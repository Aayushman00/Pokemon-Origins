# GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the battle scene's CSS gradient-and-SVG-dots background with the real cropped FRLG background asset (Phase 3 output), and replace the CSS blurred-ellipse `::after` shadows with real flat shadow image elements — closing out the two visual defects named explicitly in the original problem statement ("shadows look wrong", generic background).

**Architecture:** No new component. `BattleGround.css`'s `.gba-battle-background` gets a real `background-image` instead of a gradient; the two `::after` shadow pseudo-elements are removed and replaced with real `<img>` elements rendered in `BattleSim.jsx`, positioned via two new entries in `battleLayout.js` (which already exists as the slot-position source of truth from Phase 4).

**Tech Stack:** Pillow (already installed) for the one-time shadow-asset generation script. No new frontend dependency.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 4 ("shadow" in the asset tree), Section 6 ("Shadow" paragraph), Section 8 ("Battle background"), Section 9 Phase 5.

## Rulings (made during planning, binding on this plan)

1. **No dynamic per-encounter background selection.** Phase 3 produced 10 named backgrounds (`grass`, `water`, `route`, etc.), but nothing in the current codebase selects a background per battle/terrain — that would be a new feature (server needs to send a terrain hint, client needs to map it), which neither the spec nor any prior phase asked for. This phase hardcodes one default background (`grass.png` — the closest match to the current gradient's green tone) directly in CSS. Per-encounter background selection is out of scope; note it as a possible future enhancement, not a gap in this phase.
2. **Background fit: stretch to fill, not crop.** The cropped background cells are 240×112px (2.14:1 ratio); `.gba-battle-background` is 768×400px (1.92:1 ratio) — close but not identical. `background-size: 100% 100%` (stretch-to-fill) is used rather than `cover` (which would crop part of the image) or `contain` (which would letterbox it), since a full-bleed background is what every reference FRLG battle screen shows and a ~10% aspect mismatch is imperceptible at this art style's resolution. `image-rendering: pixelated` is applied so the stretch doesn't blur pixel edges.
3. **Shadow asset: one size, not the spec's "2-3 buckets."** Every Pokémon sprite already renders at the same uniform CSS width (`130px`, set in Phase 4's audited `BattleGround.css:343-347`, unchanged from before), because every Gen1 sprite shares Phase 2's uniform 64×64 canvas. Spec Section 6 says "two or three size buckets are enough; no per-species shadow needed" — with every sprite already the same on-screen width, even one bucket is sufficient; adding 2-3 buckets now would be unused code with no current caller to select between them (YAGNI). One flat elliptical shadow asset is generated and reused for both the opponent and player slots (scaled per-slot via existing CSS width/height on the `<img>`, matching each slot's current shadow footprint size from the outgoing `::after` rules — 180×20 for the opponent, 200×30 for the player).
4. **Shadow color/opacity:** flat dark gray at 35% opacity (`rgba(20, 20, 20, 0.35)`), matching the spec's "dark, ~40% opacity, no blur/gradient" description closely — using a slightly softer 35% since these battlefield shadows appear over intentionally bright FRLG-style grass art (not shown against black) and 40% flat (no blur to soften it) reads slightly heavy in a side-by-side check; 35% is close enough to the spec's stated intent and looks correct un-blurred. Not a meaningful deviation — recorded so a task reviewer isn't surprised the constant isn't literally `0.4`.

## Global Constraints

