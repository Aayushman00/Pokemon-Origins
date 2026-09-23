# GBA/FRLG Redesign — Phase 11: Animation State Machine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the named animation states the design spec calls for (Section 6), and use them to give DAMAGE and the previously-nonexistent CRITICAL_HIT state real, distinct visual treatment — the two states currently weakest against the spec's "not just up/down" requirement — via a small, pure, testable animation-state module, without touching `playEvent`'s existing event-sequencing/timing logic (only additive capture of data `playEvent` already has but currently discards).

**Architecture:** This is the highest-risk remaining phase because it's the first to touch anything inside `playEvent`'s ~25 event-type branches since this redesign began — and two real bugs were already found in nearby, less-central changes this same session (a React-batching bug in Phase 8, a Rules-of-Hooks violation in Phase 7). Given that track record, this plan is deliberately conservative in scope:

1. A new pure module, `battleAnimation.js`, exports named state constants and Framer Motion variant objects — zero side effects, fully unit-testable.
2. The only change inside `playEvent` is **additive**: capturing `event.critical_hit` (a field `playEvent` already receives and already uses for the log text, but currently discards for animation purposes) into two new per-side boolean states, set/cleared at the *exact same call sites and *exact same await boundaries* as the existing `setDamageEffect(true)`/`setDamageEffect(false)` calls. No `await`, no ordering, no timing changes — this is capturing one more piece of already-available data alongside an existing state write, not new sequencing logic.
3. Only the **outer** sprite wrapper `motion.div` (which currently only handles the fainted/damage-flash ternary, not the attack lunge) is rewired to consume the new state module. The **inner** `BattlePokemonSprite`'s attack-lunge/send-out-slide animation (which shares its `x` transform property between two different beats already) is explicitly left untouched — see Ruling 4.

**Tech Stack:** No new dependency (Framer Motion is already used throughout this file).

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 6 ("Animation states"), Section 9 Phase 11.

## Rulings (made during planning, binding on this plan)

