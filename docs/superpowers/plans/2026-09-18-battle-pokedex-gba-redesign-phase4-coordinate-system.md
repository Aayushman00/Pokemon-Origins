# GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `top`/`right`/`bottom`/`left` pixel offsets currently scattered directly in `BattleGround.css` for the opponent and player sprite slots with a single, named, reusable `battleLayout.js` module — a mechanical extraction with **zero visual change**, establishing the one source of truth the design spec calls for before later phases (backgrounds/shadows, sprite placement, trainer integration) build on top of it.

**Architecture:** No new coordinate math, no new rendering approach. The current CSS-only positioning (`.gba-enemy-container { top: 30px; right: 40px; }`, `.gba-player-container { bottom: 40px; left: 40px; }`) already produces correct results (see Rulings 1-2 below) — this phase relocates those four numbers into `frontend/src/pages/Game/battleLayout.js` as named constants, and `BattleSim.jsx` applies them via inline `style` on the two container `<div>`s instead of `BattleGround.css` setting them via class selectors. `position: absolute` and `z-index: 2` stay in the CSS class (layout-mechanism concerns, not slot-position values).

**Tech Stack:** Plain JS module (no new dependency), matching the project's existing pattern of small focused files under `frontend/src/`.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 3.1 ("Battle coordinate system") and Section 9 Phase 4.

## Rulings (made during planning, binding on this plan)

