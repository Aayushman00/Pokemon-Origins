# Graph Report - Pokemon-Origins  (2026-11-11)

## Corpus Check
- 460 files · ~641,588 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 16, (none) 12, .example 4)

## Summary
- 3410 nodes · 7649 edges · 165 communities (135 shown, 30 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 457 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `001a3c03`
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
- battleAi.test.js
- finish
- OverworldScreen.jsx
- authService.js
- puzzles.generated.js
- pokemonSprites.js
- legendaries.py
- hydrate.js
- test_dressing.py
- express
- movePlaygroundService.js
- createPartyService
- tiles.py
- chat.test.js
- test_cast.py
- level1.py
- dependencies
- battleSessionService.js
- test_route.py
- pokemonDetailService.js
- Database
- fetch_frlg_sprites.py
- buildings.py
- validate-sprites.js
- createBattleSessionService
- Pokemon Origins
- react-router-dom
- pokemonDetailService.test.js
- AppShell.jsx
- Shadows
- High-Level Design (HLD) — Pokemon Origins
- react
- pipeline.js
- battleService.js
- trainerVoice.test.js
- Overworld Architecture — Phase 0 Audit and Design
- App.jsx
- trainers.js
- Overworld art changelog
- tiles_v2.py
- createOverworld
- MenuIcon
- town_art.py
- gymPuzzles.test.js
- new_tiles
- playground/movement.test.js
- battleBeats.js
- playground.js
- index.test.js
- devDependencies
- world_maps.py
- QA — Campaign Loop Checklist (Phase 11)
- Tile
- gymPuzzles.js
- middleware/validate.js
- starterService.test.js
- sheets.py
- auth.js
- json
- startBattle
- README.md
- Animation Guide — Pokemon Origins
- battleSessionService.test.js
- TrainerScreen.jsx
- campaign.js
- puzzles.js
- test_art.py
- Frontend — Pokemon Origins
- constants.js
- assets.js
- Terrain
- slice_art.py
- TitleScreen.jsx
- Gen 1 sprite sheet (source)
- PartyBoard.jsx
- profileService.js
- Gym leaders
- Button
- evolutionRequirement.test.js
- tileArt.generated.js
- content.test.js
- sky_tile
- _slim_head
- script.js
- renderer.js
- characters.py
- build_all.py
- Ground
- progressService.js
- ref_node_assert
- createTypeEffectivenessService
- Bridge
- createRoomState
- resetService.test.js
- index.js
- render_map.py
- Aurelia art bible
- balance-sim.js
- games.js
- moves.js
- dependencies
- scripts
- crop_trainer_sprites.py
- Art / audio needed from a human
- pil
- WornTrail
- Restore methods
- Overworld art pipeline
- gen_overworld_placeholders.py
- Environment variables
- plain_windows
- Proportions
- pokeApiClient.test.js
- Overworld art overhaul: plan for review
- build_sheet
- File format
- Stage 1: plan
- PlaygroundMap
- PokemonDetailRoutes.js
- Lab
- bootstrap-dev-sprites.js
- db.js
- start-battle-engine.js
- ref_path
- vercel.json
- inventory.js
- MoveLabScreen.jsx
- interiors.py
- setup-battle-engine.js
- legendary/manifest.json
- overworld/manifest.json
- Route1
- party.js
- socketAuth.test.js
- pathlib
- config/flags.js

## God Nodes (most connected - your core abstractions)
1. `Tile` - 81 edges
2. `new_tiles()` - 76 edges
3. `react` - 68 edges
4. `_battle()` - 47 edges
5. `_resolve()` - 46 edges
6. `Button()` - 44 edges
7. `createBattleSessionService()` - 42 edges
8. `createOverworld()` - 39 edges
9. `Panel()` - 38 edges
10. `CampaignError` - 36 edges

## Surprising Connections (you probably didn't know these)
- `Known balance soft spots (honest)` --references--> `statAtLevel()`  [INFERRED]
  docs/QA_CAMPAIGN_CHECKLIST.md → backend/src/campaign/hydrate.js
- `2.1 Content (static JSON, `backend/data/`)` --references--> `statAtLevel()`  [INFERRED]
  docs/superpowers/plans/overworld-architecture.md → backend/src/campaign/hydrate.js
- `Inventory seeding (Phase 7, dev utility)` --references--> `addItem()`  [INFERRED]
  database/README.md → backend/src/services/inventoryService.js
- `Evolution (Phase 9 — no migration needed)` --references--> `moves()`  [INFERRED]
  database/README.md → frontend/src/v2/overworld/maps/pipeline.js
- `Engine contract (verified in code)` --references--> `drawActor()`  [INFERRED]
  docs/overworld/ART_REFINEMENT_PLAN.md → frontend/src/v2/overworld/render/renderer.js

## Import Cycles
- None detected.

## Communities (165 total, 30 thin omitted)

### Community 0 - "movePlaygroundService.test.js"
Cohesion: 0.14
Nodes (15): createMovePlaygroundService(), buildMon(), runExchange(), assert, { CampaignError }, CHARMANDER, { createMovePlaygroundService }, { describe, it } (+7 more)

### Community 1 - "battleStatus.js"
Cohesion: 0.10
Nodes (33): applyAttract(), applyConfusion(), applyDisable(), applyStatChanges(), cureStatus(), executeBeat(), runBeat(), cantMoveLine() (+25 more)

### Community 2 - "walkthrough.test.js"
Cohesion: 0.08
Nodes (38): createMemoryFlags(), boot(), DATA, GAUNTLET, json(), start(), meet(), route() (+30 more)

### Community 3 - "loader.js"
Cohesion: 0.06
Nodes (48): CampaignError, { CampaignError }, DATA_DIR, ENCOUNTER_FILE, findTrainerBattle(), fs, getEncounter(), getTrainer() (+40 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.11
Nodes (17): axios, name, private, type, version, autoprefixer, eslint, eslint-plugin-react (+9 more)

### Community 5 - "server.js"
Cohesion: 0.05
Nodes (36): apiLimiter, app, attachPlayground, authLimiter, battleRoutes, bodyParser, campaignRoutes, cors (+28 more)

### Community 6 - "combat.py"
Cohesion: 0.11
Nodes (28): _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _crit_stage(), _has_major_status(), _hit_check() (+20 more)

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
Cohesion: 0.11
Nodes (23): createMartService(), getMart(), getStock(), getStore(), isAvailable(), purchase(), requiredUnlockedLevel(), createMemoryMartStore() (+15 more)

### Community 14 - "backend/package.json"
Cohesion: 0.08
Nodes (25): author, description, devDependencies, nodemon, axios, dotenv, keywords, license (+17 more)

### Community 15 - "moveLearnService.test.js"
Cohesion: 0.14
Nodes (21): createMemoryLearnsetStore(), createMemoryMoveStore(), createMoveLearnService(), getLearnsetStore(), getMoveStore(), getPendingLearns(), processLevelUp(), resolveLearn() (+13 more)

### Community 16 - "battleAi.test.js"
Cohesion: 0.24
Nodes (9): createBattleAi(), getChart(), pickMove(), effectiveness(), hasPp(), assert, CHART, { createBattleAi, effectiveness } (+1 more)

### Community 17 - "finish"
Cohesion: 0.17
Nodes (12): build(), hall(), lab(), lobby(), opening(), room(), statues(), finish() (+4 more)

### Community 18 - "OverworldScreen.jsx"
Cohesion: 0.08
Nodes (48): TICK_MS, TILE, VIEW_H, VIEW_W, harness(), attachInput(), BUTTONS, createInputState() (+40 more)

### Community 19 - "authService.js"
Cohesion: 0.11
Nodes (18): mysql, pool, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN }, login(), pool, register() (+10 more)

### Community 20 - "puzzles.generated.js"
Cohesion: 0.31
Nodes (18): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+10 more)

