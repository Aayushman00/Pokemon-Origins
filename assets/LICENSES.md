# Asset licenses

Rule: every **new** asset must be original or CC0. Record it here when added.

## Original / CC0 (new work)

| Asset | Path | Source | License |
|-------|------|--------|---------|
| Overworld tileset (24 tiles: grass, tall grass, path, tree + canopy, water x2, flowers x2, house wall/roof/roof ends/door/window, ledge, sign, interior floor/wall, mat, fence, bush, mailbox, rock) | `frontend/public/maps/tilesets/overworld.png` | Original pixel art, hand-authored as character grids in `scripts/gen_overworld_placeholders.py`. GBA-*style* only; not traced, copied or converted from any Nintendo / Game Freak asset | CC0 |
| Overworld actor sheets (player, npc; 16x32, stand + 2 walk + 3 run frames x 4 directions) | `frontend/public/sprites/overworld/*.png` | Original pixel art, hand-authored grids in the same script | CC0 |
| Sample maps `test_town`, `test_route`, `test_house` | `frontend/public/maps/*.json` | same script | CC0 |
| World maps `dawnbrook`, `route_1`, `mossgate`, and the Dawnbrook and Mossgate interiors, including the `plank` tile | `frontend/public/maps/*.json` | `scripts/overworld_art/world_maps.py`, `interiors.py` (original layouts from the Aurelia artifacts) | CC0 |
| v2 tiles: oak trees, tall grass, flower clusters, house, doormat | `frontend/public/maps/tilesets/overworld.png` | `scripts/overworld_art/tiles_v2.py` (original; FireRed used only as a style reference) | CC0 |
| Interior tileset + Care Centre, Mart, home maps | `frontend/public/maps/tilesets/interior.png`, `frontend/public/maps/origin_{center,mart,home}.json` | `scripts/overworld_art/interiors.py` (original) | CC0 |
| Legendary overworld sprites (Articuno, Zapdos, Moltres, Mewtwo, Mew) + Legend Grove map | `frontend/public/sprites/overworld/legendary/`, `frontend/public/maps/legend_grove.json` | `scripts/overworld_art/legendaries.py` (drawn from scratch; the creature designs are Nintendo / Game Freak IP, like the names) | original pixels, IP caveat |
| Chiptune sound effects | `frontend/src/v2/battle/sfx.js` | Synthesized with WebAudio at runtime, no files | CC0 |

## Existing assets derived from Nintendo / Game Freak material — UNLICENSED

These predate the originality rule and are kept for development only. They are **not licensed for redistribution**. **Replace before any public hosting** (tracked in `assets/TODO_ART_AUDIO.md`).

| Assets | Path | How obtained |
|--------|------|--------------|
| FireRed/LeafGreen Pokémon front/back sprites (dex 1-151) | `frontend/public/sprites/pokemon/`, `frontend/public/sprites/battle/` | `scripts/fetch_frlg_sprites.py` (Bulbagarden Archives) |
| FRLG battle backgrounds (10) | `frontend/public/backgrounds/` | `scripts/crop_battle_backgrounds.py` from an FRLG sheet |
| FRLG player sprites (Red, Leaf) | `frontend/public/sprites/trainers/player/` | `scripts/crop_trainer_sprites.py` from FRLG overworld sheets |

Pokémon species, move, town and character names are also Nintendo IP; names are meant to move into one data file so a rename is data-only (decision Q8).
