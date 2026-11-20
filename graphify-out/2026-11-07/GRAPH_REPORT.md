# Graph Report - Pokemon-Origins  (2026-11-07)

## Corpus Check
- 455 files · ~563,987 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 16, (none) 12, .example 4)

## Summary
- 3280 nodes · 7254 edges · 162 communities (137 shown, 25 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 442 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a8309b12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- movePlaygroundService.js
- battleSessionService.js
- battleBeats.js
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
- battle_seats.py
- authService.js
- puzzles.generated.js
- App.jsx
- legendaries.py
- hydrate.js
- test_dressing.py
- evolutionRequirement.test.js
- World.jsx
- createPartyService
- tiles.py
- index.js
- test_cast.py
- level1.py
- dependencies
- react
- OverworldScreen.jsx
- pokemonDetailService.js
- Database
- fetch_frlg_sprites.py
- buildings.py
- validate-sprites.js
- db.js
- Pokemon Origins
- TrainerHoverCard.jsx
- pokemonDetailService.test.js
- express
- playground.js
- High-Level Design (HLD) — Pokemon Origins
- Panel
- pipeline.js
- battleService.js
- trainerVoice.test.js
- Overworld Architecture — Phase 0 Audit and Design
- pixelsprite.spec.js
- auth.js
- validateBody
- tiles_v2.py
- createOverworld
- useBattle.js
- town_art.py
- player_frames
- new_tiles
- playground/movement.test.js
- moves.js
- main.jsx
- index.test.js
- devDependencies
- world_maps.py
- QA — Campaign Loop Checklist (Phase 11)
- Tile
- blob_masks
- middleware/validate.js
- starterService.test.js
- sheets.py
- evolutions.js
- BuiltMaps
- harbor
- README.md
- Animation Guide — Pokemon Origins
- build_sprites.py
- Bridge
- herringbone
- gymPuzzles.js
- SheetTests
- Frontend — Pokemon Origins
- logic/movement.js
- assets.test.js
- battle.js
- slice_art.py
- TitleScreen.jsx
- Gen 1 sprite sheet (source)
- PartyBoard.jsx
- Gym leaders
- Button
- createBattleSessionService
- profileService.js
- rbox
- mapModel.js
- renderer.js
- characters.py
- progressService.js
- PokemonDetailRoutes.js
- createRoomState
- resetService.test.js
- battleSessionService.test.js
- Overworld art changelog
- dependencies
- scripts
- pil
- pathlib
- vitest
- shell
- validate-maps.mjs
- gen_overworld_placeholders.py
- Environment variables
- world/maps.test.js
- Proportions
- pokeApiClient.test.js
- Overworld art overhaul: plan for review
- paint_mart
- File format
- Stage 1: plan
- Room
- test_buildings.py
- bootstrap-dev-sprites.js
- start-battle-engine.js
- ref_path
- vercel.json
- MoveLabScreen.jsx
- slice_scene.py
- interiors.py
- createTypeEffectivenessService
- worldService.test.js
- setup-battle-engine.js
- legendary/manifest.json
- overworld/manifest.json
- fence_tile
- test_route.py
- Aurelia art bible
- party.js
- ref_node_assert
- Art / audio needed from a human
- towns.py
- socketAuth.test.js
- inventory.js
- rewards.js
- main.py
- paint_cottage
- Restore methods
- config/flags.js

## God Nodes (most connected - your core abstractions)
1. `Tile` - 80 edges
2. `new_tiles()` - 68 edges
3. `react` - 66 edges
4. `_battle()` - 47 edges
5. `_resolve()` - 46 edges
6. `Button()` - 46 edges
7. `createBattleSessionService()` - 42 edges
8. `Panel()` - 40 edges
9. `createOverworld()` - 39 edges
10. `CampaignError` - 36 edges

## Surprising Connections (you probably didn't know these)
- `Known balance soft spots (honest)` --references--> `statAtLevel()`  [INFERRED]
  docs/QA_CAMPAIGN_CHECKLIST.md → backend/src/campaign/hydrate.js
- `2.1 Content (static JSON, `backend/data/`)` --references--> `statAtLevel()`  [INFERRED]
  docs/superpowers/plans/overworld-architecture.md → backend/src/campaign/hydrate.js
- `5.1 The battle-session decoupling (needed from Phase 4 on)` --references--> `startBattle()`  [INFERRED]
  docs/superpowers/plans/overworld-architecture.md → backend/src/services/battleSessionService.js
- `Palette` --references--> `AppShell()`  [INFERRED]
  docs/design/STYLE_GUIDE.md → frontend/src/v2/layout/AppShell.jsx
- `Evolution (Phase 9 — no migration needed)` --references--> `moves()`  [INFERRED]
  database/README.md → frontend/src/v2/overworld/maps/pipeline.js

## Import Cycles
- None detected.

## Communities (162 total, 25 thin omitted)

### Community 0 - "movePlaygroundService.js"
Cohesion: 0.08
Nodes (30): createMemoryHistoryStore(), createMemoryHpStore(), createMemoryPpStore(), { CampaignError }, {
	createBattleSessionService,
	createMemoryPpStore,
	createMemoryHpStore,
	createMemoryHistoryStore,
}, createMovePlaygroundService(), buildMon(), buildSandboxService() (+22 more)

### Community 1 - "battleSessionService.js"
Cohesion: 0.08
Nodes (44): { addVoice, introLine, usesPlayerName }, { CampaignError }, { createBattleAi }, applyStatChanges(), applyStatus(), createMysqlHistoryStore(), createMysqlHpStore(), createMysqlPpStore() (+36 more)

### Community 2 - "battleBeats.js"
Cohesion: 0.07
Nodes (45): hit(), BattlePokemonSprite(), BATTLE_SEATS, BATTLE_SPRITE_BASE, getBattleSprite(), DEX_MAX, DEX_MIN, getPokemonSprite() (+37 more)

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
Cohesion: 0.13
Nodes (23): _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _crit_stage(), _has_major_status(), _hit_check() (+15 more)

### Community 7 - "rewardService.js"
Cohesion: 0.09
Nodes (29): makeRewards(), createMemoryRewardStore(), createMysqlRewardStore(), createRewardService(), claimOffer(), createOfferForWin(), getPendingOffer(), getPublicParty() (+21 more)

### Community 8 - "evolutionService.test.js"
Cohesion: 0.10
Nodes (29): displayName(), createEvolutionService(), applyEvolutionToRow(), confirmLevelEvolution(), evolveWithStone(), findLevelEvolution(), findStoneEvolution(), getPendingEvolutions() (+21 more)

### Community 9 - "inventoryService.test.js"
Cohesion: 0.10
Nodes (28): makeInventory(), createInventoryService(), addItem(), consumeItem(), getInventory(), getItem(), getQuantity(), getStore() (+20 more)

### Community 10 - "scripts"
Cohesion: 0.06
Nodes (31): description, devDependencies, concurrently, dotenv, engines, node, dotenv, name (+23 more)

### Community 11 - "test_combat.py"
Cohesion: 0.14
Nodes (47): _battle(), _move(), _pokemon(), _resolve(), test_accuracy_and_evasion_stages(), test_attack_stage_raises_damage(), test_attract_applies_volatile_effect(), test_battle_armor_blocks_crits() (+39 more)

### Community 12 - "portraits.py"
Cohesion: 0.16
Nodes (20): Art, bastian(), cinder(), coral(), drake(), face(), figure(), folded() (+12 more)

### Community 13 - "martService.test.js"
Cohesion: 0.11
Nodes (25): createMartService(), getMart(), getStock(), getStore(), isAvailable(), purchase(), requiredUnlockedLevel(), createMemoryMartStore() (+17 more)

### Community 14 - "backend/package.json"
Cohesion: 0.08
Nodes (25): author, description, devDependencies, nodemon, axios, dotenv, keywords, license (+17 more)

### Community 15 - "moveLearnService.test.js"
Cohesion: 0.14
Nodes (21): createMemoryLearnsetStore(), createMemoryMoveStore(), createMoveLearnService(), getLearnsetStore(), getMoveStore(), getPendingLearns(), processLevelUp(), resolveLearn() (+13 more)

### Community 16 - "battleAi.test.js"
Cohesion: 0.22
Nodes (10): createBattleAi(), getChart(), pickMove(), defaultLoadChart(), effectiveness(), hasPp(), assert, CHART (+2 more)

### Community 17 - "finish"
Cohesion: 0.26
Nodes (8): hall(), lab(), lobby(), opening(), room(), statues(), finish(), say()

### Community 18 - "battle_seats.py"
Cohesion: 0.60
Nodes (3): render(), rows_below(), seats()

### Community 19 - "authService.js"
Cohesion: 0.12
Nodes (14): authService, express, router, { validateBody, loginSchema }, loginSchema, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN } (+6 more)