### Community 21 - "pokemonSprites.js"
Cohesion: 0.22
Nodes (15): BattlePokemonSprite(), BATTLE_SPRITE_BASE, getBattleSprite(), DEX_MAX, DEX_MIN, getPokemonSprite(), getPokemonSpriteFallback(), isLocalSpriteUrl() (+7 more)

### Community 22 - "legendaries.py"
Cohesion: 0.12
Nodes (15): Stage 3e v2: legendary detailing pass, articuno(), build(), flame_fill(), grid_layer(), mew(), mewtwo(), mirror_pts() (+7 more)

### Community 23 - "hydrate.js"
Cohesion: 0.17
Nodes (18): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, getPokedexDb(), hydrateFromSpecies() (+10 more)

### Community 24 - "test_dressing.py"
Cohesion: 0.19
Nodes (4): cells(), layer(), Route, Towns

### Community 25 - "express"
Cohesion: 0.09
Nodes (21): authService, express, router, { validateBody, loginSchema }, loginSchema, martPurchaseSchema, registerSchema, validateBody() (+13 more)

### Community 26 - "movePlaygroundService.js"
Cohesion: 0.12
Nodes (27): createMemoryHistoryStore(), createMemoryHpStore(), createMemoryPpStore(), makeService(), { CampaignError }, {
	createBattleSessionService,
	createMemoryPpStore,
	createMemoryHpStore,
	createMemoryHistoryStore,
}, buildSandboxService(), {
	createProgressService,
	createMemoryStore,
} (+19 more)

