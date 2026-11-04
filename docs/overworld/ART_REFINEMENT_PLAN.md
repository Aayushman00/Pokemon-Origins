# Overworld art refinement: audit (stage 0) and plan (stage 1)

Status: stages 0-1 approved. Stage 2 slice reviewed: **tiles approved, v2 avatars
rejected** (redrawn instead of refined; parked on `art/v2-avatars-parked`).
Avatars restart as **v3 = pixel-level polish of v1** under an identity lock (same
height, head ratio, silhouette, outfit colours, accessories), one character at a time,
player boy first. Decision 2 (new proportions) is withdrawn; decision 1 (8-column sheet,
right = mirrored left) stands. Art decisions: `docs/overworld/ART_CHANGELOG.md`.
Goal: refine the existing Origin Town build until it matches, then beats, the
FireRed refs (town, gym, gym maze, Pokemon Center). Refinement, not rewrite.
UI copy says "Pokemon Origins".

---

## Stage 0: audit

### Where the art comes from

All overworld art is **generated from code** (text grids + small drawing
functions), so every art change is a reviewable diff.

| Asset | Output path | Generator |
| --- | --- | --- |
| 32 actor sheets (31 cast + `npc`) | `frontend/public/sprites/overworld/*.png` | `scripts/overworld_art/build_sprites.py` (parts in `bodies.py`, `parts.py`, `characters.py`) |
| Master palette | `frontend/public/sprites/overworld/master_palette.json` | `scripts/overworld_art/palette.py` |
| Sheet manifest | `frontend/public/sprites/overworld/manifest.json`, `frontend/src/v2/overworld/render/sheets.generated.js` | `build_sprites.py` |
| Tileset (8 cols x 19 rows, 145 tiles) | `frontend/public/maps/tilesets/overworld.png` | `scripts/overworld_art/tiles.py` |
| Origin Town (32x28, start map) | `frontend/public/maps/origin_town.json` | `scripts/overworld_art/origin_town.py` |
| Test town/route/house | `frontend/public/maps/test_*.json` | `scripts/gen_overworld_placeholders.py` |
| Playground/UI copies of the art | `frontend/src/v2/ui/{tileArt,trainerArt}.generated.js` | `build_all.py` |
| 4x animated preview | `frontend/public/sprite-preview.html` | hand-written, reads the manifest |
| Pokemon battle sprites 1-151 | `frontend/public/sprites/battle/<dex>/{front,front-b,back,back-b}.png` | `scripts/fetch_frlg_sprites.py` (FRLG-derived, **unlicensed**, see `assets/LICENSES.md`) |

`scripts/frlg_sprites/` is the Bulbagarden fetcher for **Pokemon battle
sprites only**. It has no overworld/people pipeline, so it is not reused for
this work.

### Engine contract (verified in code)

- `renderer.js` `drawActor`: blits a 16x32 cell at
  `(actorFrame(a, tick) * 16, ROW[facing] * 32)`, `ROW = {down:0, up:1, left:2, right:3}`.
  Right is its **own row 3** (the pipeline currently fills it by mirroring left).
- Sheets are **128x128 = 8 columns**: `stand, walkA, walkB, runStand, runA, runB, blink, alert`.
  This is a superset of FireRed's 9-frame order (stand + 2 walk per down/up/left) plus
  the "!" alert and blink you asked for. **No renderer/movement change needed.**
- Layers drawn in order `ground, decor, objects`, actors y-sorted, then `above`.
  Tall-grass "cover" rows are drawn over actor legs via a per-tile `cover` property.
- Tileset lookup sorts tilesets by `firstgid` descending (`mapModel.js:72`), so a
  second image tileset (interiors) works without engine changes.
- Door warps emit `{type:'sound', cue:'door'}` and run the existing iris/fade transition.
- Script ops already include a `battle` effect request (`logic/script.js:24`).

### Baseline

- `python3 -m unittest scripts.overworld_art.test_art`: 16 pass.
- `node --test "src/**/*.test.js"` (in `frontend/`): 159 pass.
- `vitest` not run: `frontend/node_modules` is not installed in this container.
- `codegraph_explore` and `graphify` are **not installed** here. I used
  `grep`/reading instead; you can run `graphify update .` locally after each stage.

