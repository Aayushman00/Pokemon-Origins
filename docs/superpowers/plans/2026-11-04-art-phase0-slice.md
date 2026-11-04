# Art Overhaul Phase 0: Art Bible and One-Screen Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the new look on one 240x160 Dawnbrook screen, shown next to the current screen, so the user can approve it before anything scales.

**Architecture:** Standalone slice beside the game's art. New modules draw ground, objects and a draft player, and `slice_scene.py` composes them into PNGs under `docs/design/art-slice/`. Game tilesets, sheets and maps are not touched, so rejecting the look costs nothing.

**Tech Stack:** Python 3, Pillow, `unittest`, existing `scripts/overworld_art` helpers.

**Spec:** `docs/superpowers/specs/2026-11-04-overworld-art-overhaul-design.md`

## Global Constraints

- Original art only. Nothing copied, traced or sampled from pret, FireRed or the user's screenshots, palettes included.
- Frame stays 240x160; tiles stay 16x16; objects sit on 16px tile alignment.
- No file under `frontend/public/` and no existing game output changes in this phase.
- No pure black. Light comes from the top-left.
- Ground carries no outlines. Contrast belongs to objects.
- Commits: imperative message, no Co-Authored-By or Claude attribution lines. Never commit `graphify-out/`.
- Run everything from `Pokemon-Origins/`. After code changes run `graphify update .`.

## Review Focus

1. Meadow variants laid side by side show seams or a visible grid. Expect continuous ground. Test in Task 1.
2. Ground transitions look blocky at corners. Expect every blob mask to produce a soft, broken edge. Test in Task 1.
3. Player disappears against pale ground. Expect the outline to stand out from meadow, lawn and trail. Test in Task 3.
4. Feet float or clip off the tile. Expect feet on the same anchor rows the engine uses. Test in Task 3.
5. The slice leaks into the game. Expect `git status` to show no change under `frontend/public/`. Check in Task 4.

---

### Task 1: Art bible, world palette and ground

**Files:**
- Create: `docs/design/ART_BIBLE.md`
- Create: `scripts/overworld_art/world_palette.py`
- Create: `scripts/overworld_art/slice_art.py`
- Test: `scripts/overworld_art/test_slice.py`

**Interfaces:**
- Consumes: `tiles_v2.blob_mask(is_outside)`, `tiles_v2.blob_masks()`. Read their docstrings for bit meanings.
- Produces:
  - `world_palette.WORLD: dict[str, list[str]]`, `world_palette.LINE: str`, `world_palette.SHADOW: tuple[str, float]`
  - `slice_art.meadow(variant: int) -> Image` (16x16, variant 0-3)
  - `slice_art.ground_layer(cells: list[str]) -> Image`, where `.` is meadow, `l` lawn, `,` trail
  - `slice_art.luma(img) -> list[float]`, Rec.601, 0-1, opaque pixels only
  - `slice_art.mean_saturation(img) -> float`, HSV, opaque pixels only

- [ ] **Step 1: Write `docs/design/ART_BIBLE.md`**

One page fixing: top-left light; ground luma 0.70-0.90, objects spanning 0.15-0.95; outlines on objects only, in `LINE`; contact shadow `SHADOW`; dither only on ground transitions; decor in clusters with empty space between; characters at most 24 rows tall with the head at most 11 rows; silhouette must read in solid colour; buildings have a roof over half their height, visible side planes, and windows that never cross a tile edge. Copy the reference rule from the spec.

- [ ] **Step 2: Write failing tests**

```python
class Ground(unittest.TestCase):
    def test_meadow_is_quiet(self):
        for v in range(4):
            self.assertLess(mean_saturation(meadow(v)), 0.35)
            l = sorted(luma(meadow(v)))
            self.assertLessEqual(l[int(len(l) * .95)] - l[int(len(l) * .05)], 0.15)

    def test_meadow_variants_have_no_seams(self):
        for a in range(4):
            for b in range(4):
                pair = Image.new("RGBA", (32, 16))
                pair.paste(meadow(a), (0, 0)); pair.paste(meadow(b), (16, 0))
                px = pair.convert("L").load()
                seam = sum(abs(px[15, y] - px[16, y]) for y in range(16)) / 16
                inner = sum(abs(px[7, y] - px[8, y]) for y in range(16)) / 16
                self.assertLessEqual(seam, inner + 6)

    def test_transition_edges_are_broken_not_straight(self):
        img = ground_layer(["...", ".,.", "..."] )
        self.assertEqual(img.size, (48, 48))
        trail = set(WORLD["trail"])
        rows = [sum(hex_at(img, x, y) in trail for x in range(48)) for y in range(48)]
        widths = {r for r in rows if r}
        self.assertGreater(len(widths), 3)

    def test_ground_is_opaque_and_never_black(self):
        img = ground_layer([".l,", "ll,", ",,,"])
        self.assertTrue(all(c[3] == 255 and c[:3] != (0, 0, 0) for _, c in img.getcolors(9999)))
```