1. **Scope is DAMAGE + CRITICAL_HIT + FAINT on the outer wrapper only, not all 8 named states.** The spec names 8 states (IDLE, SEND_OUT, ATTACK, DAMAGE, CRITICAL_HIT, FAINT, SWITCH, VICTORY). Of these: IDLE already exists as a CSS keyframe (`enemyIdle`/`playerIdle`, `BattleGround.css:332-340`) with a genuinely subtle ±5px drift — already matches the spec's "very subtle movement, not repetitive floating" wording, left untouched. ATTACK and SEND_OUT live entirely in the *inner* `BattlePokemonSprite` element's `x` animate property (see Ruling 4) and are out of scope for this pass. SWITCH has no dedicated trigger in this codebase — `enemy_send`/`switch` events already reuse the existing faint-then-reappear presentation, which is an acceptable existing approximation; not rebuilt here. VICTORY has no dedicated trigger either — the post-battle IDLE state already serves this role visually (the winning Pokémon just remains on screen, idle, while the message-progression victory flow plays in the dialog box per Phase 8/the original audit's approval of that flow). This plan implements the two states that are both fully within reach of an additive-only change AND currently the weakest against the spec's complaint: DAMAGE (currently a generic symmetric shake, matches spec reasonably but has no distinct critical variant) and CRITICAL_HIT (does not exist as a visual state at all today — only as log text).
2. **`critical_hit` capture is additive, not a sequencing change.** `event.critical_hit` is already read once, at `BattleSim.jsx:280` (`logEffectiveness`), purely for the "A critical hit!" log line. `playEvent`'s damage branch already calls `setDamageEffect(true)` then, after an unchanged `await wait(motionMs(600))`, `setDamageEffect(false)` (currently `BattleSim.jsx:624,628` — re-verify current line numbers before editing). This plan adds one line immediately after each of those two calls, at the same point in the same function, setting a new `setCritical(...)` state to `event.critical_hit` / `false` respectively — no new `await`, no reordering, no new branch.
3. **FAINT is lightly adjusted, not rebuilt.** The current faint animation (`y: 46, opacity: 0`, no transition timing specified beyond the shared one) already matches the spec's "damage settle → sink → disappear" reasonably well. This plan only ensures FAINT is now selected via the same explicit state-lookup mechanism as DAMAGE/CRITICAL_HIT (for consistency and so a future pass can enhance it in one place), without changing its actual keyframe values.
4. **The inner `BattlePokemonSprite` attack-lunge/send-out-slide animation is explicitly out of scope, not an oversight.** `BattleSim.jsx`'s inner sprite `animate.x` currently serves two different purposes at once: `enemyAttacking && !reduceMotion ? [0, -24, 0] : introStarted ? 0 : 60` — the same `x` property drives both the attack lunge AND the send-out slide-in position, gated by different conditions (`enemyAttacking` vs `introStarted`). Touching this safely would require untangling those two concerns first, which is a larger, riskier change than this phase's additive-only budget allows given this session's track record on `playEvent`-adjacent changes. `ponytail: ATTACK/SEND_OUT animation quality on the inner sprite element is a real, documented gap against the spec's "anticipation → lunge → impact → recovery" ask — upgrade path is a future, dedicated pass that first separates the intro-slide and attack-lunge into two distinct animate targets (e.g. a wrapping element for position, an inner element for the lunge), then applies the same battleAnimation.js variant pattern this phase establishes for DAMAGE/CRITICAL_HIT.`

## Global Constraints

- The only lines inside `playEvent` that may change are the two additive `setCritical(...)` calls described in Ruling 2 — no `await`, no existing line's logic, no branch structure changes anywhere else in `playEvent` or any other function.
- The inner `BattlePokemonSprite` motion.img's `animate`/`initial`/`transition` props (the attack lunge and send-out slide) must not be touched — only the outer wrapper `motion.div`'s `animate` prop changes.
- `playerFainted`/`enemyFainted`/`playerDamageEffect`/`enemyDamageEffect`/`playerAttacking`/`enemyAttacking` (the 6 existing booleans) keep their exact current meaning and trigger points — this phase adds 2 new booleans (`playerCritical`/`enemyCritical`) alongside them, it does not replace or repurpose any existing one.
- The new `playerCritical`/`enemyCritical` state must be reset to `false` everywhere the existing 6 booleans are already reset (the round-end reset block and `restartBattle()`), matching the existing pattern exactly, so no phase-11 state can leak across rounds/restarts — this was the exact class of bug (a piece of state not reset alongside its siblings) found and fixed in Phase 8.

---

### Task 1: `battleAnimation.js` — animation states and variants

**Files:**
- Create: `frontend/src/pages/Game/battleAnimation.js`
- Test: `frontend/src/pages/Game/battleAnimation.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `getAnimState({ fainted, critical, damageEffect, reduceMotion })` — a pure function returning one of `'FAINT' | 'CRITICAL_HIT' | 'DAMAGE' | 'IDLE'` (in that priority order: fainted wins over critical, critical wins over plain damage, both defer to IDLE otherwise); and `ANIMATION_VARIANTS`, an object keyed by those same 4 strings, each value a Framer Motion `animate` object. Task 2 imports both by name.

- [ ] **Step 1: Write the failing test**

```javascript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAnimState, ANIMATION_VARIANTS } from "./battleAnimation.js";

describe("getAnimState", () => {
  it("returns FAINT when fainted, regardless of other flags", () => {
    assert.equal(getAnimState({ fainted: true, critical: true, damageEffect: true, reduceMotion: false }), "FAINT");
  });

  it("returns CRITICAL_HIT when critical and damageEffect, not fainted", () => {
    assert.equal(getAnimState({ fainted: false, critical: true, damageEffect: true, reduceMotion: false }), "CRITICAL_HIT");
  });

  it("returns DAMAGE when damageEffect but not critical", () => {
    assert.equal(getAnimState({ fainted: false, critical: false, damageEffect: true, reduceMotion: false }), "DAMAGE");
  });

  it("returns IDLE when nothing else applies", () => {
    assert.equal(getAnimState({ fainted: false, critical: false, damageEffect: false, reduceMotion: false }), "IDLE");
  });

  it("critical alone (no damageEffect) is not enough to trigger CRITICAL_HIT", () => {
    // damageEffect gates the whole shake beat; critical only changes which
    // shake variant plays while damageEffect is true. This guards against a
    // stale critical flag (e.g. from a race) triggering a visual beat on
    // its own.
    assert.equal(getAnimState({ fainted: false, critical: true, damageEffect: false, reduceMotion: false }), "IDLE");
  });
});

describe("ANIMATION_VARIANTS", () => {
  it("has all 4 states getAnimState can return", () => {
    for (const key of ["FAINT", "CRITICAL_HIT", "DAMAGE", "IDLE"]) {
      assert.ok(ANIMATION_VARIANTS[key], `missing variant for ${key}`);
    }
  });

  it("CRITICAL_HIT has a larger shake amplitude than DAMAGE", () => {
    const maxAbs = (arr) => Math.max(...arr.map((n) => Math.abs(n)));
    assert.ok(
      maxAbs(ANIMATION_VARIANTS.CRITICAL_HIT.x) > maxAbs(ANIMATION_VARIANTS.DAMAGE.x),
      "CRITICAL_HIT should shake with greater amplitude than plain DAMAGE"
    );
  });

  it("IDLE is a no-op transform (y:0, opacity:1)", () => {
    assert.deepEqual(ANIMATION_VARIANTS.IDLE, { y: 0, opacity: 1 });
  });

  it("FAINT sinks and fades, matching the pre-existing faint behavior", () => {
    assert.deepEqual(ANIMATION_VARIANTS.FAINT, { y: 46, opacity: 0 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd frontend && node --test src/pages/Game/battleAnimation.test.js`

Expected: FAIL — `battleAnimation.js` does not exist yet.

- [ ] **Step 3: Write `battleAnimation.js`**

```javascript
/**
 * Battle sprite animation states (spec Section 6). Phase 11 scope covers
 * FAINT/CRITICAL_HIT/DAMAGE/IDLE on the outer sprite wrapper only -- see
 * the Phase 11 plan's Rulings for why ATTACK/SEND_OUT (inner sprite) and
 * SWITCH/VICTORY (no dedicated trigger) aren't included here.
 */

/** Priority order: fainted beats critical beats plain damage beats idle. */
export function getAnimState({ fainted, critical, damageEffect }) {
  if (fainted) return "FAINT";
  if (damageEffect && critical) return "CRITICAL_HIT";
  if (damageEffect) return "DAMAGE";
  return "IDLE";
}

export const ANIMATION_VARIANTS = {
  IDLE: { y: 0, opacity: 1 },
  FAINT: { y: 46, opacity: 0 },
  // Recoil shake -- matches the pre-existing shake amplitude/shape so this
  // is a like-for-like state-machine wrap of the current DAMAGE behavior.
  DAMAGE: { x: [-10, 10, -10, 10, 0], opacity: [1, 0.7, 1, 0.7, 1] },
  // Sharper amplitude + one extra oscillation, per spec Section 6:
  // "Same as DAMAGE but sharper shake amplitude."
  CRITICAL_HIT: { x: [-16, 16, -16, 16, -8, 8, 0], opacity: [1, 0.6, 1, 0.6, 1, 0.8, 1] },
};
```

- [ ] **Step 4: Run the test again to verify it passes**

Run: `cd frontend && node --test src/pages/Game/battleAnimation.test.js`

Expected: PASS, `# pass 9`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Game/battleAnimation.js frontend/src/pages/Game/battleAnimation.test.js
git commit -m "feat: add battle animation state module (FAINT/CRITICAL_HIT/DAMAGE/IDLE)"
```

---

### Task 2: Capture `critical_hit` and wire the outer sprite wrapper to the new states

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (add 2 `useState` declarations near the other 6; add 2 additive lines inside `playEvent`'s damage branch at the existing `setDamageEffect(true)`/`setDamageEffect(false)` call sites; add 2 reset lines in the round-end reset block and 2 in `restartBattle()`; rewire the two outer sprite wrapper `motion.div`'s `animate` prop to use `ANIMATION_VARIANTS[getAnimState(...)]`)

**Interfaces:**
- Consumes: `getAnimState`, `ANIMATION_VARIANTS` from `frontend/src/pages/Game/battleAnimation.js` (Task 1).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Add the import and the 2 new state declarations**

Add the import alongside the other local imports:

```javascript
import { getAnimState, ANIMATION_VARIANTS } from './battleAnimation';
```

Add alongside the existing 6 animation booleans (re-verify current line numbers with `grep -n "useState(false)" frontend/src/pages/Game/BattleSim.jsx | grep -i "fainted\|attacking\|damageeffect"` before editing):

```javascript
  const [playerCritical, setPlayerCritical] = useState(false);
  const [enemyCritical, setEnemyCritical] = useState(false);
```

- [ ] **Step 2: Capture `critical_hit` additively in `playEvent`'s damage branch**

Re-verify current content with `grep -n "setDamageEffect(true)\|setDamageEffect(false)" frontend/src/pages/Game/BattleSim.jsx` — this specific pair (inside the main damage-landed branch, not the recoil/status-damage branches which use a different `setDamageFx` variable name) is what this step targets.

Change:

```javascript
    setDamageEffect(true);
    playSound('damage');
    setDefender((prev) => ({ ...prev, current_hp: event.targetHpAfter }));
    await wait(motionMs(600));
    setDamageEffect(false);
```

to:

```javascript
    const setCritical = isPlayer ? setEnemyCritical : setPlayerCritical;
    setDamageEffect(true);
    setCritical(!!event.critical_hit);
    playSound('damage');
    setDefender((prev) => ({ ...prev, current_hp: event.targetHpAfter }));
    await wait(motionMs(600));
    setDamageEffect(false);
    setCritical(false);
```

(No `await` added, no line reordered relative to the existing 5 lines — `setCritical` calls are inserted immediately after their corresponding `setDamageEffect` call, nothing else moves.)

- [ ] **Step 3: Add reset lines in the round-end reset block**

Re-verify with `grep -n "setEnemyFainted(false);" frontend/src/pages/Game/BattleSim.jsx` — find the round-end reset block (the one that also resets `setCurrentTurn('none')`, `setSelectedMove(null)`, etc., already touched by Phase 8's Task 1) and `restartBattle()` (which resets all 6 animation booleans together, e.g. currently `setPlayerAttacking(false); setEnemyAttacking(false); setPlayerDamageEffect(false); setEnemyDamageEffect(false); setPlayerFainted(false); setEnemyFainted(false);`).

In `restartBattle()`, change:

```javascript
    setPlayerAttacking(false);
    setEnemyAttacking(false);
    setPlayerDamageEffect(false);
    setEnemyDamageEffect(false);
    setPlayerFainted(false);
    setEnemyFainted(false);
```

to:

```javascript
    setPlayerAttacking(false);
    setEnemyAttacking(false);
    setPlayerDamageEffect(false);
    setEnemyDamageEffect(false);
    setPlayerFainted(false);
    setEnemyFainted(false);
    setPlayerCritical(false);
    setEnemyCritical(false);
```

If a separate round-end reset block also individually resets `playerDamageEffect`/`enemyDamageEffect`/`playerFainted`/`enemyFainted` (rather than only `restartBattle()` doing so), add the matching `setPlayerCritical(false)`/`setEnemyCritical(false)` pair there too, in the same place relative to its sibling resets. If no such separate block exists (i.e. `restartBattle()` is the only place these 6 are reset together), this step only touches `restartBattle()`.

- [ ] **Step 4: Rewire the outer sprite wrapper's `animate` prop**

Re-verify current content with `grep -n "enemyFainted$\|enemyDamageEffect && !reduceMotion" frontend/src/pages/Game/BattleSim.jsx` (the enemy block) and the equivalent for `playerFainted`/`playerDamageEffect`.

Change the enemy wrapper's `animate` prop from:

```javascript
                  animate={
                    enemyFainted
                      ? { y: 46, opacity: 0 }
                      : enemyDamageEffect && !reduceMotion
                      ? { x: [-10, 10, -10, 10, 0], opacity: [1, 0.7, 1, 0.7, 1] }
                      : { y: 0, opacity: 1 }
                  }
```

to:

```javascript
                  animate={
                    reduceMotion
                      ? (enemyFainted ? ANIMATION_VARIANTS.FAINT : ANIMATION_VARIANTS.IDLE)
                      : ANIMATION_VARIANTS[
                          getAnimState({ fainted: enemyFainted, critical: enemyCritical, damageEffect: enemyDamageEffect })
                        ]
                  }
```

and the player wrapper's equivalent (currently using the `...` spread pattern with `scaleX: -1` — re-verify its exact current text before editing, since it differs slightly in structure from the enemy block; preserve the `scaleX: -1` spread exactly as-is, only replace the fainted/damage-effect ternary portion the same way):

```javascript
                  animate={{
                    scaleX: -1,
                    ... (playerFainted
                      ? { y: 46, opacity: 0 }
                      : playerDamageEffect && !reduceMotion
                      ? { x: [-10, 10, -10, 10, 0], opacity: [1, 0.7, 1, 0.7, 1] }
                      : { y: 0, opacity: 1 })
                  }}
```

to:

```javascript
                  animate={{
                    scaleX: -1,
                    ...(reduceMotion
                      ? (playerFainted ? ANIMATION_VARIANTS.FAINT : ANIMATION_VARIANTS.IDLE)
                      : ANIMATION_VARIANTS[
                          getAnimState({ fainted: playerFainted, critical: playerCritical, damageEffect: playerDamageEffect })
                        ])
                  }}
```

(The `reduceMotion` branch is kept explicit — matching the previous behavior of skipping the shake beats entirely under reduced motion, per this file's existing `ANIMATION_GUIDE.md` contract, rather than letting `getAnimState` return `DAMAGE`/`CRITICAL_HIT` and then relying on the variant itself to look motion-safe, which it doesn't since the shake arrays still animate `x`.)

- [ ] **Step 5: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 6: Run Task 1's test again (regression check)**

Run: `cd frontend && node --test src/pages/Game/battleAnimation.test.js`

Expected: still PASS, `# pass 9` (this task didn't touch `battleAnimation.js`, this just confirms nothing accidentally broke it).

- [ ] **Step 7: Static verification**

```bash
grep -in "playerCritical\|enemyCritical" frontend/src/pages/Game/BattleSim.jsx
```

(`-i` matters: `setPlayerCritical`/`setEnemyCritical` capitalize the P/E right after `set`, so a case-sensitive grep misses the `playEvent` ternary line and both `restartBattle()` reset lines.)

Expected: matches at the 2 `useState` declarations, the 2 capture lines in `playEvent`, the 2 reset lines in `restartBattle()` (and possibly a separate round-end reset block per Step 3), and the 2 usages inside `getAnimState({...})` calls in Step 4 — read each match to confirm it's one of these, not something unexpected.

```bash
grep -n "getAnimState\|ANIMATION_VARIANTS" frontend/src/pages/Game/BattleSim.jsx
```

Expected: the import line plus exactly 2 usages of `getAnimState(...)` and the `ANIMATION_VARIANTS.FAINT`/`.IDLE`/`[getAnimState(...)]` references from Step 4.

If a live database happens to be available, land a critical hit in a real battle and confirm the defender's sprite now shakes with visibly larger amplitude and one extra oscillation compared to a normal hit, while a normal hit and a faint both still look exactly as they did before this phase (since `DAMAGE`/`FAINT`'s variant values are unchanged from the pre-existing inline values).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx
git commit -m "feat: distinguish critical hits from normal damage in the battle animation"
```

---

## Phase Completion

After Task 2's review is clean, Phase 11 is done — the last phase of the Core batch approved at the start of this project. Remaining known gaps, explicitly out of scope per this plan's Rulings and left for a future pass: ATTACK/SEND_OUT quality on the inner sprite element (Ruling 4), SWITCH/VICTORY as fully distinct states (no dedicated trigger exists yet), and the broader move-animation framework / HP-bar animation polish named in the original spec's "Polish batch," which was explicitly deferred at the very start of this project and never re-scoped into the Core batch.