### What the current build gets wrong (looked at 3x/4x, side by side with refs)

Sprites
- Heads are ~14 px of a 32 px cell (chibi). FireRed sits nearer 10 / 12 / 6.
- Back views are blobs (nurse, hiker): no hair parting, no pack straps, no collar.
- Hiker/deep-skin ramps go muddy: shadow and outline are too close in value.
- Hat brims are a flat band with no under-brim shadow; no logo patch.
- Walk cycle: no 1 px body bob on the passing frame; arms barely swing.

Tiles / town
- Tree is a single 16x16 stamp repeated along the border (the "wallpaper" look).
- Tall grass has a dark band at the base of each blade row (the black banding).
- Flower beds are a regular dot grid on a brown square (sticker look).
- Grass fill is 2 tones in a visible diagonal pattern.
- Path-to-grass and water edges are hard rectangles; corners don't round.
- Roofs: no shingle rows, no ridge highlight, eaves shadow is 1 px.
- **Origin Town has zero warps**: none of the doors lead anywhere. Only `test_house` exists as an interior.

Legendaries
- Battle sprites exist for all five (144, 145, 146, 150, 151), all four files each.
  No gaps to fill, but they are FRLG-derived and listed as unlicensed.
- No overworld encounter object type yet.

---

## Stage 1: plan

### Decisions I need you to OK

1. **Keep the 8-column sheet** (superset of FireRed order). Right row stays row 3,
   but I stop pure-mirroring it: mirror left, then re-apply asymmetric parts
   (side ponytail, bag strap side, cap logo) so right is correct, not flipped.
2. **Proportions**: head 10 px (rows 4-13), torso 11 px (14-24), legs 5 px + 1 px
   sole (25-30), feet on row 30, row 31 left for the ground shadow. Shoulders 10 px
   wide for boys, 8 px for girls; girls get longer hair and a hem flare.
3. **Second tileset for interiors** (`tilesets/interior.png`, firstgid 1000; collision
   moves to 2000). Keeps exterior ids 0-144 stable so `origin_town.json` diffs stay small.
4. **Path/water edges**: 16-tile blob subset + 4 inner corners (20 tiles per terrain
   pair) instead of the full 47. It covers every shape the town uses at a third of the
   art cost; the autotiler in `origin_town.py` picks the tile from the 8 neighbours.
5. **Legendary encounter** = an NPC entry with `kind: "legendary"`, `species`, `shiny`,
   whose script is `[{op: "cry"}, {op: "battle", wild: <dex>}]`. Needs a small
   `battle` validator change to accept `wild` as well as `trainer`. No new engine concept.
6. **Shiny** = palette swap at load time (`shiny` map in `master_palette.json`
   per legendary), not a second PNG.

### Master palette plan

Shared, hue-shifted, max 15 colours + transparent per sheet (already enforced by a test).

| Material | Highlight (warm) | Base | Shadow (cool) | Deep / outline |
| --- | --- | --- | --- | --- |
| Skin light | `#ffe6c8` | `#f6be92` | `#c98572` | `#6e3a36` |
| Skin deep | `#e0a878` | `#a8683e` | `#6e3c38` | `#3a2028` |
| Blue cloth | `#9cc8ff` | `#4878e0` | `#2c4aa0` | `#1c2450` (navy) |
| Red cloth | `#ffa088` | `#e04838` | `#a02838` | `#501828` |
| Hair brown | `#d6955a` | `#9a5a32` | `#5e3434` | `#3a2426` |
| Grass (3 tones) | `#a8e070` | `#78c050` | `#58a040` | `#386830` |
| Path | `#f0dca8` | `#d8bc88` | `#b89868` | `#806040` |
| Water | `#c8f0ff` | `#78b8f0` | `#4888d8` | `#2c5898` |

Outline is per material (dark brown on skin/hair, navy on blue cloth). Pure
`#000` only in eye pupils. Light from the top-left everywhere.

### Files to change

