# Graph Report - Pokemon-Origins  (2026-11-20)

## Corpus Check
- 513 files · ~721,868 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 16, (none) 12, .example 4)

## Summary
- 3881 nodes · 8646 edges · 174 communities (148 shown, 26 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 635 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bec7353e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- movePlaygroundService.test.js
- battleStatus.js
- park.test.js
- CampaignError
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
- TrainerScreen.jsx
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
- Playground: Mart stall, park wild Pokémon by time of day, battle stands
- PlaygroundMap
- test_cast.py
- level1.py
- dependencies
- battleSessionService.js
- finish
- schemas.js
- Database
- fetch_frlg_sprites.py
- buildings.py
- validate-sprites.js
- startBattle
- Pokemon Origins
- PlaygroundScreen.jsx
- pokemonDetailService.test.js
- playground.js
- interiors.py
- High-Level Design (HLD) — Pokemon Origins
- wild.test.js
- pipeline.js
- pvpLadderService.js
- trainerVoice.test.js
- Overworld Architecture — Phase 0 Audit and Design
- BagScreen.jsx
- trainers.js
- gymPuzzles.test.js
- new_tiles
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
- pil
- bodies.py
- ref_node_assert
- world/maps.test.js
- README.md
- Animation Guide — Pokemon Origins
- battleSessionService.test.js
- getErrorMessage
- clock.test.js
- puzzles.js
- test_art.py
- Frontend — Pokemon Origins
- constants.js
- test_route.py
- shell
- test_slice.py
- react
- Gen 1 sprite sheet (source)
- auth.js
- profileService.js
- Gym leaders
- DialogueBox
- PixelSprite.jsx
- tileArt.generated.js
- index.js
- Real-time PvP, Elo ladder, movement anti-cheat — design
- Room
- script.js
- renderer.js
- characters.py
- Review Focus
- src/flags.js
- progressService.js
- worldService.test.js
- crop_trainer_sprites.py
- useBattle.js
- createRoomState
- resetService.test.js
- createBattleSessionService
- build_sheet
- Aurelia art bible
- balance-sim.js
- test_rooms.py
- palette.py
- dependencies
- scripts
- createMatchRegistry
- Still to draw
- PlaygroundStage.jsx
- gen_overworld_placeholders.py
- Battle sessions (Phase 3 + Phase 4 party, JWT)
- catchFormula.test.js
- Proportions
- fs
- Overworld art overhaul: plan for review
- campaign.js
- File format
- Stage 1: plan
- db.js
- bootstrap-dev-sprites.js
- plain_windows
- start-battle-engine.js
- ref_path
- vercel.json
- Overworld art pipeline
- battleService.js
- paint_mart
- build_all.py
- battleSessionService.pvp.test.js
- paint_cottage
- setup-battle-engine.js
- stepService.test.js
- legendary/manifest.json
- overworld/manifest.json
- json
- mass_top
- express
- Catching wild Pokémon
- sky_tile
- party.js
- games.js
- mart.js
- moves.js
- socketAuth.test.js
- Environment variables
- Restore methods
- pathlib
- config/flags.js

## God Nodes (most connected - your core abstractions)
1. `new_tiles()` - 87 edges
2. `Tile` - 85 edges
3. `react` - 71 edges
4. `createBattleSessionService()` - 64 edges
5. `_battle()` - 47 edges
6. `_resolve()` - 47 edges
7. `Button()` - 46 edges
8. `CampaignError` - 43 edges
9. `createOverworld()` - 42 edges
10. `Panel()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `Known balance soft spots (honest)` --references--> `statAtLevel()`  [INFERRED]
  docs/QA_CAMPAIGN_CHECKLIST.md → backend/src/campaign/hydrate.js
- `2.1 Content (static JSON, `backend/data/`)` --references--> `statAtLevel()`  [INFERRED]
  docs/superpowers/plans/overworld-architecture.md → backend/src/campaign/hydrate.js
- `Task 2: Level-50 party snapshot` --references--> `lookupSpecies()`  [INFERRED]
  docs/superpowers/plans/2026-11-20-pvp-elo-anticheat.md → backend/src/campaign/hydrate.js
- `Non-goals` --references--> `canStand()`  [INFERRED]
  docs/superpowers/specs/2026-11-20-pvp-elo-anticheat-design.md → backend/src/world/maps.js
- `Evolution (Phase 9 — no migration needed)` --references--> `moves()`  [INFERRED]
  database/README.md → frontend/src/v2/overworld/maps/pipeline.js

## Import Cycles
- None detected.

## Communities (174 total, 26 thin omitted)

### Community 0 - "movePlaygroundService.test.js"
Cohesion: 0.14
Nodes (15): createMovePlaygroundService(), buildMon(), runExchange(), assert, { CampaignError }, CHARMANDER, { createMovePlaygroundService }, { describe, it } (+7 more)

### Community 1 - "battleStatus.js"
Cohesion: 0.10
Nodes (34): applyAttract(), applyConfusion(), applyDisable(), applyStatChanges(), applyStatus(), cureStatus(), executeBeat(), runBeat() (+26 more)

### Community 2 - "park.test.js"
Cohesion: 0.09
Nodes (24): DATA_DIR, clamp(), { DATA_DIR }, fs, getParkTable(), parkLevels(), path, STAGE_CAP (+16 more)

### Community 3 - "CampaignError"
Cohesion: 0.09
Nodes (38): CampaignError, hydrateParty(), { CampaignError }, ENCOUNTER_FILE, findTrainerBattle(), fs, getEncounter(), getExtraTrainer() (+30 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.11
Nodes (18): axios, name, private, type, version, autoprefixer, eslint, eslint-plugin-react (+10 more)

### Community 5 - "server.js"
Cohesion: 0.05
Nodes (38): apiLimiter, app, attachPlayground, authLimiter, battleRoutes, bodyParser, campaignRoutes, cors (+30 more)

### Community 6 - "combat.py"
Cohesion: 0.12
Nodes (26): _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _crit_stage(), _has_major_status(), _hit_check() (+18 more)

### Community 7 - "rewardService.js"
Cohesion: 0.10
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
Cohesion: 0.10
Nodes (24): Art, bastian(), cinder(), coral(), drake(), draw(), face(), figure() (+16 more)

### Community 13 - "martService.test.js"
Cohesion: 0.12
Nodes (23): createMartService(), getMart(), getStock(), getStore(), isAvailable(), purchase(), requiredUnlockedLevel(), createMemoryMartStore() (+15 more)

### Community 14 - "backend/package.json"
Cohesion: 0.07
Nodes (26): author, description, devDependencies, nodemon, axios, dotenv, keywords, license (+18 more)

### Community 15 - "moveLearnService.test.js"
Cohesion: 0.14
Nodes (21): createMemoryLearnsetStore(), createMemoryMoveStore(), createMoveLearnService(), getLearnsetStore(), getMoveStore(), getPendingLearns(), processLevelUp(), resolveLearn() (+13 more)

### Community 16 - "matches.test.js"
Cohesion: 0.10
Nodes (20): assert, { createBattleAi }, { createBattleSessionService }, { createMatchRegistry, CHALLENGE_MS, ROUND_MS, MAX_MATCHES }, { describe, it }, mon(), move, NAMES (+12 more)

### Community 17 - "TrainerScreen.jsx"
Cohesion: 0.19
Nodes (17): badgeCount(), TrainerRecord(), MartScreen(), CARD_THEMES, CardEditor(), Row(), TrainerScreen(), hpTone() (+9 more)

### Community 18 - "OverworldScreen.jsx"
Cohesion: 0.08
Nodes (44): LAIRS, note(), parseVoice(), PITCH, playTrack(), pump(), stopMusic(), trackFor() (+36 more)

### Community 19 - "authService.js"
Cohesion: 0.11
Nodes (18): mysql, pool, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN }, login(), pool, register() (+10 more)

### Community 20 - "puzzles.generated.js"
Cohesion: 0.31
Nodes (18): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+10 more)

### Community 21 - "nature.py"
Cohesion: 0.03
Nodes (60): trunk_gym(), _bloom(), _blurred(), bush(), bush_body(), _canopy(), _cells(), crops() (+52 more)

### Community 22 - "legendaries.py"
Cohesion: 0.07
Nodes (29): Overworld art changelog, Stage 2a: deterministic builds, Stage 2b: v2 tiles (approved from the slice), Stage 3a: v1 polish, side views and legs (whole cast), Stage 3b/3c: environment pass (tileset + Origin Town), Stage 3b: distinct building designs (v3), Stage 3d: home staircase redraw, Stage 3d: interiors (Care Centre, Mart, home) and door warps (+21 more)

### Community 23 - "hydrate.js"
Cohesion: 0.10
Nodes (24): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, getPokedexDb(), hydrateFromSpecies() (+16 more)

### Community 24 - "test_dressing.py"
Cohesion: 0.08
Nodes (8): cells(), Ground, layer(), OffTheMeadow, Route, Shadows, Terrain, Towns

### Community 25 - "App.jsx"
Cohesion: 0.09
Nodes (25): App(), AuthScreen, BagScreen, DexEntryScreen, DexScreen, HistoryScreen, HubScreen, JourneyScreen (+17 more)

### Community 26 - "Tables"
Cohesion: 0.11
Nodes (18): Intent, Left open (not part of this design), Route 1 grass (Lv 2-5), Route 2 grass (Lv 8-12), Route 2 pond (Lv 8-12), Route 3 grass (Lv 13-17), Route 4 grass (Lv 18-23), Route 4 shore (Lv 18-23) (+10 more)

### Community 27 - "createPartyService"
Cohesion: 0.09
Nodes (33): FEMALE_ONLY_IDS, GENDERLESS_IDS, MALE_ONLY_IDS, rollGenderForSpecies(), assert, { describe, it }, { rollGenderForSpecies }, createMysqlPartyStore() (+25 more)

### Community 28 - "Playground: Mart stall, park wild Pokémon by time of day, battle stands"
Cohesion: 0.15
Nodes (12): Approaches (wild Pokémon), Battle stands, Decisions (my defaults, approved), Intent, Left to the builder, Mart stall, Non-goals, Park wild table (`backend/data/encounters/park.json`) (+4 more)

### Community 30 - "test_cast.py"
Cohesion: 0.07
Nodes (7): Builds, iris_of(), Leaders, Milestone3, Players, stand(), torso_width()

### Community 31 - "level1.py"
Cohesion: 0.12
Nodes (14): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, Stats, XPUpdateRequest (+6 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "battleSessionService.js"
Cohesion: 0.09
Nodes (24): { addVoice, introLine, usesPlayerName }, { CampaignError }, { createBattleAi, effectiveness }, createPvpSession(), createMysqlHistoryStore(), createMysqlHpStore(), createMysqlPpStore(), crypto (+16 more)

### Community 34 - "finish"
Cohesion: 0.13
Nodes (17): build(), chamber(), front(), grove(), legend_script(), place_legend(), hall(), lab() (+9 more)

### Community 35 - "schemas.js"
Cohesion: 0.17
Nodes (11): battleSchema, encounterCatalogSchema, encounterSchema, extraTrainerCatalogSchema, legendaryBattleSchema, levelSchema, partyMemberSchema, trainerBattleSchema (+3 more)

### Community 36 - "Database"
Cohesion: 0.13
Nodes (15): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed), Migrations (+7 more)

### Community 37 - "fetch_frlg_sprites.py"
Cohesion: 0.07
Nodes (19): _is_valid_existing(), main(), download_and_validate(), test_downloads_and_validates_known_sprite(), test_raises_on_404(), _fetch_all_category_members(), _get_json(), resolve_dex_map() (+11 more)

### Community 38 - "buildings.py"
Cohesion: 0.11
Nodes (11): _awning(), center(), _emblem(), _finish(), home(), lab(), mart(), _prop() (+3 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "startBattle"
Cohesion: 0.18
Nodes (12): parkBattle(), resolveWildTable(), resolveWorldTrainer(), startBattle(), defeatedFlag(), playerName(), Task 2: Park wild table, party-scaled levels, and server gating, 5.1 The battle-session decoupling (needed from Phase 4 on) (+4 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.17
Nodes (12): Architecture (short), Combat unit tests, Contributing, Database, Feature surface (current), Folder structure, License, Pokemon Origins (+4 more)

### Community 42 - "PlaygroundScreen.jsx"
Cohesion: 0.15
Nodes (21): cache, fetchProfile(), isGuestId(), ChatLog(), Composer(), Roster(), RosterRow(), time() (+13 more)

### Community 43 - "pokemonDetailService.test.js"
Cohesion: 0.05
Nodes (47): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router, formatEvolutionRequirement(), { slugToTitleCase } (+39 more)

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
Cohesion: 0.10
Nodes (36): collisionAt(), fail(), MapError, parseObject(), parseTiledMap(), propsToObject(), createWorld(), maps (+28 more)

### Community 49 - "pvpLadderService.js"
Cohesion: 0.10
Nodes (25): dayKey(), expected(), rate(), assert, { describe, it }, { rate, expected, dayKey, RATED_PER_PAIR_PER_DAY }, BOARDS, createMemoryLadderStore() (+17 more)

### Community 50 - "trainerVoice.test.js"
Cohesion: 0.10
Nodes (15): addVoice(), fill(), introLine(), overworldLines(), { addVoice, introLine, overworldLines }, assert, champion, { describe, it } (+7 more)

### Community 51 - "Overworld Architecture — Phase 0 Audit and Design"
Cohesion: 0.11
Nodes (18): hasWonBattle(), 0. Baseline (measured this session), 10. Questions (decisions I will not guess), 11. What I need from you to start Phase 1, 12. Decisions recorded (Phase 0 approved 2026-11-03), 13. Phase 8c (new): Gemini-generated ambient NPC dialogue, 1. Items in the repo that contradict the brief (need your ruling), 2.1 Content (static JSON, `backend/data/`) (+10 more)

### Community 52 - "BagScreen.jsx"
Cohesion: 0.13
Nodes (25): PokemonSprite(), typeColor(), DRAIN_MS, applyDrop(), MAX_PARTY, BagScreen(), effectOf(), NEEDS_TARGET (+17 more)

### Community 53 - "trainers.js"
Cohesion: 0.12
Nodes (15): battleHistoryQuerySchema, trainerCardSchema, trainerIdParamsSchema, validateParams(), express, profileService, { requireAuth }, resetService (+7 more)

### Community 54 - "gymPuzzles.test.js"
Cohesion: 0.18
Nodes (12): assert, { createFlagService, createMemoryFlagStore }, { describe, it, before }, gyms, loader, createFlagService(), createMemoryFlagStore(), createMysqlFlagStore() (+4 more)

### Community 55 - "new_tiles"
Cohesion: 0.03
Nodes (76): rope_rail(), _brick_at(), bush(), door(), flowers_decal(), grass(), gym(), gym_sign() (+68 more)

### Community 56 - "createOverworld"
Cohesion: 0.11
Nodes (43): ALERT_TICKS, createOverworld(), advanceRoom(), beginWarp(), bumpRoom(), enterRoom(), enterTriggers(), handleActorEvent() (+35 more)

### Community 57 - "defaultGetWildBattle"
Cohesion: 0.22
Nodes (10): defaultGetWildBattle(), rollWild(), Global Constraints, Review Focus, Task 1: Weighted wild tables and the roll, Task 2: Rules check for the tables, Task 3: Trade evolutions at Lv 37, Task 5: Check it in the game (+2 more)

### Community 58 - "town_art.py"
Cohesion: 0.04
Nodes (50): Outlines and shadows, Tile layers, floor(), sand(), speck(), base_shadow(), fence_tile(), leaf_mass() (+42 more)

### Community 59 - "Button"
Cohesion: 0.15
Nodes (32): Task 6: Battle stands (client), accLabel(), BagMenu(), CommandMenu(), effectLabel(), effectTone(), LearnMenu(), lowPp() (+24 more)

### Community 60 - "gymPuzzles.js"
Cohesion: 0.22
Nodes (11): buildPuzzle(), { CampaignError }, engine, FILE, fs, getGymPuzzle(), listGymPuzzles(), load() (+3 more)

### Community 61 - "playground/movement.test.js"
Cohesion: 0.11
Nodes (12): { canStand }, freshBudget(), spawnPoint(), standOnPlayground(), assert, { canStand }, { describe, it }, { validateStep, freshBudget, STEP_BURST, ROOM_WIDTH, ROOM_HEIGHT, spawnPoint, SPAWN_RADIUS_PX, CHAT_RADIUS_PX, TILE_PX } (+4 more)

### Community 62 - "battleBeats.js"
Cohesion: 0.06
Nodes (48): hit(), BattlePokemonSprite(), BATTLE_SEATS, BATTLE_SPRITE_BASE, getBattleSprite(), DEX_MAX, DEX_MIN, getPokemonSprite() (+40 more)

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
Nodes (35): Original / CC0 (new work), Task 3: Grass patch, encounters, and park battles in the Playground, gate(), blob_mask(), afloat(), gate(), hollow_lab_door(), playground() (+27 more)

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.22
Nodes (8): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), Known balance soft spots (honest), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "Tile"
Cohesion: 0.04
Nodes (71): bakery(), belt(), face(), floor(), cap(), make(), disc(), dojo() (+63 more)

### Community 69 - "sheets.py"
Cohesion: 0.08
Nodes (23): blink(), despeckle(), hex_rgba(), _mat(), outline(), render(), resolve(), shade() (+15 more)

### Community 70 - "middleware/validate.js"
Cohesion: 0.06
Nodes (39): authService, express, router, { validateBody, loginSchema }, battleActionSchema, battleStartSchema, calculateDamageSchema, gymSolveSchema (+31 more)

### Community 71 - "starterService.test.js"
Cohesion: 0.12
Nodes (18): createMemoryPartyStore(), createStarterService(), chooseStarter(), listStarters(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats() (+10 more)

### Community 72 - "pil"
Cohesion: 0.20
Nodes (3): render(), rows_below(), seats()

### Community 73 - "bodies.py"
Cohesion: 0.27
Nodes (5): _hero_views(), _nudge(), _views(), mirror(), swap()

### Community 74 - "ref_node_assert"
Cohesion: 0.04
Nodes (53): assert, campaignService, {
	createProgressService,
	createMemoryStore,
}, { describe, it, before }, fs, GYM_LEVELS, loader, { loadRewardPool } (+45 more)

### Community 75 - "world/maps.test.js"
Cohesion: 0.31
Nodes (6): canStand(), getMap(), index, assert, { canStand, getMap }, { describe, it }

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.29
Nodes (7): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Reduced motion, Timing, Title showcase, idle()

### Community 78 - "battleSessionService.test.js"
Cohesion: 0.06
Nodes (40): createMemoryHistoryStore(), createMemoryHpStore(), createMemoryPpStore(), assert, { CampaignError }, { createBattleAi }, {
	createBattleSessionService,
	createMemoryHistoryStore,
	snapshotPokemon,
	rollWild,
}, { createFlagService, createMemoryFlagStore } (+32 more)

### Community 79 - "getErrorMessage"
Cohesion: 0.11
Nodes (27): api, getErrorMessage(), API_URL, isEnabled, UserContext, useUser(), AuthScreen(), Field() (+19 more)

### Community 80 - "clock.test.js"
Cohesion: 0.31
Nodes (6): createSkyWatch(), assert, { describe, it }, { timeOfDay, createSkyWatch }, timeOfDay(), Task 1: Server clock and shared sky

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
Nodes (48): BUMP_TICKS, COL, DIRS, HOP_ARC, HOP_TICKS, LEDGE_DIR, RUN_TICKS, TICK_HZ (+40 more)

### Community 85 - "test_route.py"
Cohesion: 0.08
Nodes (8): Task 4: Shore encounter zones on Routes 2, 4 and 7, Bridge, DawnbrookStarterGate, Ground, layer(), Route1, ShoreZones, WornTrail

### Community 87 - "test_slice.py"
Cohesion: 0.07
Nodes (20): fence(), _field(), ground_layer(), house(), luma(), mean_saturation(), opaque(), player_frames() (+12 more)

### Community 88 - "react"
Cohesion: 0.08
Nodes (34): Palette, Primitives (`frontend/src/v2/ui/`), Rules, Style Guide — Pokemon Origins, Typography, initialTheme(), useTheme(), AppShell() (+26 more)

### Community 90 - "auth.js"
Cohesion: 0.08
Nodes (22): jwt, { JWT_SECRET }, requireAuth(), evolutionConfirmSchema, evolutionService, express, { requireAuth }, router (+14 more)

### Community 91 - "profileService.js"
Cohesion: 0.20
Nodes (15): CARD_THEMES, getBattleHistory(), getPublicProfile(), levelName(), loader, profileError(), summarizeCampaign(), summarizeRecord() (+7 more)

### Community 92 - "Gym leaders"
Cohesion: 0.10
Nodes (19): 1. Willow Thornby: Grass, Mossgate Grove, 2. Mara Quill: Normal, Hearthfield, 3. Tavish Rook: Fighting, Ironbrook, 4. Coral Marlowe: Water, Saltmere Harbor, 5. Volt Dray: Electric, Dynamo Station, 6. Skye Corvin: Flying, Gale Spire, 7. Sage Ilmara: Psychic, Starfall Observatory, 8. Cinder Valko: Fire, Emberhold (+11 more)

### Community 93 - "DialogueBox"
Cohesion: 0.18
Nodes (16): 6. Proposed module layout, formatStatLabel(), STAT_LABELS, DexEntryScreen(), dexNo(), Matchups(), dexNo(), DexScreen() (+8 more)

### Community 94 - "PixelSprite.jsx"
Cohesion: 0.28
Nodes (6): halfPixelate(), PixelSprite(), CLEAR, INK, PINK, RED

### Community 101 - "index.js"
Cohesion: 0.09
Nodes (24): createChatRing(), push(), isRateLimited(), sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, attachPlayground() (+16 more)

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
Nodes (46): Light at runtime, Layout tokens, coverAt(), actorPixel(), coverage(), BAYER, CLOUD_ROWS, clouds() (+38 more)

### Community 106 - "characters.py"
Cohesion: 0.18
Nodes (6): _hero(), _as_list(), make(), head(), grid(), row()

### Community 107 - "Review Focus"
Cohesion: 0.29
Nodes (6): Global Constraints, Manual check (user), Playground: Mart Stall, Park Wild Pokémon, Battle Stands — Implementation Plan, Review Focus, Task 4: Mart stall, parkBusy()

### Community 108 - "src/flags.js"
Cohesion: 0.38
Nodes (4): createFlags(), isEnabled(), defaults, truthy()

### Community 109 - "progressService.js"
Cohesion: 0.15
Nodes (19): countBattles(), { CampaignError }, createMysqlStore(), createProgressService(), assertLevelUnlocked(), completeBattle(), getOrCreate(), getProgress() (+11 more)

### Community 110 - "worldService.test.js"
Cohesion: 0.33
Nodes (8): createMemoryWorldStore(), createMysqlWorldStore(), createWorldService(), storyFlag(), assert, { createWorldService, createMemoryWorldStore, storyFlag }, make(), test

### Community 111 - "crop_trainer_sprites.py"
Cohesion: 0.33
Nodes (4): build_throw_strip(), colorkey_to_alpha(), head_center_x(), main()

### Community 112 - "useBattle.js"
Cohesion: 0.14
Nodes (12): appearsAtOnce(), IDLE_FX, foe(), mon(), state(), STRUGGLE_MOVE, TEXT_SPEEDS, useBattle() (+4 more)

### Community 113 - "createRoomState"
Cohesion: 0.19
Nodes (8): colorFor(), createRoomState(), addPlayer(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 114 - "resetService.test.js"
Cohesion: 0.19
Nodes (10): createResetService(), getPool(), resetTrainer(), DEFAULT_PROGRESS, defaultService, { STARTING_COINS }, assert, { createResetService, DEFAULT_PROGRESS } (+2 more)

### Community 116 - "createBattleSessionService"
Cohesion: 0.14
Nodes (33): clonePokemon(), createBattleSessionService(), applyWinAward(), checkPvpAction(), confusionSelfHit(), endOfRoundChip(), fullHealPartyIfEarned(), getOwnedSession() (+25 more)

### Community 117 - "build_sheet"
Cohesion: 0.16
Nodes (9): main(), ui_art(), key_colour(), ramp_for(), contact_sheet(), walk_gif(), build_sheet(), edge_colours() (+1 more)

### Community 118 - "Aurelia art bible"
Cohesion: 0.25
Nodes (7): Aurelia art bible, Buildings, Characters, Frame, Ground, Light and value, Reference rule

### Community 119 - "balance-sim.js"
Cohesion: 0.10
Nodes (20): {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
}, enemyLevels(), loader, { loadRewardPool }, main(), OFFER_BATTLE_TYPES, pad(), {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} (+12 more)

### Community 124 - "test_rooms.py"
Cohesion: 0.12
Nodes (3): Lab, OwnRooms, reachable()

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 127 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:components, test:sprites

### Community 128 - "createMatchRegistry"
Cohesion: 0.21
Nodes (17): createMatchRegistry(), act(), armRoundTimer(), challenge(), end(), expire(), forfeit(), respond() (+9 more)

### Community 129 - "Still to draw"
Cohesion: 0.25
Nodes (5): Art / audio needed from a human, Mossgate placeholders, Still to draw, bridge_rails(), ledge_col()

### Community 131 - "PlaygroundStage.jsx"
Cohesion: 0.12
Nodes (29): VIEW_H, VIEW_W, computeScale(), computeCamera(), createAssets(), want(), loadAssets(), loadImage() (+21 more)

### Community 134 - "gen_overworld_placeholders.py"
Cohesion: 0.11
Nodes (16): build_tiles(), check(), house(), main(), MapBuilder, merge(), paint(), pal() (+8 more)

### Community 136 - "Battle sessions (Phase 3 + Phase 4 party, JWT)"
Cohesion: 0.19
Nodes (12): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Boss reward cards (Phase 6, extended Phase 10), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules (+4 more)

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
Cohesion: 0.18
Nodes (10): Collision layer, Conventions, File format, Map properties, Maps: authoring guide, Not checked, Object layers, Pipeline (+2 more)

### Community 143 - "Stage 1: plan"
Cohesion: 0.12
Nodes (15): Baseline, Commands you will run (after each stage), Decisions I need you to OK, Engine contract (verified in code), Files to change, Master palette plan, Overworld art refinement: audit (stage 0) and plan (stage 1), Stage 0: audit (+7 more)

### Community 144 - "db.js"
Cohesion: 0.29
Nodes (6): mysql, pool, promisePool, rawQuery, TRANSIENT_ERROR_CODES, defaultLoadChart()

### Community 147 - "bootstrap-dev-sprites.js"
Cohesion: 0.20
Nodes (8): DEST, FALLBACK, fs, missing, path, placeholder, ROOT, SRC

### Community 149 - "start-battle-engine.js"
Cohesion: 0.18
Nodes (8): args, child, { cmd, argsPrefix, useShell }, engineDir, fs, path, root, { spawn }

### Community 150 - "ref_path"
Cohesion: 0.22
Nodes (6): inventoryService, main(), parseArgs(), path, vite, @vitejs/plugin-react

### Community 156 - "battleService.js"
Cohesion: 0.20
Nodes (9): axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, getLevel1(), proxyError(), turnOrder() (+1 more)

### Community 157 - "paint_mart"
Cohesion: 0.19
Nodes (7): bottle(), box_item(), glass_counter(), glass_pane(), paint_mart(), potion(), shelf_unit()

### Community 158 - "build_all.py"
Cohesion: 0.14
Nodes (6): main(), pixel_rows(), grove(), BuiltMaps, tile_ids(), tileset_image()

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

### Community 167 - "mass_top"
Cohesion: 0.09
Nodes (11): main(), render(), draw(), tile_img(), colours(), RouteDressing, _courses(), mass_face() (+3 more)

### Community 168 - "express"
Cohesion: 0.11
Nodes (16): inventoryUseSchema, rewardClaimSchema, db, express, router, express, inventoryService, { requireAuth } (+8 more)

### Community 169 - "Catching wild Pokémon"
Cohesion: 0.25
Nodes (7): Approaches, Catching wild Pokémon, Details (my calls), Intent, Left to the builder, Non-goals, Rules (user's)

### Community 170 - "sky_tile"
Cohesion: 0.22
Nodes (3): SkyAndPlains, _cloudiness(), sky_tile()

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

### Community 176 - "socketAuth.test.js"
Cohesion: 0.32
Nodes (5): createSocketAuthMiddleware(), sanitizeGuestName(), assert, { createSocketAuthMiddleware }, { describe, it }

### Community 177 - "Environment variables"
Cohesion: 0.50
Nodes (4): Backend (`backend/.env`), Battle engine (`battle-engine/.env`), Environment variables, Frontend (`frontend/.env`)

### Community 179 - "Restore methods"
Cohesion: 0.67
Nodes (3): Docker Compose (recommended), Manual, Restore methods

### Community 180 - "pathlib"
Cohesion: 0.09
Nodes (14): determine_turn_order(), add_experience_endpoint(), calculate_damage(), health_check(), read_root(), turn_order(), add_experience(), get_move_category() (+6 more)

### Community 190 - "config/flags.js"
Cohesion: 0.28
Nodes (7): createFlags(), defaults, NAMES, assert, { createFlags }, test, truthy()

## Knowledge Gaps
- **979 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+974 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1614 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `playground()` connect `world_maps.py` to `startBattle`, `finish`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `Task 2: Park wild table, party-scaled levels, and server gating` connect `startBattle` to `park.test.js`, `CampaignError`, `world_maps.py`, `Review Focus`, `clock.test.js`, `createBattleSessionService`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `createBattleSessionService()` connect `createBattleSessionService` to `createMatchRegistry`, `battleSessionService.js`, `battleStatus.js`, `CampaignError`, `index.js`, `startBattle`, `Battle sessions (Phase 3 + Phase 4 party, JWT)`, `battleSessionService.test.js`, `matches.test.js`, `Overworld Architecture — Phase 0 Audit and Design`, `authService.js`, `defaultGetWildBattle`, `battleService.js`, `battleSessionService.pvp.test.js`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _979 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `movePlaygroundService.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Should `battleStatus.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10317460317460317 - nodes in this community are weakly interconnected._
- **Should `park.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08547008547008547 - nodes in this community are weakly interconnected._