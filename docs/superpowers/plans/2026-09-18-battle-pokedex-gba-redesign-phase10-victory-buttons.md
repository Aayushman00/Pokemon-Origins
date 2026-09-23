# GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the "Retry save" / "Continue" / "Battle Again" / "Back to hub" buttons shown at the end of a battle off modern-pill-button chrome (red gradient fill, rounded corners, a decorative white circle pseudo-element, hover-lift transform, soft drop shadows) onto the app's **existing** `.pixel-btn` chrome — per the design spec's explicit instruction, not a newly invented style — closing out the actual "ugly victory modal" surface identified in the original repo audit (the win/lose message-progression flow itself was already correct and is untouched).

**Architecture:** The spec (Section 8, quoted below) is explicit: swap `.gba-restart-btn` to `.pixel-btn` chrome "instead of inventing new button chrome." `.pixel-btn`/`.pixel-btn--primary`/`.pixel-btn:disabled` already exist in `frontend/src/styles/tokens.css:167-208` and are already used elsewhere in this exact file (`BattleSim.jsx`'s error-state "Back to hub" button, line ~832). This means the fix is a `className` swap in JSX (a small, mechanical, non-logic change — no `onClick`/`disabled`/`whileHover`/`whileTap` prop touched) plus deleting the now-dead `.gba-restart-btn*` CSS rules from `BattleGround.css`, not a from-scratch CSS restyle. This is a correction from an earlier draft of this plan, which incorrectly invented new hardcoded hex colors instead of reusing `.pixel-btn` — caught during plan review, see Ruling 1.

**Tech Stack:** No new dependency.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 2 ("Visual direction" — forbidden chrome list), Section 8 ("Victory flow"), Section 9 Phase 10.

## Rulings (made during planning, binding on this plan)

1. **Use `.pixel-btn`, don't invent new colors — corrected during plan review.** An earlier draft of this plan replaced `.gba-restart-btn`'s red-gradient chrome with newly-invented flat hex colors (`#48d232` reused from `.health-good`, plus new hover/active shades). A plan reviewer caught that this directly contradicts the spec's own explicit text: Section 8 says to restyle onto "the same pixel-button chrome already defined for the rest of the app (`.pixel-btn` in `tokens.css`/`STYLE_GUIDE.md`) instead of inventing new button chrome," and Section 9's Phase 10 line says "swap `.gba-restart-btn` to `.pixel-btn` chrome." The corrected plan does exactly that: JSX `className` changes from `gba-restart-btn`/`gba-restart-btn--secondary` to `pixel-btn`/`pixel-btn--primary`, and the `.gba-restart-btn*` CSS rules are deleted (dead code) rather than restyled in place.
2. **Primary/secondary mapping:** `.pixel-btn--primary` (accent-colored, `tokens.css:193-196`) is used for the single "confirm and move on" action per screen — "Retry save," "Continue," and "Battle Again" (the three contexts where only one primary action is shown). Plain `.pixel-btn` (no `--primary` modifier) is used for "Back to hub," the secondary/alternate exit on the loss screen where two buttons appear side by side — matching `.pixel-btn--primary`'s existing purpose elsewhere in the app (the one recommended action gets the accent, everything else gets the base style).
3. **This is a small, scoped JSX change, not a logic change.** Only the `className` string on 4 button elements changes (`BattleSim.jsx` lines ~1156, ~1165, ~1177, ~1185 as of this plan's writing — re-verify current line numbers before editing). `onClick` handlers, `disabled` logic, `whileHover`/`whileTap` framer-motion props, and all surrounding JSX structure/text are untouched. This keeps the phase's actual risk profile equivalent to a CSS-only change even though it technically touches `BattleSim.jsx`.
4. **`.pixel-btn:disabled` already exists — no new rule needed.** The earlier draft's Ruling 4 proposed adding a `.gba-restart-btn:disabled` rule from scratch to fix a real gap (the "Continue" button's `disabled={progressSave !== 'saved'}` had no visual treatment). Verified: `.pixel-btn:disabled` (`tokens.css:203-208`, `opacity: 0.5; cursor: not-allowed;`) already covers this — the `className` swap in Ruling 1 fixes this gap as a side effect, with no new CSS needed.

## Global Constraints

- Do not touch `onClick` handlers, `disabled` logic, `whileHover`/`whileTap` props, or any other JSX structure/text in `BattleSim.jsx` — only the 4 `className` string values change.
- Do not touch `.gba-finish-actions` (the flex container) or `.gba-dialog-box`/`.gba-xp-summary` — only the button `className`s and the now-dead `.gba-restart-btn*` CSS block.
- Do not touch `.gba-main-menu button` (Phase 9's restyle) or `.pixel-btn`/`.pixel-btn--primary` themselves in `tokens.css` — this phase consumes those existing classes, it doesn't modify them.
- Before deleting `.gba-restart-btn*` CSS, confirm via grep that nothing outside `BattleSim.jsx`'s 4 usages (all being changed in this same task) references those class names — dead code must actually be dead before removal.

---

### Task 1: Swap victory-flow buttons to `.pixel-btn` chrome

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (4 `className` values, lines ~1156, ~1165, ~1177, ~1185 — re-verify current line numbers with `grep -n "gba-restart-btn" frontend/src/pages/Game/BattleSim.jsx` before editing)
- Modify: `frontend/src/pages/Game/BattleGround.css` (delete the `.gba-restart-btn`/`::before`/`:hover`/`:active`/`--secondary`/`--secondary::before`/`--secondary:hover` rules — re-verify current line numbers with `grep -n "gba-restart-btn" frontend/src/pages/Game/BattleGround.css` before editing)

**Interfaces:** none — no other task depends on this.

- [ ] **Step 1: Confirm current state**

Run: `grep -n "gba-restart-btn" frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css`

Expected: 4 JSX matches (one is `gba-restart-btn gba-restart-btn--secondary` on the same line, still one grep match) and the CSS matches this plan's quoted "before" block below.

- [ ] **Step 2: Change the 4 `className` values in `BattleSim.jsx`**

Change each of these 4 buttons' `className` (re-verify exact surrounding JSX matches before editing each — only the `className` value changes, nothing else on these lines):

1. "Retry save" button: `className="gba-restart-btn"` → `className="pixel-btn pixel-btn--primary"`
2. "Continue"/"Saving..." button: `className="gba-restart-btn"` → `className="pixel-btn pixel-btn--primary"`
3. "Battle Again" button: `className="gba-restart-btn"` → `className="pixel-btn pixel-btn--primary"`
4. "Back to hub" button: `className="gba-restart-btn gba-restart-btn--secondary"` → `className="pixel-btn"`

- [ ] **Step 3: Delete the now-dead CSS**

Confirm nothing else references these classes first:

```bash
grep -rn "gba-restart-btn" frontend/src --include=*.jsx --include=*.js --include=*.css
```

Expected: no output (Step 2 already removed the only 4 usages; if this finds anything else, STOP — the class isn't actually dead, don't delete its CSS).

Then delete this entire block from `frontend/src/pages/Game/BattleGround.css` (re-verify it matches exactly before deleting — this is the same "before" text an earlier draft of this plan already quoted and verified byte-accurate):

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
```

and this block (leave `.gba-finish-actions`, which sits between the two deleted blocks, untouched):

```css
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

- [ ] **Step 4: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 5: Static verification**

```bash
grep -rn "gba-restart-btn" frontend/src
```

Expected: no output anywhere in the frontend source (fully removed, both the JSX class usages and the CSS rules).

```bash
grep -n "pixel-btn" frontend/src/pages/Game/BattleSim.jsx
```

Expected: 5 matches — the 4 new victory-button usages from Step 2, plus the pre-existing error-state "Back to hub" button (line ~832) that already used `pixel-btn` before this task.

- [ ] **Step 6: Visual check**

If a live database happens to be available, win and lose a battle to see both paths: confirm "Continue"/"Battle Again"/"Retry save" now render in the app's existing accent pixel-button style (matching whatever other `.pixel-btn--primary` buttons look like elsewhere in the app, e.g. the auth/hub screens), "Back to hub" renders as a plain `.pixel-btn`, and a disabled "Continue" (mid-save) visibly dims via the pre-existing `.pixel-btn:disabled` rule.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css
git commit -m "feat: swap victory-flow buttons to existing pixel-btn chrome, remove dead gba-restart-btn CSS"
```

---

## Phase Completion

After Task 1's review is clean, Phase 10 is done — the last purely-cosmetic phase in the Core batch. Next and final phase is **Phase 11 — Animation state machine** (replacing the boolean-flag-driven `playerAttacking`/`...DamageEffect`/`...Fainted` animation approach with explicit IDLE/SEND_OUT/ATTACK/DAMAGE/CRITICAL_HIT/FAINT/SWITCH/VICTORY states per the design spec's Section 6), a separate plan written and reviewed on its own — the most architecturally involved remaining phase, since it touches the actual animation/timing logic this whole redesign has otherwise carefully avoided modifying.
