# Overworld art overhaul: plan for review

Status: decisions recorded 2026-11-04. Phase 0 is next; it ends at the user's look approval.

## Intent

Take the overworld from "good generated pixel art" to a world that looks hand-made and feels alive. GBA-era top-down pixel art (240x160, 16px tiles) stays. The goal is to beat that era with things the hardware could not do, while Aurelia keeps a look of its own.

## Reference rule

`pret/pokefirered/graphics` is used to learn how a finished game of this kind is organised: which asset categories exist, how many animation frames an effect gets, how shadows and doors are split up. No pixels, palettes, tiles or maps get copied, traced or converted. This matches `assets/LICENSES.md` and the fidelity prompt. Every new asset stays original.

"Same aesthetics" here means the same genre and era, not a clone of FireRed's look. The player sprite is the clearest case: today it reads as that game's hero (red cap, white panel, red vest), so it gets a new design.

## Where we really are

| Area | State |
| --- | --- |
| Engine (movement, camera, connections, warps, scripts, trainer sight, puzzles) | Strong. Frame timings already derived from pret |
| Towns | 2 of 10 built (Dawnbrook, Mossgate Grove) |
| Routes | 1 of 9 built |
| Gyms | 1 of 8 built, no League, no cave |
| Wild encounters | Zones exist in map data; walking in grass triggers nothing |
| Field effects | None (no grass rustle, splash, dust, door animation) |
| Map name popup, Start menu, music, weather, day/night | None |

The engine is well past 55%. Content is well below it. So the remaining work is art plus missing game systems plus most of the world, and the order below reflects that.

## Art audit: root causes

Each visible defect traces to a specific cause, so fixes go at the cause.

| # | What you see | Root cause | Fix |
| --- | --- | --- | --- |
| 1 | Row of 6 chimneys, windows sliced in half, repeating roof bands | `stamp()` in `world_maps.py` stretches one 4x4 house by repeating its middle columns | Delete stretching. Building kit where windows, chimneys and doors are placed on purpose |
| 2 | Forest looks like wallpaper; every tree shows a trunk, with dark bands between rows | `forestA/B` 2x2 tiles on a checkerboard | Solid canopy mass, irregular outline, trunks on the south rim only, 3-4 tree variants |
| 3 | Grass is loud and evenly speckled | Saturated base plus `dress_grass()`, which fills every 3x3 gap at the same density | Calmer base, large soft patches from noise, decor in clusters with empty space between |
| 4 | Path edge looks like battlements; pebbles sit on a 16px grid | 47 blob tiles share one hard rim and one pebble pattern | Redraw rim with soft, broken edge; 3-4 centre variants placed by hash |
| 5 | Side fences break into floating segments | Grid char `f` draws the same horizontal tile on vertical runs | Autotiled fence: posts, runs, corners, gate |
| 6 | Pond is a jagged plus-shape with a cream outline | Blocky grid shape, plus a thin rim as the only bank | Rounded layouts, earth bank tiles, reeds, lily pads |
| 7 | Route 1 is a wide dirt maze; grass is hard rectangles | `paint(..., "path")` makes every walkable cell dirt; no ledges anywhere | Paint walkable cells as meadow with a narrow worn trail. Collision and trainers do not change, so the approved layout survives. Add ledges and organic grass edges |
| 8 | Everything floats on the ground | No contact shadows on actors, buildings, trees or signs | Soft shadow pass drawn by the renderer |
| 9 | Town feels empty and generic | All houses identical, big street lamps in a village, barrel standing in for the well | Town-specific buildings and props; lamps only where they fit |
| 10 | All 31 characters feel like one person | Two shared body templates (`bodies.py`); heads are 13 of 23 rows; hair blob on back views; side-view head wider than body | Body archetypes, hand-drawn key cast, redone back and side views |
| 11 | Debug text on screen | Dev overlay shown in play; it also reports 56 fps and 1552 dropped ticks | Hide behind a key; find out why ticks drop |

## Reference study: lessons from the user's 16 screenshots

Structure and craft only. These are ripped game images, so nothing is traced or sampled from them, palettes included.

