# GBA/FRLG Redesign — Polish Batch Phase 14: Critical-Hit Screen Flash — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the "brief screen-flash accent" the design spec's Section 6 calls for on CRITICAL_HIT, the last named gap from Phase 11's scope (Ruling 1 there explicitly deferred it: "the screen-flash would reuse the existing `triggerHitFlash` mechanism in a future pass"). This flash must fire only on an actual critical hit — a normal hit must never trigger it — and must read as a sharp, hard on/off flash consistent with this battle screen's existing flash language, not a soft modern glow/blur.

**Architecture:** `BattleSim.jsx` already has a working, reviewed flash mechanism: `triggerHitFlash(moveType)` (`BattleSim.jsx:275-280`) sets a `hitFlash` color, rendered as a full-stage `motion.div.hit-flash` overlay (`mix-blend-mode: screen`, opacity `0 → 0.4 → 0` over 120ms via Framer Motion's `AnimatePresence`), called unconditionally on every landed hit at `playEvent:622` (`triggerHitFlash(event.moveType)`) — this is the type-tinted flash every hit already gets, and this plan does not touch it. This phase adds a second, independent, additive flash: a new `criticalFlash` boolean state, a new `triggerCriticalFlash()` function following the exact same trigger/auto-clear pattern as `triggerHitFlash`, a second `AnimatePresence`-wrapped overlay reusing the existing `.hit-flash` CSS class (same positioning/blend-mode, just a plain white background instead of a type color) with a sharper double-pulse opacity curve, and exactly one new call site — `if (event.critical_hit) triggerCriticalFlash();` — placed immediately after the existing `triggerHitFlash(event.moveType)` call. Nothing about the existing flash, `playEvent`'s sequencing, or the outer sprite animation state machine (Phase 11) is touched.

**Tech Stack:** Framer Motion (already in use for the existing `hit-flash` overlay) — no new dependency.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 6 ("Animation states" — CRITICAL_HIT row: "same as DAMAGE but sharper shake amplitude + a brief screen-flash accent").

## Rulings (made during planning, binding on this plan)

1. **A second, independent flash — not a parameterized version of the existing one.** `triggerHitFlash` fires unconditionally on every landed hit and colors the flash by move type; critical hits already trigger it too (a crit is still a landed hit). Rather than adding a `critical` parameter to `triggerHitFlash` that would change its color/timing conditionally (risking a change in the visible behavior of every normal hit if the branching were ever gotten wrong), this plan adds a fully separate `criticalFlash` state and `triggerCriticalFlash()` function. A normal hit still only ever sets `hitFlash`; a critical hit sets both `hitFlash` (the normal per-hit flash, unchanged) and `criticalFlash` (the new accent), stacking visually — exactly matching the spec's "same as DAMAGE but ALSO a screen-flash accent" wording (additive, not a replacement).
2. **White, not move-type-colored.** The existing `hitFlash` already carries the move's type color; layering a second same-colored flash on top would be visually redundant. A plain white flash (`#ffffff`) reads as the "extra emphasis" beat distinct from the type flash, consistent with how real GBA-era critical hits are typically presented as a brightness/contrast pop rather than a colored tint.
3. **Sharp double-pulse, not a soft fade — this is the "GBA-style timing, not generic modern effects" requirement.** The existing `hit-flash` already uses a single quick fade-in/fade-out (`0 → 0.4 → 0` over 120ms) — appropriately brief and blend-mode-based already, no blur or soft glow anywhere in this codebase's flash language. This plan's critical flash uses the same hard-edged `mix-blend-mode: screen` technique but with two distinct pulses (`opacity: [0, 0.7, 0, 0.5, 0]` over a fixed `times` array) rather than a single fade, so it visually reads as "flash-flash" (a harder hit) rather than a single softer flash — still using only `opacity` keyframes on a flat-color overlay, the same primitive the existing flash already uses, not any new visual technique (no blur, no scale, no gradient).
4. **`reduceMotion` fully suppresses the critical flash**, exactly like the existing `triggerHitFlash` already does (`if (reduceMotion) return;`, `BattleSim.jsx:276`) — `triggerCriticalFlash()` gets the identical guard.
5. **Total duration stays inside the existing 600ms damage-effect window.** `playEvent`'s damage branch already holds `damageEffect`/`critical` true for `await wait(motionMs(600))` (`BattleSim.jsx:632`, unmodified by this plan) before clearing them. The critical flash's total duration (`220`ms, auto-cleared via `setTimeout`) comfortably finishes well inside that window, so it never outlives the shake/flash beat it's meant to accent.

## Global Constraints

- No changes to `triggerHitFlash`, `hitFlash` state, or the existing `.hit-flash` `motion.div` block — this plan only adds new, parallel state/JSX, never modifies the existing flash.
- No changes to `playEvent`'s `await`/timing structure anywhere — the only new line inside `playEvent` is one additive `if (event.critical_hit) triggerCriticalFlash();` call, at the same point in the same function, no new `await`.
- No changes to the outer sprite `motion.div` wrapper's `ANIMATION_VARIANTS`/`getAnimState` logic (Phase 11) or the inner `BattlePokemonSprite`'s attack/send-out animation (Phase 13) — this is a screen-wide overlay, layered independently of both.
- The new flash must never fire for a non-critical hit under any circumstance.

---

### Task 1: Add the critical-hit screen flash

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx`

**Interfaces:** none — self-contained addition.

- [ ] **Step 1: Re-verify the current `hitFlash` state, `triggerHitFlash`, call site, JSX overlay, and `restartBattle` reset**

Run: `grep -n "hitFlash\|triggerHitFlash" frontend/src/pages/Game/BattleSim.jsx`

Confirm these 5 locations still match (re-verify exact current line numbers, which shift every phase):

1. State declaration (~line 130): `const [hitFlash, setHitFlash] = useState(null); // type-tinted overlay color`
2. `triggerHitFlash` function (~lines 275-280):
   ```jsx
     // Brief type-tinted flash over the stage on a landed hit
     const triggerHitFlash = (moveType) => {
       if (reduceMotion) return;
       const typeKey = String(moveType || '').toLowerCase();
       setHitFlash(TYPE_COLORS[typeKey] || '#ffffff');
       timersRef.current.push(setTimeout(() => setHitFlash(null), 280));
     };
   ```
3. Call site inside `playEvent` (~line 622): `triggerHitFlash(event.moveType);`
4. JSX overlay (~lines 961-971):
   ```jsx
               {/* Type-tinted hit flash */}
               <AnimatePresence>
                 {hitFlash && (
                   <motion.div
                     className="hit-flash"
                     style={{ background: hitFlash }}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 0.4 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.12 }}
                   />
                 )}
               </AnimatePresence>
   ```
5. `restartBattle`'s reset line (~line 824): `setHitFlash(null);`

If any of these 5 don't match exactly, stop and report NEEDS_CONTEXT with the mismatch.

- [ ] **Step 2: Add the `criticalFlash` state**

Immediately after the existing `hitFlash` state declaration, add:

```jsx
  const [criticalFlash, setCriticalFlash] = useState(false); // white double-pulse accent, crits only
```

- [ ] **Step 3: Add `triggerCriticalFlash`**

Immediately after the existing `triggerHitFlash` function, add:

```jsx
  // Extra white double-pulse accent layered on top of the normal hit flash,
  // critical hits only (spec Section 6: "sharper shake + a brief screen-flash accent").
  const triggerCriticalFlash = () => {
    if (reduceMotion) return;
    setCriticalFlash(true);
    timersRef.current.push(setTimeout(() => setCriticalFlash(false), 220));
  };
```

- [ ] **Step 4: Call it from `playEvent`, additively, only on a critical hit**

Change:

```jsx
    triggerHitFlash(event.moveType);
```

to:

```jsx
    triggerHitFlash(event.moveType);
    if (event.critical_hit) triggerCriticalFlash();
```

(No other line in this block changes — everything from `setDamageEffect(true)` onward, already reviewed in Phase 11, is untouched.)

- [ ] **Step 5: Add the JSX overlay**

Immediately after the existing `hit-flash` `AnimatePresence` block, add a second one:

```jsx
              {/* Critical-hit white double-pulse accent */}
              <AnimatePresence>
                {criticalFlash && (
                  <motion.div
                    className="hit-flash"
                    style={{ background: '#ffffff' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0, 0.5, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, times: [0, 0.25, 0.5, 0.75, 1] }}
                  />
                )}
              </AnimatePresence>
```

(Reuses the existing `.hit-flash` CSS class as-is — same `position: absolute; inset: 0; z-index: 5; pointer-events: none; mix-blend-mode: screen;` — no new CSS rule needed. Rendering this block immediately after the type-tinted one means it paints on top when both are active, per Ruling 1's "stacking" intent.)

- [ ] **Step 6: Reset `criticalFlash` in `restartBattle`**

Immediately after the existing `setHitFlash(null);` line in `restartBattle`, add:

```jsx
    setCriticalFlash(false);
```

- [ ] **Step 7: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 8: Static verification**

```bash
grep -n "criticalFlash\|triggerCriticalFlash" frontend/src/pages/Game/BattleSim.jsx
```

Expected: matches at the state declaration, the function definition, the `playEvent` call site, the JSX condition (`{criticalFlash &&`), and the `restartBattle` reset — 5 occurrences of `criticalFlash`-related identifiers (state + reset + JSX use it; function name adds 2 more for its declaration and its call site). Read each to confirm it's one of these 5 sites, not something unexpected.

```bash
grep -n "triggerHitFlash(event.moveType)" -A1 frontend/src/pages/Game/BattleSim.jsx
```

Expected: the existing call, immediately followed by `if (event.critical_hit) triggerCriticalFlash();` — confirming the new call is additive right after the existing one, not replacing it or moved elsewhere.

- [ ] **Step 9: Visual check**

If a live database happens to be available, land a normal hit and confirm only the type-tinted flash plays (unchanged from before this phase); land a critical hit and confirm the type-tinted flash still plays AND a sharper white double-pulse now layers on top of it. Toggle `prefers-reduced-motion` and confirm neither flash plays on a critical hit under reduced motion (the normal hit flash was already suppressed under reduced motion before this phase; this phase adds the same guard to the new flash).

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx
git commit -m "feat: add a white double-pulse screen flash accent on critical hits"
```

---

## Phase Completion

After Task 1's review is clean, Phase 14 (Polish batch, phase 3 of 3) is done — the last phase of the Polish batch. Per the user's explicit instruction, the next step is a combined final Polish-batch whole-branch review (covering Phases 12, 13, and 14 together), and only after that review passes clean does `superpowers:finishing-a-development-branch` get invoked for the merge/PR.
