# GBA/FRLG Redesign — Polish Batch Phase 13: ATTACK/SEND_OUT Animation Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the ATTACK and SEND_OUT animations the genuine multi-phase quality the design spec's Section 6 calls for (ATTACK: "anticipation → lunge → impact → recovery"; SEND_OUT: a snappy pop-in rather than a flat linear slide) — the gap Phase 11 explicitly left open (Ruling 4: "the inner `BattlePokemonSprite`'s attack-lunge/send-out-slide animation is explicitly out of scope... a real, documented gap") because untangling the inner sprite's shared `x`-transform property looked too risky to attempt inside that phase's tighter budget.

**Architecture:** The user asked to "revisit the shared x/inner-sprite architecture before changing it" — this plan's investigation (below) concludes the architecture does **not** need restructuring, only richer values inside it, which changes the risk profile from "risky refactor" to "safe value substitution." `BattleSim.jsx`'s inner `BattlePokemonSprite` element's `animate.x` is a single ternary: `attacking && !reduceMotion ? [lunge array] : introStarted ? 0 : entryStart`. These two cases — "currently mid-attack" and "resting/entering" — are mutually exclusive in time (an attack can only start once `introStarted` is already true, per `playEvent`'s own sequencing, which this plan does not touch), and the lunge array already starts and ends at `0`, meaning it's a pure round-trip displacement layered temporarily on top of the settled resting position, not a competing owner of the property. This is why the existing single-property approach already works correctly in production. This plan only enriches the *values* inside each branch — more keyframes in the attack array (anticipation/lunge/impact/recovery instead of a flat 3-point bounce) and a spring-physics transition for the entry case (a natural "pop" instead of a linear ease) — inside the exact same conditional structure, same trigger booleans, same total-duration envelope. No new state, no new props, no restructuring into separate elements.