| Lesson | What the references do | What we do now | Change |
| --- | --- | --- | --- |
| Value structure | Ground is pale, cool and low contrast; objects carry the contrast, so buildings and people pop | Ground is as loud as the objects | Biggest single fix. Quiet ground, strong objects |
| Two-tone ground | Pale walkable ground, darker lawn patches hugging buildings and fences, soft rounded edge | One grass everywhere | Yard patches around buildings and props |
| Building depth | Roof takes over half the height, side planes show volume, walls about 2 tiles, compact 5-6 tile width | Wide and shallow: 3 rows, flat roof strip | Taller, narrower, real roof planes. Needs footprint changes (open question 1) |
| Building variety | About 8 house types, each landmark has its own silhouette | One house in three sizes | Roof types per town; every landmark drawn once, for its town |
| Town layout | Strict rectangles, deliberate empty space, paved plazas, props in pairs and rows | Scattered props | Layout pass per town; each town gets a ground material |
| Trees | Few variants, strong silhouette, dark ground halo, tight overlapping rows | Busy round trees, every trunk visible | Strong silhouette plus halo; rhythm is fine once the silhouette reads |
| Terrain | Stepped cliffs, ledge strips, dense dark grass clumps | Flat world | Elevation set, needed by most routes |
| Characters | Silhouette does the work: hats, hair shapes, body sizes differ at a glance. Side views are narrow | Same body, colour swaps | Silhouette-first cast; a roster sheet must read in solid black |
| Interiors | Black void around a room with chamfered corners, tall walls, hard diagonal cast shadows, rugs, plants, patterned floors | Not yet reviewed against this | Add interior pass; each room type gets its own floor and wall set |

Our own identity on top: original hues and building designs per town, own emblem for Center, Mart and Gym, and the Phase 4 effects the GBA could not do.

## Phases

Each phase ends with before/after screenshots at 1x and 3x and a stop for your review. Art checks (`test_art.py`) and `validate:maps` stay green throughout.

### Phase 0: Art bible and one-screen slice (the gate)

- Style rules: light direction, outline policy, shadow colour, value range, separate world palette, dither rules.
- Rebuild one screen only: Dawnbrook square, with new grass, path, one house, trees, fence and player.
- You approve the look here. Nothing scales until you do. This is the cheapest place to change direction.

### Phase 1: Nature tileset

Grass and patches, path set, forest canopy, tree variants, water and banks, ledges and cliffs, autotiled fences, tall grass with soft edges, rocks, stumps, reeds, flower beds.

### Phase 2: Building kit

- Modular house pieces, 3 roof colours, and Town variations.
- Unique art: Lab, Care Centre, Mart, Mossgate hollow-trunk Gym.
- Well, single bench, rope bridge, signposts. Clears the placeholder list in `TODO_ART_AUDIO.md`.
- Door open frames.

### Phase 3: Characters

- New original player (male and female) with its own silhouette.
- Hand-drawn key cast: rival, Professor, Mom, Nurse, Clerk, Leaders.
- 4 body archetypes for everyone else: child, adult, heavy, elder.
- Better walk and run frames. Check `PixelAvatar` and hub avatars match.

### Phase 4: Make it alive (where we beat the GBA)

- Field effects: grass rustle and leg cover, water ripple, ledge dust, footprints on sand, door open and close.
- Soft shadows, water reflections, tree sway, drifting leaves, butterflies, chimney smoke.
- Fixed per-map time of day (map property): tint, lit windows and lamp glow on dusk or night maps.
- Weather per route: rain, fog, snow (Gale Spire and Zenith Summit suit it).
- Map name popup.

### Phase 5: Rebuild built maps

Dawnbrook, Route 1, Mossgate Grove, Mossgate Gym and all interiors with the new kit. Route collision stays. Town footprints change only as far as open question 1 allows. New interior tileset work: chamfered room shell, cast shadows, floor and wall sets per room type (home, Lab, Care Centre, Mart, Gym). Lab and neighbour house get their own rooms.

### Phase 6: Missing game systems

Wild encounters on grass steps, Start menu (party, bag, save) and its chrome, NPC wander and look-around, music with per-map tracks, better SFX.

### Phase 7: Build the world

8 routes, 8 towns, 7 gyms, League, legendary cave, following the existing rulings in the world-build decisions. Comes last so it uses the finished kit and is not drawn twice.

### Parked

Battle screen remake: not scheduled. Trainer sprite placement is still open. Replacing unlicensed Pokemon sprites and battle backgrounds before public hosting is also still open, tracked in `TODO_ART_AUDIO.md`.

## Non-goals

- No engine rewrite. Keep `logic -> render -> ui` layering and the 240x160 view.
- No copied or traced assets.
- No change to approved route layouts, trainers or gym puzzles. Town footprints are open question 1.

## Risks

- All art is generated from text grids and drawing code. It stays reviewable, but organic shapes are harder to get this way. Phase 0 proves whether it reaches the bar; hand-painted PNGs are the fallback for hero assets.
- Tile ids change, so `tiles.py`, `tiles_v2.py` and map generation need one clean migration. `build_all` regenerates all maps, which keeps this contained.
- Day/night and weather add per-frame draw cost. Check after the dropped-tick issue is understood.

## Decisions (user, 2026-11-04)

1. Town layouts: yes, building footprints may grow 1-2 rows and shrink in width, moving doors and paths in the Dawnbrook and Mossgate grids.
2. Order: finish the art (Phases 0-5) before encounters and Start menu.
3. Menus: left to Claude's judgement. Claude's call: Start menu and menu chrome are part of Phase 6, built on the existing `ui/` primitives.
4. Day/night: fixed per map, a map property. No clock.
