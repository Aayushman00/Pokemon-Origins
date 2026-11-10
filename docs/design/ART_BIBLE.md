# Aurelia art bible

The rules every overworld asset follows. Spec: `docs/superpowers/specs/2026-11-04-overworld-art-overhaul-design.md`.

## Reference rule

GBA-era top-down pixel art is the genre. `pret/pokefirered/graphics` and screenshots are for studying structure and craft only. No pixels, palettes, tiles or maps are copied, traced, sampled or converted. Every asset is original.

## Frame

240x160 view, 16x16 tiles, objects aligned to the tile grid.

## Light and value

- Light comes from the top-left. Lit planes face up and left, shaded planes face down and right.
- Meadow and trail sit at luma 0.70-0.90 and stay low contrast. Lawn, the darker ground tone, may drop to 0.55. Objects span 0.15-0.95 and carry the contrast.
- No pure black. Shadows lean cool, highlights lean warm.

## Outlines and shadows

- Outlines belong to objects only and match their material: `outline_for(ramp)` from `world_palette.py`, softened to `sel_out(ramp)` on lit top/left edges (`slice_art._outline` does both). `LINE` is the fallback for colours from no ramp, and still outlines characters. Ground has none. Trail and lawn may end in a one-pixel edge from their own ramp; grass hangs over a trail's north edge and shades the dirt under it.
- Props, fences, bushes, trees, ledges and cliff faces (`mass_shadow` on the cell below) stand on a contact shadow: translucent `SHADOW` from `world_palette.py`, hard pixel edge. Flat decals such as flowers get none.
- Buildings throw no strips onto the next cell and interior floors carry no shadow patches. Every walker stands on a faint 12x4 hard-edged shadow (renderer `ACTOR_SHADOW`); during a hop it stays on the ground and darkens, showing how high the character is.
- Slow cloud shadows drift over outdoor maps that set `clouds`.
- Small standing props (`town_art.STANDING`) take a 1px ring outline outside the shape (`ring_outline`), so posts and wires keep their fill, then a contact shadow. Sky props (`SKY`) get the ring but no shadow.
- Plateau tops on natural cliffs carry half-buried rubble that wraps over 2x2 tiles; their props are outcrops in the plateau's own stone ramp. Water off the meadow uses `pondc_*`, which leaves the biome's ground under the bank.
- Ground transitions wander and round off. No dither is needed.

## Ground

- Two tones: pale walkable meadow, darker lawn patches hugging buildings and fences.
- Decor sits in clusters with empty space between. Never spread evenly.
- Nothing visibly repeats on the 16px grid.
- Routes are meadow with a worn trail, not open sand. The main road is 2 tiles wide to meet map connections, side paths 1.
- Bridge boards lie across the direction of travel.
- Lawn edges wander up to three cells out from what stands on them. A straight lawn edge reads as a box.
- Deep forest varies by clump, not by tile, and never at a rim: sun, deep, and a rare amber accent.
- Ledges are grass hanging over an earth face. Thin brown strips read as fences.

## Light at runtime

- Time of day is fixed per map, never a clock. Dusk and night multiply the scene, then lamps and windows add light back.
- Added light is pixel rings, never a soft disc: three hard steps (`ambient.glowMask`), each edge broken by a 4x4 Bayer dither. The pulse steps the rings out 2px and back; it never fades.
- Pale effects on grass: anything near the grass's own greens disappears against it. A step into tall grass parts pixel blades (pale tip, light body, dark shaded side) that lean out, overshoot and settle.
- Water: the north bank shades the water below it; elsewhere foam laps the shore over three frames (lip, lace, recede). Open water carries a few crests that rise, run and break in place, out of step, so the loop has no seam.

## Characters

- At most 24 rows tall, plus up to 2 for hair spikes and hats. Head at most 11 rows, feet on the bottom row of the 16x32 cell.
- Children stand at least 3 rows shorter than adults, and the head stays under half the figure.
- Side views are narrow, at most 13 px wide.
- Front views are at most 12 px wide across the arms (14 for heavy builds). Legs stay inside 10 px and the feet never spread past that.
- Nothing flares at the bottom: coats and skirts hang straight, at most 9 px from the side. Arms meet the torso with a shadow tone, not an outline, or the figure reads as toy blocks.
- The silhouette must read in solid colour. Design shape first, colour second.
- At most 15 colours per sprite.
- The silhouette outline matches what it rings (`outline_for` of that material's ramp; the top of hair and hats softens to its own shadow tone). Where a sheet has no free palette slot, the least important outlines (feet before face) take the nearest dark colour already on the sheet (`sheets.edge_colours`). Eyes and drawn lines stay `OUTLINE`.
- The heroes (`teen` build: player, player_f, rival) stand about 23 rows, head about 10: shorter than adults, taller than children.

## Buildings

- The roof takes over half the height and shows visible side planes.
- Windows never cross a tile edge.
- Nothing is stretched. Every building is placed or drawn on purpose.
