# Overworld art pipeline

Original pixel art for Pokemon Origins' overworld: 31 character sheets
(18 boys, 12 girls, 1 generic townsperson), the extended tileset and the
town and route maps. Everything is generated from text grids and small
drawing functions in this folder, so art changes are reviewable diffs.

| file | what it holds |
| --- | --- |
| `legendaries.py` | legendary overworld sprites (2-frame idle), shiny palette maps, the Legend Grove showcase map |
| `interiors.py` | interior tileset (`interior.png`) and the Care Centre, Mart, home, cottage and lab maps, door/mat warps |
| `world_palette.py` | outdoor colour ramps, the shared `LINE` outline and `SHADOW` |
| `slice_art.py` | ground, tree, building and fence drawing the outdoor kit is built on |
| `nature.py` | blob sets for trail, lawn, forest and pond, plus tall grass, flowers, fences and bridge planks |
| `buildings.py` | the building kit (homes, lab, care centre, shop, trunk gym) and props |
| `tiles_v2.py` | older tiles still used by some maps; `blob_mask` and `blob_masks` for autotiling |
| `render_map.py` | renders a map JSON to PNG offline (1x / 3x review shots without the dev server) |
| `palette.py` | character palette: hue-shifted ramps (warm highlight, cool shadow), plum outline matching `LINE` |
| `compose.py` | layer stacking, auto outline, top-left light shading, despeckle (no orphan pixels) |
| `bodies.py` | male / female body templates per direction and frame |
| `parts.py` | faces, eyes/mouth/beard features, 12 hair styles, 11 hats, extras (coat, pack, cane...) |
| `characters.py` | the cast: hand-drawn player heads + everyone else assembled from parts |
| `sheets.py` | 128x128 sheet: 8 columns (stand, walkA, walkB, runStand, runA, runB, blink, alert) x 4 rows (down, up, left, right) |
| `tiles.py` | tileset: ids 0-23 unchanged, new tiles from 24 (grass, beds, herringbone, fences, pines, shores, buildings) |
| `world_maps.py` | towns and routes painted from text grids (`route_layouts.json` holds the routes, `TRAILS` their worn paths), plus map properties for time of day, ambience and name |
| `build_all.py` | runs everything below |
| `preview.py` | 4x contact sheet PNG + walk-cycle GIF |
| `test_art.py` | sheet size, frame count, palette limit, mirroring, foot anchor, orphans, silhouettes, map checks |
| `test_route.py` | worn trails, unchanged route collision, opaque outdoor ground, bridge boards |
| `test_rooms.py` | rooms differ from each other, and their people and exits can be reached |

Commands (from the repo root):

```bash
python3 -m scripts.overworld_art.build_all          # regenerate PNGs, JSON and generated JS
python3 -m unittest scripts.overworld_art.test_art  # art checks
python3 -m scripts.overworld_art.preview cast.png   # 4x contact sheet + cast.gif
```

In the running app, `/sprite-preview.html` animates every sheet at 4x.

```bash
python3 -m scripts.overworld_art.render_map dawnbrook town.png --scale 3
```
