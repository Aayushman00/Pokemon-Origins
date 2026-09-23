# Battle Damage Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock battle log text to animation beats, tier each hit's impact by type effectiveness, drain HP in GBA-style steps, and show a single `-N` tick on the defender's HP box.

**Architecture:** Pure, unit-tested helpers live in `battleAnimation.js` (tiers, post-drain lines, anim state, blink class) and a new `battleMessageQueue.js` (awaitable, resolve-on-clear message queue). `BattleSim.jsx` consumes them. `HpBox.jsx` drops framer-motion for the HP fill (CSS stepped transition only) and renders the tick. No server changes.

**Tech Stack:** React 18, framer-motion 11, Vite, plain CSS, `node --test` (node:test + node:assert/strict, ESM — `"type": "module"`).

**Spec:** `docs/superpowers/specs/2026-09-24-battle-damage-feedback-design.md` (approved, commit `68c1a70`). Read it before starting any task.

## Global Constraints

- Frontend only. No server/event-contract changes. No new npm dependencies.
- No audio work. Do not add, rename or reference new sound files.
- Do not touch the EXP bar (`.gba-exp-fill` / its `motion.div`) or the battle-intro / `startEncounter` sequence.
- Drain: `--dur-drain: 600ms`, `steps(12, end)`; JS constant `DRAIN_MS = 600`.
- Tick: visible exactly 700ms (not wrapped in `motionMs`), fade-in `--dur-fast` `steps(2, end)`, no translate/scale, no effectiveness colour, `aria-hidden="true"`.
- Reduced motion must stay correct: state updates and text still happen; only visual durations collapse (`motionMs`, global CSS rule in `tokens.css`).
- Commit messages: conventional style (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`). **Do NOT add any `Co-Authored-By: Claude …` trailer** (project owner preference).
- Work on branch `feat/battle-damage-feedback` off `main`.
- Unit test command (run from `frontend/`): `node --test src/pages/Game/battleAnimation.test.js src/pages/Game/battleMessageQueue.test.js`
- Line numbers below are from `main` at `68c1a70`; always locate edits by the quoted anchor text, since earlier tasks shift lines.

## Review Focus

1. **Queue cleared while a beat is awaiting a line** (restart mid-round, or a new action starting) — the pending `await addLog(...)` must resolve so `playEvent` finishes and the menu comes back. Pinned by the `clear() resolves pending pushes` test in Task 2.
2. **Reduced motion (gap 0ms)** — every line still paints, in order, and every push resolves. Pinned by the `gap 0 keeps order` test in Task 2.
3. **`type_multiplier` missing / non-number** (older events, non-move damage) — must behave as neutral: normal impact, no effectiveness line, no crash. Pinned by tier + `hitResultLines` tests in Task 1.
4. **Crit on a resisted hit** — crit shake wins, weak blink class, no stage flash, lines `A critical hit!` then `It's not very effective...`. Pinned by Task 1 tests (`getAnimState`, `hitResultLines`) and a Task 5 manual check.
5. **A tick's clear timer firing after a newer tick was set on the same side** — must not wipe the newer tick. Unreachable in today's event flow but cheap to guard; pinned by the id-guarded functional clear in Task 5 and its code-review check.

---

## File Structure

| File | Responsibility | Task |
|------|----------------|------|
| `frontend/src/pages/Game/battleAnimation.js` | Pure anim helpers: `getImpactTier`, `hitResultLines`, `damageEffectClass`, widened `getAnimState`, new variants | 1 |
| `frontend/src/pages/Game/battleAnimation.test.js` | Tests for the above | 1 |
| `frontend/src/pages/Game/battleMessageQueue.js` (new) | Awaitable paced queue with resolve-on-clear | 2 |
| `frontend/src/pages/Game/battleMessageQueue.test.js` (new) | Tests for the queue | 2 |
| `frontend/src/styles/tokens.css` | `--dur-drain` token | 3 |
| `frontend/src/pages/Game/BattleGround.css` | stepped `.gba-health-fill`, `.gba-damage-tick`, tier blink classes | 3, 5 |
| `frontend/src/pages/Game/battle/HpBox.jsx` | plain-div HP fill, `damageTick` prop | 3 |
| `frontend/src/pages/Game/BattleSim.jsx` | queue wiring, awaited call sites, new hit beat | 4, 5 |
| `docs/design/ANIMATION_GUIDE.md` | `--dur-drain` row, new battle beat order | 3, 5 |

---

### Task 0: Branch

- [ ] **Step 1: Create the branch**

```bash
cd "Pokemon-Origins"
git checkout main
git checkout -b feat/battle-damage-feedback
```

---

### Task 1: Pure animation helpers

**Files:**
- Modify: `frontend/src/pages/Game/battleAnimation.js`
- Test: `frontend/src/pages/Game/battleAnimation.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (all named exports of `battleAnimation.js`):
  - `getImpactTier(typeMultiplier: unknown): 'none' | 'weak' | 'normal' | 'super'`
  - `hitResultLines({ critical_hit?: boolean, type_multiplier?: unknown, hits?: number, ohko?: boolean }): string[]`
  - `damageEffectClass(damageEffect: false | true | 'weak' | 'normal' | 'super'): string` — `''`, `'damage-effect'`, `'damage-effect--weak'`, or `'damage-effect--super'`
  - `getAnimState({ fainted, critical, damageEffect })` — `damageEffect` widened to `false | true | 'none' | 'weak' | 'normal' | 'super'`; returns `'FAINT' | 'CRITICAL_HIT' | 'SUPER_HIT' | 'DAMAGE' | 'WEAK_HIT' | 'IDLE'`
  - `ANIMATION_VARIANTS` gains `SUPER_HIT` and `WEAK_HIT`

- [ ] **Step 1: Write the failing tests**

Change the import line at the top of `battleAnimation.test.js` to:

```js
import {
  getAnimState,
  ANIMATION_VARIANTS,
  getMoveAnimCategory,
  getImpactTier,
  hitResultLines,
  damageEffectClass,
} from "./battleAnimation.js";
```

In the existing `describe("ANIMATION_VARIANTS", …)` block, replace the `"has all 4 states getAnimState can return"` test with:

```js
  it("has every state getAnimState can return", () => {
    for (const key of ["FAINT", "CRITICAL_HIT", "SUPER_HIT", "DAMAGE", "WEAK_HIT", "IDLE"]) {
      assert.ok(ANIMATION_VARIANTS[key], `missing variant for ${key}`);
    }
  });

  it("SUPER_HIT shakes harder than DAMAGE but softer than CRITICAL_HIT", () => {
    const maxAbs = (arr) => Math.max(...arr.map((n) => Math.abs(n)));
    const superAmp = maxAbs(ANIMATION_VARIANTS.SUPER_HIT.x);
    assert.ok(superAmp > maxAbs(ANIMATION_VARIANTS.DAMAGE.x));
    assert.ok(superAmp < maxAbs(ANIMATION_VARIANTS.CRITICAL_HIT.x));
  });

  it("WEAK_HIT does not move the sprite", () => {
    assert.equal(ANIMATION_VARIANTS.WEAK_HIT.x, undefined);
  });
```

Append these blocks at the end of the file:

```js
describe("getAnimState with impact tiers", () => {
  const base = { fainted: false, critical: false };

  it("maps the super tier to SUPER_HIT", () => {
    assert.equal(getAnimState({ ...base, damageEffect: "super" }), "SUPER_HIT");
  });

  it("maps the weak tier to WEAK_HIT", () => {
    assert.equal(getAnimState({ ...base, damageEffect: "weak" }), "WEAK_HIT");
  });

  it("maps the normal tier and legacy true to DAMAGE", () => {
    assert.equal(getAnimState({ ...base, damageEffect: "normal" }), "DAMAGE");
    assert.equal(getAnimState({ ...base, damageEffect: true }), "DAMAGE");
  });

  it("treats the none tier as IDLE", () => {
    assert.equal(getAnimState({ ...base, damageEffect: "none" }), "IDLE");
  });

  it("crit beats every tier for the shake", () => {
    for (const tier of ["weak", "normal", "super", true]) {
      assert.equal(getAnimState({ fainted: false, critical: true, damageEffect: tier }), "CRITICAL_HIT");
    }
  });

  it("faint beats everything", () => {
    assert.equal(getAnimState({ fainted: true, critical: true, damageEffect: "super" }), "FAINT");
  });
});

describe("getImpactTier", () => {
  it("returns none for immunity", () => {
    assert.equal(getImpactTier(0), "none");
  });

  it("returns weak below 1", () => {
    assert.equal(getImpactTier(0.25), "weak");
    assert.equal(getImpactTier(0.5), "weak");
  });

  it("returns super above 1", () => {
    assert.equal(getImpactTier(2), "super");
    assert.equal(getImpactTier(4), "super");
  });

  it("returns normal for 1 and for missing or non-number input", () => {
    for (const m of [1, undefined, null, NaN, "2"]) {
      assert.equal(getImpactTier(m), "normal", `input ${String(m)}`);
    }
  });
});

describe("hitResultLines", () => {
  it("orders crit, effectiveness, multi-hit, OHKO", () => {
    assert.deepEqual(
      hitResultLines({ critical_hit: true, type_multiplier: 2, hits: 3, ohko: true }),
      ["A critical hit!", "It's super effective!", "Hit 3 time(s)!", "It's a one-hit KO!"]
    );
  });

  it("crit on a resisted hit gives crit then not very effective", () => {
    assert.deepEqual(
      hitResultLines({ critical_hit: true, type_multiplier: 0.5 }),
      ["A critical hit!", "It's not very effective..."]
    );
  });

  it("neutral hit with nothing special gives no lines", () => {
    assert.deepEqual(hitResultLines({ type_multiplier: 1, hits: 1 }), []);
  });

  it("missing multiplier gives no effectiveness line", () => {
    assert.deepEqual(hitResultLines({ critical_hit: true }), ["A critical hit!"]);
  });

  it("immunity gives no hit lines at all, even with crit set", () => {
    assert.deepEqual(hitResultLines({ critical_hit: true, type_multiplier: 0, hits: 2 }), []);
  });
});

describe("damageEffectClass", () => {
  it("maps each effect to its blink class", () => {
    assert.equal(damageEffectClass(false), "");
    assert.equal(damageEffectClass(true), "damage-effect");
    assert.equal(damageEffectClass("normal"), "damage-effect");
    assert.equal(damageEffectClass("weak"), "damage-effect--weak");
    assert.equal(damageEffectClass("super"), "damage-effect--super");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `frontend/`): `node --test src/pages/Game/battleAnimation.test.js`
Expected: FAIL — `SyntaxError: The requested module './battleAnimation.js' does not provide an export named 'damageEffectClass'` (or `getImpactTier`).

- [ ] **Step 3: Implement**

In `battleAnimation.js`, replace the whole `getAnimState` function and its doc comment with:

```js
/**
 * Priority: fainted > critical > super > normal > weak > idle.
 * `damageEffect` is the impact tier ('weak' | 'normal' | 'super'), or the
 * legacy boolean `true` (recoil / burn chip), which means 'normal'.
 */
export function getAnimState({ fainted, critical, damageEffect }) {
  if (fainted) return "FAINT";
  if (!damageEffect || damageEffect === "none") return "IDLE";
  if (critical) return "CRITICAL_HIT";
  if (damageEffect === "super") return "SUPER_HIT";
  if (damageEffect === "weak") return "WEAK_HIT";
  return "DAMAGE";
}
```

In `ANIMATION_VARIANTS`, add after the `DAMAGE` entry:

```js
  // Super-effective: between DAMAGE (±10) and CRITICAL_HIT (±16).
  SUPER_HIT: { x: [-13, 13, -13, 13, 0], opacity: [1, 0.65, 1, 0.65, 1] },
  // Resisted: one soft dip, no movement.
  WEAK_HIT: { opacity: [1, 0.8, 1] },
```

Append at the end of the file:

```js
// Effectiveness tier for a landed hit (spec §2). Anything that isn't a
// finite number is treated as neutral so older / non-move events never break.
export function getImpactTier(typeMultiplier) {
  if (typeof typeMultiplier !== "number" || Number.isNaN(typeMultiplier)) return "normal";
  if (typeMultiplier === 0) return "none";
  if (typeMultiplier < 1) return "weak";
  if (typeMultiplier > 1) return "super";
  return "normal";
}

// Lines shown after the HP drain, in FireRed order (spec §3 beats 8-11).
// Immunity shows none of these -- its "doesn't affect" line lives on the
// failed branch.
export function hitResultLines({ critical_hit, type_multiplier, hits, ohko }) {
  const tier = getImpactTier(type_multiplier);
  if (tier === "none") return [];
  const lines = [];
  if (critical_hit) lines.push("A critical hit!");
  if (tier === "super") lines.push("It's super effective!");
  if (tier === "weak") lines.push("It's not very effective...");
  if (hits > 1) lines.push(`Hit ${hits} time(s)!`);
  if (ohko) lines.push("It's a one-hit KO!");
  return lines;
}

// Sprite blink class for a damage effect (CSS in BattleGround.css).
export function damageEffectClass(damageEffect) {
  if (!damageEffect || damageEffect === "none") return "";
  if (damageEffect === "weak") return "damage-effect--weak";
  if (damageEffect === "super") return "damage-effect--super";
  return "damage-effect";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/pages/Game/battleAnimation.test.js`
Expected: PASS, 0 failures (the pre-existing tests included).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Game/battleAnimation.js frontend/src/pages/Game/battleAnimation.test.js
git commit -m "feat: add impact tiers, hit result lines and tiered anim states"
```

---

### Task 2: Awaitable message queue

**Files:**
- Create: `frontend/src/pages/Game/battleMessageQueue.js`
- Test: `frontend/src/pages/Game/battleMessageQueue.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `createMessageQueue({ onLine, gapMs, setTimer?, clearTimer? })` returning `{ push(message: string): Promise<void>, clear(): void, isIdle(): boolean }`.
  - `onLine(message)` is called when a line paints; `push`'s promise resolves right after that call.
  - `gapMs()` is a **function** returning the delay before the next line (read at each flush, so reduced motion can change live).
  - `setTimer(fn, ms) => handle` / `clearTimer(handle)` default to `setTimeout` / `clearTimeout`.
  - `clear()` cancels the pending timer, drops unpainted lines **and resolves their promises**.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/pages/Game/battleMessageQueue.test.js`:

```js
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test src/pages/Game/battleMessageQueue.test.js`
Expected: FAIL — `Cannot find module '…/battleMessageQueue.js'`.

- [ ] **Step 3: Implement**

Create `frontend/src/pages/Game/battleMessageQueue.js`:

```js
/**
 * Paced battle-log queue (spec §1). push() returns a promise that resolves
 * when *that* line is handed to onLine, so beats can `await` their text
 * before playing the visual it introduces. Lines are spaced by gapMs()
 * after each paint. clear() resolves every unpainted line so no beat is
 * left awaiting forever (restart / new action).
 */
export function createMessageQueue({
  onLine,
  gapMs,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let pending = [];
  let timer = null;

  const flush = () => {
    if (pending.length === 0) {
      timer = null;
      return;
    }
    const { message, resolve } = pending.shift();
    onLine(message);
    resolve();
    timer = setTimer(flush, gapMs());
  };

  return {
    push(message) {
      return new Promise((resolve) => {
        pending.push({ message, resolve });
        if (timer === null) flush();
      });
    },
    clear() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      const dropped = pending;
      pending = [];
      dropped.forEach((entry) => entry.resolve());
    },
    isIdle() {
      return pending.length === 0 && timer === null;
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/pages/Game/battleMessageQueue.test.js`
Expected: PASS, 6 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Game/battleMessageQueue.js frontend/src/pages/Game/battleMessageQueue.test.js
git commit -m "feat: add awaitable battle message queue with resolve-on-clear"
```

---

### Task 3: Stepped HP drain and the `-N` tick slot in HpBox

**Files:**
- Modify: `frontend/src/styles/tokens.css` (the `--dur-*` block, ~line 47-50)
- Modify: `frontend/src/pages/Game/BattleGround.css` (`.gba-health-fill`, ~line 325; append new rules)
- Modify: `frontend/src/pages/Game/battle/HpBox.jsx`
- Modify: `docs/design/ANIMATION_GUIDE.md` (Timing table)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `HpBox` accepts a new optional prop `damageTick: { id: number, amount: number } | null` (default `null`). Renders nothing extra when null.

- [ ] **Step 1: Add the token**

In `tokens.css`, directly after `--dur-boot: 1000ms;` add:

```css
	--dur-drain: 600ms; /* HP bar drain; BattleSim DRAIN_MS must match */
```

- [ ] **Step 2: Make the HP fill CSS-driven and stepped**

In `BattleGround.css`, in the `.gba-health-fill` rule, replace

```css
  transition: width 1s steps(10, end);
```

with

```css
  transition: width var(--dur-drain) steps(12, end);
```

Leave the `.gba-exp-fill` rule (its own `1s steps(10, end)`) untouched.

Append to the end of `BattleGround.css`:

```css
/* -N damage tick (spec §5): appears on the defender's HP row for 700ms */
.gba-damage-tick {
  font-family: var(--font-pixel);
  font-size: 10px;
  color: #333;
  text-shadow: 1px 1px 0 #e8e8c8;
  margin-left: 6px;
  white-space: nowrap;
  animation: damageTickIn var(--dur-fast) steps(2, end) both;
}

@keyframes damageTickIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 3: Update HpBox**

In `HpBox.jsx`:

1. Add `damageTick = null,` to the destructured props, after `style,`.
2. Replace the HP fill `motion.div`:

```jsx
          <motion.div
            className={`gba-health-fill ${getHealthColorClass(healthPercent)}`}
            initial={{ width: '100%' }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
```

with

```jsx
          {/* CSS-only stepped drain (--dur-drain, steps(12)); no spring. */}
          <div
            className={`gba-health-fill ${getHealthColorClass(healthPercent)}`}
            style={{ width: `${healthPercent}%` }}
          />
```

3. Replace the player HP text block

```jsx
        {role === 'player' && (
          <div className="gba-hp-text">
            HP: {pokemon.current_hp}/{pokemon.max_hp}
          </div>
        )}
```

with

```jsx
        {damageTick && (
          <span className="gba-damage-tick" key={damageTick.id} aria-hidden="true">
            -{damageTick.amount}
          </span>
        )}
        {role === 'player' && (
          <div className="gba-hp-text">
            HP: {pokemon.current_hp}/{pokemon.max_hp}
          </div>
        )}
```

`motion` is still used by the EXP bar, so keep the `framer-motion` import.

- [ ] **Step 4: Document the token**

In `docs/design/ANIMATION_GUIDE.md`, in the Timing table, add a row after `--dur-boot`:

```markdown
| `--dur-drain` | 600ms | HP bar drain, `steps(12, end)` (≈3 GBA frames per step); `DRAIN_MS` in `BattleSim.jsx` must match |
```

- [ ] **Step 5: Verify build and lint**

Run (from `frontend/`): `npm run build`
Expected: build succeeds.
Run: `npx eslint src/pages/Game/battle/HpBox.jsx`
Expected: no errors.

- [ ] **Step 6: Manual check**

Run `npm run dev`, start a battle, land a hit. Expected: the HP bar moves in visible discrete steps over ~0.6s with no spring overshoot; nothing else in the HP box has changed (no tick yet — it's wired in Task 5).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/styles/tokens.css frontend/src/pages/Game/BattleGround.css frontend/src/pages/Game/battle/HpBox.jsx docs/design/ANIMATION_GUIDE.md
git commit -m "feat: stepped CSS HP drain and damage tick slot in HpBox"
```

---

### Task 4: Wire the queue into BattleSim and await beat lines

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx`

**Interfaces:**
- Consumes: `createMessageQueue` from Task 2.
- Produces: inside `BattleSim`, `addLog(message: string): Promise<void>` (awaitable), `messageQueue` (the ref's queue with `.clear()` / `.isIdle()`).

This task changes every beat's timing contract (spec §1). The damage-hit block (`triggerHitFlash(event.moveType);` through `logEffectiveness(event, defenderName);`) is **left as-is** here; Task 5 rewrites it.

- [ ] **Step 1: Import**

Add after the `battleAnimation` import:

```js
import { createMessageQueue } from './battleMessageQueue';
```

- [ ] **Step 2: Replace the queue refs**

Replace

```js
  const messageQueueRef = useRef([]);
  const messageTimerRef = useRef(null);
```

with

```js
  // Awaitable log queue (spec §1); created once, lives for the component.
  const messageQueueRef = useRef(null);
  // Read live by the queue's gapMs so reduced motion applies without
  // recreating the queue.
  const reduceMotionRef = useRef(false);
```

Directly after `const reduceMotion = useReducedMotion();` add:

```js
  reduceMotionRef.current = reduceMotion;
```

- [ ] **Step 3: Replace `flushNextMessage` and `addLog`**

Replace the whole comment block starting `// Drains messageQueueRef one at a time` plus the `flushNextMessage` and `addLog` functions with:

```js
  // Paced dialog lines. addLog resolves when *that* line paints, so a beat
  // can `await addLog(...)` before playing the visual it introduces
  // (spec §1). React 18 batching is why lines are queued at all -- see
  // Phase 8 plan Ruling 2.
  if (messageQueueRef.current === null) {
    messageQueueRef.current = createMessageQueue({
      onLine: (line) => setActiveBeatLines((prev) => [...prev, line]),
      gapMs: () => (reduceMotionRef.current ? 0 : 600),
      setTimer: (fn, ms) => {
        const t = setTimeout(fn, ms);
        timersRef.current.push(t);
        return t;
      },
    });
  }
  const addLog = (message) => messageQueueRef.current.push(message);
```

`timersRef` is declared below `messageQueueRef` in the file; this is fine because `setTimer` only runs after render. If ESLint flags use-before-define, move the `timersRef` declaration (`const timersRef = useRef([]);`) up to just below `const reduceMotionRef = useRef(false);`.

- [ ] **Step 4: Resolve-on-clear at both reset points**

In `resolveServerAction`, replace

```js
    messageQueueRef.current = [];
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
```

with

```js
    messageQueueRef.current.clear();
```

In `restartBattle`, replace

```js
    messageQueueRef.current = [];
    messageTimerRef.current = null;
```

with

```js
    messageQueueRef.current.clear();
```

In `resolveServerAction`, replace the drain loop

```js
      while (messageQueueRef.current.length > 0 || messageTimerRef.current) {
        await wait(100);
      }
```

with

```js
      while (!messageQueueRef.current.isIdle()) {
        await wait(100);
      }
```

Confirm no `messageTimerRef` references remain: `grep -n messageTimerRef src/pages/Game/BattleSim.jsx` → no output.

- [ ] **Step 5: Await the beat-path call sites**

Add `await` in front of `addLog(` at each of these anchors inside `playEvent` (spec §1 table). Nothing else on those lines changes.

| Anchor text (inside `playEvent`) |
|---|
| ``addLog(`Go! ${event.pokemon.nickname}!`);`` |
| ``addLog(`${session?.trainerName \|\| 'The trainer'} sent out ${event.pokemon.nickname}!`);`` |
| ``addLog(`Used ${event.itemName}! ${event.nickname} recovered ${event.amount} HP.`);`` |
| ``addLog(`${event.nickname} gained ${event.amount} XP!`);`` |
| ``addLog(`Got ${event.amount} coins!`);`` |
| ``addLog(`${event.nickname} grew to Lv ${event.level}!`);`` |
| ``addLog(`${event.nickname} can now evolve!`);`` |
| ``addLog(`${event.nickname} learned ${event.moveName}!`);`` |
| ``addLog(`${event.nickname} wants to learn ${event.moveName}!`);`` |
| `addLog(line(event.nickname));` — all four (cant_move, status_applied, status_end, status_damage) |
| ``addLog(`${event.nickname} fainted!`);`` — both (status_damage and recoil branches) |
| `addLog(statChangeText(event));` |
| ``addLog(`${event.nickname} is damaged by recoil!`);`` |
| ``addLog(`${event.nickname} drained energy!`);`` |
| ``addLog(`${event.nickname} regained health!`);`` |
| ``addLog(`${attackerName} used ${event.moveName}!`);`` |
| ``addLog(`${attackerName}'s attack missed!`);`` |
| the multi-line `addLog(` in the `event.result === 'failed'` branch (``It doesn't affect ${defenderName}...`` / `'But it failed!'`) |
| ``addLog(`${defenderName} fainted!`);`` (move faint) |

Do **not** add `await` to: `'Choose your next Pokémon!'`, `'Battle started!'`, the `startBattle` opening line, `'Your bag has no battle items!'`, the bag error line, `'You have no other Pokémon!'`, `addLog(message);` in the 400-error branch, `'Battle restarted!'`. None of those are inside an async beat.

- [ ] **Step 6: Verify**

Run: `npx eslint src/pages/Game/BattleSim.jsx` → no new errors.
Run: `npm run build` → succeeds.
Run: `node --test src/pages/Game/battleAnimation.test.js src/pages/Game/battleMessageQueue.test.js` → all pass.

- [ ] **Step 7: Manual check (normal and reduced motion)**

`npm run dev`, then play a few rounds. Toggle reduced motion (Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce") and repeat.
Expected:
- Status move: `X used Move!` is visible before the sparkle plays.
- Enemy turn: `Foe used Move!` is visible during the telegraph.
- Restart via the menu in the middle of a round → the new battle loads and the menu comes back (no stuck `acting` phase).
- Reduced motion: every line still appears, in order, and the menu returns.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx
git commit -m "refactor: awaitable addLog so battle beats wait for their text"
```

---

### Task 5: New hit beat — tiers, drain-then-text, `-N` tick

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx`
- Modify: `frontend/src/pages/Game/BattleGround.css` (tier blink classes)
- Modify: `docs/design/ANIMATION_GUIDE.md` (Battle beat order section)

**Interfaces:**
- Consumes: `getImpactTier`, `hitResultLines`, `damageEffectClass`, widened `getAnimState` (Task 1); awaitable `addLog` (Task 4); `HpBox` `damageTick` prop (Task 3).
- Produces: final behaviour; nothing new for later tasks.

- [ ] **Step 1: Blink classes**

In `BattleGround.css`, directly after the existing `@keyframes damageFlash { … }` block, add:

```css
/* Impact tiers (spec §2) */
.damage-effect--weak {
  animation: damageFlashWeak 0.25s steps(2, end) 1;
}

@keyframes damageFlashWeak {
  0% { opacity: 1; filter: brightness(1); }
  50% { opacity: 0.6; filter: brightness(3); }
  100% { opacity: 1; filter: brightness(1); }
}

.damage-effect--super {
  animation: damageFlash 0.3s steps(2, end) 2;
}
```

- [ ] **Step 2: Imports, constant, tick state**

Change the `battleAnimation` import to:

```js
import {
  getAnimState,
  ANIMATION_VARIANTS,
  getMoveAnimCategory,
  getImpactTier,
  hitResultLines,
  damageEffectClass,
} from './battleAnimation';
```

Below the `STAGE_TOTAL_HEIGHT` constant add:

```js
// Must match --dur-drain in tokens.css (spec §4).
const DRAIN_MS = 600;
// -N tick visibility; deliberately NOT motionMs-wrapped (spec §5).
const DAMAGE_TICK_MS = 700;
```

After `const [statusSparkle, setStatusSparkle] = useState(false);` add:

```js
  // -N tick on the defender's HP box: { id, amount } | null (spec §5)
  const [playerDamageTick, setPlayerDamageTick] = useState(null);
  const [enemyDamageTick, setEnemyDamageTick] = useState(null);
```

Change the two damage-effect comments/state only in meaning (no code change needed): `playerDamageEffect` / `enemyDamageEffect` now hold `false | true | 'weak' | 'normal' | 'super'`. Update the comment above them to:

```js
  // Per-beat animation flags. *DamageEffect: false | true (legacy normal) | impact tier
```

- [ ] **Step 3: Tick helper**

Directly after the `triggerStatusSparkle` function add:

```js
  // Show "-N" on the defender's HP box for DAMAGE_TICK_MS. The clear only
  // removes *this* tick, so a second hit inside 700ms keeps its own tick.
  const showDamageTick = (side, amount) => {
    const setTick = side === 'player' ? setPlayerDamageTick : setEnemyDamageTick;
    const id = Date.now() + Math.random();
    setTick({ id, amount });
    timersRef.current.push(
      setTimeout(() => setTick((cur) => (cur && cur.id === id ? null : cur)), DAMAGE_TICK_MS)
    );
  };
```

- [ ] **Step 4: Delete `logEffectiveness`**

Delete the whole `const logEffectiveness = (event, defenderName) => { … };` function. `hitResultLines` replaces it. Confirm: `grep -n logEffectiveness src/pages/Game/BattleSim.jsx` → no output after Step 5.

- [ ] **Step 5: Rewrite the landed-hit block**

In `playEvent`, replace everything from

```js
    triggerHitFlash(event.moveType);
    if (event.critical_hit) triggerCriticalFlash();
```

through (and including)

```js
    if (event.ohko) addLog("It's a one-hit KO!");
    logEffectiveness(event, defenderName);
```

with:

```js
    const tier = getImpactTier(event.type_multiplier);

    // Guard (spec §3 ×0): immunity normally arrives as result 'failed'. If a
    // hit ever gets here with ×0, show only the text -- no flash, blink,
    // shake, tick or crit.
    if (tier === 'none') {
      await addLog(`It doesn't affect ${defenderName}...`);
      await wait(motionMs(400));
      return;
    }

    // Beat 5 -- impact, tiered (spec §2). Resisted hits skip the stage flash.
    if (tier !== 'weak') triggerHitFlash(event.moveType);
    if (event.critical_hit) triggerCriticalFlash();
    const setDamageEffect = isPlayer ? setEnemyDamageEffect : setPlayerDamageEffect;
    const setDefender = isPlayer ? setTrainerPokemon : setUserPokemon;
    if (isPlayer) view.enemy = { ...view.enemy, current_hp: event.targetHpAfter };
    else view.player = { ...view.player, current_hp: event.targetHpAfter };
    const setCritical = isPlayer ? setEnemyCritical : setPlayerCritical;
    setDamageEffect(tier);
    setCritical(!!event.critical_hit);
    playSound('damage');
    // Same tick: start the stepped drain and show the -N tick.
    setDefender((prev) => ({ ...prev, current_hp: event.targetHpAfter }));
    showDamageTick(isPlayer ? 'enemy' : 'player', event.damage);

    // Beat 6 -- drain.
    await wait(motionMs(DRAIN_MS));
    // Beat 7.
    setDamageEffect(false);
    setCritical(false);

    // Beats 8-11 -- crit, effectiveness, multi-hit, OHKO; each waits for paint.
    for (const line of hitResultLines(event)) {
      await addLog(line);
    }
```

The faint block that follows (`if (event.targetFainted) { … }`) stays; its `addLog` was already awaited in Task 4. The line `` addLog(`${attackerName} dealt ${event.damage} damage!`); `` is now gone — confirm with `grep -n "dealt" src/pages/Game/BattleSim.jsx` → no output.

- [ ] **Step 6: Sprite blink classes by tier**

Replace

```jsx
                  className={`gba-pokemon-sprite enemy-sprite ${enemyDamageEffect ? 'damage-effect' : ''}`}
```

with

```jsx
                  className={`gba-pokemon-sprite enemy-sprite ${damageEffectClass(enemyDamageEffect)}`}
```

and

```jsx
                  className={`gba-pokemon-sprite player-sprite ${playerDamageEffect ? 'damage-effect' : ''}`}
```

with

```jsx
                  className={`gba-pokemon-sprite player-sprite ${damageEffectClass(playerDamageEffect)}`}
```

The two `getAnimState({ … damageEffect: …DamageEffect })` calls need no change — `getAnimState` now understands tiers.

- [ ] **Step 7: Pass ticks to HpBox**

In the enemy `<HpBox … role="enemy" …/>` add the prop `damageTick={enemyDamageTick}`.
In the player `<HpBox … role="player" …/>` add the prop `damageTick={playerDamageTick}`.

- [ ] **Step 8: Reset ticks on restart**

In `restartBattle`, after `setStatusSparkle(false);` add:

```js
    setPlayerDamageTick(null);
    setEnemyDamageTick(null);
```

- [ ] **Step 9: Update the animation guide**

In `docs/design/ANIMATION_GUIDE.md`, replace the paragraph under `## Battle beat order (Phase 3 contract)` that starts with `` `encounter` (flash + appear text) `` with:

```markdown
`encounter` (flash + appear text) → `intro` (enemy slides in, then player + HP boxes) → `idle` (sprite bob) → `attack` → back to menu; `faint` (sink + fade) when HP hits 0.

`attack` (FireRed order, spec 2026-09-24-battle-damage-feedback): "X used Move!" (painted) → attack animation (lunge / ranged flash / status sparkle) → impact tiered by effectiveness (×0 none; <1 soft blink, no stage flash, no shake; ×1 standard; >1 double blink + stronger shake; crit adds white pulse + crit shake) with the stepped HP drain and a 700ms `-N` tick on the defender HP box starting together → drain (`--dur-drain`) → crit line → effectiveness line → multi-hit line → OHKO line → faint beat.

Rule: a visual beat never starts before the line that introduces it has painted (`await addLog(...)`).
```

- [ ] **Step 10: Verify**

Run: `node --test src/pages/Game/battleAnimation.test.js src/pages/Game/battleMessageQueue.test.js` → all pass.
Run: `npx eslint src/pages/Game/BattleSim.jsx` → no new errors.
Run: `npm run build` → succeeds.

- [ ] **Step 11: Manual check (normal, then reduced motion)**

`npm run dev`. Pick matchups that produce each case (e.g. Water vs Fire = super, Fire vs Water = resisted, Normal vs Ghost = immune).

Expected:
- **Neutral hit:** stage flash + standard blink/shake, bar steps down over ~0.6s, `-N` appears on the defender HP row at impact and disappears ~0.7s later, then no effectiveness line; no "dealt N damage!" line anywhere.
- **Super-effective:** double blink, visibly stronger shake than neutral, `It's super effective!` appears only after the bar stops.
- **Resisted:** no stage flash, one soft blink, sprite does not move, then `It's not very effective...`.
- **Crit on a resisted hit (Review Focus 4):** white pulse + crit shake, no stage flash, `A critical hit!` then `It's not very effective...`.
- **Multi-hit:** one tick with the total, then effectiveness (if any), then `Hit N time(s)!`.
- **Immune:** only `It doesn't affect X...` — no blink, shake, tick or crit.
- **Enemy tick:** appears next to the enemy HP bar (enemy has no HP number).
- **Tick clear is id-guarded (Review Focus 5):** in today's event flow a second move hit on the same defender can't land within 700ms (the enemy telegraph alone is 700ms, and recoil/chip damage show no tick), so verify by code review: the timeout in `showDamageTick` uses the functional updater `cur.id === id ? null : cur`, never a bare `setTick(null)`.
- **Faint:** bar reaches 0, lines play, then faint beat.
- **Reduced motion:** bar jumps (no steps), tick is static text for ~0.7s, all lines appear in the same order, menu returns.

- [ ] **Step 12: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css docs/design/ANIMATION_GUIDE.md
git commit -m "feat: tiered impact, drain-then-text hit beat and -N damage tick"
```

---

### Task 6: Final verification and graph refresh

**Files:** none (verification only), plus the graphify output (untracked).

- [ ] **Step 1: Full checks**

From `frontend/`:

```bash
node --test src/pages/Game/battleAnimation.test.js src/pages/Game/battleMessageQueue.test.js
npm run test:sprites
npm run lint
npm run build
```

Expected: all tests pass; lint reports no errors in files this plan touched (pre-existing warnings elsewhere are out of scope — note them, don't fix); build succeeds.

- [ ] **Step 2: Spec cross-check**

Open the spec and confirm, with `grep` on `BattleSim.jsx`:
- `grep -n "dealt" ` → nothing.
- `grep -n "messageTimerRef\|logEffectiveness"` → nothing.
- `grep -c "await addLog"` → 24 (22 from Task 4, plus the ×0 guard and the `hitResultLines` loop from Task 5).
- `HpBox.jsx` has no `stiffness: 120` on the HP fill (the EXP bar's spring remains).

- [ ] **Step 3: Refresh the knowledge graph**

From the parent project folder (`Pokemon Origins/`): `graphify update .`

- [ ] **Step 4: Nothing to commit unless fixes were needed**

If any check forced a fix, commit it with a `fix:` message (no Claude trailer).