`hex_at(img, x, y)` is a local test helper returning `#rrggbb`.

- [ ] **Step 3: Run, expect failure**

Run: `python -m unittest scripts.overworld_art.test_slice -v`
Expected: FAIL with `ModuleNotFoundError` on `slice_art`.

- [ ] **Step 4: Implement `world_palette.py`**

Start values, tune by eye within the tests: `meadow` `#cfe3b4 #bfd8a6 #aecb98`; `lawn` `#9cc084 #8ab376 #78a268`; `trail` `#e6d8b4 #d8c79e #c4b088`; `LINE = "#2e2a3c"`; `SHADOW = ("#2e4a4a", 0.35)`. Add ramps keyed `leaf`, `bark`, `roof_clay`, `wall`, `glass`, `stone`, `wood`, `fence`, each with 4-5 hue-shifted tones.

- [ ] **Step 5: Implement ground in `slice_art.py`**

Meadow: sparse low-contrast flecks, none touching tile edges, seeded per variant. `ground_layer` picks a meadow variant by `world_maps.hashed(x, y)`, and draws lawn and trail cells with `blob_mask`. Inside a 3px band next to a differing neighbour, pick per pixel between the two materials from a seeded hash weighted by distance, so edges break up. Trail centres get scattered specks at hashed positions, not on a grid.

- [ ] **Step 6: Run, expect pass**

Run: `python -m unittest scripts.overworld_art.test_slice -v`
Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add docs/design/ART_BIBLE.md scripts/overworld_art/world_palette.py scripts/overworld_art/slice_art.py scripts/overworld_art/test_slice.py
git commit -m "Add art bible and quiet ground for the art slice"
```

### Task 2: Tree, house and fence

**Files:**
- Modify: `scripts/overworld_art/slice_art.py`
- Modify: `scripts/overworld_art/test_slice.py`

**Interfaces:**
- Consumes: `WORLD`, `LINE`, `luma`.
- Produces:
  - `slice_art.tree(variant: str) -> Image` (32x32, transparent background, variants `"A"`, `"B"`)
  - `slice_art.house() -> Image` (80x80, transparent background)
  - `slice_art.HOUSE_DOOR_COL: int` (tile column of the door inside the house)
  - `slice_art.fence(tiles: int, vertical: bool = False) -> Image`

- [ ] **Step 1: Write failing tests**

```python
class Objects(unittest.TestCase):
    def test_objects_carry_the_contrast(self):
        for img in (tree("A"), house()):
            l = sorted(luma(img))
            self.assertGreaterEqual(l[int(len(l) * .95)] - l[int(len(l) * .05)], 0.40)

    def test_house_roof_takes_over_half(self):
        roof = set(WORLD["roof_clay"])
        rows = [y for y in range(80) if any(hex_at(house(), x, y) in roof for x in range(80))]
        self.assertGreaterEqual(max(rows) + 1, 42)

    def test_windows_never_cross_a_tile_edge(self):
        glass = set(WORLD["glass"])
        h = house()
        for edge in (16, 32, 48, 64):
            self.assertFalse(any(hex_at(h, edge - 1, y) in glass and hex_at(h, edge, y) in glass for y in range(80)))

    def test_fence_sizes(self):
        self.assertEqual(fence(4).size, (64, 16))
        self.assertEqual(fence(3, vertical=True).size, (16, 48))
```

- [ ] **Step 2: Run, expect failure**

Run: `python -m unittest scripts.overworld_art.test_slice -v`
Expected: FAIL with `ImportError` on `tree`.

- [ ] **Step 3: Implement `tree`, `house`, `fence`**

`tree`: 5 large leaf clumps, 3 tones plus `LINE` rim, one visible trunk stub; silhouette before detail. Write new code, do not change `tiles_v2.oak`. `house`: 5 tiles wide, 5 tall, drawn whole; top 3 rows are a clay roof with lit left plane and shaded right plane; bottom 2 rows are wall with a door at `HOUSE_DOOR_COL`, two windows each inside one tile column, and one chimney. `fence`: post and rail, vertical runs drawn as their own art with posts stacked and no gaps.

- [ ] **Step 4: Run, expect pass**

Run: `python -m unittest scripts.overworld_art.test_slice -v`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/overworld_art/slice_art.py scripts/overworld_art/test_slice.py
git commit -m "Draw slice tree, house and fence"
```

### Task 3: Draft player

**Files:**
- Modify: `scripts/overworld_art/slice_art.py`
- Modify: `scripts/overworld_art/test_slice.py`

**Interfaces:**
- Consumes: `WORLD`, `LINE`, `luma`.
- Produces: `slice_art.player_frames() -> dict[str, Image]`, keys `down`, `up`, `left`, `right`, each 16x32 transparent. Stand frames only; walk cycles wait for Phase 3.

Design, original: no cap. Short dark hair with a raised tuft, teal jacket, amber scarf with one tail, brown satchel on the left hip. Scarf and tuft carry the silhouette from every direction.