### Community 27 - "createPartyService"
Cohesion: 0.11
Nodes (26): FEMALE_ONLY_IDS, GENDERLESS_IDS, MALE_ONLY_IDS, rollGenderForSpecies(), assert, { describe, it }, { rollGenderForSpecies }, createMysqlPartyStore() (+18 more)

### Community 28 - "tiles.py"
Cohesion: 0.06
Nodes (35): _brick_at(), bush(), door(), flower_bed(), flowers_decal(), grass(), gym(), gym_sign() (+27 more)

### Community 29 - "chat.test.js"
Cohesion: 0.24
Nodes (8): createChatRing(), push(), isRateLimited(), sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, attachPlayground()

### Community 30 - "test_cast.py"
Cohesion: 0.11
Nodes (6): Builds, Leaders, Milestone3, Players, stand(), torso_width()

### Community 31 - "level1.py"
Cohesion: 0.12
Nodes (14): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, Stats, XPUpdateRequest (+6 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "battleSessionService.js"
Cohesion: 0.12
Nodes (18): { addVoice, introLine, usesPlayerName }, { CampaignError }, { createBattleAi, effectiveness }, applyStatus(), createMysqlHistoryStore(), createMysqlHpStore(), createMysqlPpStore(), crypto (+10 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.23
Nodes (14): buildEvolutionGraph(), nodeFor(), cleanFlavorText(), createMysqlEvolutionGraphStore(), createPokemonDetailService(), findPathToId(), flattenNext(), getEvolutionStore() (+6 more)

### Community 36 - "Database"
Cohesion: 0.12
Nodes (16): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed), Inventory seeding (Phase 7, dev utility) (+8 more)

### Community 37 - "fetch_frlg_sprites.py"
Cohesion: 0.07
Nodes (19): _is_valid_existing(), main(), download_and_validate(), test_downloads_and_validates_known_sprite(), test_raises_on_404(), _fetch_all_category_members(), _get_json(), resolve_dex_map() (+11 more)

### Community 38 - "buildings.py"
Cohesion: 0.08
Nodes (14): _awning(), center(), _emblem(), _finish(), home(), lab(), mart(), _prop() (+6 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "createBattleSessionService"
Cohesion: 0.22
Nodes (22): clonePokemon(), createBattleSessionService(), applyWinAward(), confusionSelfHit(), endOfRoundChip(), fullHealPartyIfEarned(), getOwnedSession(), getSession() (+14 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.17
Nodes (12): Architecture (short), Combat unit tests, Contributing, Database, Feature surface (current), Folder structure, License, Pokemon Origins (+4 more)

### Community 42 - "react-router-dom"
Cohesion: 0.17
Nodes (15): API_URL, isGuestId(), ChatLog(), Composer(), Roster(), RosterRow(), time(), isTyping() (+7 more)

### Community 43 - "pokemonDetailService.test.js"
Cohesion: 0.18
Nodes (10): assert, { createPokemonDetailService }, { createTypeEffectivenessService }, { describe, it }, EVOLUTION_ROWS, fakeEvolutionStore(), fakeService(), POKEMON (+2 more)

### Community 44 - "AppShell.jsx"
Cohesion: 0.16
Nodes (15): Palette, Primitives (`frontend/src/v2/ui/`), Rules, Style Guide — Pokemon Origins, Typography, initialTheme(), useTheme(), AppShell() (+7 more)

### Community 46 - "High-Level Design (HLD) — Pokemon Origins"
Cohesion: 0.17
Nodes (12): 1. System Overview, 2. Architectural Goals, 4.1 Browser ↔ backend, 4.2 Backend ↔ battle-engine (BFF), 4.3 Backend ↔ MySQL, 4. Component Interfaces, 5. Key user flows, 6. System qualities (as built) (+4 more)

### Community 47 - "react"
Cohesion: 0.15
Nodes (24): api, getErrorMessage(), PokemonSprite(), formatStatLabel(), STAT_LABELS, Card(), JourneyScreen(), RewardScreen() (+16 more)

### Community 48 - "pipeline.js"
Cohesion: 0.15
Nodes (25): next(), collisionAt(), checkConnections(), checkEncounters(), checkObjects(), checkReachable(), checkTiles(), checkTrainers() (+17 more)

### Community 49 - "battleService.js"
Cohesion: 0.22
Nodes (8): axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, proxyError(), turnOrder(), defaultEngine()

### Community 50 - "trainerVoice.test.js"
Cohesion: 0.12
Nodes (13): addVoice(), fill(), introLine(), overworldLines(), { addVoice, introLine, overworldLines }, assert, champion, { describe, it } (+5 more)

### Community 51 - "Overworld Architecture — Phase 0 Audit and Design"
Cohesion: 0.11
Nodes (18): hasWonBattle(), 0. Baseline (measured this session), 10. Questions (decisions I will not guess), 11. What I need from you to start Phase 1, 12. Decisions recorded (Phase 0 approved 2026-11-03), 13. Phase 8c (new): Gemini-generated ambient NPC dialogue, 1. Items in the repo that contradict the brief (need your ruling), 2.1 Content (static JSON, `backend/data/`) (+10 more)

### Community 52 - "App.jsx"
Cohesion: 0.10
Nodes (29): 6. Proposed module layout, App(), Protected(), UserContext, useUser(), AuthScreen(), Field(), BagScreen() (+21 more)

### Community 53 - "trainers.js"
Cohesion: 0.12
Nodes (15): battleHistoryQuerySchema, trainerCardSchema, trainerIdParamsSchema, validateParams(), express, profileService, { requireAuth }, resetService (+7 more)

### Community 54 - "Overworld art changelog"
Cohesion: 0.13
Nodes (14): Overworld art changelog, Stage 2a: deterministic builds, Stage 2b: v2 tiles (approved from the slice), Stage 3a: v1 polish, side views and legs (whole cast), Stage 3b/3c: environment pass (tileset + Origin Town), Stage 3b: distinct building designs (v3), Stage 3d: home staircase redraw, Stage 3d: interiors (Care Centre, Mart, home) and door warps (+6 more)

### Community 55 - "tiles_v2.py"
Cohesion: 0.05
Nodes (42): mown_block(), text(), band_window(), barrel(), base_shadow(), bench(), boxed(), center_v3() (+34 more)

### Community 56 - "createOverworld"
Cohesion: 0.12
Nodes (40): ALERT_TICKS, createOverworld(), advanceRoom(), beginWarp(), bumpRoom(), enterRoom(), enterTriggers(), handleActorEvent() (+32 more)

### Community 57 - "MenuIcon"
Cohesion: 0.12
Nodes (12): foe(), mon(), state(), StartMenu(), sign, stage, Cursor(), ICONS (+4 more)

### Community 58 - "town_art.py"
Cohesion: 0.04
Nodes (45): Outlines and shadows, Tile layers, disc(), sand(), speck(), bush_body(), leaf_mass(), _outline() (+37 more)

### Community 59 - "gymPuzzles.test.js"
Cohesion: 0.20
Nodes (12): assert, { createFlagService, createMemoryFlagStore }, { describe, it, before }, gyms, loader, createFlagService(), createMemoryFlagStore(), createMysqlFlagStore() (+4 more)

### Community 60 - "new_tiles"
Cohesion: 0.04
Nodes (54): _bloom(), _blurred(), bush(), _canopy(), _cells(), crops(), _decal(), doormat() (+46 more)

### Community 61 - "playground/movement.test.js"
Cohesion: 0.21
Nodes (6): clamp(), resolveMove(), spawnPoint(), assert, { describe, it }, { resolveMove, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC, clamp, spawnPoint, SPAWN_RADIUS_PX, CHAT_RADIUS_PX, TILE_PX }

### Community 62 - "battleBeats.js"
Cohesion: 0.11
Nodes (26): hit(), BATTLE_SEATS, FX_FAMILY, fxFamily(), getImpactTier(), getMoveAnimCategory(), hitResultLines(), RANGED_FEEL_TYPES (+18 more)

### Community 63 - "playground.js"
Cohesion: 0.17
Nodes (9): assert, { describe, it }, { playgroundExchangeSchema }, playgroundExchangeSchema, express, movePlaygroundService, { requireAuth }, router (+1 more)

### Community 64 - "index.test.js"
Cohesion: 0.17
Nodes (5): assert, attachPlayground, { describe, it }, fakePool, { ROOM_WIDTH, ROOM_HEIGHT, CHAT_RADIUS_PX }

### Community 65 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+8 more)

### Community 66 - "world_maps.py"
Cohesion: 0.07
Nodes (31): Original / CC0 (new work), blob_mask(), afloat(), gate(), hollow_lab_door(), playground(), plaza_pieces(), route() (+23 more)

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.22
Nodes (8): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), Known balance soft spots (honest), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "Tile"
Cohesion: 0.05
Nodes (58): bakery(), belt(), face(), floor(), cap(), make(), dojo(), bonsai() (+50 more)

### Community 69 - "gymPuzzles.js"
Cohesion: 0.20
Nodes (12): buildPuzzle(), { CampaignError }, engine, FILE, fs, getGymPuzzle(), listGymPuzzles(), load() (+4 more)

### Community 70 - "middleware/validate.js"
Cohesion: 0.08
Nodes (28): battleActionSchema, battleStartSchema, calculateDamageSchema, gymSolveSchema, idList, moveSchema, playgroundMonSchema, playgroundStagesSchema (+20 more)

### Community 71 - "starterService.test.js"
Cohesion: 0.12
Nodes (18): createMemoryPartyStore(), createStarterService(), chooseStarter(), listStarters(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats() (+10 more)

### Community 72 - "sheets.py"
Cohesion: 0.09
Nodes (22): _views(), blink(), despeckle(), hex_rgba(), key_colour(), _mat(), mirror(), outline() (+14 more)

### Community 73 - "auth.js"
Cohesion: 0.08
Nodes (24): jwt, { JWT_SECRET }, requireAuth(), evolutionConfirmSchema, rewardClaimSchema, evolutionService, express, { requireAuth } (+16 more)

### Community 75 - "startBattle"
Cohesion: 0.18
Nodes (11): resolveWildTable(), resolveWorldTrainer(), startBattle(), defeatedFlag(), playerName(), usesPlayerName(), 5.1 The battle-session decoupling (needed from Phase 4 on), 5.2 API list (new; all JWT, Zod-validated, rate-limited, parameterized SQL) (+3 more)

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.29
Nodes (7): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Reduced motion, Timing, Title showcase, idle()

### Community 78 - "battleSessionService.test.js"
Cohesion: 0.11
Nodes (13): assert, { CampaignError }, { createBattleAi }, {
	createBattleSessionService,
	createMemoryHistoryStore,
	snapshotPokemon,
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

### Community 79 - "TrainerScreen.jsx"
Cohesion: 0.27
Nodes (15): badgeCount(), cache, fetchProfile(), invalidateProfile(), TrainerRecord(), Row(), TrainerScreen(), ProgressBar() (+7 more)

### Community 80 - "campaign.js"
Cohesion: 0.22
Nodes (8): completeBattleSchema, battleSessionService, campaignService, express, progressService, { requireAuth }, router, {
	validateBody,
	completeBattleSchema,
}

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

### Community 85 - "assets.js"
Cohesion: 0.36
Nodes (8): loadAssets(), loadImage(), loadLegendaries(), shinyCanvas(), swapPalette(), SPRITES, SHEET_NAMES, SHEETS

### Community 87 - "slice_art.py"
Cohesion: 0.06
Nodes (24): fence(), _field(), ground_layer(), house(), marks(), luma(), mean_saturation(), opaque() (+16 more)

### Community 88 - "TitleScreen.jsx"
Cohesion: 0.08
Nodes (32): createFlags(), isEnabled(), defaults, isEnabled, truthy(), MAX_CAMPAIGN_LEVEL, JourneyRoad(), DIGLETT_MAP (+24 more)

### Community 90 - "PartyBoard.jsx"
Cohesion: 0.13
Nodes (24): TYPE_COLORS, seatDrop(), applyDrop(), MAX_PARTY, BattleStage(), monClass(), THEMES, HpPanel() (+16 more)

### Community 91 - "profileService.js"
Cohesion: 0.20
Nodes (15): CARD_THEMES, getBattleHistory(), getPublicProfile(), levelName(), loader, profileError(), summarizeCampaign(), summarizeRecord() (+7 more)

### Community 92 - "Gym leaders"
Cohesion: 0.10
Nodes (19): 1. Willow Thornby: Grass, Mossgate Grove, 2. Mara Quill: Normal, Hearthfield, 3. Tavish Rook: Fighting, Ironbrook, 4. Coral Marlowe: Water, Saltmere Harbor, 5. Volt Dray: Electric, Dynamo Station, 6. Skye Corvin: Flying, Gale Spire, 7. Sage Ilmara: Psychic, Starfall Observatory, 8. Cinder Valko: Fire, Emberhold (+11 more)

### Community 93 - "Button"
Cohesion: 0.13
Nodes (35): typeColor(), DRAIN_MS, audio(), CUES, isSoundOn(), noiseBuffer(), play(), setSoundOn() (+27 more)

### Community 94 - "evolutionRequirement.test.js"
Cohesion: 0.21
Nodes (9): formatEvolutionRequirement(), { slugToTitleCase }, assert, { describe, it }, { formatEvolutionRequirement }, slugToTitleCase(), assert, { describe, it } (+1 more)

### Community 101 - "content.test.js"
Cohesion: 0.17
Nodes (9): assert, campaignService, {
	createProgressService,
	createMemoryStore,
}, { describe, it, before }, fs, GYM_LEVELS, loader, { loadRewardPool } (+1 more)

### Community 102 - "sky_tile"
Cohesion: 0.22
Nodes (3): SkyAndPlains, _cloudiness(), sky_tile()

### Community 104 - "script.js"
Cohesion: 0.33
Nodes (6): DIRS, need(), parseScript(), ScriptError, validateScript(), VALIDATORS

### Community 105 - "renderer.js"
Cohesion: 0.08
Nodes (45): Light at runtime, Layout tokens, actorPixel(), coverage(), BAYER, CLOUD_ROWS, clouds(), glowMask() (+37 more)

### Community 106 - "characters.py"
Cohesion: 0.23
Nodes (5): _as_list(), make(), head(), grid(), row()

### Community 107 - "build_all.py"
Cohesion: 0.15
Nodes (6): main(), pixel_rows(), grove(), BuiltMaps, tile_ids(), tileset_image()

### Community 109 - "progressService.js"
Cohesion: 0.10
Nodes (29): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Boss reward cards (Phase 6, extended Phase 10), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules (+21 more)

### Community 110 - "ref_node_assert"
Cohesion: 0.09
Nodes (16): createMemoryWorldStore(), createMysqlWorldStore(), createWorldService(), storyFlag(), assert, { createWorldService, createMemoryWorldStore, storyFlag }, make(), test (+8 more)

### Community 111 - "createTypeEffectivenessService"
Cohesion: 0.24
Nodes (8): ALL_TYPES, createTypeEffectivenessService(), getCombinedMultipliers(), getMatchups(), getWeaknesses(), assert, { createTypeEffectivenessService }, { describe, it }

### Community 113 - "createRoomState"
Cohesion: 0.19
Nodes (8): colorFor(), createRoomState(), addPlayer(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 114 - "resetService.test.js"
Cohesion: 0.19
Nodes (10): createResetService(), getPool(), resetTrainer(), DEFAULT_PROGRESS, defaultService, { STARTING_COINS }, assert, { createResetService, DEFAULT_PROGRESS } (+2 more)

### Community 116 - "index.js"
Cohesion: 0.20
Nodes (8): { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS }, { createRoomState }, { createSocketAuthMiddleware }, EMOTES, FACINGS, jwt, { JWT_SECRET }, { resolveMove, spawnPoint, CHAT_RADIUS_PX, ROOM_WIDTH, ROOM_HEIGHT }

### Community 117 - "render_map.py"
Cohesion: 0.20
Nodes (5): main(), render(), draw(), tile_img(), RouteDressing

### Community 118 - "Aurelia art bible"
Cohesion: 0.25
Nodes (7): Aurelia art bible, Buildings, Characters, Frame, Ground, Light and value, Reference rule

### Community 119 - "balance-sim.js"
Cohesion: 0.12
Nodes (22): {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
}, enemyLevels(), loader, { loadRewardPool }, main(), OFFER_BATTLE_TYPES, pad(), {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} (+14 more)

### Community 124 - "games.js"
Cohesion: 0.29
Nodes (6): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, chooseStarterSchema

### Community 125 - "moves.js"
Cohesion: 0.29
Nodes (6): moveLearnResolveSchema, express, moveLearnService, { requireAuth }, router, {
	validateBody,
	moveLearnResolveSchema,
}

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 127 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:components, test:sprites

### Community 128 - "crop_trainer_sprites.py"
Cohesion: 0.33
Nodes (4): build_throw_strip(), colorkey_to_alpha(), head_center_x(), main()

### Community 129 - "Art / audio needed from a human"
Cohesion: 0.50
Nodes (3): Art / audio needed from a human, Mossgate placeholders, Still to draw

### Community 130 - "pil"
Cohesion: 0.20
Nodes (3): render(), rows_below(), seats()

### Community 132 - "Restore methods"
Cohesion: 0.67
Nodes (3): Docker Compose (recommended), Manual, Restore methods

### Community 134 - "gen_overworld_placeholders.py"
Cohesion: 0.11
Nodes (16): build_tiles(), check(), house(), main(), MapBuilder, merge(), paint(), pal() (+8 more)

### Community 136 - "Environment variables"
Cohesion: 0.50
Nodes (4): Backend (`backend/.env`), Battle engine (`battle-engine/.env`), Environment variables, Frontend (`frontend/.env`)

### Community 139 - "pokeApiClient.test.js"
Cohesion: 0.22
Nodes (5): axios, createPokeApiClient(), assert, { createPokeApiClient }, { describe, it }

### Community 140 - "Overworld art overhaul: plan for review"
Cohesion: 0.10
Nodes (19): Art audit: root causes, Decisions (user, 2026-11-04), Intent, Non-goals, Overworld art overhaul: plan for review, Parked, Phase 0: Art bible and one-screen slice (the gate), Phase 1: Nature tileset (+11 more)

### Community 141 - "build_sheet"
Cohesion: 0.19
Nodes (7): main(), ui_art(), contact_sheet(), walk_gif(), build_sheet(), edge_colours(), _rgb()

### Community 142 - "File format"
Cohesion: 0.22
Nodes (8): Collision layer, Conventions, File format, Map properties, Maps: authoring guide, Not checked, Object layers, Pipeline

### Community 143 - "Stage 1: plan"
Cohesion: 0.12
Nodes (15): Baseline, Commands you will run (after each stage), Decisions I need you to OK, Engine contract (verified in code), Files to change, Master palette plan, Overworld art refinement: audit (stage 0) and plan (stage 1), Stage 0: audit (+7 more)

### Community 145 - "PokemonDetailRoutes.js"
Cohesion: 0.25
Nodes (6): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router

### Community 147 - "bootstrap-dev-sprites.js"
Cohesion: 0.20
Nodes (8): DEST, FALLBACK, fs, missing, path, placeholder, ROOT, SRC

### Community 148 - "db.js"
Cohesion: 0.29
Nodes (6): mysql, pool, promisePool, rawQuery, TRANSIENT_ERROR_CODES, defaultLoadChart()

### Community 149 - "start-battle-engine.js"
Cohesion: 0.18
Nodes (8): args, child, { cmd, argsPrefix, useShell }, engineDir, fs, path, root, { spawn }

### Community 150 - "ref_path"
Cohesion: 0.22
Nodes (6): inventoryService, main(), parseArgs(), path, vite, @vitejs/plugin-react

### Community 154 - "inventory.js"
Cohesion: 0.29
Nodes (6): inventoryUseSchema, express, inventoryService, { requireAuth }, router, { validateBody, inventoryUseSchema }

### Community 155 - "MoveLabScreen.jsx"
Cohesion: 0.29
Nodes (8): defaultMon(), MonSetupPanel(), MoveLabScreen(), STAGE_KEYS, STATUS_OPTIONS, TRI_STATE_OPTIONS, triStateToValue(), valueToTriState()

### Community 157 - "interiors.py"
Cohesion: 0.05
Nodes (47): Scripts, book(), bookcase(), bottle(), box_item(), build(), tile_id(), center() (+39 more)

### Community 161 - "setup-battle-engine.js"
Cohesion: 0.18
Nodes (7): engineDir, fs, launcher, path, reqFile, { spawnSync }, venvDir

### Community 163 - "legendary/manifest.json"
Cohesion: 0.50
Nodes (3): frame, frames, legendaries

### Community 164 - "overworld/manifest.json"
Cohesion: 0.50
Nodes (3): columns, rows, sheets

### Community 168 - "Route1"
Cohesion: 0.21
Nodes (3): Ground, layer(), Route1

### Community 171 - "party.js"
Cohesion: 0.22
Nodes (6): partyArrangeSchema, express, partyService, { requireAuth }, router, { validateBody, partyArrangeSchema }

### Community 176 - "socketAuth.test.js"
Cohesion: 0.32
Nodes (5): createSocketAuthMiddleware(), sanitizeGuestName(), assert, { createSocketAuthMiddleware }, { describe, it }

### Community 180 - "pathlib"
Cohesion: 0.10
Nodes (11): determine_turn_order(), add_experience_endpoint(), calculate_damage(), health_check(), read_root(), turn_order(), add_experience(), xp_needed_for_level() (+3 more)

### Community 190 - "config/flags.js"
Cohesion: 0.28
Nodes (7): createFlags(), defaults, NAMES, assert, { createFlags }, test, truthy()

## Knowledge Gaps
- **821 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+816 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1384 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Outlines and shadows` connect `town_art.py` to `renderer.js`, `new_tiles`, `Aurelia art bible`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Why does `clouds()` connect `renderer.js` to `town_art.py`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Why does `_outline()` connect `town_art.py` to `new_tiles`, `buildings.py`, `slice_art.py`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _821 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `movePlaygroundService.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Should `battleStatus.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10420168067226891 - nodes in this community are weakly interconnected._
- **Should `walkthrough.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08081632653061224 - nodes in this community are weakly interconnected._