- Do not touch the battle state machine, event handling, sprite selection/animation logic, or any component other than `BattleGround.css`, `BattleSim.jsx`, and `battleLayout.js`.
- The background image must use `image-rendering: pixelated` — no blur from the CSS scale.
- Shadow assets must be flat (no blur, no gradient) per spec Section 6 — CSS `filter: blur(...)` must not be applied to the new shadow `<img>` elements (the old `::after` rules' `filter: blur(4px)` is being removed, not carried over).
- Shadow position/size (the visible footprint under each sprite) must match the outgoing `::after` rules' footprint exactly (180×20 for opponent, 200×30 for player) — this phase changes the shadow's *rendering technique* (flat asset vs. blurred CSS ellipse), not its size or placement.

---

### Task 1: Generate the flat shadow asset

**Files:**
- Create: `scripts/generate_battle_shadow.py`
- Create: `frontend/public/shadows/oval.png`

**Interfaces:**
- Consumes: nothing.
- Produces: `frontend/public/shadows/oval.png`, a square-ish flat ellipse PNG with transparent padding, referenced by Task 3's `<img>` elements (any aspect ratio works since the `<img>` will be explicitly sized per slot via CSS width/height — the source only needs to be a clean ellipse with alpha padding, not a specific size).

- [ ] **Step 1: Write the script**

```python
"""Generate a flat, un-blurred elliptical battlefield shadow.

This is not cropped from an external source -- FRLG's own battle shadows
are simple flat ellipses, cheap to draw directly and safer than hunting
for a pre-made asset with an unknown license. See plan Ruling 3/4.
"""
from pathlib import Path

from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parents[1]
DEST_PATH = REPO_ROOT / "frontend" / "public" / "shadows" / "oval.png"

CANVAS_SIZE = (200, 60)  # padding around the ellipse so nothing gets clipped when scaled
ELLIPSE_BOX = (10, 10, 190, 50)  # 180x40 flat ellipse, centered with 10px padding
SHADOW_COLOR = (20, 20, 20, 89)  # ~35% opacity (89/255), flat, no blur -- see plan Ruling 4


def main() -> None:
    DEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse(ELLIPSE_BOX, fill=SHADOW_COLOR)
    img.save(DEST_PATH)
    print(f"wrote {DEST_PATH} ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it**

Run: `python scripts/generate_battle_shadow.py`

Expected: `wrote .../frontend/public/shadows/oval.png (200x60)`.

- [ ] **Step 3: Verify it's flat (no blur) and correctly transparent**

```bash
python -c "
from PIL import Image
im = Image.open('frontend/public/shadows/oval.png')
assert im.mode == 'RGBA', im.mode
px = im.load()
# corner must be fully transparent
assert px[0,0][3] == 0, px[0,0]
# ellipse center must be the flat shadow color, not blurred/anti-aliased into something else
center = px[100,30]
assert center == (20,20,20,89), center
print('OK: corner transparent, center flat shadow color, no blur applied')
"
```

Expected: `OK: corner transparent, center flat shadow color, no blur applied`.

- [ ] **Step 4: Visual spot-check**

Use the Read tool to view `frontend/public/shadows/oval.png` — confirm a clean, flat, dark ellipse with no soft/blurred edge and no visible banding.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate_battle_shadow.py frontend/public/shadows
git commit -m "feat: generate flat battle shadow asset (replaces CSS blur ellipse)"
```

---

### Task 2: Swap the battle background to the real cropped asset

**Files:**
- Modify: `frontend/src/pages/Game/BattleGround.css:42-60` (the `.gba-battle-background` rule and its `::before` SVG-dots overlay)

**Interfaces:**
- Consumes: `frontend/public/backgrounds/grass.png` (Phase 3 output).
- Produces: nothing for later tasks.

- [ ] **Step 1: Replace the gradient background with the real asset**

Change (current `BattleGround.css:42-60`):

```css
/* Battle Background with Gradient and Texture */
.gba-battle-background {
  width: 100%;
  height: 400px;
  background: linear-gradient(to bottom, #78c850, #43a047);
  position: relative;
  overflow: hidden;
}

.gba-battle-background::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  opacity: 0.3;
}
```

to:

```css
/* Battle Background: real cropped FRLG battlefield art (Phase 3/5).
   Stretch-fit (100% 100%), not cover/contain -- see plan Ruling 2. */
.gba-battle-background {
  width: 100%;
  height: 400px;
  background-image: url("/backgrounds/grass.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  position: relative;
  overflow: hidden;
}
```

(The entire `.gba-battle-background::before` rule and its inline SVG data-URI are deleted — the real background art already has its own texture, the synthetic dot overlay is no longer needed.)

- [ ] **Step 2: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build, no errors.

- [ ] **Step 3: Verify no dangling reference to the removed rule**

Run: `grep -n "gba-battle-background::before" frontend/src/pages/Game/*.jsx frontend/src/pages/Game/*.css`

Expected: no output (nothing else referenced the removed pseudo-element).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Game/BattleGround.css
git commit -m "feat: replace battle background gradient with real cropped FRLG art"
```

---

### Task 3: Replace CSS blur shadows with real shadow images

**Files:**
- Modify: `frontend/src/pages/Game/battleLayout.js` (add shadow size constants + a `shadowStyle(role)` helper)
- Modify: `frontend/src/pages/Game/battleLayout.test.js` (add tests for the new export)
- Modify: `frontend/src/pages/Game/BattleSim.jsx:912` area (enemy container) and `:988` area (player container) — add a shadow `<img>` inside each, before the sprite
- Modify: `frontend/src/pages/Game/BattleGround.css:167-178` and `:186-197` (delete the two `::after` shadow rules — these are the current line numbers after Phase 4's edits to this same file; re-verify with `grep -n "gba-enemy-container::after\|gba-player-container::after" frontend/src/pages/Game/BattleGround.css` before editing, since line numbers shift easily)

**Interfaces:**
- Consumes: `frontend/public/shadows/oval.png` (Task 1).
- Produces: `SHADOW_SIZES` and `shadowStyle(role)` in `battleLayout.js`, exported alongside the existing `BATTLE_SLOTS`/`slotStyle`.

- [ ] **Step 1: Extend `battleLayout.js`**

Add to `frontend/src/pages/Game/battleLayout.js` (after the existing `slotStyle` function):

```javascript
// Shadow footprint per slot -- same visible size as the outgoing CSS
// ::after blur-ellipse rules, just rendered as a flat asset now (see
// Phase 5 plan Ruling 3: one asset, sized per slot via CSS, not multiple
// asset buckets -- every sprite shares the same on-screen width today).
export const SHADOW_SIZES = {
  opponent: { width: 180, height: 20, bottom: -10, left: -30 },
  player: { width: 200, height: 30, bottom: -15, right: -30 },
};

export function shadowStyle(role) {
  const size = SHADOW_SIZES[role];
  if (!size) {
    throw new Error(`shadowStyle: unknown role "${role}"`);
  }
  const style = { position: "absolute", zIndex: -1, width: `${size.width}px`, height: `${size.height}px` };
  if (size.bottom !== undefined) style.bottom = `${size.bottom}px`;
  if (size.top !== undefined) style.top = `${size.top}px`;
  if (size.left !== undefined) style.left = `${size.left}px`;
  if (size.right !== undefined) style.right = `${size.right}px`;
  return style;
}
```

- [ ] **Step 2: Add tests**

Append to `frontend/src/pages/Game/battleLayout.test.js` (same file, same `node:test`/`node:assert/strict` imports already present):

```javascript
import { SHADOW_SIZES, shadowStyle } from "./battleLayout.js";

describe("battleLayout shadows", () => {
  it("has the opponent shadow footprint, unchanged from the old CSS ::after rule", () => {
    assert.deepEqual(SHADOW_SIZES.opponent, { width: 180, height: 20, bottom: -10, left: -30 });
  });

  it("has the player shadow footprint, unchanged from the old CSS ::after rule", () => {
    assert.deepEqual(SHADOW_SIZES.player, { width: 200, height: 30, bottom: -15, right: -30 });
  });

  it("shadowStyle('opponent') returns an inline-style-ready object", () => {
    assert.deepEqual(shadowStyle("opponent"), {
      position: "absolute",
      zIndex: -1,
      width: "180px",
      height: "20px",
      bottom: "-10px",
      left: "-30px",
    });
  });

  it("throws on an unknown role", () => {
    assert.throws(() => shadowStyle("bystander"));
  });
});
```

(This is appended to the existing test file, not a new file — add the import at the top alongside the existing `BATTLE_SLOTS, slotStyle` import line, e.g. `import { BATTLE_SLOTS, slotStyle, SHADOW_SIZES, shadowStyle } from "./battleLayout.js";`.)

- [ ] **Step 3: Run the tests**

Run: `cd frontend && node --test src/pages/Game/battleLayout.test.js`

Expected: PASS, 9/9 (5 existing + 4 new).

- [ ] **Step 4: Add the shadow `<img>` elements in `BattleSim.jsx`**

Add the import (alongside the existing `slotStyle` import):

```javascript
import { slotStyle, shadowStyle } from './battleLayout';
```

Inside the enemy container div (`frontend/src/pages/Game/BattleSim.jsx`, right after the opening `<div className="gba-enemy-container" style={slotStyle('opponent')}>` tag, before the HP box):

```jsx
                <img
                  src="/shadows/oval.png"
                  alt=""
                  aria-hidden="true"
                  style={{ ...shadowStyle('opponent'), imageRendering: 'pixelated' }}
                />
```

Inside the player container div (right after the opening `<div className="gba-player-container" style={slotStyle('player')}>` tag, before the sprite motion.div):

```jsx
                <img
                  src="/shadows/oval.png"
                  alt=""
                  aria-hidden="true"
                  style={{ ...shadowStyle('player'), imageRendering: 'pixelated' }}
                />
```

- [ ] **Step 5: Remove the old blur-ellipse CSS**

In `frontend/src/pages/Game/BattleGround.css`, delete the `.gba-enemy-container::after` rule block and the `.gba-player-container::after` rule block in full (re-run the grep above to get their current exact line numbers — they were `:167-178` and `:186-197` as of this plan's writing, but confirm before editing since earlier edits in this same file can shift line numbers) — both are fully replaced by the `<img>` elements from Step 4. Leave the two `/* ...now supplied by battleLayout.js... */` comments from Phase 4 in place; do not remove them.

- [ ] **Step 6: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 7: Static verification (no live battle screen needed, mirrors Phase 4's approach)**

```bash
grep -n "gba-enemy-container::after\|gba-player-container::after" frontend/src/pages/Game/BattleGround.css
```

Expected: no output (both blur-shadow rules removed).

```bash
grep -n "shadows/oval.png" frontend/src/pages/Game/BattleSim.jsx
```

Expected: 2 matches (opponent and player shadow `<img>`s).

If a live database happens to be available in this environment (`docker ps` shows MySQL running), additionally load the battle screen and visually confirm both shadows render as flat, un-blurred dark ellipses under each sprite at roughly their prior size/position, and confirm the background shows real FRLG grass art with no gradient/dot pattern.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/Game/battleLayout.js frontend/src/pages/Game/battleLayout.test.js frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css
git commit -m "feat: replace CSS blur-ellipse battle shadows with flat shadow asset"
```

---

## Phase Completion

After Task 3's review is clean, Phase 5 is done. Next phase per the spec's Core batch is **Phase 6 — Pokémon sprite rendering + placement** (swap sprite source to the new Phase 2 pipeline output — largely already true since Phase 2 already replaced the files at the paths the app reads; this phase's remaining scope is confirming front/back sides are correct and no stretch/blur, per spec Section 9), a separate plan written and reviewed on its own.
