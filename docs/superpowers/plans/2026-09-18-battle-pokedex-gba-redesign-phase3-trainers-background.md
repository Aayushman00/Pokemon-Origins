# GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crop the two uploaded trainer sprite sheets and the uploaded battle-background sheet into clean, canonical, locally-stored PNGs at the app's static asset root — asset preparation only, no battle-scene wiring (that's a later phase).

**Architecture:** No JSX/component changes. This phase only adds two one-time Python crop scripts (matching the `scripts/*.py` style already established in Phases 1-2) and their PNG outputs under `frontend/public/`.

**Tech Stack:** Python 3 + Pillow (already installed this session), numpy (already installed this session, used for border/background-color detection).

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 4 ("Asset pipeline"), Section 7 ("Cropping"), Section 8 ("Battle background"), Section 11 ("Trainer sprites"), and Section 9 Phase 3.

## Rulings (made during planning, binding on this plan)

1. **Source files live outside the git repository.** `Main Character Male.gif`, `Main Character Female.gif`, and `Game Boy Advance - Pokemon FireRed _ LeafGreen - Battle Effects - Battle Backgrounds.png` are all at `C:\Users\ayush\Desktop\Coding\Pokemon Origins\` — one directory above this repo's root (`C:\Users\ayush\Desktop\Coding\Pokemon Origins\Pokemon-Origins\`), and are not tracked by any git repository (confirmed during Phase 2's Task 5 investigation of this same parent folder). The crop scripts read them via a path one level above the repo root (`Path(__file__).resolve().parents[2] / "<filename>"`), matching where the user actually placed them; only the *derived, cropped* output PNGs are written into the repo. This is a one-time read of user-supplied source material, not a runtime dependency.
2. **Output paths.** Following Phase 2's precedent (write to the app's real static-asset root, not the design spec's generic `assets/...` proposal): trainer sprites go to `frontend/public/sprites/trainers/player/red.png` and `.../leaf.png` (same `sprites/trainers/` convention `TrainerAvatar.jsx` already uses for NPC opponents, just under a new `player/` subfolder since a player-controlled trainer is a distinct concept from an NPC). Backgrounds go to `frontend/public/backgrounds/{name}.png` (new convention — nothing currently reads background images, so this establishes the pattern used by the same static-serving mechanism as `frontend/public/sprites/`).
3. **Neither trainer sheet contains an official back-facing "throw the Poké Ball" send-out sprite.** Verified by cropping and visually inspecting every candidate region on both sheets (2026-09-18, re-verified at 6x zoom after an initial misread during plan review): the male sheet's two large standalone poses (40×55 and 33×80, at roughly x=133-172/y=215-269 and x=237-269/y=210-289) are both front-facing overworld idle poses. The 5-pose "OTHER" row (y≈144-192) contains: a back/three-quarter pose with hand raised near the face and backpack visible (bbox 86,149-148,192 — **no ball present**, ruled out), a **forward-lunging pose with the arm fully extended and hand open reaching forward** (bbox 242,144-305,192 — the closest thing on this sheet to a throwing/releasing motion), a gesturing pose, and two running poses. The female sheet's "BATTLE" row (y≈166-220) contains a 3/4-profile arm-raised/waving pose (bbox 152,172-203,219) — accurate as originally identified, no correction needed. Given neither sheet has the specific asset the spec assumed would exist, this plan selects the closest available substitute for a brief send-out flourish: **male → the forward-lunging, arm-extended pose** (bbox 242,144-305,192), **female → the arm-raised pose** (bbox 152,172-203,219). `ponytail: substitute poses stand in for a true back-facing throw sprite that doesn't exist in the uploaded sheets; upgrade path is sourcing a real FRLG trainer-back sprite (e.g. from Bulbagarden's trainer sprite categories, same MediaWiki-API technique as Phase 2) if a future pass wants the authentic throw animation.`
4. **Background: 10 usable cells, not 12.** The sheet is a 3-column × 4-row grid, but row 4's columns 2-3 are occupied by a credit/attribution text box ("Pokemon FRLG Battle BG's ripped by Desgardes. No credit needed."), not a background — verified via border-line detection (row 4's right two columns show only a 67%-width red border scan, not the 100% seen for real cell dividers). This plan crops the 9 backgrounds in rows 1-3 plus the 1 valid cell in row 4 column 1, for **10 total named backgrounds**, and explicitly skips the credit-box region.
5. **Precise grid geometry**, measured via border-color detection (dark red `RGB(128,0,0)`, 2026-09-18): columns at x=[6-245], [249-488], [492-731] (240px wide each, 3px borders at x=0-5, 246-248, 489-491, 732-736); rows at y=[6-117], [121-232], [235-346], [349-460] (112px tall each, borders at y=0-5, 118-120, 233-234, 347-348, 461-465). Row 4 only has a real cell in column 1.

## Global Constraints

- Do not touch any battle scene JSX/CSS, `TrainerAvatar.jsx`, or any component — this phase is asset-content-only, matching Phase 2's scope discipline.
- Trainer output PNGs must have the sheet's flat color-key background (`RGB(17,219,255)` cyan for male, `RGB(255,0,255)` magenta for female) converted to full transparency (alpha=0), not just visually similar — verified pixel-by-pixel, not by eye.
- Background output PNGs must have the 3px dark-red grid border fully excluded (native cell pixels only), no resize/blur, `image-rendering: pixelated`-safe (integer-scalable source, no anti-aliased edges introduced by the crop itself).
- No cropped sprite may include any pixel of a neighboring pose (verified via the exact bounding boxes in Ruling 5's geometry and Ruling 3's measured trainer bboxes).

---

### Task 1: Trainer sprite crop script (`scripts/crop_trainer_sprites.py`)

**Files:**
- Create: `scripts/crop_trainer_sprites.py`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `frontend/public/sprites/trainers/player/red.png`, `frontend/public/sprites/trainers/player/leaf.png`. Task 3 validates these paths exist.

- [ ] **Step 1: Write the script**

```python
"""Crop the player trainer sprites (Red, Leaf) from the uploaded overworld
sheets and color-key their flat background to transparency.

Source sheets are NOT in this git repo -- they live one directory above
the repo root, where the user placed them (see plan Ruling 1).
"""
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = REPO_ROOT.parent  # "Pokemon Origins" parent folder, not tracked by git

