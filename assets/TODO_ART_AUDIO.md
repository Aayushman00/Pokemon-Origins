# Art / audio needed from a human

## Blocking before public hosting
- [ ] **Replace all FRLG-derived assets** listed as unlicensed in `assets/LICENSES.md` (Pokémon sprites, battle backgrounds, Red/Leaf sprites) with original or CC0 art.
- [ ] Rename Kanto towns/characters to originals (data-only change once the names file exists, Phase 3).

## Dawnbrook placeholders
- [ ] Lab exterior: stretched house stamp (`world_maps.dawnbrook`). Needs its own building art.
- [ ] Lab interior reuses the Care Centre room, and the neighbour house reuses the home room (`interiors.ROOMS`).
- [ ] Well tile: a barrel stands in for it (`paint`, grid char `u`).
- [ ] Single-tile bench: uses `bench_l` alone (`paint`, grid char `n`).
- [ ] Houses at the outline footprint are a stretched 4x4 stamp.

## Mossgate placeholders
- [ ] Gym exterior: the stock Gym stamp with hedges either side. The design is a hollow trunk (`world_maps.mossgate`).
- [ ] Gym interior: forest tiles for walls, `rock2` for seed pods, `veg` for soil patches, `bush` for the vine gate (`world_maps.mossgate_gym`).
- [ ] Rope bridge: uses the boardwalk `plank` tile, so it has no ropes (`paint`, grid char `k`).
- [ ] Both Mossgate houses reuse the home room (`interiors.ROOMS`).

## Phase 1 placeholders (work, but look like placeholders)
- [ ] Real overworld tileset (grass, paths, trees, water, buildings, caves, interiors) at 16x16. Replace `frontend/public/maps/tilesets/overworld.png`; keep local tile ids or update the maps. Door-open frames, tall-grass rustle frames.
- [ ] Real 16x32 character sheets (spec arrives with Phase 2: `assets/sprites/avatar/SPEC.md`). Current `player.png` / `npc.png` are 3 columns (idle, walkA, walkB) x 4 rows (down, up, left, right).
- [ ] Bump / ledge / door sound effects are placeholder synth blips.