- [ ] **Step 1: Write failing tests**

```python
class Player(unittest.TestCase):
    def test_size_and_feet(self):
        for f in player_frames().values():
            x0, y0, x1, y1 = f.getbbox()
            self.assertEqual(f.size, (16, 32))
            self.assertLessEqual(y1 - y0, 24)
            self.assertEqual(y1, 32)

    def test_side_view_is_narrow(self):
        x0, _, x1, _ = player_frames()["left"].getbbox()
        self.assertLessEqual(x1 - x0, 13)

    def test_right_mirrors_left(self):
        f = player_frames()
        self.assertEqual(ImageOps.mirror(f["left"]).tobytes(), f["right"].tobytes())

    def test_colour_budget(self):
        for f in player_frames().values():
            self.assertLessEqual(len([c for c in f.getcolors(999) if c[1][3]]), 15)

    def test_outline_stands_out_from_every_ground(self):
        line = luma(solid(LINE))[0]
        for ramp in ("meadow", "lawn", "trail"):
            self.assertGreaterEqual(min(luma(solid(c))[0] for c in WORLD[ramp]) - line, 0.40)
```

`solid(hex)` is a local test helper returning a 1x1 opaque image.

- [ ] **Step 2: Run, expect failure**

Run: `python -m unittest scripts.overworld_art.test_slice -v`
Expected: FAIL with `ImportError` on `player_frames`.

- [ ] **Step 3: Implement `player_frames`**

Hand-authored text grids per direction, one char per material, `left` mirrored for `right`. Head at most 11 rows. Do not use `bodies.py`; the shared templates are the problem being fixed.

- [ ] **Step 4: Run, expect pass**

Run: `python -m unittest scripts.overworld_art.test_slice -v`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/overworld_art/slice_art.py scripts/overworld_art/test_slice.py
git commit -m "Draft the original player for the art slice"
```

### Task 4: Compose the screen and hold for approval

**Files:**
- Create: `scripts/overworld_art/slice_scene.py`
- Modify: `scripts/overworld_art/test_slice.py`
- Create (generated): `docs/design/art-slice/slice_1x.png`, `slice_3x.png`, `before_after.png`

**Interfaces:**
- Consumes: everything from Tasks 1-3; `render_map.render(map_id)`; `dict(tiles.new_tiles())["flowers0"]`.
- Produces: `slice_scene.GRID: list[str]` (10 rows of 15 chars), `slice_scene.scene() -> Image`, `slice_scene.before() -> Image`, `slice_scene.main()`.

- [ ] **Step 1: Write failing tests**

```python
class Scene(unittest.TestCase):
    def test_scene_is_one_gba_screen(self):
        self.assertEqual(scene().size, (240, 160))
        self.assertEqual(len(GRID), 10)
        self.assertTrue(all(len(r) == 15 for r in GRID))

    def test_before_matches_the_frame(self):
        self.assertEqual(before().size, (240, 160))

    def test_no_pure_black(self):
        self.assertFalse(any(c[:3] == (0, 0, 0) for _, c in scene().convert("RGBA").getcolors(99999)))
```

- [ ] **Step 2: Run, expect failure**

Run: `python -m unittest scripts.overworld_art.test_slice -v`
Expected: FAIL with `ModuleNotFoundError` on `slice_scene`.

- [ ] **Step 3: Implement `slice_scene.py`**

`GRID` is 10 rows of 15 chars. Layout: tree row along the top and left edge, house near centre on a lawn patch, trail from the door down to the bottom edge, fence with one vertical and one horizontal run, one flower cluster, player on the trail below the door, facing down. Draw order: ground, contact shadows (`SHADOW`, a soft ellipse under each object), then objects sorted by bottom y. `before()` crops `render("dawnbrook")` at tiles x 0-14, y 2-11. `main()` writes `slice_1x.png`, a nearest-neighbour `slice_3x.png`, and `before_after.png` (before left, after right, 3x, 16px gap).

- [ ] **Step 4: Run tests and generate**

Run: `python -m unittest scripts.overworld_art.test_slice -v` then `python -m scripts.overworld_art.slice_scene`
Expected: PASS, 16 tests; three PNGs written.

- [ ] **Step 5: Confirm existing art is safe**

Run: `python -m unittest scripts.overworld_art.test_art` then `git status --short frontend/public`
Expected: tests pass, no output from `git status`.

- [ ] **Step 6: Look at `before_after.png` and iterate**

Read the image. It must beat "before" on: quiet ground, building depth, player silhouette, grounded objects. Tests prove limits, not beauty, so tune values and redraw until it does. Rerun Step 4 after each change.

- [ ] **Step 7: Commit and update the graph**

```bash
git add scripts/overworld_art/slice_scene.py scripts/overworld_art/test_slice.py docs/design/art-slice
git commit -m "Compose the Dawnbrook art slice with before and after"
graphify update .
```

- [ ] **Step 8: Stop at the gate**

Show `before_after.png` to the user. Do not start Phase 1 until the user approves the look.
