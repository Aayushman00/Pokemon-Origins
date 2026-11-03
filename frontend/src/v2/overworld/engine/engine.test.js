import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TICK_MS } from "../constants.js";
import { coverage, startTransition, tickTransition } from "../logic/transition.js";
import { createInputState, drainEdges, padButtons, pollGamepad, setButton, snapshot } from "./input.js";
import { createLoop } from "./loop.js";
import { computeScale } from "./scale.js";

describe("integer scaling", () => {
	it("picks the largest integer device-pixel scale that fits", () => {
		assert.equal(computeScale(960, 640, 1).scale, 4);
		assert.equal(computeScale(1000, 1000, 1).scale, 4);
		assert.equal(computeScale(1920, 1080, 1).scale, 6);
	});
	it("never scales below 1", () => assert.equal(computeScale(100, 50, 1).scale, 1));
	it("is exact in device pixels at fractional devicePixelRatio, at many window sizes", () => {
		for (const dpr of [1, 1.25, 1.5, 2, 2.625]) {
			for (let w = 250; w < 2200; w += 137) {
				const s = computeScale(w, w * 0.6, dpr);
				assert.equal(s.backingW % 240, 0);
				assert.equal(s.backingH % 160, 0);
				assert.ok(Math.abs(s.cssW * dpr - s.backingW) < 1e-9, "css size maps to whole device pixels");
				assert.ok(s.backingW / 240 === s.backingH / 160, "same integer factor on both axes");
				assert.ok(Math.abs(s.left * dpr - Math.round(s.left * dpr)) < 1e-9 && Math.abs(s.top * dpr - Math.round(s.top * dpr)) < 1e-9, "canvas origin sits on a whole device pixel");
			}
		}
	});
});

describe("fixed timestep loop", () => {
	function harness(refreshMs) {
		let t = 0;
		let cb = null;
		const counts = { ticks: 0, renders: 0 };
		const loop = createLoop({
			step: () => counts.ticks++,
			render: () => counts.renders++,
			now: () => t,
			raf: (f) => ((cb = f), 1),
			caf: () => (cb = null),
		});
		loop.start();
		return {
			counts,
			loop,
			run(ms) {
				const end = t + ms;
				while (t < end) {
					t += refreshMs;
					cb?.(t);
				}
			},
			jump(ms) {
				t += ms;
			},
		};
	}
	it("runs 60 ticks per second on a 60 Hz display", () => {
		const h = harness(TICK_MS);
		h.run(1000);
		assert.ok(Math.abs(h.counts.ticks - 60) <= 1, `ticks=${h.counts.ticks}`);
	});
	it("still runs 60 ticks per second on a 144 Hz display and does not redraw identical frames", () => {
		const h = harness(1000 / 144);
		h.run(1000);
		assert.ok(Math.abs(h.counts.ticks - 60) <= 1, `ticks=${h.counts.ticks}`);
		assert.ok(h.counts.renders <= h.counts.ticks);
	});
	it("runs 60 ticks per second on a 30 Hz display by catching up (two ticks per frame)", () => {
		const h = harness(1000 / 30);
		h.run(1000);
		assert.ok(Math.abs(h.counts.ticks - 60) <= 2, `ticks=${h.counts.ticks}`);
	});
	it("caps catch-up after a stall instead of fast-forwarding", () => {
		const h = harness(TICK_MS);
		h.run(100);
		const before = h.counts.ticks;
		h.jump(10000);
		h.run(TICK_MS);
		assert.ok(h.counts.ticks - before <= 6);
		assert.ok(h.loop.stats.dropped > 100);
	});
	it("stop halts further ticks", () => {
		const h = harness(TICK_MS);
		h.run(100);
		h.loop.stop();
		const n = h.counts.ticks;
		h.run(100);
		assert.equal(h.counts.ticks, n);
	});
});

describe("input", () => {
	it("the most recently pressed direction wins and falls back when released", () => {
		const s = createInputState();
		setButton(s, "left", true, "keyboard");
		setButton(s, "up", true, "keyboard");
		assert.equal(snapshot(s).dir, "up");
		setButton(s, "up", false, "keyboard");
		assert.equal(snapshot(s).dir, "left");
		setButton(s, "left", false, "keyboard");
		assert.equal(snapshot(s).dir, null);
	});
	it("a button held from two sources stays held until both release", () => {
		const s = createInputState();
		setButton(s, "b", true, "keyboard");
		setButton(s, "b", true, "gamepad");
		setButton(s, "b", false, "keyboard");
		assert.equal(snapshot(s).run, true);
		setButton(s, "b", false, "gamepad");
		assert.equal(snapshot(s).run, false);
	});
	it("edges report presses once, with their source", () => {
		const s = createInputState();
		setButton(s, "a", true, "virtual");
		setButton(s, "a", true, "virtual");
		assert.deepEqual(drainEdges(s), [{ button: "a", source: "virtual" }]);
		assert.deepEqual(drainEdges(s), []);
	});
	it("maps a standard gamepad: dpad, stick, A/B", () => {
		const pad = (pressed, axes = [0, 0]) => ({ buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i) })), axes });
		assert.deepEqual([...padButtons(pad([12, 0]))].sort(), ["a", "up"]);
		assert.ok(padButtons(pad([], [0.9, 0])).has("right"));
		assert.ok(!padButtons(pad([], [0.2, 0.2])).has("right"), "inside the deadzone");
		assert.ok(padButtons(pad([1])).has("b"));
	});
	it("pollGamepad turns pad changes into presses and releases", () => {
		const s = createInputState();
		const pad = (pressed) => [{ connected: true, buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i) })), axes: [0, 0] }];
		const prev = pollGamepad(s, new Set(), pad([15]));
		assert.equal(snapshot(s).dir, "right");
		pollGamepad(s, prev, pad([]));
		assert.equal(snapshot(s).dir, null);
	});
});

describe("transitions", () => {
	it("covers the screen, swaps once, then uncovers", () => {
		let tr = startTransition("iris");
		let swaps = 0;
		let max = 0;
		for (let i = 0; i < 100 && tr.phase !== "done"; i++) {
			const r = tickTransition(tr);
			tr = r.tr;
			swaps += r.swap ? 1 : 0;
			max = Math.max(max, coverage(tr));
		}
		assert.equal(swaps, 1);
		assert.equal(max, 1);
		assert.equal(coverage(tr), 0);
	});
	it("'none' completes immediately but still swaps", () => {
		const r = tickTransition(startTransition("none"));
		assert.ok(r.swap && r.done);
	});
});
