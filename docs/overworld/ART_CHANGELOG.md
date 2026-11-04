# Overworld art changelog

Art decisions, newest first. Each stage ships as its own commit.

## Stage 3d v2: interiors repainted after the FireRed room references

Rooms are now painted as whole pictures, then sliced into 16x16 tiles and
de-duplicated (241 unique tiles across the three rooms; the healing machine's
changing tiles become 3-frame animations automatically). This is what lets
furniture span tiles and cast big soft floor shadows, as in FireRed.

- **Room shell:** diagonally cut top corners sloping into narrow side-wall bands, a
  two-row back wall (cap, trim, face, wainscot stripe, baseboard), black outside, the
  exit mat set into the bottom edge.
- **Shadows:** every piece of furniture darkens the floor below it (solid core,
  dithered rim) using each floor's own shadow palette; no alpha anywhere.
- **Care Centre:** warm cream tile floor, orange scallop trim, U-shaped salmon counter
  whose arms run back to the wall, flower pots on the arms, sign-in paper, big white
  healing machine with a 6-light screen (3 frames) and red cross, desk phone, wall
  monitor, bookshelf, PC tower, a lit heal dome (shaded top half, bright lower half),
  yellow seats and glass tables. One centred exit mat (both door cells lead to it).
- **Mart:** bold two-tone blue grid floor, yellow walls with green trim, poster, glass
  wall cabinets, chiller cases, palm, stock box, L-shaped glass counter + register desk
  around the clerk, tall shelving units with a red kick plate, a second glass case.
- **Home:** parquet basket-weave floor, light-blue walls, kitchen run (sink, glass
  cupboard, bin, cooker), TV, staircase up with a runner rug, big green dotted rug with
  a checked table and four chairs, palms in white pots. The bed moved upstairs (later).

## Stage 3d: interiors (Care Centre, Mart, home) and door warps

Gym interiors are deliberately not built: each gym's interior will be decided per gym.

- **Interior tileset** `tilesets/interior.png` (81 tiles, its own tileset; maps use
  firstgid 1 + collision at 1000). Rooms share a frame: dark side walls, a two-row back
  wall (trim + wainscot), a shadowed first floor row, a bottom edge with a red exit mat.
- **Care Centre (15x10):** grey FireRed-style grid floor, blue-trim walls with windows
  and a poster, red counter with flower pots, the nurse behind it, a healing machine on
  the back wall (3-frame chasing lights), a PC, a soft heal-pad light on the floor
  (lighter disc with a dithered rim, no alpha), glass tables with yellow seats, plants,
  two visitors, a 2-wide exit mat.
- **Mart (11x9):** blue/white checker floor, side counter with a register, a new Mart
  clerk (v1 pipeline: cap + apron), two rows of stocked shelves, drink fridges, plants,
  a shopper.
- **Home (11x9):** wood plank floor, wallpaper with wood wainscot, window, clock, TV,
  bookshelf, kitchen (cabinets, sinks, stove), table with chairs and a fruit bowl, bed,
  rug, plant.
- **Talk across counters:** the counter cell in front of the nurse / clerk carries their
  script as a sign (heal / shop requests, as FireRed does).
- **Doors:** the home, Care Centre (2 cells) and Mart door signs became walkable warps
  (step up to enter, door sound + iris); you arrive above the mat; stepping down onto the
  mat returns you in front of the door. The Gym door keeps its "closed" sign.
- **Engine:** OverworldScreen now loads tileset images for every map the start map's
  doors and edges lead to (interiors need `interior.png`).

## Stage 3b: distinct building designs (v3)

Review: the four buildings shared one template (pitched shingle roof, cream siding),
so only colour told them apart. FireRed gives every building type its own silhouette
and roof type; v3 does the same. Footprints and door columns are unchanged.

- **House:** the approved v2 house (pitched shingles, chimney) plus flower boxes.
- **Care Centre:** wrap-around red hip roof with a flat top and rounded front corners,
  smooth white walls, blue band windows, a protruding glass vestibule with sliding doors
  and an original heart-and-plus emblem badge on the eave.
- **Mart:** flat panelled roof with a rooftop unit, full-width MART sign band (2x
  lettering, bag icons), blue/white striped awning with a scalloped edge, glass door and
  a display window with goods on shelves.
- **Gym:** wide, low building with a ribbed tan flat roof and lit front lip, a pillared
  portico with an original red-shield gold-star emblem, glass doors, window strips, a
  wall stripe band and a GYM plate.
- Emblems are deliberately original (no Poke Ball).

## Stage 3b/3c: environment pass (tileset + Origin Town)

Five commits, one per area; existing tile ids never change (new tiles append).

- **Forest border:** a 2x2 tree that tiles seamlessly both ways, in two deeper forest
  shades alternating per block, also used as the off-map `border` block so the world
  edge is one forest. Pines and bushes stand in front of the band on free edge cells.
- **Paths:** 47-tile blob autotile: 1 px wobbly grass edge (periodic so tiles join),
  dirt rim, rounded outer corners, inner-corner bites, sparse worn centre and pebbles.
- **Pond:** water on the same 47 masks with dry sand, wet sand, lapping foam, shallow
  and deep bands; wide concave arcs; 3 frames (ripples drift, foam laps, sparkles).
  Lily pads and reeds; the outline loses its corner cells for an organic shape.
- **Buildings:** v2 Care Centre (red roof, cross plate, vent), Mart (blue roof, MART
  plate), Gym (slate shingles, skylight band, fluted pillars, glass doors). Plates are
  centred over the doors; every building casts a soft lawn shadow.
- **Fences and ledge:** pickets are white boards with grass gaps and end posts; log
  fences end at posts; both cast a shadow strip. The ledge has a lit lip, striated
  dirt face, dark base, shadow and rounded end caps.
- **Props:** rock with shadow, barrels and crates against building walls, a bench,
  three lamp posts (heads drawn above actors), a vegetable bed and a laundry line.
  Every prop is placed only where it leaves its neighbours walkable and never on an
  NPC, sign or warp cell.

## Stage 3a: v1 polish, side views and legs (whole cast)

v1 stays the baseline (v3 boy polish reverted). Template-level fixes only, so every
character gets them; heads, colours, outfits and height are unchanged.

- **Side views, less chunky:** the male side torso is 6 px of fill (was 8) and sits
  under the head the way FireRed tucks the body under a wider head.
- **No pointy nose:** the side face front is flat. The shared side face (`parts.FACE`)
  and the hand-drawn side heads of the player boy, player girl and Youngster each had a
  1 px nose that the outline turned into a spike.
- **Compact side stride:** walk frames step 1-2 px forward/back with a 1 px gap at the
  feet (v1 opened a wide A-shape, feet 4-6 px apart). Male and female.
- **Front/back legs:** the 2 px gap between the legs is now a 1 px seam, male and female,
  in stand, walk and alert frames.
- **Right-facing:** the engine's right row is the mirrored left row (tested), so every
  side-view fix applies to right-facing frames too.
- **Back view collar:** the 4 px skin strip between the hair and the shirt (shared back
  face, and the player boy / Youngster back heads) is now the shirt collar, the way
  FireRed back views run the hair straight into the collar.
- **Rounder male shoulders:** the top body row is 2 px narrower, so the shoulders step
  down from the neck instead of making a square box (female shoulders already did).

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