DEST_DIR = REPO_ROOT / "frontend" / "public" / "sprites" / "trainers" / "player"

# (source filename, background color to key out, crop box, output filename)
JOBS = [
    (
        "Main Character Male.gif",
        (17, 219, 255),
        (242, 144, 306, 193),  # forward-lunging, arm extended reaching forward -- see plan Ruling 3
        "red.png",
    ),
    (
        "Main Character Female.gif",
        (255, 0, 255),
        (152, 172, 204, 220),  # front-facing, arm raised -- see plan Ruling 3
        "leaf.png",
    ),
]


def colorkey_to_alpha(img: Image.Image, bg_color: tuple, tolerance: int = 30) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    bg = bg_color
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) <= tolerance:
                pixels[x, y] = (r, g, b, 0)
    return img


def main() -> None:
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, bg_color, box, out_name in JOBS:
        source_path = SOURCE_ROOT / source_name
        if not source_path.exists():
            raise SystemExit(f"crop_trainer_sprites: missing source {source_path}")
        img = Image.open(source_path).convert("RGBA")
        cropped = img.crop(box)
        result = colorkey_to_alpha(cropped, bg_color)
        dest_path = DEST_DIR / out_name
        result.save(dest_path)
        print(f"wrote {dest_path} ({result.size[0]}x{result.size[1]})")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it**

Run: `python scripts/crop_trainer_sprites.py`

Expected: two `wrote ...` lines, `red.png (64x49)`, `leaf.png (52x48)`.

- [ ] **Step 3: Verify transparency and no color-key halo**

```bash
python -c "
from PIL import Image
for name, bg in [('red.png', (17,219,255)), ('leaf.png', (255,0,255))]:
    p = 'frontend/public/sprites/trainers/player/' + name
    im = Image.open(p)
    assert im.mode == 'RGBA', (name, im.mode)
    # every pixel matching the background color must now be fully transparent
    px = im.load()
    bad = 0
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a = px[x,y]
            if abs(r-bg[0])+abs(g-bg[1])+abs(b-bg[2]) <= 30 and a != 0:
                bad += 1
    print(name, 'size', im.size, 'residual-background-pixels', bad)
    assert bad == 0, f'{name} has {bad} non-transparent background-color pixels'
print('OK: both trainer sprites fully color-keyed')
"
```

Expected: `red.png size (64, 49) residual-background-pixels 0`, `leaf.png size (52, 48) residual-background-pixels 0`, `OK: both trainer sprites fully color-keyed`.

- [ ] **Step 4: Visual spot-check**

Use the Read tool to view both `frontend/public/sprites/trainers/player/red.png` and `.../leaf.png` — confirm each shows a clean, recognizable trainer pose (per Ruling 3: Red lunging forward with arm extended; Leaf with arm raised) with a checkerboard/transparent background, no cyan/magenta halo, no clipped body parts.

