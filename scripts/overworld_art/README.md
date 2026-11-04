# Overworld art pipeline

Original pixel art for Pokemon Origins' overworld: 31 character sheets
(18 boys, 12 girls, 1 generic townsperson), the extended tileset and the
Origin Town showcase map. Everything is generated from text grids and small
drawing functions in this folder, so art changes are reviewable diffs.

| file | what it holds |
| --- | --- |
| `palette.py` | master palette: hue-shifted ramps (warm highlight, cool shadow), dark-brown outline |
| `compose.py` | layer stacking, auto outline, top-left light shading, despeckle (no orphan pixels) |
| `bodies.py` | male / female body templates per direction and frame |
| `parts.py` | faces, eyes/mouth/beard features, 12 hair styles, 11 hats, extras (coat, pack, cane...) |
| `characters.py` | the cast: hand-drawn player heads + everyone else assembled from parts |
| `sheets.py` | 128x128 sheet: 8 columns (stand, walkA, walkB, runStand, runA, runB, blink, alert) x 4 rows (down, up, left, right) |
| `tiles.py` | tileset: ids 0-23 unchanged, new tiles from 24 (grass, beds, herringbone, fences, pines, shores, buildings) |
| `origin_town.py` | the showcase map, with an automatic "no bare 3x3 grass" pass |
| `build_all.py` | runs everything below |
| `preview.py` | 4x contact sheet PNG + walk-cycle GIF |
| `test_art.py` | sheet size, frame count, palette limit, mirroring, foot anchor, orphans, silhouettes, map checks |

Commands (from the repo root):

```bash
python3 -m scripts.overworld_art.build_all          # regenerate PNGs, JSON and generated JS
python3 -m unittest scripts.overworld_art.test_art  # art checks
python3 -m scripts.overworld_art.preview cast.png   # 4x contact sheet + cast.gif
```

In the running app, `/sprite-preview.html` animates every sheet at 4x.