**Tech Stack:** Framer Motion (already in use) — keyframe arrays with `transition.times`, and a `type: "spring"` transition config, both standard Framer Motion APIs already used elsewhere in this file (the keyframe-array pattern is exactly what today's flat lunge already does; spring transitions are new to this file but not a new dependency).

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 6 ("Animation states" — ATTACK and SEND_OUT rows).

## Rulings (made during planning, binding on this plan)

1. **The shared `x` architecture is kept, not split into separate elements — investigated and confirmed safe.** Splitting position (send-out settle point) and lunge (attack displacement) into two nested elements was the alternative considered. It was rejected because: (a) the two cases never overlap in time (`playEvent`'s existing `await` sequencing, unmodified by this plan, guarantees `introStarted` is true before any attack can fire), (b) the lunge keyframe array already round-trips to `0`, so it never permanently displaces the resting position it's layered on, and (c) this exact pattern is already live in production across every phase of this session without incident — introducing a second element to "fix" something that isn't actually broken would be new, unreviewed surface area for zero behavioral gain. This directly answers the "revisit before changing" instruction: revisited, and the conclusion is *keep the architecture, enrich the values*.
2. **Total animation durations are preserved exactly.** The attack lunge's `transition.x` duration stays `0.45`s (450ms), matching `playEvent`'s existing `setAttacking(true)` → `await wait(motionMs(500))` → `setAttacking(false)` window (`BattleSim.jsx:583-587`, unmodified by this plan) with the same ~50ms safety margin before the boolean flips back that the current flat animation already relies on. The entry (send-out) case's spring transition is tuned (`stiffness: 260, damping: 20`) to settle in roughly the same ~450-500ms window the current linear ease-out already takes, so the visual "how long until this Pokémon is fully on screen" beat doesn't shift, keeping this in step with the message-queue pacing established in Phase 8.
3. **`reduceMotion` gets a genuine fix here, not just preservation, since this plan is already rewriting these exact ternaries.** Today, the attack lunge is correctly suppressed under `reduceMotion` (`attacking && !reduceMotion` already gates the array), but the entry slide-in's duration uses `motionMs(450)` — which already correctly zeroes under `reduceMotion` for a duration-based tween, but a `type: "spring"` transition has no `duration` to zero this way (springs are governed by `stiffness`/`damping`, not by a duration your app can scale down). This plan adds an explicit `reduceMotion` branch so the spring is used only when motion is not reduced; under `reduceMotion`, entry position still jumps straight to its settled value via a `{ duration: 0 }` transition, exactly matching this file's existing "skip the beat, keep the end state" contract used everywhere else (Phase 11's `ANIMATION_VARIANTS` reduceMotion branch, the message queue, etc.).
4. **The player entry's existing `delay: motionMs(350) / 1000`** (so the player's Pokémon visibly enters after the enemy's, `BattleSim.jsx:1091-1092`) **is preserved unchanged** in both the new spring and new reduceMotion branches — this plan only changes what kind of transition plays, never when it starts relative to the enemy's.
5. **SEND_OUT's spring-bounce is intentionally the ONLY new "bounce" in this diff.** The spec's ATTACK row asks for anticipation/lunge/impact/recovery, which this plan delivers via a 5-point keyframe array (`[0, 8, -32, -26, 0]` enemy / mirrored `[0, -8, 32, 26, 0]` player), not a spring — attacks need a precise, repeatable, symmetric round-trip shape a spring's physics-driven settle wouldn't reliably produce, whereas SEND_OUT is a one-shot settle-to-rest motion a spring suits naturally.

## Global Constraints

- No changes anywhere in `playEvent` — not to `await` calls, not to when `setPlayerAttacking`/`setEnemyAttacking` are set true/false, not to any timing constant. This plan only touches the two `BattlePokemonSprite` elements' own `animate`/`transition` JSX props.
- No changes to the outer `motion.div` wrapper's `animate` prop (the Phase 11 `ANIMATION_VARIANTS`/`getAnimState` DAMAGE/CRITICAL_HIT/FAINT/IDLE logic) — this plan only touches the *inner* `BattlePokemonSprite` element's own props.
- Both the enemy and player lunge/entry animations keep their existing mutual-exclusion structure (`attacking && !reduceMotion ? [...] : introStarted ? 0 : entryStart`) — only the array contents and the transition config objects change, never the shape of the conditional.
- `reduceMotion` must fully suppress both the new lunge keyframes and the new spring bounce, falling back to instant (`duration: 0`) transitions to the same resting values as today.

---

### Task 1: Enrich the enemy sprite's attack lunge and send-out spring

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx`

**Interfaces:** none — self-contained JSX prop changes on one element.

- [ ] **Step 1: Re-verify the current block**

Run: `grep -n "enemyAttacking && !reduceMotion" frontend/src/pages/Game/BattleSim.jsx`

Confirm the surrounding `BattlePokemonSprite` block (enemy, `variant="front"`) still matches this "before" text exactly (re-verify line numbers, which shift every phase):

```jsx
                    initial={{ x: 60, opacity: 0 }}
                    animate={{
                      x: enemyAttacking && !reduceMotion ? [0, -24, 0] : introStarted ? 0 : 60,
                      opacity: introStarted ? 1 : 0,
                    }}
                    transition={{
                      x: enemyAttacking
                        ? { duration: 0.45 }
                        : { duration: motionMs(450) / 1000, ease: 'easeOut' },
                      opacity: { duration: motionMs(350) / 1000 },
                    }}
```

- [ ] **Step 2: Replace with the enriched version**

```jsx
                    initial={{ x: 60, opacity: 0 }}
                    animate={{
                      x:
                        enemyAttacking && !reduceMotion
                          ? [0, 8, -32, -26, 0]
                          : introStarted
                          ? 0
                          : 60,
                      opacity: introStarted ? 1 : 0,
                    }}
                    transition={{
                      x:
                        enemyAttacking && !reduceMotion
                          ? { duration: 0.45, times: [0, 0.15, 0.6, 0.8, 1] }
                          : reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 260, damping: 20 },
                      opacity: { duration: motionMs(350) / 1000 },
                    }}
```

(The `x` array grows from a flat 3-point bounce to a 5-point anticipation→lunge→impact→recovery curve: `0` rest → `8` anticipation pull-back away from the target → `-32` lunge (deeper than the old `-24`) → `-26` brief impact hold → `0` recovery, timed via `times: [0, 0.15, 0.6, 0.8, 1]` so the anticipation is quick, the lunge snaps in, and the hold/recovery read clearly — all within the same `0.45`s total duration as before, per Ruling 2. The entry case's `transition.x` swaps a flat `easeOut` tween for a spring when motion isn't reduced, and an instant `{ duration: 0 }` jump when it is, per Ruling 3 — `introStarted`'s resting value (`0` or `60`) is unchanged, only how it's reached changes.)

- [ ] **Step 3: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 4: Static verification**

```bash
grep -n "8, -32, -26\|stiffness: 260, damping: 20" frontend/src/pages/Game/BattleSim.jsx
```

(Note: `type: 'spring'` alone is NOT a safe grep target here — the file already has 2 pre-existing, unrelated `type: 'spring'` occurrences for HP-bar-fill width transitions, using `stiffness: 120, damping: 20`. `stiffness: 260, damping: 20` is unique to this task's new code.)

Expected: both new patterns present, exactly once each (this task only touches the enemy block).

- [ ] **Step 5: Visual check**

If a live database happens to be available, land a normal (non-critical) hit as the enemy and confirm the sprite now shows a brief pull-back before lunging, rather than a flat forward-back bounce; reload/re-battle and confirm the enemy's send-out now has a slight springy overshoot-and-settle instead of a linear slide-in. Toggle `prefers-reduced-motion` (OS/browser setting) and confirm the enemy still appears with no lunge and no spring bounce — an instant, static entry — matching the pre-existing reduced-motion contract.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx
git commit -m "feat: give the enemy attack lunge anticipation/impact phases and a spring send-out"
```

---

### Task 2: Enrich the player sprite's attack lunge and send-out spring (mirrored)

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx`

**Interfaces:** none.

- [ ] **Step 1: Re-verify the current block**

Run: `grep -n "playerAttacking && !reduceMotion" frontend/src/pages/Game/BattleSim.jsx`

Confirm the surrounding `BattlePokemonSprite` block (player, `variant="back"`) still matches this "before" text exactly:

```jsx
                    initial={{ x: -60, opacity: 0, scaleX: -1 }}
                    animate={{
                      scaleX: -1,
                      x: playerAttacking && !reduceMotion ? [0, 24, 0] : introStarted ? 0 : -60,
                      opacity: introStarted ? 1 : 0,
                    }}
                    transition={{
                      x: playerAttacking
                        ? { duration: 0.45 }
                        : { duration: motionMs(450) / 1000, delay: motionMs(350) / 1000, ease: 'easeOut' },
                      opacity: { duration: motionMs(350) / 1000, delay: motionMs(350) / 1000 },
                    }}
```

- [ ] **Step 2: Replace with the enriched (mirrored) version**

```jsx
                    initial={{ x: -60, opacity: 0, scaleX: -1 }}
                    animate={{
                      scaleX: -1,
                      x:
                        playerAttacking && !reduceMotion
                          ? [0, -8, 32, 26, 0]
                          : introStarted
                          ? 0
                          : -60,
                      opacity: introStarted ? 1 : 0,
                    }}
                    transition={{
                      x:
                        playerAttacking && !reduceMotion
                          ? { duration: 0.45, times: [0, 0.15, 0.6, 0.8, 1] }
                          : reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 260, damping: 20, delay: motionMs(350) / 1000 },
                      opacity: { duration: motionMs(350) / 1000, delay: motionMs(350) / 1000 },
                    }}
```

(Mirrored signs from Task 1 per the player facing the opposite direction: `8`→`-8`, `-32`→`32`, `-26`→`26`, matching the existing sign convention already established by the pre-existing `[0, -24, 0]` vs `[0, 24, 0]` pair. The player's pre-existing entry `delay: motionMs(350) / 1000` — so the player enters visibly after the enemy — is preserved on the new spring branch per Ruling 4; the `reduceMotion` branch intentionally has no delay, matching how an instant `{ duration: 0 }` jump has nothing to delay.)

- [ ] **Step 3: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 4: Static verification**

```bash
grep -n "\-8, 32, 26\|stiffness: 260, damping: 20" frontend/src/pages/Game/BattleSim.jsx
```

Expected: the player's array pattern present once, and `stiffness: 260, damping: 20` now present twice total in the file (enemy from Task 1, player from this task) — do not grep on `type: 'spring'` alone, per Task 1 Step 4's note about the 2 pre-existing, unrelated HP-bar-fill spring transitions elsewhere in this file.

- [ ] **Step 5: Visual check**

If a live database happens to be available, land a hit as the player and confirm the mirrored anticipation/lunge/impact/recovery reads correctly (pulling back toward the bottom-left before lunging up-right into the frame); confirm the player's send-out still visibly follows the enemy's (same relative delay as before) and now also has the spring overshoot. Confirm `prefers-reduced-motion` still suppresses both for the player exactly as it does for the enemy.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx
git commit -m "feat: give the player attack lunge anticipation/impact phases and a spring send-out"
```

---

## Phase Completion

After Task 2's review is clean, Phase 13 (Polish batch, phase 2 of 3) is done. Next: **Phase 14 — Critical-hit screen flash**, a separate plan written and reviewed on its own, reusing the existing `triggerHitFlash` mechanism (`BattleSim.jsx:622`) rather than introducing a new effect system.
