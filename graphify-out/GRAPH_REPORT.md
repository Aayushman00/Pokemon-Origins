# Graph Report - Pokemon-Origins  (2026-11-20)

## Corpus Check
- 503 files · ~712,214 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 16, (none) 12, .example 4)

## Summary
- 3804 nodes · 8478 edges · 183 communities (159 shown, 24 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 583 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e914431e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- movePlaygroundService.test.js
- battleStatus.js
- mapModel.js
- loader.js
- frontend/package.json
- server.js
- combat.py
- rewardService.js
- evolutionService.test.js
- inventoryService.test.js
- scripts
- test_combat.py
- portraits.py
- martService.test.js
- backend/package.json
- moveLearnService.test.js
- matches.test.js
- Panel
- OverworldScreen.jsx
- authService.js
- puzzles.generated.js
- nature.py
- legendaries.py
- hydrate.js
- test_dressing.py
- App.jsx
- Tables
- createPartyService
- new_tiles
- test_nature.py
- test_cast.py
- level1.py
- dependencies
- battleSessionService.js
- finish
- pokemonDetailService.js
- Database
- pathlib
- buildings.py
- validate-sprites.js
- ring
- Pokemon Origins
- TrainerScreen.jsx
- pokemonDetailService.test.js
- playground.js
- interiors.py
- High-Level Design (HLD) — Pokemon Origins
- wild.test.js
- pipeline.js
- pvpLadderService.js
- trainerVoice.test.js
- Overworld Architecture — Phase 0 Audit and Design
- PartyBoard.jsx
- trainers.js
- gymPuzzles.test.js
- tiles_v2.py
- createOverworld
- defaultGetWildBattle
- town_art.py
- Button
- gymPuzzles.js
- playground/movement.test.js
- battleBeats.js
- rbox
- index.test.js
- devDependencies
- world_maps.py
- QA — Campaign Loop Checklist (Phase 11)
- Tile
- sheets.py
- middleware/validate.js
- starterService.test.js
- music.js
- movePlaygroundService.js
- walkthrough.test.js
- _outline
- README.md
- Animation Guide — Pokemon Origins
- battleSessionService.test.js
- TitleScreen.jsx
- pokemonSprites.js
- puzzles.js
- test_art.py
- Frontend — Pokemon Origins
- constants.js
- Route1
- shell
- slice_art.py
- react
- Gen 1 sprite sheet (source)
- auth.js
- profileService.js
- Gym leaders
- BattleMenus.jsx
- extras.test.js
- tileArt.generated.js
- index.js
- Real-time PvP, Elo ladder, movement anti-cheat — design
- Room
- script.js
- renderer.js
- characters.py
- campaignService.js
- meadow
- progressService.js
- worldService.test.js
- crop_trainer_sprites.py
- api.js
- createRoomState
- resetService.test.js
- createBattleSessionService
- build_sheet
- Aurelia art bible
- balance-sim.js
- test_route.py
- _slim_head
- dependencies
- scripts
- createMatchRegistry
- Still to draw
- attachPlayground
- assets.js
- forest_tile
- evolutions.js
- gen_overworld_placeholders.py
- Battle sessions (Phase 3 + Phase 4 party, JWT)
- catchFormula.test.js
- Proportions
- fs
- Overworld art overhaul: plan for review
- campaign.js
- File format
- Stage 1: plan
- express
- content.test.js
- slice-pokemon-sprites.py
- bootstrap-dev-sprites.js
- plain_windows
- start-battle-engine.js
- ref_path
- vercel.json
- blob_masks
- MoveLabScreen.jsx
- battleService.js
- paint_mart
- build_all.py
- battleSessionService.pvp.test.js
- paint_cottage
- setup-battle-engine.js
- stepService.test.js
- legendary/manifest.json
- overworld/manifest.json
- gym
- test_buildings.py
- render_map.py
- inventory.js
- Catching wild Pokémon
- tile_ids
- party.js
- games.js
- mart.js
- moves.js
- Catching Implementation Plan
- ref_node_assert
- Environment variables
- tall_grass_v2
- Restore methods
- main.py
- config/flags.js

## God Nodes (most connected - your core abstractions)
1. `new_tiles()` - 87 edges
2. `Tile` - 85 edges
3. `react` - 71 edges
4. `createBattleSessionService()` - 61 edges
5. `_battle()` - 47 edges
6. `_resolve()` - 47 edges
7. `Button()` - 46 edges
8. `CampaignError` - 42 edges
9. `createOverworld()` - 42 edges
10. `Panel()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `Known balance soft spots (honest)` --references--> `statAtLevel()`  [INFERRED]
  docs/QA_CAMPAIGN_CHECKLIST.md → backend/src/campaign/hydrate.js
- `2.1 Content (static JSON, `backend/data/`)` --references--> `statAtLevel()`  [INFERRED]
  docs/superpowers/plans/overworld-architecture.md → backend/src/campaign/hydrate.js
- `What the builder changes` --references--> `defaultGetWildBattle()`  [INFERRED]
  docs/superpowers/specs/2026-11-12-wild-encounters-design.md → backend/src/services/battleSessionService.js
- `5.1 The battle-session decoupling (needed from Phase 4 on)` --references--> `startBattle()`  [INFERRED]
  docs/superpowers/plans/overworld-architecture.md → backend/src/services/battleSessionService.js
- `Inventory seeding (Phase 7, dev utility)` --references--> `addItem()`  [INFERRED]
  database/README.md → backend/src/services/inventoryService.js

## Import Cycles
- None detected.

## Communities (183 total, 24 thin omitted)

### Community 0 - "movePlaygroundService.test.js"
Cohesion: 0.14
Nodes (15): createMovePlaygroundService(), buildMon(), runExchange(), assert, { CampaignError }, CHARMANDER, { createMovePlaygroundService }, { describe, it } (+7 more)

### Community 1 - "battleStatus.js"
Cohesion: 0.10
Nodes (36): applyAttract(), applyConfusion(), applyDisable(), applyStatChanges(), applyStatus(), cureStatus(), executeBeat(), runBeat() (+28 more)

### Community 2 - "mapModel.js"
Cohesion: 0.09
Nodes (25): fail(), MapError, OBJECT_GROUPS, parseObject(), parseTiledMap(), propsToObject(), SIDES, TILE_LAYERS (+17 more)

### Community 3 - "loader.js"
Cohesion: 0.09
Nodes (35): { CampaignError }, DATA_DIR, ENCOUNTER_FILE, findTrainerBattle(), fs, getEncounter(), getExtraTrainer(), getTrainer() (+27 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.11
Nodes (17): axios, name, private, type, version, autoprefixer, eslint, eslint-plugin-react (+9 more)

### Community 5 - "server.js"
Cohesion: 0.05
Nodes (38): apiLimiter, app, attachPlayground, authLimiter, battleRoutes, bodyParser, campaignRoutes, cors (+30 more)

### Community 6 - "combat.py"
Cohesion: 0.10
Nodes (30): _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _crit_stage(), _has_major_status(), _hit_check() (+22 more)

### Community 7 - "rewardService.js"
Cohesion: 0.10
Nodes (29): makeRewards(), createMemoryRewardStore(), createMysqlRewardStore(), createRewardService(), claimOffer(), createOfferForWin(), getPendingOffer(), getPublicParty() (+21 more)

### Community 8 - "evolutionService.test.js"
Cohesion: 0.10
Nodes (29): displayName(), createEvolutionService(), applyEvolutionToRow(), confirmLevelEvolution(), evolveWithStone(), findLevelEvolution(), findStoneEvolution(), getPendingEvolutions() (+21 more)

### Community 9 - "inventoryService.test.js"
Cohesion: 0.11
Nodes (27): makeInventory(), createInventoryService(), addItem(), consumeItem(), getInventory(), getItem(), getQuantity(), getStore() (+19 more)

### Community 10 - "scripts"
Cohesion: 0.06
Nodes (31): description, devDependencies, concurrently, dotenv, engines, node, dotenv, name (+23 more)

### Community 11 - "test_combat.py"
Cohesion: 0.14
Nodes (47): _battle(), _move(), _pokemon(), _resolve(), test_accuracy_and_evasion_stages(), test_attack_stage_raises_damage(), test_attract_applies_volatile_effect(), test_battle_armor_blocks_crits() (+39 more)

### Community 12 - "portraits.py"
Cohesion: 0.11
Nodes (24): Art, bastian(), cinder(), coral(), drake(), draw(), face(), figure() (+16 more)

### Community 13 - "martService.test.js"
Cohesion: 0.12
Nodes (23): createMartService(), getMart(), getStock(), getStore(), isAvailable(), purchase(), requiredUnlockedLevel(), createMemoryMartStore() (+15 more)

### Community 14 - "backend/package.json"
Cohesion: 0.08
Nodes (25): author, description, devDependencies, nodemon, axios, dotenv, keywords, license (+17 more)

### Community 15 - "moveLearnService.test.js"
Cohesion: 0.14
Nodes (21): createMemoryLearnsetStore(), createMemoryMoveStore(), createMoveLearnService(), getLearnsetStore(), getMoveStore(), getPendingLearns(), processLevelUp(), resolveLearn() (+13 more)

### Community 16 - "matches.test.js"
Cohesion: 0.10
Nodes (20): assert, { createBattleAi }, { createBattleSessionService }, { createMatchRegistry, CHALLENGE_MS, ROUND_MS }, { describe, it }, mon(), move, NAMES (+12 more)

### Community 17 - "Panel"
Cohesion: 0.13
Nodes (26): Palette, Primitives (`frontend/src/v2/ui/`), Rules, Style Guide — Pokemon Origins, Typography, getErrorMessage(), AuthScreen(), Field() (+18 more)

### Community 18 - "OverworldScreen.jsx"
Cohesion: 0.08
Nodes (49): TICK_MS, TILE, VIEW_H, VIEW_W, harness(), attachInput(), BUTTONS, createInputState() (+41 more)

### Community 19 - "authService.js"
Cohesion: 0.11
Nodes (18): mysql, pool, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN }, login(), pool, register() (+10 more)

### Community 20 - "puzzles.generated.js"
Cohesion: 0.31
Nodes (18): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+10 more)

### Community 21 - "nature.py"
Cohesion: 0.07
Nodes (31): _bloom(), _blurred(), bush(), bush_body(), _cells(), crops(), _decal(), doormat() (+23 more)

### Community 22 - "legendaries.py"
Cohesion: 0.07
Nodes (28): Overworld art changelog, Stage 2b: v2 tiles (approved from the slice), Stage 3a: v1 polish, side views and legs (whole cast), Stage 3b/3c: environment pass (tileset + Origin Town), Stage 3b: distinct building designs (v3), Stage 3d: home staircase redraw, Stage 3d: interiors (Care Centre, Mart, home) and door warps, Stage 3d v2: interiors repainted after the FireRed room references (+20 more)

### Community 23 - "hydrate.js"
Cohesion: 0.10
Nodes (26): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, getPokedexDb(), hydrateFromSpecies() (+18 more)

### Community 24 - "test_dressing.py"
Cohesion: 0.08
Nodes (8): cells(), Ground, layer(), OffTheMeadow, Route, Shadows, Terrain, Towns

### Community 25 - "App.jsx"
Cohesion: 0.12
Nodes (18): App(), AuthScreen, BagScreen, DexEntryScreen, DexScreen, HistoryScreen, HubScreen, JourneyScreen (+10 more)

### Community 26 - "Tables"
Cohesion: 0.10
Nodes (19): Intent, Left open (not part of this design), Route 1 grass (Lv 2-5), Route 2 grass (Lv 8-12), Route 2 pond (Lv 8-12), Route 3 grass (Lv 13-17), Route 4 grass (Lv 18-23), Route 4 shore (Lv 18-23) (+11 more)

### Community 27 - "createPartyService"
Cohesion: 0.11
Nodes (28): FEMALE_ONLY_IDS, GENDERLESS_IDS, MALE_ONLY_IDS, rollGenderForSpecies(), assert, { describe, it }, { rollGenderForSpecies }, createMysqlPartyStore() (+20 more)

### Community 28 - "new_tiles"
Cohesion: 0.06
Nodes (36): _brick_at(), bush(), flower_bed(), flowers_decal(), grass(), gym_sign(), herringbone(), hexrgb() (+28 more)

### Community 29 - "test_nature.py"
Cohesion: 0.11
Nodes (9): fence_tile(), tall_grass(), put(), _tuft(), alpha(), Blobs, Decor, Fence (+1 more)

### Community 30 - "test_cast.py"
Cohesion: 0.08
Nodes (7): Builds, iris_of(), Leaders, Milestone3, Players, stand(), torso_width()

### Community 31 - "level1.py"
Cohesion: 0.13
Nodes (13): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, Stats, XPUpdateRequest (+5 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "battleSessionService.js"
Cohesion: 0.09
Nodes (29): { addVoice, introLine, usesPlayerName }, { CampaignError }, { createBattleAi, effectiveness }, createMysqlHistoryStore(), createMysqlHpStore(), createMysqlPpStore(), crypto, defaultService (+21 more)

### Community 34 - "finish"
Cohesion: 0.12
Nodes (18): build(), way_out(), chamber(), front(), grove(), legend_script(), place_legend(), hall() (+10 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.12
Nodes (23): formatEvolutionRequirement(), { slugToTitleCase }, assert, { describe, it }, { formatEvolutionRequirement }, buildEvolutionGraph(), nodeFor(), cleanFlavorText() (+15 more)

### Community 36 - "Database"
Cohesion: 0.12
Nodes (16): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed), Inventory seeding (Phase 7, dev utility) (+8 more)

### Community 37 - "pathlib"
Cohesion: 0.07
Nodes (12): _is_valid_existing(), main(), download_and_validate(), test_downloads_and_validates_known_sprite(), test_raises_on_404(), _fetch_all_category_members(), _get_json(), resolve_dex_map() (+4 more)

### Community 38 - "buildings.py"
Cohesion: 0.10
Nodes (13): _awning(), center(), _emblem(), _finish(), home(), lab(), mart(), _prop() (+5 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "ring"
Cohesion: 0.10
Nodes (20): plate(), draw(), screen(), draw(), pad(), stone(), draw(), glyph() (+12 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.17
Nodes (12): Architecture (short), Combat unit tests, Contributing, Database, Feature surface (current), Folder structure, License, Pokemon Origins (+4 more)

### Community 42 - "TrainerScreen.jsx"
Cohesion: 0.15
Nodes (26): badgeCount(), cache, fetchProfile(), invalidateProfile(), isGuestId(), TrainerRecord(), ChatLog(), Roster() (+18 more)

### Community 43 - "pokemonDetailService.test.js"
Cohesion: 0.08
Nodes (24): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router, assert, { createPokemonDetailService } (+16 more)

### Community 44 - "playground.js"
Cohesion: 0.17
Nodes (9): assert, { describe, it }, { playgroundExchangeSchema }, playgroundExchangeSchema, express, movePlaygroundService, { requireAuth }, router (+1 more)

### Community 45 - "interiors.py"
Cohesion: 0.20
Nodes (18): build(), tile_id(), center(), extras(), home(), extras(), house(), extras() (+10 more)

### Community 46 - "High-Level Design (HLD) — Pokemon Origins"
Cohesion: 0.17
Nodes (12): 1. System Overview, 2. Architectural Goals, 4.1 Browser ↔ backend, 4.2 Backend ↔ battle-engine (BFF), 4.3 Backend ↔ MySQL, 4. Component Interfaces, 5. Key user flows, 6. System qualities (as built) (+4 more)

### Community 47 - "wild.test.js"
Cohesion: 0.12
Nodes (15): assert, BANNED, bases, ceiling, { describe, it }, eligible, evolutions, finals (+7 more)

### Community 48 - "pipeline.js"
Cohesion: 0.23
Nodes (20): collisionAt(), createWorld(), checkConnections(), checkEncounters(), checkObjects(), checkReachable(), checkTiles(), checkTrainers() (+12 more)

### Community 49 - "pvpLadderService.js"
Cohesion: 0.10
Nodes (25): dayKey(), expected(), rate(), assert, { describe, it }, { rate, expected, dayKey, RATED_PER_PAIR_PER_DAY }, BOARDS, createMemoryLadderStore() (+17 more)

### Community 50 - "trainerVoice.test.js"
Cohesion: 0.10
Nodes (15): addVoice(), fill(), introLine(), overworldLines(), { addVoice, introLine, overworldLines }, assert, champion, { describe, it } (+7 more)

### Community 51 - "Overworld Architecture — Phase 0 Audit and Design"
Cohesion: 0.08
Nodes (23): hasWonBattle(), 0. Baseline (measured this session), 10. Questions (decisions I will not guess), 11. What I need from you to start Phase 1, 12. Decisions recorded (Phase 0 approved 2026-11-03), 13. Phase 8c (new): Gemini-generated ambient NPC dialogue, 1. Items in the repo that contradict the brief (need your ruling), 2.1 Content (static JSON, `backend/data/`) (+15 more)

### Community 52 - "PartyBoard.jsx"
Cohesion: 0.11
Nodes (33): PokemonSprite(), formatStatLabel(), STAT_LABELS, typeColor(), able(), HpPanel(), PartyBalls(), useSteppedNumber() (+25 more)

### Community 53 - "trainers.js"
Cohesion: 0.12
Nodes (15): battleHistoryQuerySchema, trainerCardSchema, trainerIdParamsSchema, validateParams(), express, profileService, { requireAuth }, resetService (+7 more)

### Community 54 - "gymPuzzles.test.js"
Cohesion: 0.18
Nodes (12): assert, { createFlagService, createMemoryFlagStore }, { describe, it, before }, gyms, loader, createFlagService(), createMemoryFlagStore(), createMysqlFlagStore() (+4 more)

### Community 55 - "tiles_v2.py"
Cohesion: 0.05
Nodes (38): mown_block(), text(), band_window(), barrel(), base_shadow(), bench(), boxed(), center_v3() (+30 more)

### Community 56 - "createOverworld"
Cohesion: 0.10
Nodes (46): DIRS, ALERT_TICKS, createOverworld(), advanceRoom(), beginWarp(), bumpRoom(), enterRoom(), enterTriggers() (+38 more)

### Community 57 - "defaultGetWildBattle"
Cohesion: 0.22
Nodes (10): getWildTable(), defaultGetWildBattle(), rollWild(), Global Constraints, Review Focus, Task 1: Weighted wild tables and the roll, Task 2: Rules check for the tables, Task 3: Trade evolutions at Lv 37 (+2 more)

### Community 58 - "town_art.py"
Cohesion: 0.05
Nodes (34): disc(), floor(), speck(), ledge(), _cloudiness(), _courses(), drop(), ground() (+26 more)

### Community 59 - "Button"
Cohesion: 0.21
Nodes (16): PartyMenu(), ResultPanel(), BattleView(), readSpeed(), Card(), JourneyScreen(), Key(), MobilePad() (+8 more)

### Community 60 - "gymPuzzles.js"
Cohesion: 0.22
Nodes (11): buildPuzzle(), { CampaignError }, engine, FILE, fs, getGymPuzzle(), listGymPuzzles(), load() (+3 more)

### Community 61 - "playground/movement.test.js"
Cohesion: 0.11
Nodes (15): { canStand }, spawnPoint(), standOnPlayground(), assert, { canStand }, { describe, it }, { validateStep, freshBudget, STEP_BURST, ROOM_WIDTH, ROOM_HEIGHT, spawnPoint, SPAWN_RADIUS_PX, CHAT_RADIUS_PX, TILE_PX }, validateStep() (+7 more)

### Community 62 - "battleBeats.js"
Cohesion: 0.11
Nodes (29): BATTLE_SEATS, TYPE_COLORS, FX_FAMILY, fxFamily(), getImpactTier(), getMoveAnimCategory(), hitResultLines(), RANGED_FEEL_TYPES (+21 more)

### Community 63 - "rbox"
Cohesion: 0.17
Nodes (13): book(), bookcase(), framed_picture(), glass_table(), mat(), paint_center(), paint_home(), paint_lab() (+5 more)

### Community 64 - "index.test.js"
Cohesion: 0.14
Nodes (5): assert, attachPlayground, { CHAT_RADIUS_PX, TILE_PX }, { describe, it }, fakePool

### Community 65 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+8 more)

### Community 66 - "world_maps.py"
Cohesion: 0.07
Nodes (31): Original / CC0 (new work), gate(), afloat(), gate(), hollow_lab_door(), playground(), plaza_pieces(), route() (+23 more)

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.22
Nodes (8): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), Known balance soft spots (honest), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "Tile"
Cohesion: 0.05
Nodes (47): bakery(), belt(), face(), floor(), cap(), make(), dojo(), bonsai() (+39 more)

### Community 69 - "sheets.py"
Cohesion: 0.08
Nodes (24): Stage 2a: deterministic builds, main(), ui_art(), blink(), despeckle(), hex_rgba(), key_colour(), _mat() (+16 more)

### Community 70 - "middleware/validate.js"
Cohesion: 0.07
Nodes (34): authService, express, router, { validateBody, loginSchema }, battleActionSchema, battleStartSchema, calculateDamageSchema, gymSolveSchema (+26 more)

### Community 71 - "starterService.test.js"
Cohesion: 0.12
Nodes (17): createMemoryPartyStore(), createStarterService(), chooseStarter(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats(), STARTER_POKEMON_IDS (+9 more)

### Community 72 - "music.js"
Cohesion: 0.22
Nodes (16): LAIRS, note(), parseVoice(), PITCH, playTrack(), pump(), stopMusic(), trackFor() (+8 more)

### Community 73 - "movePlaygroundService.js"
Cohesion: 0.21
Nodes (11): { CampaignError }, {
	createBattleSessionService,
	createMemoryPpStore,
	createMemoryHpStore,
	createMemoryHistoryStore,
}, {
	createProgressService,
	createMemoryStore,
}, {
	createWalletService,
	createMemoryWalletStore,
}, { createXpService, createMemoryXpStore }, defaultListMovesRaw(), defaultListSpeciesRaw(), defaultLookupMove() (+3 more)

### Community 74 - "walkthrough.test.js"
Cohesion: 0.17
Nodes (21): LEDGE_DIR, createMemoryFlags(), boot(), DATA, GAUNTLET, json(), start(), interact() (+13 more)

### Community 75 - "_outline"
Cohesion: 0.15
Nodes (16): Outlines and shadows, base_shadow(), _outline(), awning(), forge_pit(), great_dome(), gym_building(), home() (+8 more)

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.29
Nodes (7): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Reduced motion, Timing, Title showcase, idle()

### Community 78 - "battleSessionService.test.js"
Cohesion: 0.08
Nodes (28): createMemoryHistoryStore(), createMemoryHpStore(), createMemoryPpStore(), assert, { CampaignError }, { createBattleAi }, {
	createBattleSessionService,
	createMemoryHistoryStore,
	snapshotPokemon,
	rollWild,
}, { createFlagService, createMemoryFlagStore } (+20 more)

### Community 79 - "TitleScreen.jsx"
Cohesion: 0.08
Nodes (29): api, createFlags(), isEnabled(), defaults, isEnabled, truthy(), UserContext, useUser() (+21 more)

### Community 80 - "pokemonSprites.js"
Cohesion: 0.24
Nodes (14): BattlePokemonSprite(), getBattleSprite(), DEX_MAX, DEX_MIN, getPokemonSprite(), getPokemonSpriteFallback(), isLocalSpriteUrl(), isValidDex() (+6 more)

### Community 81 - "puzzles.js"
Cohesion: 0.29
Nodes (18): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+10 more)

### Community 82 - "test_art.py"
Cohesion: 0.06
Nodes (8): render(), rows_below(), seats(), frames(), hexs(), LegendaryTests, SheetTests, WorldTests

### Community 83 - "Frontend — Pokemon Origins"
Cohesion: 0.40
Nodes (5): Frontend — Pokemon Origins, Layout (`src/`), Local, Routes, UI rules

### Community 84 - "constants.js"
Cohesion: 0.08
Nodes (38): BUMP_TICKS, COL, HOP_ARC, HOP_TICKS, RUN_TICKS, TICK_HZ, TURN_TICKS, WALK_TICKS (+30 more)

### Community 85 - "Route1"
Cohesion: 0.21
Nodes (3): Ground, layer(), Route1

### Community 87 - "slice_art.py"
Cohesion: 0.06
Nodes (21): fence(), _field(), ground_layer(), house(), leaf_mass(), player_frames(), rgb(), _sprite() (+13 more)

### Community 88 - "react"
Cohesion: 0.12
Nodes (21): initialTheme(), useTheme(), AppShell(), Crest(), StartMenu(), BADGES, GymBadge(), silhouette() (+13 more)

### Community 90 - "auth.js"
Cohesion: 0.08
Nodes (22): jwt, { JWT_SECRET }, requireAuth(), rewardClaimSchema, express, { getDefaultLadder }, { requireAuth }, router (+14 more)

### Community 91 - "profileService.js"
Cohesion: 0.20
Nodes (15): CARD_THEMES, getBattleHistory(), getPublicProfile(), levelName(), loader, profileError(), summarizeCampaign(), summarizeRecord() (+7 more)

### Community 92 - "Gym leaders"
Cohesion: 0.10
Nodes (19): 1. Willow Thornby: Grass, Mossgate Grove, 2. Mara Quill: Normal, Hearthfield, 3. Tavish Rook: Fighting, Ironbrook, 4. Coral Marlowe: Water, Saltmere Harbor, 5. Volt Dray: Electric, Dynamo Station, 6. Skye Corvin: Flying, Gale Spire, 7. Sage Ilmara: Psychic, Starfall Observatory, 8. Cinder Valko: Fire, Emberhold (+11 more)

### Community 93 - "BattleMenus.jsx"
Cohesion: 0.17
Nodes (21): 6. Proposed module layout, accLabel(), BagMenu(), CommandMenu(), effectLabel(), effectTone(), LearnMenu(), lowPp() (+13 more)

### Community 94 - "extras.test.js"
Cohesion: 0.14
Nodes (11): assert, { describe, it }, extras, fs, { hydrateParty }, loader, path, ROOT (+3 more)

### Community 101 - "index.js"
Cohesion: 0.13
Nodes (14): { createBattleSessionService }, { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS }, { createMatchRegistry }, { createRoomState }, { createSocketAuthMiddleware }, { createStepService, createMysqlStepStore }, EMOTES, FACINGS (+6 more)

### Community 102 - "Real-time PvP, Elo ladder, movement anti-cheat — design"
Cohesion: 0.29
Nodes (6): Anti-goals, Approaches considered, Intent, Left to the builder, Non-goals, Real-time PvP, Elo ladder, movement anti-cheat — design

### Community 103 - "Room"
Cohesion: 0.17
Nodes (4): floor_key(), pad(), inside(), Room

### Community 104 - "script.js"
Cohesion: 0.26
Nodes (8): PAGE, paginate(), DIRS, need(), parseScript(), ScriptError, validateScript(), VALIDATORS

### Community 105 - "renderer.js"
Cohesion: 0.08
Nodes (46): Layout tokens, Engine contract (verified in code), coverAt(), actorPixel(), coverage(), BAYER, CLOUD_ROWS, clouds() (+38 more)

### Community 106 - "characters.py"
Cohesion: 0.11
Nodes (11): _hero(), _hero_views(), _nudge(), _views(), _as_list(), make(), head(), grid() (+3 more)

### Community 107 - "campaignService.js"
Cohesion: 0.13
Nodes (12): resetCache(), getLevel1(), { CampaignError }, getLegacyLevel1(), { hydrateParty }, loader, assert, campaignService (+4 more)

### Community 108 - "meadow"
Cohesion: 0.11
Nodes (13): pond_tile(), _flecks(), marks(), _lawn(), marks(), luma(), meadow(), mean_saturation() (+5 more)

### Community 109 - "progressService.js"
Cohesion: 0.15
Nodes (20): countBattles(), { CampaignError }, createMemoryStore(), createMysqlStore(), createProgressService(), assertLevelUnlocked(), completeBattle(), getOrCreate() (+12 more)

### Community 110 - "worldService.test.js"
Cohesion: 0.33
Nodes (8): createMemoryWorldStore(), createMysqlWorldStore(), createWorldService(), storyFlag(), assert, { createWorldService, createMemoryWorldStore, storyFlag }, make(), test

### Community 111 - "crop_trainer_sprites.py"
Cohesion: 0.33
Nodes (4): build_throw_strip(), colorkey_to_alpha(), head_center_x(), main()

### Community 112 - "api.js"
Cohesion: 0.08
Nodes (20): API_URL, DRAIN_MS, appearsAtOnce(), IDLE_FX, foe(), mon(), state(), STRUGGLE_MOVE (+12 more)

### Community 113 - "createRoomState"
Cohesion: 0.19
Nodes (8): colorFor(), createRoomState(), addPlayer(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 114 - "resetService.test.js"
Cohesion: 0.19
Nodes (10): createResetService(), getPool(), resetTrainer(), DEFAULT_PROGRESS, defaultService, { STARTING_COINS }, assert, { createResetService, DEFAULT_PROGRESS } (+2 more)

### Community 116 - "createBattleSessionService"
Cohesion: 0.13
Nodes (37): CampaignError, clonePokemon(), createBattleSessionService(), applyWinAward(), checkPvpAction(), confusionSelfHit(), createPvpSession(), endOfRoundChip() (+29 more)

### Community 117 - "build_sheet"
Cohesion: 0.28
Nodes (3): contact_sheet(), walk_gif(), build_sheet()

### Community 118 - "Aurelia art bible"
Cohesion: 0.22
Nodes (8): Aurelia art bible, Buildings, Characters, Frame, Ground, Light and value, Light at runtime, Reference rule

### Community 119 - "balance-sim.js"
Cohesion: 0.11
Nodes (21): {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
}, enemyLevels(), loader, { loadRewardPool }, main(), OFFER_BATTLE_TYPES, pad(), {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} (+13 more)

### Community 124 - "test_route.py"
Cohesion: 0.06
Nodes (8): Task 4: Shore encounter zones on Routes 2, 4 and 7, Lab, OwnRooms, reachable(), Bridge, DawnbrookStarterGate, ShoreZones, WornTrail

### Community 125 - "_slim_head"
Cohesion: 0.13
Nodes (7): _build(), _drop(), _lead(), _motion(), _slim_head(), _stretch(), _widen()

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 127 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:components, test:sprites

### Community 128 - "createMatchRegistry"
Cohesion: 0.22
Nodes (13): { CHAT_RADIUS_PX }, createMatchRegistry(), act(), armRoundTimer(), challenge(), end(), expire(), forfeit() (+5 more)

### Community 129 - "Still to draw"
Cohesion: 0.20
Nodes (6): Art / audio needed from a human, Mossgate placeholders, Still to draw, rope_rail(), bridge_rails(), ledge_col()

### Community 130 - "attachPlayground"
Cohesion: 0.18
Nodes (10): createChatRing(), push(), isRateLimited(), sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, attachPlayground() (+2 more)

### Community 131 - "assets.js"
Cohesion: 0.31
Nodes (10): createAssets(), want(), loadAssets(), loadImage(), loadLegendaries(), shinyCanvas(), swapPalette(), SPRITES (+2 more)

### Community 132 - "forest_tile"
Cohesion: 0.16
Nodes (5): forest_tile(), standing_tree(), edge_colour(), colours(), sel_out()

### Community 133 - "evolutions.js"
Cohesion: 0.29
Nodes (6): evolutionConfirmSchema, evolutionService, express, { requireAuth }, router, {
	validateBody,
	evolutionConfirmSchema,
}

### Community 134 - "gen_overworld_placeholders.py"
Cohesion: 0.12
Nodes (15): build_tiles(), check(), house(), main(), MapBuilder, merge(), paint(), pal() (+7 more)

### Community 136 - "Battle sessions (Phase 3 + Phase 4 party, JWT)"
Cohesion: 0.21
Nodes (11): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Boss reward cards (Phase 6, extended Phase 10), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules (+3 more)

### Community 137 - "catchFormula.test.js"
Cohesion: 0.24
Nodes (8): CATCH_RATES, catchRateOf(), catchValue(), rollCatch(), STATUS_BONUS, assert, { catchValue, rollCatch, catchRateOf, DEFAULT_CATCH_RATE }, { describe, it }

### Community 139 - "fs"
Cohesion: 0.14
Nodes (10): { createPokeApiClient }, fs, OUT, path, axios, createPokeApiClient(), assert, { createPokeApiClient } (+2 more)

### Community 140 - "Overworld art overhaul: plan for review"
Cohesion: 0.10
Nodes (19): Art audit: root causes, Decisions (user, 2026-11-04), Intent, Non-goals, Overworld art overhaul: plan for review, Parked, Phase 0: Art bible and one-screen slice (the gate), Phase 1: Nature tileset (+11 more)

### Community 141 - "campaign.js"
Cohesion: 0.22
Nodes (8): completeBattleSchema, battleSessionService, campaignService, express, progressService, { requireAuth }, router, {
	validateBody,
	completeBattleSchema,
}

### Community 142 - "File format"
Cohesion: 0.17
Nodes (11): Collision layer, Conventions, File format, Map properties, Maps: authoring guide, Not checked, Object layers, Pipeline (+3 more)

### Community 143 - "Stage 1: plan"
Cohesion: 0.13
Nodes (14): Baseline, Commands you will run (after each stage), Decisions I need you to OK, Files to change, Master palette plan, Overworld art refinement: audit (stage 0) and plan (stage 1), Stage 0: audit, Stage 1: plan (+6 more)

### Community 144 - "express"
Cohesion: 0.11
Nodes (16): mysql, pool, promisePool, rawQuery, TRANSIENT_ERROR_CODES, registerSchema, db, express (+8 more)

### Community 145 - "content.test.js"
Cohesion: 0.17
Nodes (9): assert, campaignService, {
	createProgressService,
	createMemoryStore,
}, { describe, it, before }, fs, GYM_LEVELS, loader, { loadRewardPool } (+1 more)

### Community 146 - "slice-pokemon-sprites.py"
Cohesion: 0.31
Nodes (7): chroma_to_alpha(), crop_frac(), fail(), inspect(), main(), slice_sheet(), trim_transparent()

### Community 147 - "bootstrap-dev-sprites.js"
Cohesion: 0.20
Nodes (8): DEST, FALLBACK, fs, missing, path, placeholder, ROOT, SRC

### Community 149 - "start-battle-engine.js"
Cohesion: 0.18
Nodes (8): args, child, { cmd, argsPrefix, useShell }, engineDir, fs, path, root, { spawn }

### Community 150 - "ref_path"
Cohesion: 0.22
Nodes (6): inventoryService, main(), parseArgs(), path, vite, @vitejs/plugin-react

### Community 154 - "blob_masks"
Cohesion: 0.18
Nodes (6): Overworld art pipeline, _wave(), blob_mask(), blob_masks(), zones(), halo()

### Community 155 - "MoveLabScreen.jsx"
Cohesion: 0.29
Nodes (8): defaultMon(), MonSetupPanel(), MoveLabScreen(), STAGE_KEYS, STATUS_OPTIONS, TRI_STATE_OPTIONS, triStateToValue(), valueToTriState()

### Community 156 - "battleService.js"
Cohesion: 0.22
Nodes (8): axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, proxyError(), turnOrder(), defaultEngine()

### Community 157 - "paint_mart"
Cohesion: 0.19
Nodes (7): bottle(), box_item(), glass_counter(), glass_pane(), paint_mart(), potion(), shelf_unit()

### Community 158 - "build_all.py"
Cohesion: 0.24
Nodes (4): main(), pixel_rows(), grove(), tileset_image()

### Community 159 - "battleSessionService.pvp.test.js"
Cohesion: 0.25
Nodes (10): assert, { createBattleAi }, { createBattleSessionService }, { describe, it }, mon(), move, setup(), spyStore() (+2 more)

### Community 161 - "setup-battle-engine.js"
Cohesion: 0.18
Nodes (7): engineDir, fs, launcher, path, reqFile, { spawnSync }, venvDir

### Community 162 - "stepService.test.js"
Cohesion: 0.31
Nodes (7): createMemoryStepStore(), createStepService(), add(), flush(), assert, { createStepService, createMemoryStepStore }, { describe, it }

### Community 163 - "legendary/manifest.json"
Cohesion: 0.50
Nodes (3): frame, frames, legendaries

### Community 164 - "overworld/manifest.json"
Cohesion: 0.50
Nodes (3): columns, rows, sheets

### Community 165 - "gym"
Cohesion: 0.31
Nodes (6): door(), gym(), house(), roof(), wall(), window()

### Community 167 - "render_map.py"
Cohesion: 0.22
Nodes (5): main(), render(), draw(), tile_img(), RouteDressing

### Community 168 - "inventory.js"
Cohesion: 0.29
Nodes (6): inventoryUseSchema, express, inventoryService, { requireAuth }, router, { validateBody, inventoryUseSchema }

### Community 169 - "Catching wild Pokémon"
Cohesion: 0.25
Nodes (7): Approaches, Catching wild Pokémon, Details (my calls), Intent, Left to the builder, Non-goals, Rules (user's)

### Community 170 - "tile_ids"
Cohesion: 0.10
Nodes (5): side_ledge(), BuiltMaps, Milestone2, SkyAndPlains, tile_ids()

### Community 171 - "party.js"
Cohesion: 0.22
Nodes (6): partyArrangeSchema, express, partyService, { requireAuth }, router, { validateBody, partyArrangeSchema }

### Community 172 - "games.js"
Cohesion: 0.29
Nodes (6): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, chooseStarterSchema

### Community 173 - "mart.js"
Cohesion: 0.29
Nodes (6): martPurchaseSchema, express, martService, { requireAuth }, router, { validateBody, martPurchaseSchema }

### Community 174 - "moves.js"
Cohesion: 0.29
Nodes (6): moveLearnResolveSchema, express, moveLearnService, { requireAuth }, router, {
	validateBody,
	moveLearnResolveSchema,
}

### Community 175 - "Catching Implementation Plan"
Cohesion: 0.33
Nodes (5): Catching Implementation Plan, Global Constraints, Review Focus, Task 1: Catch formula and catch-rate data, Task 4: Client: ball pocket, catch beat, caught result

### Community 176 - "ref_node_assert"
Cohesion: 0.10
Nodes (11): assert, { createSocketAuthMiddleware }, { describe, it }, hit(), BATTLE_SPRITE_BASE, ctx, view, createMessageQueue() (+3 more)

### Community 177 - "Environment variables"
Cohesion: 0.50
Nodes (4): Backend (`backend/.env`), Battle engine (`battle-engine/.env`), Environment variables, Frontend (`frontend/.env`)

### Community 179 - "Restore methods"
Cohesion: 0.67
Nodes (3): Docker Compose (recommended), Manual, Restore methods

### Community 180 - "main.py"
Cohesion: 0.11
Nodes (12): XP and leveling (Phase 5), determine_turn_order(), add_experience_endpoint(), calculate_damage(), health_check(), read_root(), turn_order(), add_experience() (+4 more)

### Community 190 - "config/flags.js"
Cohesion: 0.28
Nodes (7): createFlags(), defaults, NAMES, assert, { createFlags }, test, truthy()

## Knowledge Gaps
- **945 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+940 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1573 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Outlines and shadows` connect `_outline` to `renderer.js`, `nature.py`, `Aurelia art bible`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Why does `clouds()` connect `renderer.js` to `_outline`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **Why does `finish()` connect `finish` to `Still to draw`, `world_maps.py`, `gen_overworld_placeholders.py`, `Catching Implementation Plan`, `blob_masks`, `new_tiles`, `build_all.py`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _945 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `movePlaygroundService.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Should `battleStatus.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09672830725462304 - nodes in this community are weakly interconnected._
- **Should `mapModel.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08534850640113797 - nodes in this community are weakly interconnected._