| Stage | Files |
| --- | --- |
| 2 slice | `palette.py`, `bodies.py`, `parts.py`, `characters.py` (player, player_f, lass), `tiles.py` (tree x3, tall grass, flowers, house), new `scripts/overworld_art/slice_preview.py` -> `frontend/public/art-slice.html` |
| 3a roster | `characters.py`, `parts.py`; all 32 sheets redrawn; add `shopkeeper` (grunt_m/f, leader_m/f, cooltrainer_m/f already exist) |
| 3b tileset | `tiles.py` (grass noise, autotile edges, pond rim, lilies, reeds, fences/posts, props, roofs), `origin_town.py` |
| 3c town | `origin_town.py` -> `origin_town.json` (+ door warps) |
| 3d interiors | new `interiors.py`, `tilesets/interior.png`, maps `pc_origin`, `mart_origin`, `gym_origin`, `gym_maze`, `house_origin` |
| 3e legendaries | `legendaries.py` (32x32 overworld sheets), `logic/script.js` (`battle.wild`, `cry`), `render/renderer.js` (32x32 object blit + cry flash), `master_palette.json` (shiny maps) |

### Tile list (new or redrawn)

- Trees: round oak (2 tiles wide, canopy in `above`), tall oak, pine; each with a
  2 px ground-shadow ellipse; 3 border variants placed with a seeded stagger.
- Bushes (single, clump-of-2), grass tufts, clover, pebble.
- Grass: 3 base tones in blue-noise, so no 4x4 area repeats.
- Tall grass: 3-tone tufts, lighter top edge, 2-frame sway, no dark band.
- Flowers: irregular red/yellow/white clusters drawn straight onto grass, 2-frame sway.
- Path: 20-tile edge set, worn lighter centre, pebbles.
- Pond: 20-tile sand/stone rim, 3-frame ripple + sparkle, lily pads, reeds.
- Fences: post, rail, end and corner caps, 1 px shadow strip. Ledge: dark lip + shadow.
- Props: mailbox, sign, rock, barrel, crate, bench, lamp post, garden bed, laundry line;
  each with a 1-2 px shadow.
- Buildings: shingle rows, ridge highlight, 2 px eaves shadow, side-wall shade, 3-pane
  windows with sky gradient + sill, framed door with step + mat, chimney, base stones,
  mown-grass skirt. Gym: fluted pillars + FireRed-style gym roof. Center: red roof +
  white cross. Mart: blue roof.
- Interiors: grey grid floor, yellow grid floor, teal mosaic floor, white wall trim,
  counter, nurse machine (3 frames), heal-pad glow, flower pot, PC, glass table, yellow
  seat, red mat, striped pillar, wall machine, red orb, leader pad, raised maze wall
  (orange face + cast shadow), arrow warp (2 frames), pressure tile, shelves, TV, bed,
  plant, table, rug.

### Tests to add

- Sheet dims (multiples of 16x32), frame count (8 cols x 4 rows), colour limit,
  no semi-alpha, no orphan pixels (extend existing `test_art.py`).
- Head/torso/leg row bands within +/-1 px of the plan.
- Every gid in every map resolves to a tileset; every door has a warp and a return warp.
- Legendary sheets: 32x32 cells, 2 frames; shiny palette covers every colour used.
- Node: `battle` accepts `wild`; legendary NPC triggers a battle effect on A-press.

### Commands you will run (after each stage)

```bash
python3 -m scripts.overworld_art.build_all
```
Regenerates every PNG/JSON from the Python sources, so you review code diffs, not binaries.

```bash
python3 -m unittest scripts.overworld_art.test_art
```
Art rules: sizes, palette limit, orphans, silhouettes, map validity.

```bash
cd frontend && npm test
```
Node logic tests then vitest component tests (needs `npm install` once).

```bash
cd frontend && npm run dev
```
Then open `/sprite-preview.html` (4x animated cast) and `/art-slice.html` (stage 2
side-by-side page) and play the overworld at 1x and 3x.

Each stage ships as its own commit on `claude/funny-hopper-804j0z`, so you can review
and `git revert` one stage without touching the others.