1. **No visual regression is expected or wanted from this phase.** The original design spec assumed the battle scene needed bottom-center anchoring logic to handle "Pokémon of very different sprite dimensions." Reading the actual code (2026-09-18) shows this is already correctly handled: `BattleGround.css:343-347`'s `.gba-pokemon-sprite img` rule sets `width: 130px` uniformly and `transform-origin: bottom center`, and every Gen1 sprite (after Phase 2) shares the same 64×64 source canvas with the creature's art already scaled correctly within it (Game Freak's own convention) — so uniform CSS scaling and a shared bottom-center transform-origin already preserve both correct relative scale between species and correct ground alignment. There is no live bug to fix here; this phase is a maintainability refactor (named constants replacing magic numbers), not a visual bug fix.
2. **Scope explicitly excludes shadow positioning.** `.gba-enemy-container::after` / `.gba-player-container::after` (`BattleGround.css:170-201`) currently render the battlefield shadows as blurred CSS ellipses, positioned with their own hardcoded offsets. Spec Section 9 Phase 5 ("Backgrounds + shadows") replaces this blur-ellipse technique with real flat-shadow PNG assets rendered as actual elements, not CSS pseudo-elements — meaning the shadow positioning code written now would be thrown away in Phase 5. This plan touches only the sprite/HP-box container slot positions (`top`/`right`/`bottom`/`left` on `.gba-enemy-container`/`.gba-player-container` themselves), not their `::after` shadows.
3. **Positioning moves to inline `style`, not CSS custom properties.** Two options were considered: (a) `battleLayout.js` constants injected into CSS via custom properties (`--slot-top`, etc.), or (b) applying the constants directly as inline `style` on the two container `<div>`s in `BattleSim.jsx`. This plan uses (b): it's a smaller diff (no new CSS variable indirection layer to maintain), keeps the single source of truth in one importable JS module that both the component and any future test can read directly, and matches how the rest of `BattleSim.jsx` already applies dynamic inline styles (e.g. `hitFlash` background, HP box `animationDelay`) rather than toggling CSS custom properties.

## Global Constraints

- Do not touch `.gba-enemy-container::after`/`.gba-player-container::after` (shadow) rules, `.gba-pokemon-sprite img` sizing, `transform-origin`, animations, or any other visual property — only the four position values (`top`, `right` on the enemy container; `bottom`, `left` on the player container) move out of CSS and into `battleLayout.js`.
- Do not touch the battle state machine, event handling, or any non-positioning JSX in `BattleSim.jsx`.
- The four moved values must be numerically identical to what's in CSS today (`30`, `40`, `40`, `40` — all in px) — this is a relocation, not a redesign.
- After this phase, `frontend/public/backgrounds/*.png` and `frontend/public/sprites/trainers/player/*.png` (Phase 2/3 outputs) remain unused by any component — this phase does not wire them in (that's Phases 5 and 7).

---

### Task 1: Create `battleLayout.js`

**Files:**
- Create: `frontend/src/pages/Game/battleLayout.js`
- Test: `frontend/src/pages/Game/battleLayout.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `BATTLE_SLOTS` (an object with `opponent` and `player` keys, each `{ top, right, bottom, left }` in px, matching the current CSS exactly — a key is only present if the corresponding CSS property exists today, e.g. `opponent` has `top`/`right` only, `player` has `bottom`/`left` only) and `slotStyle(role)` (a pure function: `slotStyle('opponent')` returns `{ position: 'absolute', top: '30px', right: '40px' }`; `slotStyle('player')` returns `{ position: 'absolute', bottom: '40px', left: '40px' }`; any other input throws). Task 2 imports both by name.

- [ ] **Step 1: Write the failing test**

This project's frontend has no vitest/jest — its one existing test file (`frontend/src/sprites/pokemonSprites.test.js`) uses plain Node's built-in `node:test` + `node:assert/strict` with ESM imports (the project is `"type": "module"`). Match that convention exactly:

```javascript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BATTLE_SLOTS, slotStyle } from "./battleLayout.js";

describe("battleLayout", () => {
  it("has the current opponent slot position, unchanged from BattleGround.css", () => {
    assert.deepEqual(BATTLE_SLOTS.opponent, { top: 30, right: 40 });
  });

  it("has the current player slot position, unchanged from BattleGround.css", () => {
    assert.deepEqual(BATTLE_SLOTS.player, { bottom: 40, left: 40 });
  });

  it("slotStyle('opponent') returns an inline-style-ready object", () => {
    assert.deepEqual(slotStyle("opponent"), {
      position: "absolute",
      top: "30px",
      right: "40px",
    });
  });

  it("slotStyle('player') returns an inline-style-ready object", () => {
    assert.deepEqual(slotStyle("player"), {
      position: "absolute",
      bottom: "40px",
      left: "40px",
    });
  });

  it("throws on an unknown role", () => {
    assert.throws(() => slotStyle("bystander"));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd frontend && node --test src/pages/Game/battleLayout.test.js`

Expected: FAIL — `battleLayout.js` does not exist yet (`ERR_MODULE_NOT_FOUND` or similar).

- [ ] **Step 3: Write `battleLayout.js`**

```javascript
/**
 * Single source of truth for battle-scene slot positions.
 * Values are unchanged from the CSS they replace (BattleGround.css's old
 * .gba-enemy-container / .gba-player-container top/right/bottom/left) --
 * this module only centralizes them, it does not change them.
 */
export const BATTLE_SLOTS = {
  opponent: { top: 30, right: 40 },
  player: { bottom: 40, left: 40 },
};

export function slotStyle(role) {
  const slot = BATTLE_SLOTS[role];
  if (!slot) {
    throw new Error(`slotStyle: unknown role "${role}"`);
  }
  const style = { position: "absolute" };
  for (const [key, value] of Object.entries(slot)) {
    style[key] = `${value}px`;
  }
  return style;
}
```

- [ ] **Step 4: Run the test again to verify it passes**

Run: `cd frontend && node --test src/pages/Game/battleLayout.test.js`

Expected: PASS, 5/5 assertions (`# pass 5`).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Game/battleLayout.js frontend/src/pages/Game/battleLayout.test.js
git commit -m "feat: add battleLayout module as single source of truth for slot positions"
```

---

### Task 2: Wire `BattleSim.jsx` to `battleLayout.js` and remove the now-duplicate CSS

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx:911` (enemy container div), `:987` (player container div), plus the import block near line 8
- Modify: `frontend/src/pages/Game/BattleGround.css:165-168` (remove `top`/`right` from `.gba-enemy-container`), `:183-188` (remove `bottom`/`left` from `.gba-player-container`)

**Interfaces:**
- Consumes: `slotStyle` from `frontend/src/pages/Game/battleLayout.js` (Task 1).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Add the import**

In `frontend/src/pages/Game/BattleSim.jsx`, add near the other local imports (after line 8's `import './BattleGround.css';`):

```javascript
import { slotStyle } from './battleLayout';
```

- [ ] **Step 2: Apply `slotStyle` to the enemy container**

Change (around line 911):

```jsx
              <div className="gba-enemy-container">
```

to:

```jsx
              <div className="gba-enemy-container" style={slotStyle('opponent')}>
```

- [ ] **Step 3: Apply `slotStyle` to the player container**

Change (around line 987):

```jsx
              <div className="gba-player-container">
```

to:

```jsx
              <div className="gba-player-container" style={slotStyle('player')}>
```

- [ ] **Step 4: Remove the now-duplicate position values from CSS**

In `frontend/src/pages/Game/BattleGround.css`, change:

```css
.gba-enemy-container {
  top: 30px;
  right: 40px;
}
```

to (empty rule removed entirely, since `position` and `z-index` already live in the shared `.gba-enemy-container, .gba-player-container` selector above it):

```css
/* top/right now supplied by battleLayout.js via inline style (BattleSim.jsx) */
```

And change:

```css
.gba-player-container {
  bottom: 40px;
  left: 40px;
  flex-direction: column;
  align-items: flex-end;
}
```

to:

```css
/* bottom/left now supplied by battleLayout.js via inline style (BattleSim.jsx) */
.gba-player-container {
  flex-direction: column;
  align-items: flex-end;
}
```

(`flex-direction`/`align-items` stay — they're layout-mechanism for the container's children, not slot-position values, and out of this phase's scope per Global Constraints.)

- [ ] **Step 5: Verify the frontend still builds**

Run: `cd frontend && npm run build`

Expected: clean build, no errors.

- [ ] **Step 6: Regression check**

Reaching the actual battle screen requires a running MySQL instance (via `docker compose up -d`) and a registered/authenticated user with campaign progress — check first whether Docker Desktop is running (`docker ps`) and MySQL is reachable. **If it is:** start the dev server (`cd frontend && npm run dev`), log in, start a battle, and use the browser tools to screenshot the battle screen at three widths (1440px, 768px, 390px), confirming the opponent sprite/HP box sit in the same top-right position and the player sprite/HP box sit in the same bottom-left position as before this change — a pixel-identical check, not a redesign check, per Ruling 1.

**If Docker/MySQL is not available** (the common case in a fresh sandbox), the live screen isn't reachable, but the change is fully verifiable statically since it's a mechanical relocation of already-unit-tested values — do this instead:

```bash
grep -n "top: 30px\|right: 40px\|bottom: 40px\|left: 40px" frontend/src/pages/Game/BattleGround.css
```

Expected: no output (the four literal values are gone from the CSS file — they now live only in `battleLayout.js`, already proven correct by Task 1's passing test).

```bash
grep -n "style={slotStyle(" frontend/src/pages/Game/BattleSim.jsx
```

Expected: two matches, one for `'opponent'` and one for `'player'`.

Since Task 1's test already proves `slotStyle('opponent')` and `slotStyle('player')` produce the exact pixel values the CSS used to hardcode, and this step proves those exact calls are now wired into the two container elements with the old CSS values removed, the two checks together are equivalent to confirming the rendered DOM is unchanged — without needing a live database. Note in the task report which path (live screenshot or static check) was used and why.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css
git commit -m "refactor: wire battle sprite slots through battleLayout.js, remove duplicate CSS positions"
```

---

## Phase Completion

After Task 2's review is clean, Phase 4 is done. Next phase per the spec's Core batch is **Phase 5 — Backgrounds + shadows** (swap in the Phase 3 cropped background PNGs, replace the CSS blur-ellipse shadows with real flat-shadow assets), a separate plan written and reviewed on its own — that phase is where `frontend/public/backgrounds/*.png` finally gets consumed by a component, and where `battleLayout.js` gains its first real reason to grow (per-Pokémon shadow sizing).
