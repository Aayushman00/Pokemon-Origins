# Graph Report - Pokemon-Origins  (2026-11-20)

## Corpus Check
- 497 files · ~706,168 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 16, (none) 12, .example 4)

## Summary
- 3799 nodes · 8450 edges · 175 communities (151 shown, 24 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 563 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e914431e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- movePlaygroundService.test.js
- battleStatus.js
- walkthrough.test.js
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
- Button
- PlaygroundStage.jsx
- auth.js
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
- fetch_frlg_sprites.py
- buildings.py
- validate-sprites.js
- resolveMove
- Pokemon Origins
- TrainerHoverCard.jsx
- pokemonDetailService.test.js
- playground.js
- interiors.py
- High-Level Design (HLD) — Pokemon Origins
- wild.test.js
- pipeline.js
- requireAuth
- trainerVoice.test.js
- Overworld Architecture — Phase 0 Audit and Design
- BagScreen.jsx
- trainers.js
- gymPuzzles.test.js
- tiles_v2.py
- createOverworld
- Review Focus
- town_art.py
- react
- gymPuzzles.js
- playground/movement.test.js
- battleBeats.js
- rbox
- index.test.js
- devDependencies
- towns.py
- QA — Campaign Loop Checklist (Phase 11)
- Tile
- sheets.py
- middleware/validate.js
- starterService.test.js
- OverworldScreen.jsx
- movePlaygroundService.js
- pil
- evolutionRequirement.test.js
- README.md
- Animation Guide — Pokemon Origins
- battleSessionService.test.js
- HubScreen.jsx
- schemas.js
- puzzles.js
- test_art.py
- Frontend — Pokemon Origins
- constants.js
- test_route.py
- shell
- slice_art.py
- TitleScreen.jsx
- Gen 1 sprite sheet (source)
- express
- profileService.js
- Gym leaders
- Panel
- ref_node_assert
- tileArt.generated.js
- index.js
- Real-time PvP, Elo ladder, movement anti-cheat — design
- Room
- script.js
- renderer.js
- characters.py
- createTypeEffectivenessService
- meadow
- content.test.js
- worldService.test.js
- crop_trainer_sprites.py
- api.js
- createRoomState
- resetService.test.js
- createBattleSessionService
- build_sheet
- outline_for
- balance-sim.js
- test_rooms.py
- PokemonDetailRoutes.js
- dependencies
- scripts
- createMatchRegistry
- bridge_rails
- AppShell.jsx
- assets.js
- PlaygroundMap
- evolutions.js
- gen_overworld_placeholders.py
- Battle sessions (Phase 3 + Phase 4 party, JWT)
- 4. Component Interfaces
- Proportions
- pokeApiClient.test.js
- Overworld art overhaul: plan for review
- campaign.js
- File format
- Stage 1: plan
- db.js
- useBattle.js
- Migrations
- fs
- world_maps.py
- start-battle-engine.js
- seed-inventory.js
- vercel.json
- paint
- MoveLabScreen.jsx
- palette.py
- paint_mart
- party.test.js
- battleSessionService.pvp.test.js
- paint_cottage
- setup-battle-engine.js
- stepService.test.js
- legendary/manifest.json
- overworld/manifest.json
- gym
- tile_ids
- render_map.py
- inventory.js
- ref_path
- BuiltMaps
- party.js
- socketAuth.test.js
- pathlib
- config/flags.js

## God Nodes (most connected - your core abstractions)
1. `new_tiles()` - 87 edges
2. `Tile` - 85 edges
3. `react` - 71 edges
4. `createBattleSessionService()` - 60 edges
5. `_battle()` - 47 edges
6. `_resolve()` - 47 edges
7. `Button()` - 46 edges
8. `createOverworld()` - 42 edges
9. `CampaignError` - 41 edges
10. `Panel()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `Known balance soft spots (honest)` --references--> `statAtLevel()`  [INFERRED]
  Pokemon-Origins/docs/QA_CAMPAIGN_CHECKLIST.md → Pokemon-Origins/backend/src/campaign/hydrate.js
- `2.1 Content (static JSON, `backend/data/`)` --references--> `statAtLevel()`  [INFERRED]
  Pokemon-Origins/docs/superpowers/plans/overworld-architecture.md → Pokemon-Origins/backend/src/campaign/hydrate.js
- `3.2 Backend API (BFF)` --references--> `requireAuth()`  [INFERRED]
  Pokemon-Origins/HLD.md → Pokemon-Origins/backend/src/middleware/auth.js
- `What the builder changes` --references--> `defaultGetWildBattle()`  [INFERRED]
  Pokemon-Origins/docs/superpowers/specs/2026-11-12-wild-encounters-design.md → Pokemon-Origins/backend/src/services/battleSessionService.js
- `5.1 The battle-session decoupling (needed from Phase 4 on)` --references--> `startBattle()`  [INFERRED]
  Pokemon-Origins/docs/superpowers/plans/overworld-architecture.md → Pokemon-Origins/backend/src/services/battleSessionService.js

## Import Cycles
- None detected.

## Communities (175 total, 24 thin omitted)

### Community 0 - "movePlaygroundService.test.js"
Cohesion: 0.19
Nodes (12): assert, { CampaignError }, CHARMANDER, { createMovePlaygroundService }, { describe, it }, EMBER, fakeLookupMove(), fakeLookupSpecies() (+4 more)

### Community 1 - "battleStatus.js"
Cohesion: 0.10
Nodes (34): applyAttract(), applyConfusion(), applyDisable(), applyStatChanges(), applyStatus(), cureStatus(), executeBeat(), runBeat() (+26 more)

### Community 2 - "walkthrough.test.js"
Cohesion: 0.08
Nodes (38): createMemoryFlags(), boot(), DATA, GAUNTLET, json(), start(), interact(), meet() (+30 more)

### Community 3 - "loader.js"
Cohesion: 0.07
Nodes (46): CampaignError, { CampaignError }, countBattles(), DATA_DIR, ENCOUNTER_FILE, findTrainerBattle(), fs, getEncounter() (+38 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.11
Nodes (17): axios, name, private, type, version, autoprefixer, eslint, eslint-plugin-react (+9 more)

### Community 5 - "server.js"
Cohesion: 0.05
Nodes (38): apiLimiter, app, attachPlayground, authLimiter, battleRoutes, bodyParser, campaignRoutes, cors (+30 more)

### Community 6 - "combat.py"
Cohesion: 0.12
Nodes (26): _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _crit_stage(), _has_major_status(), _hit_check() (+18 more)

### Community 7 - "rewardService.js"
Cohesion: 0.09
Nodes (29): makeRewards(), createMemoryRewardStore(), createMysqlRewardStore(), createRewardService(), claimOffer(), createOfferForWin(), getPendingOffer(), getPublicParty() (+21 more)

### Community 8 - "evolutionService.test.js"
Cohesion: 0.10
Nodes (26): createEvolutionService(), applyEvolutionToRow(), confirmLevelEvolution(), evolveWithStone(), findLevelEvolution(), findStoneEvolution(), getPendingEvolutions(), getStore() (+18 more)

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
Cohesion: 0.10
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

### Community 17 - "Button"
Cohesion: 0.17
Nodes (25): api, getErrorMessage(), PokemonSprite(), formatStatLabel(), STAT_LABELS, Card(), JourneyScreen(), RewardScreen() (+17 more)

### Community 18 - "PlaygroundStage.jsx"
Cohesion: 0.10
Nodes (32): TICK_MS, TILE, VIEW_H, VIEW_W, harness(), attachInput(), BUTTONS, createInputState() (+24 more)

### Community 19 - "auth.js"
Cohesion: 0.06
Nodes (29): jwt, { JWT_SECRET }, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN }, login(), pool, register() (+21 more)

### Community 20 - "puzzles.generated.js"
Cohesion: 0.29
Nodes (19): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+11 more)

### Community 21 - "nature.py"
Cohesion: 0.06
Nodes (29): Outlines and shadows, trunk_gym(), base_shadow(), _bloom(), _blurred(), bush_body(), _canopy(), _cells() (+21 more)

### Community 22 - "legendaries.py"
Cohesion: 0.07
Nodes (29): Overworld art changelog, Stage 2a: deterministic builds, Stage 2b: v2 tiles (approved from the slice), Stage 3a: v1 polish, side views and legs (whole cast), Stage 3b/3c: environment pass (tileset + Origin Town), Stage 3b: distinct building designs (v3), Stage 3d: home staircase redraw, Stage 3d: interiors (Care Centre, Mart, home) and door warps (+21 more)

### Community 23 - "hydrate.js"
Cohesion: 0.14
Nodes (22): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, displayName(), getPokedexDb() (+14 more)

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
Cohesion: 0.17
Nodes (20): createMemoryPartyStore(), createMysqlPartyStore(), createPartyService(), addPokemon(), arrange(), depositByPosition(), getPartyRows(), getPcRows() (+12 more)

### Community 28 - "new_tiles"
Cohesion: 0.06
Nodes (39): main(), pixel_rows(), _brick_at(), bush(), flower_bed(), flowers_decal(), grass(), gym_sign() (+31 more)

### Community 29 - "test_nature.py"
Cohesion: 0.07
Nodes (15): bush(), fence_tile(), forest_tile(), standing_tree(), tall_grass(), put(), _tuft(), tufts() (+7 more)

### Community 30 - "test_cast.py"
Cohesion: 0.12
Nodes (5): Builds, Leaders, Milestone3, stand(), torso_width()

### Community 31 - "level1.py"
Cohesion: 0.12
Nodes (14): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, Stats, XPUpdateRequest (+6 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "battleSessionService.js"
Cohesion: 0.10
Nodes (21): { addVoice, introLine, usesPlayerName }, { CampaignError }, { createBattleAi, effectiveness }, crypto, defaultService, MIRRORED_TYPES, mirrorEvents(), OFFER_BATTLE_TYPES (+13 more)

### Community 34 - "finish"
Cohesion: 0.16
Nodes (14): chamber(), front(), grove(), legend_script(), place_legend(), hall(), lab(), lobby() (+6 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.23
Nodes (14): buildEvolutionGraph(), nodeFor(), cleanFlavorText(), createMysqlEvolutionGraphStore(), createPokemonDetailService(), findPathToId(), flattenNext(), getEvolutionStore() (+6 more)

### Community 36 - "Database"
Cohesion: 0.12
Nodes (16): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Docker Compose (recommended), Evolution (Phase 9 — no migration needed), Full campaign (Phase 10 — no migration needed), Inventory seeding (Phase 7, dev utility), Manual (+8 more)

### Community 37 - "fetch_frlg_sprites.py"
Cohesion: 0.07
Nodes (19): _is_valid_existing(), main(), download_and_validate(), test_downloads_and_validates_known_sprite(), test_raises_on_404(), _fetch_all_category_members(), _get_json(), resolve_dex_map() (+11 more)

### Community 38 - "buildings.py"
Cohesion: 0.11
Nodes (11): _awning(), center(), _emblem(), _finish(), home(), lab(), mart(), _prop() (+3 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "resolveMove"
Cohesion: 0.16
Nodes (25): clonePokemon(), confusionSelfHit(), endOfRoundChip(), pickEnemyMove(), processFaint(), resolveItem(), resolveMove(), resolvePvpRound() (+17 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.12
Nodes (16): Architecture (short), Backend (`backend/.env`), Battle engine (`battle-engine/.env`), Combat unit tests, Contributing, Database, Environment variables, Feature surface (current) (+8 more)

### Community 42 - "TrainerHoverCard.jsx"
Cohesion: 0.23
Nodes (18): badgeCount(), cache, fetchProfile(), isGuestId(), TrainerRecord(), ChatLog(), Roster(), RosterRow() (+10 more)

### Community 43 - "pokemonDetailService.test.js"
Cohesion: 0.18
Nodes (10): assert, { createPokemonDetailService }, { createTypeEffectivenessService }, { describe, it }, EVOLUTION_ROWS, fakeEvolutionStore(), fakeService(), POKEMON (+2 more)

### Community 44 - "playground.js"
Cohesion: 0.17
Nodes (9): assert, { describe, it }, { playgroundExchangeSchema }, playgroundExchangeSchema, express, movePlaygroundService, { requireAuth }, router (+1 more)

### Community 45 - "interiors.py"
Cohesion: 0.20
Nodes (18): build(), tile_id(), center(), extras(), home(), extras(), house(), extras() (+10 more)

### Community 46 - "High-Level Design (HLD) — Pokemon Origins"
Cohesion: 0.17
Nodes (12): 1. System Overview, 2. Architectural Goals, 3.2 Backend API (BFF), 3.3 Battle engine, 3.4 Data storage, 3. System Components, 5. Key user flows, 6. System qualities (as built) (+4 more)

### Community 47 - "wild.test.js"
Cohesion: 0.12
Nodes (15): assert, BANNED, bases, ceiling, { describe, it }, eligible, evolutions, finals (+7 more)

### Community 48 - "pipeline.js"
Cohesion: 0.15
Nodes (25): collisionAt(), checkConnections(), checkEncounters(), checkObjects(), checkReachable(), checkTiles(), checkTrainers(), checkWarps() (+17 more)

### Community 49 - "requireAuth"
Cohesion: 0.08
Nodes (30): requireAuth(), express, { getDefaultLadder }, { requireAuth }, router, dayKey(), expected(), rate() (+22 more)

### Community 50 - "trainerVoice.test.js"
Cohesion: 0.11
Nodes (14): addVoice(), fill(), introLine(), overworldLines(), { addVoice, introLine, overworldLines }, assert, champion, { describe, it } (+6 more)

### Community 51 - "Overworld Architecture — Phase 0 Audit and Design"
Cohesion: 0.08
Nodes (23): hasWonBattle(), 0. Baseline (measured this session), 10. Questions (decisions I will not guess), 11. What I need from you to start Phase 1, 12. Decisions recorded (Phase 0 approved 2026-11-03), 13. Phase 8c (new): Gemini-generated ambient NPC dialogue, 1. Items in the repo that contradict the brief (need your ruling), 2.1 Content (static JSON, `backend/data/`) (+15 more)

### Community 52 - "BagScreen.jsx"
Cohesion: 0.13
Nodes (24): applyDrop(), MAX_PARTY, BagScreen(), effectOf(), NEEDS_TARGET, pocketOf(), POCKETS, able() (+16 more)

### Community 53 - "trainers.js"
Cohesion: 0.12
Nodes (15): battleHistoryQuerySchema, trainerCardSchema, trainerIdParamsSchema, validateParams(), express, profileService, { requireAuth }, resetService (+7 more)

### Community 54 - "gymPuzzles.test.js"
Cohesion: 0.18
Nodes (12): assert, { createFlagService, createMemoryFlagStore }, { describe, it, before }, gyms, loader, createFlagService(), createMemoryFlagStore(), createMysqlFlagStore() (+4 more)

### Community 55 - "tiles_v2.py"
Cohesion: 0.05
Nodes (40): mown_block(), band_window(), barrel(), base_shadow(), bench(), boxed(), center_v3(), chimney() (+32 more)

### Community 56 - "createOverworld"
Cohesion: 0.11
Nodes (46): ALERT_TICKS, createOverworld(), advanceRoom(), beginWarp(), bumpRoom(), enterRoom(), enterTriggers(), handleActorEvent() (+38 more)

### Community 57 - "Review Focus"
Cohesion: 0.18
Nodes (8): Global Constraints, Review Focus, Task 2: Rules check for the tables, Task 3: Trade evolutions at Lv 37, Task 4: Shore encounter zones on Routes 2, 4 and 7, Task 5: Check it in the game, Wild Encounters Implementation Plan, ShoreZones

### Community 58 - "town_art.py"
Cohesion: 0.04
Nodes (48): disc(), coil(), sand(), speck(), awning(), _cloudiness(), _courses(), drop() (+40 more)

### Community 59 - "react"
Cohesion: 0.14
Nodes (14): StartMenu(), STARTERS, StarterPick(), Cursor(), DialogueBox(), ARROWS, moveCursor(), CHAR_MS (+6 more)

### Community 60 - "gymPuzzles.js"
Cohesion: 0.22
Nodes (11): buildPuzzle(), { CampaignError }, engine, FILE, fs, getGymPuzzle(), listGymPuzzles(), load() (+3 more)

### Community 61 - "playground/movement.test.js"
Cohesion: 0.13
Nodes (14): attachPlayground(), { canStand }, clamp(), freshBudget(), resolveMove(), spawnPoint(), standOnPlayground(), assert (+6 more)

### Community 62 - "battleBeats.js"
Cohesion: 0.06
Nodes (52): hit(), BattlePokemonSprite(), BATTLE_SEATS, BATTLE_SPRITE_BASE, getBattleSprite(), DEX_MAX, DEX_MIN, getPokemonSprite() (+44 more)

### Community 63 - "rbox"
Cohesion: 0.17
Nodes (13): book(), bookcase(), framed_picture(), glass_table(), mat(), paint_center(), paint_home(), paint_lab() (+5 more)

### Community 64 - "index.test.js"
Cohesion: 0.12
Nodes (6): assert, attachPlayground, { CHAT_RADIUS_PX, TILE_PX }, { describe, it }, fakePool, { ROOM_WIDTH, ROOM_HEIGHT, CHAT_RADIUS_PX }

### Community 65 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+8 more)

### Community 66 - "towns.py"
Cohesion: 0.08
Nodes (19): Original / CC0 (new work), gate(), afloat(), gate(), hollow_lab_door(), playground(), plaza_pieces(), target_of() (+11 more)

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.22
Nodes (8): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), Known balance soft spots (honest), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "Tile"
Cohesion: 0.04
Nodes (64): bakery(), belt(), face(), floor(), cap(), make(), dojo(), bonsai() (+56 more)

### Community 69 - "sheets.py"
Cohesion: 0.07
Nodes (28): main(), ui_art(), blink(), despeckle(), hex_rgba(), key_colour(), _mat(), outline() (+20 more)

### Community 70 - "middleware/validate.js"
Cohesion: 0.05
Nodes (45): authService, express, router, { validateBody, loginSchema }, battleActionSchema, battleStartSchema, calculateDamageSchema, gymSolveSchema (+37 more)

### Community 71 - "starterService.test.js"
Cohesion: 0.13
Nodes (16): createStarterService(), chooseStarter(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats(), STARTER_POKEMON_IDS, starterStats (+8 more)

### Community 72 - "OverworldScreen.jsx"
Cohesion: 0.12
Nodes (30): LAIRS, note(), parseVoice(), PITCH, playTrack(), pump(), stopMusic(), trackFor() (+22 more)

### Community 73 - "movePlaygroundService.js"
Cohesion: 0.10
Nodes (29): createMemoryHistoryStore(), createMemoryHpStore(), createMemoryPpStore(), makeService(), { CampaignError }, {
	createBattleSessionService,
	createMemoryPpStore,
	createMemoryHpStore,
	createMemoryHistoryStore,
}, createMovePlaygroundService(), buildMon() (+21 more)

### Community 74 - "pil"
Cohesion: 0.20
Nodes (3): render(), rows_below(), seats()

### Community 75 - "evolutionRequirement.test.js"
Cohesion: 0.21
Nodes (9): formatEvolutionRequirement(), { slugToTitleCase }, assert, { describe, it }, { formatEvolutionRequirement }, slugToTitleCase(), assert, { describe, it } (+1 more)

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.29
Nodes (7): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Reduced motion, Timing, Title showcase, idle()

### Community 78 - "battleSessionService.test.js"
Cohesion: 0.11
Nodes (13): assert, { CampaignError }, { createBattleAi }, {
	createBattleSessionService,
	createMemoryHistoryStore,
	snapshotPokemon,
	rollWild,
}, { createFlagService, createMemoryFlagStore }, {
	createInventoryService,
	createMemoryInventoryStore,
}, {
	createProgressService,
	createMemoryStore,
}, {
	createRewardService,
	createMemoryRewardStore,
} (+5 more)

### Community 79 - "HubScreen.jsx"
Cohesion: 0.10
Nodes (25): createFlags(), isEnabled(), defaults, isEnabled, truthy(), UserContext, useUser(), AuthScreen() (+17 more)

### Community 80 - "schemas.js"
Cohesion: 0.15
Nodes (12): battleSchema, encounterCatalogSchema, encounterSchema, extraTrainerCatalogSchema, legendaryBattleSchema, levelSchema, partyMemberSchema, trainerBattleSchema (+4 more)

### Community 81 - "puzzles.js"
Cohesion: 0.29
Nodes (18): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+10 more)

### Community 82 - "test_art.py"
Cohesion: 0.07
Nodes (5): frames(), hexs(), LegendaryTests, SheetTests, WorldTests

### Community 83 - "Frontend — Pokemon Origins"
Cohesion: 0.40
Nodes (5): Frontend — Pokemon Origins, Layout (`src/`), Local, Routes, UI rules

### Community 84 - "constants.js"
Cohesion: 0.07
Nodes (43): BUMP_TICKS, COL, DIRS, HOP_ARC, HOP_TICKS, LEDGE_DIR, RUN_TICKS, TICK_HZ (+35 more)

### Community 85 - "test_route.py"
Cohesion: 0.10
Nodes (6): Bridge, DawnbrookStarterGate, Ground, layer(), Route1, WornTrail

### Community 87 - "slice_art.py"
Cohesion: 0.07
Nodes (25): fence(), _field(), ground_layer(), house(), luma(), mean_saturation(), opaque(), _outline() (+17 more)

### Community 88 - "TitleScreen.jsx"
Cohesion: 0.12
Nodes (20): sign, stage, DIGLETT_MAP, DIGLETT_PAL, NamePlate(), pickDiggSpot(), PixelDiglett(), TitleScreen() (+12 more)

### Community 90 - "express"
Cohesion: 0.08
Nodes (22): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, chooseStarterSchema, moveLearnResolveSchema, rewardClaimSchema (+14 more)

### Community 91 - "profileService.js"
Cohesion: 0.10
Nodes (26): CARD_THEMES, getBattleHistory(), getPublicProfile(), levelName(), loader, profileError(), summarizeCampaign(), summarizeRecord() (+18 more)

### Community 92 - "Gym leaders"
Cohesion: 0.10
Nodes (19): 1. Willow Thornby: Grass, Mossgate Grove, 2. Mara Quill: Normal, Hearthfield, 3. Tavish Rook: Fighting, Ironbrook, 4. Coral Marlowe: Water, Saltmere Harbor, 5. Volt Dray: Electric, Dynamo Station, 6. Skye Corvin: Flying, Gale Spire, 7. Sage Ilmara: Psychic, Starfall Observatory, 8. Cinder Valko: Fire, Emberhold (+11 more)

### Community 93 - "Panel"
Cohesion: 0.17
Nodes (27): 6. Proposed module layout, typeColor(), accLabel(), BagMenu(), CommandMenu(), effectLabel(), effectTone(), LearnMenu() (+19 more)

### Community 94 - "ref_node_assert"
Cohesion: 0.10
Nodes (13): assert, { describe, it }, extras, fs, { hydrateParty }, loader, path, ROOT (+5 more)

### Community 101 - "index.js"
Cohesion: 0.09
Nodes (20): createChatRing(), push(), isRateLimited(), sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, { createBattleSessionService } (+12 more)

### Community 102 - "Real-time PvP, Elo ladder, movement anti-cheat — design"
Cohesion: 0.14
Nodes (13): canStand(), getMap(), index, assert, { canStand, getMap }, { describe, it }, Anti-goals, Approaches considered (+5 more)

### Community 103 - "Room"
Cohesion: 0.17
Nodes (4): floor_key(), pad(), inside(), Room

### Community 104 - "script.js"
Cohesion: 0.27
Nodes (7): PAGE, DIRS, need(), parseScript(), ScriptError, validateScript(), VALIDATORS

### Community 105 - "renderer.js"
Cohesion: 0.07
Nodes (47): Light at runtime, Layout tokens, Engine contract (verified in code), coverAt(), actorPixel(), coverage(), BAYER, CLOUD_ROWS (+39 more)

### Community 106 - "characters.py"
Cohesion: 0.11
Nodes (11): _hero(), _hero_views(), _nudge(), _views(), _as_list(), make(), head(), grid() (+3 more)

### Community 107 - "createTypeEffectivenessService"
Cohesion: 0.24
Nodes (8): ALL_TYPES, createTypeEffectivenessService(), getCombinedMultipliers(), getMatchups(), getWeaknesses(), assert, { createTypeEffectivenessService }, { describe, it }

### Community 108 - "meadow"
Cohesion: 0.11
Nodes (16): lawn_tile(), _on_edge(), pond_tile(), shore(), _shape(), trail_tile(), turf_tile(), _variant() (+8 more)

### Community 109 - "content.test.js"
Cohesion: 0.09
Nodes (28): assert, campaignService, {
	createProgressService,
	createMemoryStore,
}, { describe, it, before }, fs, GYM_LEVELS, loader, { loadRewardPool } (+20 more)

### Community 110 - "worldService.test.js"
Cohesion: 0.33
Nodes (8): createMemoryWorldStore(), createMysqlWorldStore(), createWorldService(), storyFlag(), assert, { createWorldService, createMemoryWorldStore, storyFlag }, make(), test

### Community 111 - "crop_trainer_sprites.py"
Cohesion: 0.33
Nodes (4): build_throw_strip(), colorkey_to_alpha(), head_center_x(), main()

### Community 112 - "api.js"
Cohesion: 0.13
Nodes (14): API_URL, Composer(), BOARDS, LadderPanel(), isTyping(), PlaygroundScreen(), Window(), createPvpTransport() (+6 more)

### Community 113 - "createRoomState"
Cohesion: 0.19
Nodes (8): colorFor(), createRoomState(), addPlayer(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 114 - "resetService.test.js"
Cohesion: 0.19
Nodes (10): createResetService(), getPool(), resetTrainer(), DEFAULT_PROGRESS, defaultService, { STARTING_COINS }, assert, { createResetService, DEFAULT_PROGRESS } (+2 more)

### Community 116 - "createBattleSessionService"
Cohesion: 0.13
Nodes (22): createBattleSessionService(), applyWinAward(), fullHealPartyIfEarned(), getOwnedSession(), getSession(), grantWinXp(), payWinCoins(), performAction() (+14 more)

### Community 117 - "build_sheet"
Cohesion: 0.11
Nodes (5): contact_sheet(), walk_gif(), build_sheet(), iris_of(), Players

### Community 118 - "outline_for"
Cohesion: 0.12
Nodes (10): Aurelia art bible, Buildings, Characters, Frame, Ground, Light and value, Reference rule, edge_colour() (+2 more)

### Community 119 - "balance-sim.js"
Cohesion: 0.17
Nodes (10): {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
}, enemyLevels(), loader, { loadRewardPool }, main(), OFFER_BATTLE_TYPES, pad(), {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} (+2 more)

### Community 124 - "test_rooms.py"
Cohesion: 0.12
Nodes (3): Lab, OwnRooms, reachable()

### Community 125 - "PokemonDetailRoutes.js"
Cohesion: 0.25
Nodes (6): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 127 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:components, test:sprites

### Community 128 - "createMatchRegistry"
Cohesion: 0.22
Nodes (13): { CHAT_RADIUS_PX }, createMatchRegistry(), act(), armRoundTimer(), challenge(), end(), expire(), forfeit() (+5 more)

### Community 129 - "bridge_rails"
Cohesion: 0.17
Nodes (6): Art / audio needed from a human, Mossgate placeholders, Still to draw, rope_rail(), bridge_rails(), ledge_col()

### Community 130 - "AppShell.jsx"
Cohesion: 0.21
Nodes (11): Palette, Primitives (`frontend/src/v2/ui/`), Rules, Style Guide — Pokemon Origins, initialTheme(), useTheme(), AppShell(), Crest() (+3 more)

### Community 131 - "assets.js"
Cohesion: 0.31
Nodes (10): createAssets(), want(), loadAssets(), loadImage(), loadLegendaries(), shinyCanvas(), swapPalette(), SPRITES (+2 more)

### Community 133 - "evolutions.js"
Cohesion: 0.29
Nodes (6): evolutionConfirmSchema, evolutionService, express, { requireAuth }, router, {
	validateBody,
	evolutionConfirmSchema,
}

### Community 134 - "gen_overworld_placeholders.py"
Cohesion: 0.10
Nodes (17): build_tiles(), check(), house(), main(), MapBuilder, merge(), paint(), pal() (+9 more)

### Community 136 - "Battle sessions (Phase 3 + Phase 4 party, JWT)"
Cohesion: 0.19
Nodes (12): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Boss reward cards (Phase 6, extended Phase 10), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules (+4 more)

### Community 137 - "4. Component Interfaces"
Cohesion: 0.50
Nodes (4): 4.1 Browser ↔ backend, 4.2 Backend ↔ battle-engine (BFF), 4.3 Backend ↔ MySQL, 4. Component Interfaces

### Community 139 - "pokeApiClient.test.js"
Cohesion: 0.22
Nodes (5): axios, createPokeApiClient(), assert, { createPokeApiClient }, { describe, it }

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

### Community 144 - "db.js"
Cohesion: 0.15
Nodes (11): mysql, pool, promisePool, rawQuery, TRANSIENT_ERROR_CODES, mysql, pool, defaultLoadChart() (+3 more)

### Community 145 - "useBattle.js"
Cohesion: 0.24
Nodes (10): DRAIN_MS, appearsAtOnce(), IDLE_FX, foe(), mon(), state(), STRUGGLE_MOVE, TEXT_SPEEDS (+2 more)

### Community 146 - "Migrations"
Cohesion: 0.67
Nodes (3): Existing volume / local MySQL, Fresh Compose volume, Migrations

### Community 147 - "fs"
Cohesion: 0.18
Nodes (9): fs, DEST, FALLBACK, fs, missing, path, placeholder, ROOT (+1 more)

### Community 148 - "world_maps.py"
Cohesion: 0.07
Nodes (13): route(), before_in_stage(), extra_script(), fringe(), grass_runs(), leader_story(), ledge_row(), mossgate_gym() (+5 more)

### Community 149 - "start-battle-engine.js"
Cohesion: 0.18
Nodes (8): args, child, { cmd, argsPrefix, useShell }, engineDir, fs, path, root, { spawn }

### Community 150 - "seed-inventory.js"
Cohesion: 0.50
Nodes (4): inventoryService, main(), parseArgs(), path

### Community 154 - "paint"
Cohesion: 0.10
Nodes (8): grove(), Overworld art pipeline, blob_mask(), blob_masks(), zones(), forest_name(), halo(), paint()

### Community 155 - "MoveLabScreen.jsx"
Cohesion: 0.29
Nodes (8): defaultMon(), MonSetupPanel(), MoveLabScreen(), STAGE_KEYS, STATUS_OPTIONS, TRI_STATE_OPTIONS, triStateToValue(), valueToTriState()

### Community 157 - "paint_mart"
Cohesion: 0.19
Nodes (7): bottle(), box_item(), glass_counter(), glass_pane(), paint_mart(), potion(), shelf_unit()

### Community 158 - "party.test.js"
Cohesion: 0.22
Nodes (7): createPvpPartyLoader(), { statAtLevel }, assert, BASE, { createPvpPartyLoader }, { describe, it }, loader()

### Community 159 - "battleSessionService.pvp.test.js"
Cohesion: 0.25
Nodes (10): assert, { createBattleAi }, { createBattleSessionService }, { describe, it }, mon(), move, setup(), spyStore() (+2 more)

### Community 161 - "setup-battle-engine.js"
Cohesion: 0.18
Nodes (7): engineDir, fs, launcher, path, reqFile, { spawnSync }, venvDir

### Community 162 - "stepService.test.js"
Cohesion: 0.27
Nodes (8): createMemoryStepStore(), createMysqlStepStore(), createStepService(), add(), flush(), assert, { createStepService, createMemoryStepStore }, { describe, it }

### Community 163 - "legendary/manifest.json"
Cohesion: 0.50
Nodes (3): frame, frames, legendaries

### Community 164 - "overworld/manifest.json"
Cohesion: 0.50
Nodes (3): columns, rows, sheets

### Community 165 - "gym"
Cohesion: 0.29
Nodes (7): door(), gym(), house(), roof(), text(), wall(), window()

### Community 166 - "tile_ids"
Cohesion: 0.12
Nodes (4): Kit, Placed, SkyAndPlains, tile_ids()

### Community 167 - "render_map.py"
Cohesion: 0.38
Nodes (4): main(), render(), draw(), tile_img()

### Community 168 - "inventory.js"
Cohesion: 0.29
Nodes (6): inventoryUseSchema, express, inventoryService, { requireAuth }, router, { validateBody, inventoryUseSchema }

### Community 171 - "party.js"
Cohesion: 0.22
Nodes (6): partyArrangeSchema, express, partyService, { requireAuth }, router, { validateBody, partyArrangeSchema }

### Community 176 - "socketAuth.test.js"
Cohesion: 0.32
Nodes (5): createSocketAuthMiddleware(), sanitizeGuestName(), assert, { createSocketAuthMiddleware }, { describe, it }

### Community 180 - "pathlib"
Cohesion: 0.09
Nodes (14): determine_turn_order(), add_experience_endpoint(), calculate_damage(), health_check(), read_root(), turn_order(), add_experience(), get_move_category() (+6 more)

### Community 190 - "config/flags.js"
Cohesion: 0.28
Nodes (7): createFlags(), defaults, NAMES, assert, { createFlags }, test, truthy()

## Knowledge Gaps
- **929 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+924 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1578 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clouds()` connect `renderer.js` to `nature.py`?**
  _High betweenness centrality (0.262) - this node is a cross-community bridge._
- **Why does `Outlines and shadows` connect `nature.py` to `renderer.js`, `town_art.py`, `outline_for`, `slice_art.py`?**
  _High betweenness centrality (0.262) - this node is a cross-community bridge._
- **Why does `_outline()` connect `slice_art.py` to `buildings.py`, `nature.py`, `outline_for`, `town_art.py`, `test_nature.py`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _929 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `battleStatus.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10317460317460317 - nodes in this community are weakly interconnected._
- **Should `walkthrough.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08244897959183674 - nodes in this community are weakly interconnected._
- **Should `loader.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07111756168359942 - nodes in this community are weakly interconnected._