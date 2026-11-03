# Art / audio needed from a human

## Blocking before public hosting
- [ ] **Replace all FRLG-derived assets** listed as unlicensed in `assets/LICENSES.md` (Pokémon sprites, battle backgrounds, Red/Leaf sprites) with original or CC0 art.
- [ ] Rename Kanto towns/characters to originals (data-only change once the names file exists, Phase 3).

## Phase 1 placeholders (work, but look like placeholders)
- [ ] Real overworld tileset (grass, paths, trees, water, buildings, caves, interiors) at 16x16. Replace `frontend/public/maps/tilesets/overworld.png`; keep local tile ids or update the maps. Door-open frames, tall-grass rustle frames.
- [ ] Real 16x32 character sheets (spec arrives with Phase 2: `assets/sprites/avatar/SPEC.md`). Current `player.png` / `npc.png` are 3 columns (idle, walkA, walkB) x 4 rows (down, up, left, right).
- [ ] Bump / ledge / door sound effects are placeholder synth blips.