### Community 20 - "puzzles.generated.js"
Cohesion: 0.31
Nodes (18): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+10 more)

### Community 21 - "App.jsx"
Cohesion: 0.11
Nodes (24): App(), Protected(), API_URL, initialTheme(), useTheme(), UserContext, useUser(), AppShell() (+16 more)

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
Cohesion: 0.09
Nodes (7): cells(), Ground, layer(), Route, Shadows, Terrain, Towns

### Community 25 - "evolutionRequirement.test.js"
Cohesion: 0.21
Nodes (9): formatEvolutionRequirement(), { slugToTitleCase }, assert, { describe, it }, { formatEvolutionRequirement }, slugToTitleCase(), assert, { describe, it } (+1 more)

### Community 26 - "World.jsx"
Cohesion: 0.16
Nodes (16): Palette, Primitives (`frontend/src/v2/ui/`), Rules, Style Guide — Pokemon Origins, Typography, clamp(), scenery(), TileArt() (+8 more)

### Community 27 - "createPartyService"
Cohesion: 0.11
Nodes (27): FEMALE_ONLY_IDS, GENDERLESS_IDS, MALE_ONLY_IDS, rollGenderForSpecies(), assert, { describe, it }, { rollGenderForSpecies }, createMemoryPartyStore() (+19 more)

