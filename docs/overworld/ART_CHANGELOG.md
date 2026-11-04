# Overworld art changelog

Art decisions, newest first. Each stage ships as its own commit.

## Stage 3a (in review): v3 polish, player boy

v3 = pixel-level polish of the v1 sheet (`scripts/overworld_art/polish.py`). Identity
lock, enforced by `PolishTests`: every frame keeps the exact v1 silhouette (0 alpha
pixels changed, same bounding boxes) and uses only colours already in the v1 sheet.
Only the TONE a pixel takes from its own ramp changes.

- **Face:** hand-set tone map with top-left light: clean base skin, right-cheek and chin
  shadow, a brim shadow row on the forehead under the cap.
- **Eyes:** the upper eye pixel takes the navy shadow already in his trousers: a sheen
  on the eye without a new colour. Blink still closes to the lash line.
- **Cap:** crown lit top-left, shaded right; white patch untouched; brim row kept dark.
- **Back view:** hair strands and a parting (v / ^ in the hair's own ramp), cap
  strap opening kept, nape shadow.
- **Side view:** brim shadow on the face, ear shadow, hair lit behind the ear.
- **Body:** a calmer shading rule (`shade_v3`) on the vest: right-hand form shadow,
  hem shadow, left rim light. v1 shaded every pixel next to another material, which
  made thin parts muddy.
- **Kept exactly as v1:** trousers, legs, shoes (their dark navy is part of his look),
  sleeves and hands (splitting 2 px runs into two tones leaves orphan pixels).
- **Not done, and why:** a sole line (his shoes are 1 px tall, so a light sole would
  erase the red shoes); extra arm swing (would move pixels and break the silhouette
  lock; v1 already has the 1 px walk bob).
- **Rejected during self-check:** an earlier v3 pass lifted the trousers to the mid
  blue; next to v1 NPCs that read as a recolour, so legs went back to v1 tones. A
  highlight pixel on the hands read as a white dot; highlights are now limited to cap,
  hair and vest.

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
