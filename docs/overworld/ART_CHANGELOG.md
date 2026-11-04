# Overworld art changelog

Art decisions, newest first. Each stage ships as its own commit.

## Stage 2: vertical slice (player boy, player girl, Lass, house, trees, tall grass, flowers)

Review page: `/art-slice.html` (4x, animated, before/after, M/F labels, local FireRed reference slots).

### Characters (`scripts/overworld_art/handmade.py`)
- **Hand-placed tones instead of auto-shading.** v1 picked each pixel's tone by rule
  (`compose.shade`), which turned muddy at 16 px. v2 grids name the tone of every pixel
  (hi / base / shadow / deep per material), the way GBA sprites are drawn.
- **Proportions:** head rows ~4-13 (10 px, hats rise to row 2), torso 14-25 (12 px),
  legs 26-31 (6 px incl. shoe, sole line, outline). Feet stay on row 31: the engine,
  tall-grass cover and the existing anchor test depend on it, so the plan's "row 31 for a
  ground shadow" was dropped (FireRed has no walking shadow either).
- **Gender by silhouette:** boys are 16 px wide at the shoulders with 2 px arms;
  girls 12 px with 1 px arms, a flared hem, and longer hair. Tested.
- **Outlines per material:** the general line is dark brown `#3a2426`; cloth uses its own
  deep tone (navy on the blue jacket, wine on red). No `#000000` anywhere; pupils use the
  deepest cloth tone and the iris pixel below them is the catch-light.
- **Hue-shifted 4-tone ramps** (`palette.V2`): warm highlights, cool shadows. Colours are
  shared across materials on purpose (the boy's white tee shadows into the jacket
  highlight; the girl's hat shadow is her top's highlight) so each sheet is one
  15-colour + transparent palette. All three are exactly 15.
- **Accessories read in every direction:** boy cap with brim, white panel and logo,
  backpack (straps from the front, full pack from behind, pack bump in profile); girl sun
  hat with band, ponytail with tie, cross-body bag; Lass hairband, long hair over the
  back, sailor ribbon, knee-length pleated skirt.
- **Right row = mirrored left + a `right` layer.** The girl's bag hangs on her right hip,
  so it is hidden facing left and drawn facing right instead of being flipped.
- **Faces:** 1x2 eyes (pupil + catch-light iris), brows for the girls, 1 px mouth,
  blush. Blink closes the eye to a lash line; alert raises the brows and opens the mouth.
- **Motion:** 2 leg frames per direction; the planted foot stays on row 31, the lifted
  foot rises 1-2 px; arms swing opposite the legs; 1 px body bob on walk frames; the run
  lean drops the hem row for girls so hands are never cut to 1 px.
- **Clean clusters:** a new zero-tolerance test checks every shading pixel touches its own
  material family; eyes, mouth, blush, decal marks and outline are line work.

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

### Pipeline
- **Reproducible builds.** v1 `compose.despeckle` broke ties with `max(set(...))`, whose
  order follows Python's per-process hash seed, so every build changed a few v1 pixels
  (HEAD's own generator did not reproduce HEAD's PNGs). Ties are now sorted; builds are
  byte-identical across `PYTHONHASHSEED` values. The v1 sheets in this commit differ
  from the previous ones only by those tie pixels.
- `render_map.py` renders any map to PNG offline for 1x / 3x review.

### Not in this slice (next stages)
- Care centre, mart and gym still use v1 buildings; the border is still the v1 tree.
- The other 28 sheets are v1 (shorter and auto-shaded), so v2 characters stand taller.
