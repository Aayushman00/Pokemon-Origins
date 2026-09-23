# GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the FIGHT/BAG/POKéMON/RESTART command panel off its current modern-web-button chrome (gradient fill, rounded corners, hover-lift transform, diagonal shine-sweep animation, soft drop shadows) onto the same flat cream/dark-border GBA panel language already established elsewhere in this file (`.gba-hp-box`), and explicitly re-confirm RESTART's semantics are untouched and remain distinct from any flee/RUN concept — a pure CSS change plus a verification pass, no battle logic.

**Architecture:** No component/state changes. Only `.gba-main-menu button` and its pseudo-element/hover/active rules in `BattleGround.css` change; `.gba-main-menu`'s grid layout, the JSX button elements themselves, and `handleMainMenuSelection`/`restartBattle`/`confirmRestart` are untouched.

**Tech Stack:** No new dependency.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 4 (forbidden list: "modern gradients," "giant browser-style buttons"), Section 15 (RESET vs RUN), Section 9 Phase 9.

## Rulings (made during planning, binding on this plan)

1. **Match the existing `.gba-hp-box` palette, don't invent a new one.** This file already establishes a cream/dark-border GBA panel look (`.gba-hp-box`: `background: #e8e8c8; border: 4px solid #506860; border-radius: 12px;`, confirmed at `BattleGround.css` — grep for `gba-hp-box` before editing to re-verify current line numbers). The command menu buttons adopt the same three values (`#e8e8c8` background, `4px solid #506860` border, `12px` border-radius) rather than a separately-invented flatter/squarer style — one consistent panel language across the battle scene, matching the spec's "compact information density" and "restrained radius" guidance without introducing a second competing visual system.
2. **Remove the shine-sweep pseudo-element entirely, don't tone it down.** `.gba-main-menu button::after`/`:hover::after` (a diagonal white gradient bar that sweeps across the button on hover, 0.3-0.7s transition) is exactly the kind of decorative flourish spec Section 4's forbidden list calls out ("modern gradients," implicitly this class of hover animation is never used anywhere in official FRLG UI). It is deleted, not dimmed.
3. **`.gba-restart-btn` is explicitly out of scope for this phase**, even though its name suggests overlap. Verified: it's actually a generic action-button class reused across the victory/bag/party screens (`BattleSim.jsx` lines ~1156-1185 — Continue, Cancel, and similar buttons), not the command-menu's RESTART button (which is a plain `<button>` inside `.gba-main-menu`, styled by Ruling 1/2's changes). `.gba-restart-btn`'s own restyle is Phase 10's job (victory flow), per the original spec's phase breakdown. This plan does not touch it.
4. **RESET/RESTART verification is a grep-based confirmation, not new test infrastructure.** The original repo audit (start of this project) already established RESTART correctly maps to `restartBattle()` → `startBattle(true)` (a full fresh session), is never conflated with a flee/RUN action (none exists in this codebase), and the main menu is FIGHT/BAG/POKÉMON/RESTART exactly as the spec requires. This phase re-confirms that finding is still true after all prior phases' edits (nothing in Phases 1-8 touched this logic, but re-verifying costs one grep and removes any doubt) rather than re-deriving it from scratch or building a new automated test for behavior this codebase's existing test suite doesn't otherwise cover at the component level.

## Global Constraints

- Do not touch `handleMainMenuSelection`, `restartBattle`, `confirmRestart`, or any other JS logic in `BattleSim.jsx` — this phase is CSS-only in that file, plus a read-only verification pass.
- Do not touch `.gba-restart-btn` or any of its variants/usages.
- Do not touch `.gba-main-menu`'s own grid layout rule (columns/rows/gap/sizing) — only the `button` element's own styling and its `::after` pseudo-element.
- The four command labels (FIGHT, BAG, POKéMON, RESTART) and their `onClick` handlers must remain byte-identical — this phase never edits `BattleSim.jsx`.

---

### Task 1: Restyle the command panel buttons; verify RESET/RESTART semantics unchanged

**Files:**
- Modify: `frontend/src/pages/Game/BattleGround.css` (the `.gba-main-menu button` rule and its `:hover`/`:active`/`::after`/`:hover::after` rules — re-verify current line numbers with `grep -n "gba-main-menu" frontend/src/pages/Game/BattleGround.css` before editing, since this file has shifted across every prior phase this session)

**Interfaces:** none — pure CSS, no other task depends on this.

- [ ] **Step 1: Confirm the reference palette**

Run: `grep -n "gba-hp-box {" -A10 frontend/src/pages/Game/BattleGround.css`

Expected: confirms `background: #e8e8c8;`, `border: 4px solid #506860;`, `border-radius: 12px;` (or very close — read the actual current values and use exactly what's there, not what this plan assumes, in case an earlier phase changed them incidentally).

- [ ] **Step 2: Replace the button styling**

Change (current `.gba-main-menu button` rule and its hover/active/after rules):

```css
.gba-main-menu button {
  background: linear-gradient(to bottom, #f8f8f8, #e0e0e0);
  border: 3px solid #506860;
  border-radius: 6px;
  padding: 10px 8px;
  width: 100%;
  height: 100%;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.2s ease;
  font-family: 'Press Start 2P', monospace;
  color: #333;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 3px 6px rgba(0,0,0,0.1);
}

.gba-main-menu button:hover {
  background: linear-gradient(to bottom, #ffffff, #f0f0f0);
  transform: translateY(-3px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 10px rgba(0,0,0,0.15);
}

.gba-main-menu button:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
}

.gba-main-menu button::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 70%;
  height: 100%;
  background: rgba(255,255,255,0.2);
  transform: skewX(-25deg);
  transition: left 0.3s ease;
}

.gba-main-menu button:hover::after {
  left: 120%;
  transition: left 0.7s ease;
}
```

to (matching `.gba-hp-box`'s flat cream/dark-border language, no gradient/lift/shine-sweep, per Rulings 1-2):

```css
.gba-main-menu button {
  background: #e8e8c8;
  border: 4px solid #506860;
  border-radius: 12px;
  padding: 10px 8px;
  width: 100%;
  height: 100%;
  font-size: 14px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gba-main-menu button:hover {
  background: #f2f2d8;
}

.gba-main-menu button:active {
  background: #d8d8b8;
}
```

(The `::after`/`:hover::after` shine-sweep rules are deleted entirely, not replaced — there is no equivalent in the new style, per Ruling 2.)

- [ ] **Step 3: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 4: Static verification — restyle**

```bash
grep -n "linear-gradient\|translateY\|skewX" frontend/src/pages/Game/BattleGround.css | grep -A0 -B0 "gba-main-menu"
```

Since `grep -A/-B` on a piped second grep won't show context usefully, instead run:

```bash
sed -n '/\.gba-main-menu button/,/^}/p' frontend/src/pages/Game/BattleGround.css
```

and manually confirm none of `linear-gradient`, `translateY`, `skewX`, or `box-shadow` appear in the printed block(s) for `.gba-main-menu button` and its `:hover`/`:active` states — only the new flat-color rules from Step 2.

- [ ] **Step 5: Static verification — RESET/RESTART semantics unchanged (Ruling 4)**

```bash
grep -n "'RESTART'\|restartBattle\|confirmRestart\|'RUN'\|flee" frontend/src/pages/Game/BattleSim.jsx
```

Expected: matches for `'RESTART'` (the menu action string), `restartBattle`/`confirmRestart` (the handler functions), and **zero** matches for `'RUN'` or `flee` anywhere in the file — confirming the menu still reads FIGHT/BAG/POKÉMON/RESTART, RESTART still routes through the same full-reset handler, and no flee/RUN concept has been introduced or exists. If this grep finds ANY reference to a `'RUN'` action or `flee` logic, stop and report it — that would mean something changed since the original audit and needs investigation before this phase can be called verified, not something to silently reconcile.

- [ ] **Step 6: Visual check**

If a live database happens to be available, start a battle, reach the command menu, and confirm the four buttons now show a flat cream background with a dark border and no gradient/shadow/hover-lift/shine-sweep, matching the HP box's visual language. Click RESTART and confirm the existing "Restart this battle?" confirmation flow (YES/NO) still works exactly as before (this phase didn't touch that logic, but a quick click-through costs little and this is the one interactive path in this phase's diff).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Game/BattleGround.css
git commit -m "feat: restyle battle command panel buttons off modern web-button chrome"
```

---

## Phase Completion

After Task 1's review is clean, Phase 9 is done. Next phase per the spec's Core batch is **Phase 10 — Victory flow button restyle** (`.gba-restart-btn` and its variants, currently used by the Continue/Cancel-style buttons on the victory/bag/party screens — the actual "ugly victory modal" surface identified in the original audit), a separate plan written and reviewed on its own.
