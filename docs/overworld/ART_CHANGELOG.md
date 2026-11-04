# Overworld art changelog

Art decisions, newest first. Each stage ships as its own commit.

## Stage 2b: v2 tiles (approved from the slice)

The stage 2 slice was reviewed: tiles approved, avatars rejected. The v2
avatars (redrawn from scratch, taller) are parked on branch
`art/v2-avatars-parked` for comparison only; v1 sprites remain the baseline.
Avatars restart as v3: pixel-level polish of the v1 sheets.

### Tiles (`scripts/overworld_art/tiles_v2.py`)
- **Oak trees (2x2, two variants):** canopy built from overlapping leaf clumps, each lit
  from the top-left with a 5-tone ramp, dark underside where a nearer clump overlaps,
  sparse leaf dither, dark-green outline. Trunk with bark lines and root flare; opaque
  ground-shadow ellipse offset to the right. New ids (appended); placed by stage 3c.
- **Tall grass:** separate leaning blades (2 px roots tapering to 1 px warm tips) in two
  staggered rows that wrap at tile edges. Floor is one tone darker than the lawn so a
  patch reads as tall grass, with no dark band. 2-frame sway (tips move 1 px).
- **Flowers:** mixed red/yellow/white heads straight on field grass (no soil square),
  two layouts alternated in a checker so beds stop repeating; 2-frame sway.
- **House:** rounded shingle tabs in staggered courses, ridge cap + shadow line, light
  left / shaded right face, fascia and eave line, eave shadow on the wall, brick chimney,
  siding lines with side-wall shading, 3-pane windows with sky gradient, glint and sill,
  trimmed door with panels and lit window, stone step, stone footing, red doormat. Same
  4x4 footprint and door column, so Origin Town did not move.

### Tooling
- `render_map.py` renders any map to PNG offline for 1x / 3x review.

## Stage 2a: deterministic builds
- v1 `compose.despeckle` broke ties with `max(set(...))`, whose order follows Python's
  per-process hash seed, so every build flipped a few shading pixels. Ties are sorted
  now; the 29 regenerated sheets differ by 7-22 tone pixels each, no silhouette change.
