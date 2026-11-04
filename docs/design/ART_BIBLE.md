# Aurelia art bible

The rules every overworld asset follows. Spec: `docs/superpowers/specs/2026-11-04-overworld-art-overhaul-design.md`.

## Reference rule

GBA-era top-down pixel art is the genre. `pret/pokefirered/graphics` and screenshots are for studying structure and craft only. No pixels, palettes, tiles or maps are copied, traced, sampled or converted. Every asset is original.

## Frame

240x160 view, 16x16 tiles, objects aligned to the tile grid.

## Light and value

- Light comes from the top-left. Lit planes face up and left, shaded planes face down and right.
- Ground sits at luma 0.70-0.90 and stays low contrast. Objects span 0.15-0.95 and carry the contrast.
- No pure black. Shadows lean cool, highlights lean warm.

## Outlines and shadows

- Outlines belong to objects only, in `LINE` from `world_palette.py`. Ground has none.
- Every standing object gets a soft contact shadow, `SHADOW` from `world_palette.py`.
- Dither only on ground transitions.

## Ground

- Two tones: pale walkable meadow, darker lawn patches hugging buildings and fences.
- Decor sits in clusters with empty space between. Never spread evenly.
- Nothing visibly repeats on the 16px grid.

## Characters

- At most 24 rows tall, head at most 11 rows, feet on the bottom row of the 16x32 cell.
- Side views are narrow, at most 13 px wide.
- The silhouette must read in solid colour. Design shape first, colour second.
- At most 15 colours per sprite.

## Buildings

- The roof takes over half the height and shows visible side planes.
- Windows never cross a tile edge.
- Nothing is stretched. Every building is placed or drawn on purpose.
