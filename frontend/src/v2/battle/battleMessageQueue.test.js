import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMessageQueue } from "./battleMessageQueue.js";

// Manual scheduler: timers only fire when the test calls tick().
function manualTimers() {
  const pending = [];
  return {
    setTimer: (fn, ms) => {
      const handle = { fn, ms, cancelled: false };
      pending.push(handle);
      return handle;
    },
    clearTimer: (handle) => {
      if (handle) handle.cancelled = true;
    },
    tick() {
      const next = pending.shift();
      if (next && !next.cancelled) next.fn();
    },
    lastDelay: () => pending[pending.length - 1]?.ms,
  };
}

describe("createMessageQueue", () => {
  it("paints the first line immediately and resolves its push", async () => {
    const painted = [];
    const t = manualTimers();
    const q = createMessageQueue({ onLine: (m) => painted.push(m), gapMs: () => 600, ...t });
    await q.push("a");
    assert.deepEqual(painted, ["a"]);
  });

  it("holds the second line until the gap timer fires", async () => {
    const painted = [];
    const t = manualTimers();
    const q = createMessageQueue({ onLine: (m) => painted.push(m), gapMs: () => 600, ...t });
    q.push("a");
    let bDone = false;
    const b = q.push("b").then(() => { bDone = true; });
    await Promise.resolve();
    assert.deepEqual(painted, ["a"]);
    assert.equal(bDone, false);
    assert.equal(t.lastDelay(), 600);
    t.tick();
    await b;
    assert.deepEqual(painted, ["a", "b"]);
  });

  it("gap 0 keeps order and resolves everything (reduced motion)", async () => {
    const painted = [];
    const q = createMessageQueue({ onLine: (m) => painted.push(m), gapMs: () => 0 });
    await Promise.all([q.push("a"), q.push("b"), q.push("c")]);
    assert.deepEqual(painted, ["a", "b", "c"]);
  });

  it("clear() resolves pending pushes without painting them", async () => {
    const painted = [];
    const t = manualTimers();
    const q = createMessageQueue({ onLine: (m) => painted.push(m), gapMs: () => 600, ...t });
    q.push("a");
    const b = q.push("b");
    q.clear();
    await b; // must not hang
    assert.deepEqual(painted, ["a"]);
    assert.equal(q.isIdle(), true);
  });

  it("is usable again after clear()", async () => {
    const painted = [];
    const t = manualTimers();
    const q = createMessageQueue({ onLine: (m) => painted.push(m), gapMs: () => 600, ...t });
    q.push("a");
    q.push("b");
    q.clear();
    await q.push("c");
    assert.deepEqual(painted, ["a", "c"]);
  });

  it("isIdle() is false while a gap timer is pending", () => {
    const t = manualTimers();
    const q = createMessageQueue({ onLine: () => {}, gapMs: () => 600, ...t });
    q.push("a");
    assert.equal(q.isIdle(), false);
    t.tick();
    assert.equal(q.isIdle(), true);
  });

  it("passes each painted line to gapMs so long lines can hold longer", async () => {
    const t = manualTimers();
    const q = createMessageQueue({ onLine: () => {}, gapMs: (m) => m.length * 10, ...t });
    q.push("hello");
    assert.equal(t.lastDelay(), 50);
  });

  it("skip() paints the next line without waiting for the gap", async () => {
    const painted = [];
    const t = manualTimers();
    const q = createMessageQueue({ onLine: (m) => painted.push(m), gapMs: () => 600, ...t });
    q.push("a");
    const b = q.push("b");
    q.skip();
    await b;
    assert.deepEqual(painted, ["a", "b"]);
  });

  it("skip() on an idle queue does nothing", () => {
    const q = createMessageQueue({ onLine: () => {}, gapMs: () => 600 });
    q.skip();
    assert.equal(q.isIdle(), true);
  });
});