### Community 28 - "tiles.py"
Cohesion: 0.08
Nodes (29): bush(), door(), flower_bed(), flowers_decal(), grass(), gym(), gym_sign(), hexrgb() (+21 more)

### Community 29 - "index.js"
Cohesion: 0.14
Nodes (14): createChatRing(), push(), isRateLimited(), sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, attachPlayground() (+6 more)

### Community 30 - "test_cast.py"
Cohesion: 0.13
Nodes (5): Builds, Leaders, Players, stand(), torso_width()

### Community 31 - "level1.py"
Cohesion: 0.10
Nodes (18): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), determine_turn_order(), Move, Pokemon, Stats (+10 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "react"
Cohesion: 0.26
Nodes (10): 6. Proposed module layout, StarterPick(), Cursor(), DialogueBox(), ARROWS, moveCursor(), CHAR_MS, useTypewriter() (+2 more)

### Community 34 - "OverworldScreen.jsx"
Cohesion: 0.09
Nodes (33): TICK_MS, harness(), attachInput(), BUTTONS, createInputState(), DIR_BUTTONS, drainEdges(), isTyping() (+25 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.23
Nodes (14): buildEvolutionGraph(), nodeFor(), cleanFlavorText(), createMysqlEvolutionGraphStore(), createPokemonDetailService(), findPathToId(), flattenNext(), getEvolutionStore() (+6 more)

### Community 36 - "Database"
Cohesion: 0.13
Nodes (15): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed), Migrations (+7 more)

### Community 37 - "fetch_frlg_sprites.py"
Cohesion: 0.07
Nodes (19): _is_valid_existing(), main(), download_and_validate(), test_downloads_and_validates_known_sprite(), test_raises_on_404(), _fetch_all_category_members(), _get_json(), resolve_dex_map() (+11 more)

### Community 38 - "buildings.py"
Cohesion: 0.09
Nodes (13): _awning(), center(), _emblem(), _finish(), home(), lab(), mart(), _prop() (+5 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "db.js"
Cohesion: 0.17
Nodes (10): mysql, pool, promisePool, rawQuery, TRANSIENT_ERROR_CODES, mysql, pool, defaultRestorePp() (+2 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.17
Nodes (12): Architecture (short), Combat unit tests, Contributing, Database, Feature surface (current), Folder structure, License, Pokemon Origins (+4 more)

### Community 42 - "TrainerHoverCard.jsx"
Cohesion: 0.19
Nodes (21): badgeCount(), cache, fetchProfile(), isGuestId(), TrainerRecord(), ChatLog(), Roster(), RosterRow() (+13 more)

### Community 43 - "pokemonDetailService.test.js"
Cohesion: 0.18
Nodes (10): assert, { createPokemonDetailService }, { createTypeEffectivenessService }, { describe, it }, EVOLUTION_ROWS, fakeEvolutionStore(), fakeService(), POKEMON (+2 more)

### Community 44 - "express"
Cohesion: 0.17
Nodes (10): martPurchaseSchema, db, express, router, express, martService, { requireAuth }, router (+2 more)

### Community 45 - "playground.js"
Cohesion: 0.17
Nodes (9): assert, { describe, it }, { playgroundExchangeSchema }, playgroundExchangeSchema, express, movePlaygroundService, { requireAuth }, router (+1 more)

### Community 46 - "High-Level Design (HLD) — Pokemon Origins"
Cohesion: 0.17
Nodes (12): 1. System Overview, 2. Architectural Goals, 4.1 Browser ↔ backend, 4.2 Backend ↔ battle-engine (BFF), 4.3 Backend ↔ MySQL, 4. Component Interfaces, 5. Key user flows, 6. System qualities (as built) (+4 more)

### Community 47 - "Panel"
Cohesion: 0.13
Nodes (30): api, getErrorMessage(), PokemonSprite(), formatStatLabel(), STAT_LABELS, BagScreen(), NEEDS_TARGET, Card() (+22 more)

### Community 48 - "pipeline.js"
Cohesion: 0.17
Nodes (26): start(), meet(), next(), route(), step(), travel(), collisionAt(), solve() (+18 more)

### Community 49 - "battleService.js"
Cohesion: 0.22
Nodes (8): axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, proxyError(), turnOrder(), defaultEngine()

### Community 50 - "trainerVoice.test.js"
Cohesion: 0.12
Nodes (13): addVoice(), fill(), introLine(), overworldLines(), { addVoice, introLine, overworldLines }, assert, champion, { describe, it } (+5 more)

### Community 51 - "Overworld Architecture — Phase 0 Audit and Design"
Cohesion: 0.08
Nodes (23): hasWonBattle(), 0. Baseline (measured this session), 10. Questions (decisions I will not guess), 11. What I need from you to start Phase 1, 12. Decisions recorded (Phase 0 approved 2026-11-03), 13. Phase 8c (new): Gemini-generated ambient NPC dialogue, 1. Items in the repo that contradict the brief (need your ruling), 2.1 Content (static JSON, `backend/data/`) (+15 more)

### Community 52 - "pixelsprite.spec.js"
Cohesion: 0.33
Nodes (4): CLEAR, INK, PINK, RED

### Community 53 - "auth.js"
Cohesion: 0.09
Nodes (20): jwt, { JWT_SECRET }, requireAuth(), completeBattleSchema, battleSessionService, campaignService, express, progressService (+12 more)

### Community 54 - "validateBody"
Cohesion: 0.14
Nodes (12): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, chooseStarterSchema, registerSchema, validateBody() (+4 more)

### Community 55 - "tiles_v2.py"
Cohesion: 0.06
Nodes (37): mown_block(), band_window(), barrel(), base_shadow(), bench(), boxed(), center_v3(), chimney() (+29 more)

### Community 56 - "createOverworld"
Cohesion: 0.12
Nodes (40): ALERT_TICKS, createOverworld(), advanceRoom(), beginWarp(), bumpRoom(), enterRoom(), enterTriggers(), handleActorEvent() (+32 more)

### Community 57 - "useBattle.js"
Cohesion: 0.16
Nodes (13): DRAIN_MS, createMessageQueue(), REWARD_EVENT_TYPES, appearsAtOnce(), IDLE_FX, foe(), mon(), state() (+5 more)

### Community 58 - "town_art.py"
Cohesion: 0.06
Nodes (39): Tile layers, make(), disc(), sand(), speck(), awning(), drop(), forge_pit() (+31 more)

### Community 59 - "player_frames"
Cohesion: 0.25
Nodes (4): player_frames(), _sprite(), Player, solid()

### Community 60 - "new_tiles"
Cohesion: 0.07
Nodes (35): _bloom(), _blurred(), bush(), _cells(), crops(), _decal(), doormat(), flowers() (+27 more)

### Community 61 - "playground/movement.test.js"
Cohesion: 0.29
Nodes (6): clamp(), resolveMove(), spawnPoint(), assert, { describe, it }, { resolveMove, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC, clamp, spawnPoint, SPAWN_RADIUS_PX, CHAT_RADIUS_PX }

### Community 62 - "moves.js"
Cohesion: 0.29
Nodes (6): moveLearnResolveSchema, express, moveLearnService, { requireAuth }, router, {
	validateBody,
	moveLearnResolveSchema,
}

### Community 64 - "index.test.js"
Cohesion: 0.15
Nodes (5): assert, attachPlayground, { describe, it }, fakePool, { ROOM_WIDTH, ROOM_HEIGHT }

### Community 65 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+8 more)

### Community 66 - "world_maps.py"
Cohesion: 0.10
Nodes (15): Original / CC0 (new work), before_in_stage(), dawnbrook(), dress_grass(), dress_pond(), forest_name(), halo(), ledge_row() (+7 more)

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.22
Nodes (8): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), Known balance soft spots (honest), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "Tile"
Cohesion: 0.04
Nodes (53): bakery(), belt(), face(), floor(), cap(), dojo(), bonsai(), face() (+45 more)

### Community 69 - "blob_masks"
Cohesion: 0.40
Nodes (3): Overworld art pipeline, blob_mask(), blob_masks()

### Community 70 - "middleware/validate.js"
Cohesion: 0.06
Nodes (34): battleHistoryQuerySchema, gymSolveSchema, idList, moveSchema, playgroundMonSchema, playgroundStagesSchema, pokemonSchema, trainerCardSchema (+26 more)

### Community 71 - "starterService.test.js"
Cohesion: 0.13
Nodes (16): createStarterService(), chooseStarter(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats(), STARTER_POKEMON_IDS, starterStats (+8 more)

### Community 72 - "sheets.py"
Cohesion: 0.11
Nodes (18): blink(), despeckle(), hex_rgba(), _mat(), outline(), render(), resolve(), shade() (+10 more)

### Community 73 - "evolutions.js"
Cohesion: 0.29
Nodes (6): evolutionConfirmSchema, evolutionService, express, { requireAuth }, router, {
	validateBody,
	evolutionConfirmSchema,
}

### Community 75 - "harbor"
Cohesion: 0.20
Nodes (8): harbor(), anchor(), boat(), face(), floor(), valve(), water(), wheel()

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.29
Nodes (7): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Reduced motion, Timing, Title showcase, idle()

### Community 78 - "build_sprites.py"
Cohesion: 0.20
Nodes (6): main(), ui_art(), ramp_for(), contact_sheet(), walk_gif(), build_sheet()

### Community 81 - "gymPuzzles.js"
Cohesion: 0.09
Nodes (41): buildPuzzle(), { CampaignError }, engine, FILE, fs, getGymPuzzle(), listGymPuzzles(), load() (+33 more)

### Community 82 - "SheetTests"
Cohesion: 0.07
Nodes (5): frames(), hexs(), LegendaryTests, SheetTests, WorldTests

### Community 83 - "Frontend — Pokemon Origins"
Cohesion: 0.40
Nodes (5): Frontend — Pokemon Origins, Layout (`src/`), Local, Routes, UI rules

### Community 84 - "logic/movement.js"
Cohesion: 0.10
Nodes (33): BUMP_TICKS, DIRS, HOP_ARC, HOP_TICKS, LEDGE_DIR, RUN_TICKS, TICK_HZ, TILE (+25 more)

### Community 85 - "assets.test.js"
Cohesion: 0.36
Nodes (8): loadAssets(), loadImage(), loadLegendaries(), shinyCanvas(), swapPalette(), SPRITES, SHEET_NAMES, SHEETS

### Community 86 - "battle.js"
Cohesion: 0.20
Nodes (9): battleActionSchema, battleStartSchema, calculateDamageSchema, battleService, battleSessionService, express, { requireAuth }, router (+1 more)

### Community 87 - "slice_art.py"
Cohesion: 0.07
Nodes (20): edge_colour(), fence(), _field(), _flecks(), ground_layer(), house(), luma(), meadow() (+12 more)

### Community 88 - "TitleScreen.jsx"
Cohesion: 0.10
Nodes (28): createFlags(), isEnabled(), defaults, isEnabled, truthy(), MAX_CAMPAIGN_LEVEL, JourneyRoad(), DIGLETT_MAP (+20 more)

### Community 90 - "PartyBoard.jsx"
Cohesion: 0.17
Nodes (19): applyDrop(), MAX_PARTY, HpPanel(), PartyBalls(), useSteppedNumber(), MoveLine(), PartyBoard(), same() (+11 more)

### Community 92 - "Gym leaders"
Cohesion: 0.10
Nodes (19): 1. Willow Thornby: Grass, Mossgate Grove, 2. Mara Quill: Normal, Hearthfield, 3. Tavish Rook: Fighting, Ironbrook, 4. Coral Marlowe: Water, Saltmere Harbor, 5. Volt Dray: Electric, Dynamo Station, 6. Skye Corvin: Flying, Gale Spire, 7. Sage Ilmara: Psychic, Starfall Observatory, 8. Cinder Valko: Fire, Emberhold (+11 more)

### Community 93 - "Button"
Cohesion: 0.18
Nodes (25): typeColor(), audio(), CUES, isSoundOn(), noiseBuffer(), play(), setSoundOn(), BagMenu() (+17 more)

### Community 94 - "createBattleSessionService"
Cohesion: 0.13
Nodes (35): clonePokemon(), createBattleSessionService(), applyAttract(), applyConfusion(), applyDisable(), applyWinAward(), confusionSelfHit(), cureStatus() (+27 more)

### Community 101 - "profileService.js"
Cohesion: 0.20
Nodes (15): CARD_THEMES, getBattleHistory(), getPublicProfile(), levelName(), loader, profileError(), summarizeCampaign(), summarizeRecord() (+7 more)

### Community 102 - "rbox"
Cohesion: 0.17
Nodes (13): book(), bookcase(), framed_picture(), glass_table(), mat(), paint_center(), paint_home(), paint_lab() (+5 more)

### Community 104 - "mapModel.js"
Cohesion: 0.17
Nodes (14): coverAt(), fail(), MapError, OBJECT_GROUPS, parseObject(), propsToObject(), SIDES, TILE_LAYERS (+6 more)

### Community 105 - "renderer.js"
Cohesion: 0.09
Nodes (36): VIEW_H, VIEW_W, computeCamera(), actorPixel(), coverage(), CLOUD_ROWS, clouds(), KINDS (+28 more)

### Community 106 - "characters.py"
Cohesion: 0.14
Nodes (8): _views(), _as_list(), make(), head(), grid(), mirror(), swap(), row()

### Community 109 - "progressService.js"
Cohesion: 0.10
Nodes (30): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Boss reward cards (Phase 6, extended Phase 10), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules (+22 more)

### Community 112 - "PokemonDetailRoutes.js"
Cohesion: 0.25
Nodes (6): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router

### Community 113 - "createRoomState"
Cohesion: 0.19
Nodes (8): colorFor(), createRoomState(), addPlayer(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 114 - "resetService.test.js"
Cohesion: 0.13
Nodes (18): createResetService(), getPool(), resetTrainer(), DEFAULT_PROGRESS, defaultService, { STARTING_COINS }, assert, { createResetService, DEFAULT_PROGRESS } (+10 more)

### Community 119 - "battleSessionService.test.js"
Cohesion: 0.05
Nodes (42): {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
}, enemyLevels(), loader, { loadRewardPool }, main(), OFFER_BATTLE_TYPES, pad(), {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} (+34 more)

### Community 124 - "Overworld art changelog"
Cohesion: 0.13
Nodes (14): Overworld art changelog, Stage 2a: deterministic builds, Stage 2b: v2 tiles (approved from the slice), Stage 3a: v1 polish, side views and legs (whole cast), Stage 3b/3c: environment pass (tileset + Origin Town), Stage 3b: distinct building designs (v3), Stage 3d: home staircase redraw, Stage 3d: interiors (Care Centre, Mart, home) and door warps (+6 more)

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 127 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:components, test:sprites

### Community 128 - "pil"
Cohesion: 0.16
Nodes (4): build_throw_strip(), colorkey_to_alpha(), head_center_x(), main()

### Community 129 - "pathlib"
Cohesion: 0.12
Nodes (8): main(), pixel_rows(), grove(), draw(), main(), leaders(), Portraits, tileset_image()

### Community 130 - "vitest"
Cohesion: 0.17
Nodes (4): sign, stage, @vitejs/plugin-react, vitest

### Community 133 - "validate-maps.mjs"
Cohesion: 0.18
Nodes (8): errors, INDEX_FILE, MAPS_DIR, names, PUZZLE_FILE, raw, ROOT, specs

### Community 134 - "gen_overworld_placeholders.py"
Cohesion: 0.11
Nodes (16): build_tiles(), check(), house(), main(), MapBuilder, merge(), paint(), pal() (+8 more)

### Community 136 - "Environment variables"
Cohesion: 0.50
Nodes (4): Backend (`backend/.env`), Battle engine (`battle-engine/.env`), Environment variables, Frontend (`frontend/.env`)

### Community 137 - "world/maps.test.js"
Cohesion: 0.31
Nodes (6): canStand(), getMap(), index, assert, { canStand, getMap }, { describe, it }

### Community 139 - "pokeApiClient.test.js"
Cohesion: 0.22
Nodes (5): axios, createPokeApiClient(), assert, { createPokeApiClient }, { describe, it }

### Community 140 - "Overworld art overhaul: plan for review"
Cohesion: 0.10
Nodes (19): Art audit: root causes, Decisions (user, 2026-11-04), Intent, Non-goals, Overworld art overhaul: plan for review, Parked, Phase 0: Art bible and one-screen slice (the gate), Phase 1: Nature tileset (+11 more)

### Community 141 - "paint_mart"
Cohesion: 0.19
Nodes (7): bottle(), box_item(), glass_counter(), glass_pane(), paint_mart(), potion(), shelf_unit()

### Community 142 - "File format"
Cohesion: 0.18
Nodes (10): Collision layer, Conventions, File format, Map properties, Maps: authoring guide, Not checked, Object layers, Pipeline (+2 more)

### Community 143 - "Stage 1: plan"
Cohesion: 0.12
Nodes (15): Baseline, Commands you will run (after each stage), Decisions I need you to OK, Engine contract (verified in code), Files to change, Master palette plan, Overworld art refinement: audit (stage 0) and plan (stage 1), Stage 0: audit (+7 more)

### Community 145 - "Room"
Cohesion: 0.17
Nodes (4): floor_key(), pad(), inside(), Room

### Community 147 - "bootstrap-dev-sprites.js"
Cohesion: 0.20
Nodes (8): DEST, FALLBACK, fs, missing, path, placeholder, ROOT, SRC

### Community 149 - "start-battle-engine.js"
Cohesion: 0.18
Nodes (8): args, child, { cmd, argsPrefix, useShell }, engineDir, fs, path, root, { spawn }

### Community 150 - "ref_path"
Cohesion: 0.29
Nodes (5): inventoryService, main(), parseArgs(), path, vite

### Community 155 - "MoveLabScreen.jsx"
Cohesion: 0.29
Nodes (8): defaultMon(), MonSetupPanel(), MoveLabScreen(), STAGE_KEYS, STATUS_OPTIONS, TRI_STATE_OPTIONS, triStateToValue(), valueToTriState()

### Community 156 - "slice_scene.py"
Cohesion: 0.11
Nodes (15): main(), render(), draw(), tile_img(), marks(), _lawn(), marks(), leaf_mass() (+7 more)

### Community 157 - "interiors.py"
Cohesion: 0.20
Nodes (18): build(), tile_id(), center(), extras(), home(), extras(), house(), extras() (+10 more)

### Community 158 - "createTypeEffectivenessService"
Cohesion: 0.24
Nodes (8): ALL_TYPES, createTypeEffectivenessService(), getCombinedMultipliers(), getMatchups(), getWeaknesses(), assert, { createTypeEffectivenessService }, { describe, it }

### Community 159 - "worldService.test.js"
Cohesion: 0.33
Nodes (8): createMemoryWorldStore(), createMysqlWorldStore(), createWorldService(), storyFlag(), assert, { createWorldService, createMemoryWorldStore, storyFlag }, make(), test

### Community 161 - "setup-battle-engine.js"
Cohesion: 0.18
Nodes (7): engineDir, fs, launcher, path, reqFile, { spawnSync }, venvDir

### Community 163 - "legendary/manifest.json"
Cohesion: 0.50
Nodes (3): frame, frames, legendaries

### Community 164 - "overworld/manifest.json"
Cohesion: 0.50
Nodes (3): columns, rows, sheets

### Community 168 - "test_route.py"
Cohesion: 0.07
Nodes (7): Lab, OwnRooms, reachable(), Ground, layer(), Route1, WornTrail

### Community 170 - "Aurelia art bible"
Cohesion: 0.20
Nodes (9): Aurelia art bible, Buildings, Characters, Frame, Ground, Light and value, Light at runtime, Outlines and shadows (+1 more)

### Community 171 - "party.js"
Cohesion: 0.22
Nodes (6): partyArrangeSchema, express, partyService, { requireAuth }, router, { validateBody, partyArrangeSchema }

### Community 172 - "ref_node_assert"
Cohesion: 0.07
Nodes (30): assert, campaignService, {
	createProgressService,
	createMemoryStore,
}, { describe, it, before }, fs, GYM_LEVELS, loader, { loadRewardPool } (+22 more)

### Community 174 - "Art / audio needed from a human"
Cohesion: 0.40
Nodes (4): Art / audio needed from a human, Blocking before public hosting, Mossgate placeholders, Still to draw

### Community 175 - "towns.py"
Cohesion: 0.10
Nodes (17): build(), gate(), hollow_lab_door(), route(), target_of(), terrain(), town(), autotile_paths() (+9 more)

### Community 176 - "socketAuth.test.js"
Cohesion: 0.32
Nodes (5): createSocketAuthMiddleware(), sanitizeGuestName(), assert, { createSocketAuthMiddleware }, { describe, it }

### Community 177 - "inventory.js"
Cohesion: 0.29
Nodes (6): inventoryUseSchema, express, inventoryService, { requireAuth }, router, { validateBody, inventoryUseSchema }

### Community 179 - "rewards.js"
Cohesion: 0.29
Nodes (6): rewardClaimSchema, express, { requireAuth }, rewardService, router, { validateBody, rewardClaimSchema }

### Community 180 - "main.py"
Cohesion: 0.10
Nodes (12): add_experience_endpoint(), calculate_damage(), health_check(), read_root(), turn_order(), add_experience(), get_move_category(), get_type_effectiveness() (+4 more)

### Community 185 - "Restore methods"
Cohesion: 0.67
Nodes (3): Docker Compose (recommended), Manual, Restore methods

### Community 190 - "config/flags.js"
Cohesion: 0.28
Nodes (7): createFlags(), defaults, NAMES, assert, { createFlags }, test, truthy()

## Knowledge Gaps
- **810 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+805 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1337 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Object layers` connect `File format` to `pipeline.js`, `tiles.py`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Why does `step()` connect `pipeline.js` to `File format`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `XP and leveling (Phase 5)` connect `progressService.js` to `main.py`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _810 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `movePlaygroundService.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08199643493761141 - nodes in this community are weakly interconnected._
- **Should `battleSessionService.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07712765957446809 - nodes in this community are weakly interconnected._
- **Should `battleBeats.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0672316384180791 - nodes in this community are weakly interconnected._