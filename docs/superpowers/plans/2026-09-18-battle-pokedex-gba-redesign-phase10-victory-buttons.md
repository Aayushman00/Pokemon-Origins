# GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `.gba-restart-btn` and its `--secondary` variant — the "Retry save" / "Continue" / "Battle Again" / "Back to hub" buttons shown at the end of a battle — off modern-pill-button chrome (red gradient fill, rounded corners, a decorative white circle pseudo-element, hover-lift transform, soft drop shadows) onto the same flat GBA panel language established in Phase 9, closing out the actual "ugly victory modal" surface identified in the original repo audit (the win/lose message-progression flow itself was already correct and is untouched).

**Architecture:** No component/state changes. Only the CSS for `.gba-restart-btn`, its `::before` pseudo-element, `--secondary` variant, and their hover/active states change in `BattleGround.css`. The JSX (`BattleSim.jsx`'s `uiPhase === 'finished'` block, its `motion.button` `whileHover`/`whileTap` scale-tap feedback, `onClick` handlers, `disabled` logic) is untouched — this phase is chrome only, matching Phase 9's scope discipline.

**Tech Stack:** No new dependency.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 4 (forbidden list), Section 14 ("Victory screen"), Section 9 Phase 10.

## Rulings (made during planning, binding on this plan)

1. **Primary/secondary distinction via color, not shape.** The current code distinguishes the primary action (red) from the secondary "Back to hub" action (cream) — this plan keeps that same primary/secondary color-based hierarchy rather than inventing a new distinguishing mechanic, since it already reads clearly and matches how real GBA dialogs sometimes use accent color for the recommended option. The primary button's flat color becomes `#48d232` (this file's own established "good/positive" HP-bar-good color, `BattleGround.css`'s `.health-good` rule — reused, not invented, for visual consistency with the rest of the battle scene) instead of red, since red in this UI language is reserved for danger/damage states (HP-critical, damage flashes) elsewhere in this same file — using it for a positive "you won, continue" action was a mismatched signal, not just a stylistic one.
2. **Secondary button matches Phase 9's exact flat cream palette.** `.gba-restart-btn--secondary` becomes `#e8e8c8` background / `#506860` border — the same values Phase 9 already established for the command menu and `.gba-hp-box` — one consistent panel language across the whole battle scene rather than a third slightly-different cream shade.
3. **The decorative `::before` circle is deleted, not restyled.** It's a purely ornamental white-circle-with-shadow with no semantic meaning (not an icon representing the action, just decoration) — exactly the kind of "arbitrary CSS" the spec's forbidden list calls out. Deleted entirely, matching how Phase 9 deleted (not toned down) the shine-sweep.
4. **A `:disabled` state is added — a small, justified addition, not scope creep.** The "Continue" button already sets `disabled={progressSave !== 'saved'}` in JSX (existing logic, unchanged), but `BattleGround.css` currently has no `.gba-restart-btn:disabled` rule at all — the button visually looks fully active even when non-interactive. This is a pre-existing gap this phase's CSS pass can cheaply close (one rule, `opacity` + `cursor`) while already touching this exact selector; it's not a new feature, it's completing a state the existing JSX logic already exposes but the existing CSS never styled.

## Global Constraints

- Do not touch any JS/JSX in `BattleSim.jsx` — no changes to `onClick` handlers, `disabled` logic, `whileHover`/`whileTap` props, or the win/lose message/XP-summary text (already correct per the original audit).
- Do not touch `.gba-finish-actions` (the flex container) or `.gba-dialog-box`/`.gba-xp-summary` — only `.gba-restart-btn` and its `::before`/`--secondary`/`:hover`/`:active` rules.
- `.gba-main-menu button` (Phase 9's restyle) must not be touched or referenced — these are separate selectors for separate UI regions; no shared-class refactor is in scope here.

---

### Task 1: Restyle the victory-flow buttons

**Files:**
- Modify: `frontend/src/pages/Game/BattleGround.css` (the `.gba-restart-btn` block and its `::before`/`:hover`/`:active`/`--secondary`/`--secondary::before`/`--secondary:hover` rules — re-verify current line numbers with `grep -n "gba-restart-btn" frontend/src/pages/Game/BattleGround.css` before editing, since this file has shifted across every prior phase this session)

**Interfaces:** none — pure CSS, no other task depends on this.

- [ ] **Step 1: Confirm current state**

Run: `grep -n "gba-restart-btn" -A15 frontend/src/pages/Game/BattleGround.css | head -70`

Expected: confirms the current rules match this plan's quoted "before" text below (word-for-word) before editing.

- [ ] **Step 2: Replace the button styling**

Change (current, spanning `.gba-restart-btn` through `.gba-restart-btn--secondary:hover`):

```css
.gba-restart-btn {
  margin-top: 10px;
  padding: 8px 14px;
  background: linear-gradient(to bottom, #f05858, #e04848);
  border: 3px solid #506860;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Press Start 2P', monospace;
  color: white;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.2);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
}

.gba-restart-btn::before {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  border: 2px solid #506860;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.3);
}

.gba-restart-btn:hover {
  background: linear-gradient(to bottom, #ff6868, #f05858);
  transform: translateY(-3px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 10px rgba(0,0,0,0.25);
}

.gba-restart-btn:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
}

/* Loss screen offers two exits: retry (primary) or back to the hub */
.gba-finish-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.gba-restart-btn--secondary {
  background: linear-gradient(to bottom, #e8e8c8, #d8d8b0);
  color: #33403a;
  text-shadow: none;
}

.gba-restart-btn--secondary::before {
  display: none;
}

.gba-restart-btn--secondary:hover {
  background: linear-gradient(to bottom, #f4f4d8, #e8e8c8);
}
```

to (flat colors per Rulings 1-3, `.gba-finish-actions` unchanged and included here only for surrounding context — do not modify it):

```css
.gba-restart-btn {
  margin-top: 10px;
  padding: 8px 14px;
  background: #48d232;
  border: 3px solid #2c7a1c;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Press Start 2P', monospace;
  color: white;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.3);
}

.gba-restart-btn:hover {
  background: #56e03e;
}

.gba-restart-btn:active {
  background: #3ab528;
}

.gba-restart-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loss screen offers two exits: retry (primary) or back to the hub */
.gba-finish-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.gba-restart-btn--secondary {
  background: #e8e8c8;
  border-color: #506860;
  color: #33403a;
  text-shadow: none;
}

.gba-restart-btn--secondary:hover {
  background: #f2f2d8;
}
```

(The `::before` circle and `--secondary::before` override are deleted entirely, per Ruling 3 — there is no replacement, nothing else references them.)

- [ ] **Step 3: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 4: Static verification**

```bash
sed -n '/\.gba-restart-btn {/,/^\.gba-battle-log-toggle/p' frontend/src/pages/Game/BattleGround.css
```

Expected: printed block shows only the new flat rules (no `linear-gradient`, `transform`, `box-shadow`, or any `::before` rule for either `.gba-restart-btn` or `.gba-restart-btn--secondary`), plus the untouched `.gba-finish-actions` rule sitting in between exactly as before.

```bash
grep -n "gba-restart-btn\|gba-finish-actions" frontend/src/pages/Game/BattleSim.jsx
```

Expected: unchanged from before this task (4 JSX usages of `gba-restart-btn`, 1 of `gba-finish-actions`) — this task made zero JS/JSX edits, this grep is a scope-confirmation, not something that should show new matches.

- [ ] **Step 5: Visual check**

If a live database happens to be available, win a battle and confirm: the "Continue"/"Battle Again" button is now a flat green with a dark border (no gradient, no white circle, no lift-on-hover), the "Back to hub" secondary button is flat cream matching the command panel's Phase 9 style, and — if reachable — a disabled "Continue" button (mid-save) visibly dims rather than looking identically clickable.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Game/BattleGround.css
git commit -m "feat: restyle victory-flow buttons off modern pill-button chrome"
```

---

## Phase Completion

After Task 1's review is clean, Phase 10 is done — the last purely-cosmetic phase in the Core batch. Next and final phase is **Phase 11 — Animation state machine** (replacing the boolean-flag-driven `playerAttacking`/`...DamageEffect`/`...Fainted` animation approach with explicit IDLE/SEND_OUT/ATTACK/DAMAGE/CRITICAL_HIT/FAINT/SWITCH/VICTORY states per the design spec's Section 6), a separate plan written and reviewed on its own — the most architecturally involved remaining phase, since it touches the actual animation/timing logic this whole redesign has otherwise carefully avoided modifying.