- [ ] **Step 5: Commit**

```bash
git add scripts/crop_trainer_sprites.py frontend/public/sprites/trainers/player
git commit -m "feat: add player trainer sprite crop script (Red, Leaf)"
```

---

### Task 2: Battle background crop script (`scripts/crop_battle_backgrounds.py`)

**Files:**
- Create: `scripts/crop_battle_backgrounds.py`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: 10 files under `frontend/public/backgrounds/{name}.png`. Task 3 validates these exist.

- [ ] **Step 1: Write the script**

```python
"""Crop the 10 usable battle backgrounds out of the uploaded FRLG battle-BG
sheet, excluding the 3px grid border and the row-4 credit-text cell.

Source sheet is NOT in this git repo -- see plan Ruling 1.
"""
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = REPO_ROOT.parent / "Game Boy Advance - Pokemon FireRed _ LeafGreen - Battle Effects - Battle Backgrounds.png"
DEST_DIR = REPO_ROOT / "frontend" / "public" / "backgrounds"

COLS = [(6, 246), (249, 489), (492, 732)]  # (x0, x1) inside the border, per plan Ruling 5
ROWS = [(6, 118), (121, 233), (235, 347), (349, 461)]  # (y0, y1)

# name each populated cell, row-major, skipping row 4's columns 2-3 (credit box)
NAMES = [
    ["plain", "grass", "water"],
    ["dirt", "pond", "ice"],
    ["sand", "purple", "forest"],
    ["route"],  # row 4, column 1 only
]


def main() -> None:
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(SOURCE_PATH).convert("RGB")
    written = 0
    for row_idx, (y0, y1) in enumerate(ROWS):
        row_names = NAMES[row_idx]
        for col_idx, name in enumerate(row_names):
            x0, x1 = COLS[col_idx]
            cell = img.crop((x0, y0, x1, y1))
            dest_path = DEST_DIR / f"{name}.png"
            cell.save(dest_path)
            print(f"wrote {dest_path} ({cell.size[0]}x{cell.size[1]})")
            written += 1
    print(f"Done. Wrote {written} backgrounds.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it**

Run: `python scripts/crop_battle_backgrounds.py`

Expected: 10 `wrote ...` lines (plain, grass, water, dirt, pond, ice, sand, purple, forest each 240x112; route also 240x112), ending `Done. Wrote 10 backgrounds.`

- [ ] **Step 3: Verify no border bleed**

```bash
python -c "
from PIL import Image
import os
DARKRED = (128,0,0)
names = ['plain','grass','water','dirt','pond','ice','sand','purple','forest','route']
for name in names:
    p = f'frontend/public/backgrounds/{name}.png'
    im = Image.open(p)
    assert im.size == (240,112), (name, im.size)
    px = im.load()
    edge_pixels = (
        [px[x,0] for x in range(im.width)] + [px[x,im.height-1] for x in range(im.width)]
        + [px[0,y] for y in range(im.height)] + [px[im.width-1,y] for y in range(im.height)]
    )
    border_hits = sum(1 for (r,g,b) in edge_pixels if abs(r-DARKRED[0])+abs(g-DARKRED[1])+abs(b-DARKRED[2]) <= 30)
    print(name, im.size, 'border-color edge pixels:', border_hits)
    assert border_hits == 0, f'{name} still has {border_hits} dark-red border pixels on its edge'
print('OK: all 10 backgrounds are border-free')
"
```

Expected: 10 lines each ending `border-color edge pixels: 0`, then `OK: all 10 backgrounds are border-free`.

- [ ] **Step 4: Visual spot-check**

Use the Read tool to view `frontend/public/backgrounds/grass.png` and `frontend/public/backgrounds/route.png` (the two most likely default battle backgrounds) — confirm each is a clean, complete battlefield background with no border sliver, no adjacent-cell bleed, no blur.

- [ ] **Step 5: Commit**

```bash
git add scripts/crop_battle_backgrounds.py frontend/public/backgrounds
git commit -m "feat: add battle background crop script (10 FRLG battlefield backgrounds)"
```

---

## Phase Completion

After Task 2's review is clean, Phase 3 is done. Next phase per the spec's Core batch is **Phase 4 — Battle coordinate system** (`battleLayout.js`, wiring `BattleSim.jsx`/`BattleGround.css` off hardcoded offsets), a separate plan written and reviewed on its own. Trainer-sprite *integration* into the battle scene (rendering `red.png`/`leaf.png` during a SEND_OUT beat) and background *integration* (swapping `BattleGround.css`'s current background for one of these 10) are later phases (7 and 5 respectively in the Core batch) — this phase only prepares the assets.
