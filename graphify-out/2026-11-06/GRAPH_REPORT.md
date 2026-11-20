# Graph Report - Pokemon-Origins  (2026-11-05)

## Corpus Check
- 488 files · ~640,621 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 16, (none) 12, .example 4)

## Summary
- 3591 nodes · 7740 edges · 192 communities (163 shown, 29 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 680 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63b1d087`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan
- battleSessionService.js
- BattlePokemonSprite
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
- level1.py
- authService.js
- puzzles.generated.js
- App.jsx
- legendaries.py
- hydrate.js
- test_dressing.py
- Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan
- move
- createPartyService
- tiles.py
- chat.test.js
- test_cast.py
- Move
- dependencies
- balance-sim.js
- OverworldScreen.jsx
- pokemonDetailService.js
- Database
- fetch_frlg_sprites.py
- buildings.py
- validate-sprites.js
- Battle System + Pokédex — GBA/FRLG Visual & UX Redesign
- Pokemon Origins
- TrainerScreen.jsx
- pokemonDetailService.test.js
- createTypeEffectivenessService
- Required behavior
- High-Level Design (HLD) — Pokemon Origins
- Button
- pipeline.js
- battleService.js
- trainerVoice.test.js
- Overworld Architecture — Phase 0 Audit and Design
- createChatRing
- auth.js
- World.jsx
- tiles_v2.py
- createOverworld
- battleBeats.js
- town_art.py
- react
- new_tiles
- fence
- campaign.js
- Move Lab — Battle Engine Move-Testing Playground
- index.js
- devDependencies
- world_maps.py
- QA — Campaign Loop Checklist (Phase 11)
- Tile
- GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan
- trainers.js
- starterService.test.js
- sheets.py
- evolutions.js
- GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan
- top
- README.md
- Animation Guide — Pokemon Origins
- build_sprites.py
- GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan
- GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan
- gymPuzzles.js
- SheetTests
- Frontend — Pokemon Origins
- constants.js
- assets.test.js
- middleware/validate.js
- test_slice.py
- TitleScreen.jsx
- Gen 1 sprite sheet (source)
- PokemonSprite
- PHASES
- Gym leaders
- Panel
- createBattleSessionService
- movePlaygroundService.test.js
- profileService.js
- rbox
- GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan
- mapModel.js
- renderer.js
- characters.py
- playground.js
- ground_layer
- content.test.js
- Battle Damage Feedback
- BattleStage.jsx
- PokemonDetailRoutes.js
- createRoomState
- resetService.test.js
- attachPlayground
- hitResultLines
- REQUIRED CHANGES
- battleSessionService.test.js
- Overworld art changelog
- Global Constraints
- dependencies
- scripts
- pathlib
- build_all.py
- useBattle.js
- express
- shell
- ref_node_assert
- gen_overworld_placeholders.py
- Environment variables
- world/maps.test.js
- Proportions
- pokeApiClient.test.js
- Overworld art overhaul: plan for review
- paint_mart
- File format
- Stage 1: plan
- test_route.py
- Room
- json
- fs
- tree
- start-battle-engine.js
- ref_path
- vercel.json
- bodies.py
- MoveLabScreen.jsx
- slice_art.py
- interiors.py
- typeEffectiveness.test.js
- worldService.test.js
- Global Constraints
- setup-battle-engine.js
- snapshotPokemon
- legendary/manifest.json
- overworld/manifest.json
- slice-pokemon-sprites.py
- fence_tile
- genderService.js
- Route1
- slice_scene.py
- Aurelia art bible
- party.js
- start
- Lab
- Art / audio needed from a human
- towns.py
- battleBeats.test.js
- inventory.js
- OwnRooms
- rewards.js
- main.py
- paint_cottage
- Complete the Game: Plan
- createMessageQueue
- 1. Awaitable `addLog`
- Restore methods
- Shadows
- Terrain
- Bridge
- blob_mask
- config/flags.js
- Ground

## God Nodes (most connected - your core abstractions)
1. `Tile` - 80 edges
2. `new_tiles()` - 68 edges
3. `react` - 66 edges
4. `_battle()` - 48 edges
5. `_resolve()` - 46 edges
6. `Button()` - 46 edges
7. `createBattleSessionService()` - 45 edges
8. `Panel()` - 41 edges
9. `createOverworld()` - 39 edges
10. `CampaignError` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Known balance soft spots (honest)` --references--> `statAtLevel()`  [INFERRED]
  docs/QA_CAMPAIGN_CHECKLIST.md → backend/src/campaign/hydrate.js
- `2.1 Content (static JSON, `backend/data/`)` --references--> `statAtLevel()`  [INFERRED]
  docs/superpowers/plans/overworld-architecture.md → backend/src/campaign/hydrate.js
- `Global Constraints` --references--> `move()`  [INFERRED]
  docs/superpowers/plans/2026-09-17-playground-chat.md → backend/src/services/battleAi.test.js
- `Task 5: Frontend Playground screen (drag-to-move)` --references--> `move()`  [INFERRED]
  docs/superpowers/plans/2026-09-17-playground-drag-movement.md → backend/src/services/battleAi.test.js
- `2.2 `index.js` changes` --references--> `move()`  [INFERRED]
  docs/superpowers/specs/2026-09-17-playground-chat-design.md → backend/src/services/battleAi.test.js

## Import Cycles
- None detected.

## Communities (192 total, 29 thin omitted)

### Community 0 - "GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Player trainer sprite resolver, Task 2: Render the player's trainer during the encounter beat

### Community 1 - "battleSessionService.js"
Cohesion: 0.08
Nodes (46): { addVoice, introLine, usesPlayerName }, { CampaignError }, { createBattleAi }, applyAttract(), applyConfusion(), applyDisable(), applyStatChanges(), applyStatus() (+38 more)

### Community 2 - "BattlePokemonSprite"
Cohesion: 0.06
Nodes (44): Current State (already implemented, verified this session), Global Constraints, Real Battle Sprites Implementation Plan, Self-Review, Task 1: Unit-test the battle sprite resolver, Task 2: Commit the BattleSim wiring + new sprite assets, Task 3: Full test suite sanity check, GBA/FRLG Redesign — Phase 11: Animation State Machine — Implementation Plan (+36 more)

### Community 3 - "loader.js"
Cohesion: 0.06
Nodes (55): CampaignError, { CampaignError }, countBattles(), DATA_DIR, ENCOUNTER_FILE, findTrainerBattle(), fs, getEncounter() (+47 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.11
Nodes (17): axios, name, private, type, version, autoprefixer, eslint, eslint-plugin-react (+9 more)

### Community 5 - "server.js"
Cohesion: 0.05
Nodes (36): apiLimiter, app, attachPlayground, authLimiter, battleRoutes, bodyParser, campaignRoutes, cors (+28 more)

### Community 6 - "combat.py"
Cohesion: 0.14
Nodes (23): _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _crit_stage(), _has_major_status(), _hit_check() (+15 more)

### Community 7 - "rewardService.js"
Cohesion: 0.09
Nodes (29): makeRewards(), createMemoryRewardStore(), createMysqlRewardStore(), createRewardService(), claimOffer(), createOfferForWin(), getPendingOffer(), getPublicParty() (+21 more)

### Community 8 - "evolutionService.test.js"
Cohesion: 0.10
Nodes (28): createEvolutionService(), applyEvolutionToRow(), confirmLevelEvolution(), evolveWithStone(), findLevelEvolution(), findStoneEvolution(), getPendingEvolutions(), getStore() (+20 more)

### Community 9 - "inventoryService.test.js"
Cohesion: 0.11
Nodes (27): makeInventory(), createInventoryService(), addItem(), consumeItem(), getInventory(), getItem(), getQuantity(), getStore() (+19 more)

### Community 10 - "scripts"
Cohesion: 0.06
Nodes (31): description, devDependencies, concurrently, dotenv, engines, node, dotenv, name (+23 more)

### Community 11 - "test_combat.py"
Cohesion: 0.13
Nodes (48): _battle(), _move(), _pokemon(), _resolve(), test_accuracy_and_evasion_stages(), test_attack_stage_raises_damage(), test_attract_applies_volatile_effect(), test_battle_armor_blocks_crits() (+40 more)

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

### Community 16 - "battleAi.test.js"
Cohesion: 0.13
Nodes (15): mysql, pool, promisePool, rawQuery, TRANSIENT_ERROR_CODES, createBattleAi(), getChart(), pickMove() (+7 more)

### Community 17 - "finish"
Cohesion: 0.17
Nodes (12): build(), hall(), lab(), lobby(), opening(), room(), statues(), finish() (+4 more)

### Community 18 - "level1.py"
Cohesion: 0.17
Nodes (10): determine_turn_order(), BattleSimRequest, get_level1(), LevelBattleStartRequest, load_level1_data(), simulate_battle(), start_battle(), test_turn_order_faster_first() (+2 more)

### Community 19 - "authService.js"
Cohesion: 0.11
Nodes (17): mysql, pool, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN }, login(), pool, register() (+9 more)

### Community 20 - "puzzles.generated.js"
Cohesion: 0.31
Nodes (18): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+10 more)

### Community 21 - "App.jsx"
Cohesion: 0.11
Nodes (18): App(), Protected(), initialTheme(), useTheme(), UserContext, useUser(), AppShell(), Crest() (+10 more)

### Community 22 - "legendaries.py"
Cohesion: 0.12
Nodes (15): Stage 3e v2: legendary detailing pass, articuno(), build(), flame_fill(), grid_layer(), mew(), mewtwo(), mirror_pts() (+7 more)

### Community 23 - "hydrate.js"
Cohesion: 0.15
Nodes (22): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, displayName(), getPokedexDb() (+14 more)

### Community 24 - "test_dressing.py"
Cohesion: 0.19
Nodes (4): cells(), layer(), Route, Towns

### Community 25 - "Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan"
Cohesion: 0.11
Nodes (20): formatEvolutionRequirement(), { slugToTitleCase }, assert, { describe, it }, { formatEvolutionRequirement }, slugToTitleCase(), assert, { describe, it } (+12 more)

### Community 26 - "move"
Cohesion: 0.13
Nodes (19): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Boss reward cards (Phase 6, extended Phase 10), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), removePlayer() (+11 more)

### Community 27 - "createPartyService"
Cohesion: 0.17
Nodes (21): createMemoryPartyStore(), createMysqlPartyStore(), createPartyService(), addPokemon(), arrange(), depositByPosition(), getPartyRows(), getPcRows() (+13 more)

### Community 28 - "tiles.py"
Cohesion: 0.06
Nodes (34): Task 1: Art bible, world palette and ground, _brick_at(), bush(), door(), flower_bed(), flowers_decal(), grass(), gym() (+26 more)

### Community 29 - "chat.test.js"
Cohesion: 0.15
Nodes (12): isRateLimited(), sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, File Structure, Global Constraints, Playground Room Chat Implementation Plan (+4 more)

### Community 30 - "test_cast.py"
Cohesion: 0.13
Nodes (5): Builds, Leaders, Players, stand(), torso_width()

### Community 31 - "Move"
Cohesion: 0.16
Nodes (12): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, Stats, XPUpdateRequest (+4 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "balance-sim.js"
Cohesion: 0.11
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

### Community 34 - "OverworldScreen.jsx"
Cohesion: 0.09
Nodes (34): TICK_MS, harness(), attachInput(), BUTTONS, createInputState(), DIR_BUTTONS, drainEdges(), isTyping() (+26 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.24
Nodes (13): buildEvolutionGraph(), nodeFor(), cleanFlavorText(), createMysqlEvolutionGraphStore(), createPokemonDetailService(), findPathToId(), flattenNext(), getEvolutionStore() (+5 more)

### Community 36 - "Database"
Cohesion: 0.13
Nodes (15): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed), Inventory seeding (Phase 7, dev utility) (+7 more)

### Community 37 - "fetch_frlg_sprites.py"
Cohesion: 0.09
Nodes (12): _is_valid_existing(), main(), download_and_validate(), test_downloads_and_validates_known_sprite(), test_raises_on_404(), _fetch_all_category_members(), _get_json(), resolve_dex_map() (+4 more)

### Community 38 - "buildings.py"
Cohesion: 0.13
Nodes (9): _awning(), center(), _emblem(), _finish(), home(), lab(), mart(), trunk_gym() (+1 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "Battle System + Pokédex — GBA/FRLG Visual & UX Redesign"
Cohesion: 0.12
Nodes (16): 10. Testing approach, 11. Risks / rollback, 1. Problem statement, 2. Visual direction (binding for every phase), 3.1 Battle coordinate system, 3.2 Battle event stream vs developer log (Phase 8 core fix), 3.3 Animation state machine (Phase 11), 3.4 Move animation registry (Phase 12, deferred batch) (+8 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.17
Nodes (12): Architecture (short), Combat unit tests, Contributing, Database, Feature surface (current), Folder structure, License, Pokemon Origins (+4 more)

### Community 42 - "TrainerScreen.jsx"
Cohesion: 0.12
Nodes (30): API_URL, badgeCount(), cache, fetchProfile(), invalidateProfile(), isGuestId(), TrainerRecord(), ChatLog() (+22 more)

### Community 43 - "pokemonDetailService.test.js"
Cohesion: 0.18
Nodes (10): assert, { createPokemonDetailService }, { createTypeEffectivenessService }, { describe, it }, EVOLUTION_ROWS, fakeEvolutionStore(), fakeService(), POKEMON (+2 more)

### Community 44 - "createTypeEffectivenessService"
Cohesion: 0.33
Nodes (11): createTypeEffectivenessService(), getCombinedMultipliers(), getMatchups(), getWeaknesses(), GBA/FRLG Redesign — Polish Batch Phase 12: Pokédex Stat Bars + Resistance/Immunity Panel — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan) (+3 more)

### Community 45 - "Required behavior"
Cohesion: 0.17
Nodes (11): Data flow, Errors, Evolutions, Height/weight/category/gender/abilities, Pokédex Detail Page: PokéAPI-Sourced Types, Weaknesses, Stats, Evolutions, Problem, Required behavior, Stats (+3 more)

### Community 46 - "High-Level Design (HLD) — Pokemon Origins"
Cohesion: 0.17
Nodes (12): 1. System Overview, 2. Architectural Goals, 4.1 Browser ↔ backend, 4.2 Backend ↔ battle-engine (BFF), 4.3 Backend ↔ MySQL, 4. Component Interfaces, 5. Key user flows, 6. System qualities (as built) (+4 more)

### Community 47 - "Button"
Cohesion: 0.14
Nodes (28): formatStatLabel(), STAT_LABELS, typeColor(), BagMenu(), CommandMenu(), LearnMenu(), MoveMenu(), PartyMenu() (+20 more)

### Community 48 - "pipeline.js"
Cohesion: 0.23
Nodes (19): collisionAt(), createWorld(), checkConnections(), checkObjects(), checkReachable(), checkTiles(), checkTrainers(), checkWarps() (+11 more)

### Community 49 - "battleService.js"
Cohesion: 0.24
Nodes (7): axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, proxyError(), turnOrder()

### Community 50 - "trainerVoice.test.js"
Cohesion: 0.11
Nodes (14): addVoice(), fill(), introLine(), overworldLines(), { addVoice, introLine, overworldLines }, assert, champion, { describe, it } (+6 more)

### Community 51 - "Overworld Architecture — Phase 0 Audit and Design"
Cohesion: 0.08
Nodes (23): hasWonBattle(), 0. Baseline (measured this session), 10. Questions (decisions I will not guess), 11. What I need from you to start Phase 1, 12. Decisions recorded (Phase 0 approved 2026-11-03), 13. Phase 8c (new): Gemini-generated ambient NPC dialogue, 1. Items in the repo that contradict the brief (need your ruling), 2.1 Content (static JSON, `backend/data/`) (+15 more)

### Community 52 - "createChatRing"
Cohesion: 0.17
Nodes (14): createChatRing(), push(), recent(), Task 2: Awaitable message queue, 1. Overview, 2.1 Backend module: `backend/src/playground/chat.js`, 2.2 `index.js` changes, 2.3 Frontend: `Playground.jsx` (+6 more)

### Community 53 - "auth.js"
Cohesion: 0.08
Nodes (24): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, jwt, { JWT_SECRET }, requireAuth() (+16 more)

### Community 54 - "World.jsx"
Cohesion: 0.24
Nodes (11): clamp(), scenery(), TileArt(), Tree(), World(), BY_GENDER, mix(), PixelTrainer() (+3 more)

### Community 55 - "tiles_v2.py"
Cohesion: 0.05
Nodes (41): mown_block(), band_window(), barrel(), base_shadow(), bench(), boxed(), center_v3(), chimney() (+33 more)

### Community 56 - "createOverworld"
Cohesion: 0.11
Nodes (40): ALERT_TICKS, createOverworld(), advanceRoom(), beginWarp(), bumpRoom(), enterRoom(), enterTriggers(), handleActorEvent() (+32 more)

### Community 57 - "battleBeats.js"
Cohesion: 0.23
Nodes (14): chipSteps(), faintSteps(), planEvent(), withFallback(), CANT_MOVE_TEXT, REWARD_EVENT_TYPES, rewardLine(), STAT_LABELS (+6 more)

### Community 58 - "town_art.py"
Cohesion: 0.06
Nodes (35): Tile layers, disc(), bonsai(), gong(), _outline(), awning(), drop(), forge_pit() (+27 more)

### Community 59 - "react"
Cohesion: 0.15
Nodes (18): api, getErrorMessage(), dexNo(), DexScreen(), HubEvents(), HubScreen(), PLACES, StarterPick() (+10 more)

### Community 60 - "new_tiles"
Cohesion: 0.07
Nodes (35): _bloom(), _blurred(), bush(), _canopy(), _cells(), crops(), _decal(), doormat() (+27 more)

### Community 61 - "fence"
Cohesion: 0.18
Nodes (9): Art Overhaul Phase 0: Art Bible and One-Screen Slice Implementation Plan, Global Constraints, Review Focus, Task 2: Tree, house and fence, Task 3: Draft player, fence(), luma(), mean_saturation() (+1 more)

### Community 62 - "campaign.js"
Cohesion: 0.11
Nodes (16): completeBattleSchema, martPurchaseSchema, validateBody(), battleSessionService, campaignService, express, progressService, { requireAuth } (+8 more)

### Community 63 - "Move Lab — Battle Engine Move-Testing Playground"
Cohesion: 0.15
Nodes (12): defaultEngine(), Backend design, Engine choice, Frontend design, Move Lab — Battle Engine Move-Testing Playground, `POST /api/playground/exchange` (new route, `requireAuth`), Purpose, RNG override plumbing (Python engine) (+4 more)

### Community 64 - "index.js"
Cohesion: 0.09
Nodes (17): { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS }, { createRoomState }, { createSocketAuthMiddleware }, jwt, { JWT_SECRET }, { resolveMove, spawnPoint, CHAT_RADIUS_PX, ROOM_WIDTH, ROOM_HEIGHT }, assert, attachPlayground (+9 more)

### Community 65 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+8 more)

### Community 66 - "world_maps.py"
Cohesion: 0.08
Nodes (20): Original / CC0 (new work), grove(), _wave(), autotile_paths(), dawnbrook(), dress_grass(), dress_pond(), forest_name() (+12 more)

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.22
Nodes (8): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), Known balance soft spots (honest), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "Tile"
Cohesion: 0.05
Nodes (60): Rulings (made during planning, binding on this plan), bakery(), belt(), face(), floor(), cap(), make(), dojo() (+52 more)

### Community 69 - "GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan"
Cohesion: 0.25
Nodes (7): GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Add `currentMessage` state, give `addLog` an internal message queue, reset on round completion, Task 2: Show the real battle message in the dialog box, Task 3: Demote the developer log to a collapsed-by-default panel

### Community 70 - "trainers.js"
Cohesion: 0.12
Nodes (15): battleHistoryQuerySchema, trainerCardSchema, trainerIdParamsSchema, validateParams(), express, profileService, { requireAuth }, resetService (+7 more)

### Community 71 - "starterService.test.js"
Cohesion: 0.11
Nodes (18): createStarterService(), chooseStarter(), listStarters(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats(), STARTER_POKEMON_IDS (+10 more)

### Community 72 - "sheets.py"
Cohesion: 0.10
Nodes (19): Stage 2a: deterministic builds, blink(), despeckle(), hex_rgba(), _mat(), outline(), render(), resolve() (+11 more)

### Community 73 - "evolutions.js"
Cohesion: 0.29
Nodes (6): evolutionConfirmSchema, evolutionService, express, { requireAuth }, router, {
	validateBody,
	evolutionConfirmSchema,
}

### Community 74 - "GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Trainer sprite crop script (`scripts/crop_trainer_sprites.py`), Task 2: Battle background crop script (`scripts/crop_battle_backgrounds.py`)

### Community 75 - "top"
Cohesion: 0.39
Nodes (7): GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Create `battleLayout.js`, Task 2: Wire `BattleSim.jsx` to `battleLayout.js` and remove the now-duplicate CSS, top()

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.29
Nodes (7): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Reduced motion, Timing, Title showcase, idle()

### Community 78 - "build_sprites.py"
Cohesion: 0.20
Nodes (6): main(), ui_art(), ramp_for(), contact_sheet(), walk_gif(), build_sheet()

### Community 79 - "GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan"
Cohesion: 0.33
Nodes (5): GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Swap victory-flow buttons to `.pixel-btn` chrome

### Community 80 - "GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan"
Cohesion: 0.33
Nodes (5): GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Restyle the command panel buttons; verify RESET/RESTART semantics unchanged

### Community 81 - "gymPuzzles.js"
Cohesion: 0.09
Nodes (41): buildPuzzle(), { CampaignError }, engine, FILE, fs, getGymPuzzle(), listGymPuzzles(), load() (+33 more)

### Community 82 - "SheetTests"
Cohesion: 0.07
Nodes (5): frames(), hexs(), LegendaryTests, SheetTests, WorldTests

### Community 83 - "Frontend — Pokemon Origins"
Cohesion: 0.40
Nodes (5): Frontend — Pokemon Origins, Layout (`src/`), Local, Routes, UI rules

### Community 84 - "constants.js"
Cohesion: 0.09
Nodes (35): BUMP_TICKS, COL, DIR_NAMES, DIRS, HOP_ARC, HOP_TICKS, LEDGE_DIR, OPPOSITE (+27 more)

### Community 85 - "assets.test.js"
Cohesion: 0.36
Nodes (8): loadAssets(), loadImage(), loadLegendaries(), shinyCanvas(), swapPalette(), SPRITES, SHEET_NAMES, SHEETS

### Community 86 - "middleware/validate.js"
Cohesion: 0.08
Nodes (28): battleActionSchema, battleStartSchema, calculateDamageSchema, gymSolveSchema, idList, moveSchema, playgroundMonSchema, playgroundStagesSchema (+20 more)

### Community 87 - "test_slice.py"
Cohesion: 0.23
Nodes (3): player_frames(), Player, solid()

### Community 88 - "TitleScreen.jsx"
Cohesion: 0.07
Nodes (35): createFlags(), isEnabled(), defaults, FLAG_NAMES, isEnabled, truthy(), MAX_CAMPAIGN_LEVEL, JourneyRoad() (+27 more)

### Community 90 - "PokemonSprite"
Cohesion: 0.17
Nodes (19): PokemonSprite(), applyDrop(), MAX_PARTY, HpPanel(), PartyBalls(), useSteppedNumber(), MoveLine(), PartyBoard() (+11 more)

### Community 91 - "PHASES"
Cohesion: 0.10
Nodes (19): Master prompt: Pokemon Origins overworld + FRLG-feel overhaul, NON-NEGOTIABLE CONSTRAINTS, OPEN QUESTIONS FOR ME (answer in Phase 0 if I haven't), Phase 0: Audit and design doc (no feature code), Phase 10: Retention and extras (only if I approve), Phase 1: Overworld engine (canvas, custom, no game framework), Phase 2: Avatar system (highly detailed pixel avatars), Phase 3: Core world content and the Start menu (+11 more)

### Community 92 - "Gym leaders"
Cohesion: 0.10
Nodes (19): 1. Willow Thornby: Grass, Mossgate Grove, 2. Mara Quill: Normal, Hearthfield, 3. Tavish Rook: Fighting, Ironbrook, 4. Coral Marlowe: Water, Saltmere Harbor, 5. Volt Dray: Electric, Dynamo Station, 6. Skye Corvin: Flying, Gale Spire, 7. Sage Ilmara: Psychic, Starfall Observatory, 8. Cinder Valko: Fire, Emberhold (+11 more)

### Community 93 - "Panel"
Cohesion: 0.22
Nodes (19): Palette, Primitives (`frontend/src/v2/ui/`), Rules, Style Guide — Pokemon Origins, Typography, 7. Dialogue in-world, READ FIRST (do not skip), 6. Proposed module layout (+11 more)

### Community 94 - "createBattleSessionService"
Cohesion: 0.10
Nodes (38): clonePokemon(), createBattleSessionService(), applyWinAward(), confusionSelfHit(), endOfRoundChip(), fullHealPartyIfEarned(), getOwnedSession(), getSession() (+30 more)

### Community 98 - "movePlaygroundService.test.js"
Cohesion: 0.14
Nodes (15): createMovePlaygroundService(), buildMon(), runExchange(), assert, { CampaignError }, CHARMANDER, { createMovePlaygroundService }, { describe, it } (+7 more)

### Community 101 - "profileService.js"
Cohesion: 0.20
Nodes (15): CARD_THEMES, getBattleHistory(), getPublicProfile(), levelName(), loader, profileError(), summarizeCampaign(), summarizeRecord() (+7 more)

### Community 102 - "rbox"
Cohesion: 0.17
Nodes (13): book(), bookcase(), framed_picture(), glass_table(), mat(), paint_center(), paint_home(), paint_lab() (+5 more)

### Community 103 - "GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan, Global Constraints, Phase Completion, Task 1: Generate the flat shadow asset, Task 2: Swap the battle background to the real cropped asset, Task 3: Replace CSS blur shadows with real shadow images

### Community 104 - "mapModel.js"
Cohesion: 0.17
Nodes (14): coverAt(), fail(), MapError, OBJECT_GROUPS, parseObject(), propsToObject(), SIDES, TILE_LAYERS (+6 more)

### Community 105 - "renderer.js"
Cohesion: 0.09
Nodes (36): Outlines and shadows, VIEW_H, VIEW_W, actorPixel(), coverage(), CLOUD_ROWS, clouds(), KINDS (+28 more)

### Community 106 - "characters.py"
Cohesion: 0.21
Nodes (6): Task 7: `MessageLog.jsx` + full-width move-resolution view, remove dev-log accordion, _as_list(), make(), head(), grid(), row()

### Community 107 - "playground.js"
Cohesion: 0.17
Nodes (9): assert, { describe, it }, { playgroundExchangeSchema }, playgroundExchangeSchema, express, movePlaygroundService, { requireAuth }, router (+1 more)

### Community 108 - "ground_layer"
Cohesion: 0.21
Nodes (4): _field(), ground_layer(), variant_at(), Ground

### Community 109 - "content.test.js"
Cohesion: 0.10
Nodes (22): Party & switch rules, assert, campaignService, {
	createProgressService,
	createMemoryStore,
}, { describe, it, before }, fs, GYM_LEVELS, loader (+14 more)

### Community 110 - "Battle Damage Feedback"
Cohesion: 0.15
Nodes (12): ×0 (immune / no effect), 2. Impact tiers, 3. Damaging-move beat order, 4. Stepped HP drain, 5. `-N` damage tick, Battle Damage Feedback, Context, Decisions (resolved with the user before drafting) (+4 more)

### Community 111 - "BattleStage.jsx"
Cohesion: 0.22
Nodes (10): BATTLE_SEATS, TYPE_COLORS, FX_FAMILY, fxFamily(), getMoveAnimCategory(), RANGED_FEEL_TYPES, seatDrop(), BattleStage() (+2 more)

### Community 112 - "PokemonDetailRoutes.js"
Cohesion: 0.25
Nodes (6): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router

### Community 113 - "createRoomState"
Cohesion: 0.14
Nodes (18): colorFor(), createRoomState(), addPlayer(), getPlayer(), listPlayers(), updatePosition(), hashToUint(), PALETTE (+10 more)

### Community 114 - "resetService.test.js"
Cohesion: 0.19
Nodes (10): createResetService(), getPool(), resetTrainer(), DEFAULT_PROGRESS, defaultService, { STARTING_COINS }, assert, { createResetService, DEFAULT_PROGRESS } (+2 more)

### Community 116 - "attachPlayground"
Cohesion: 0.27
Nodes (7): attachPlayground(), createSocketAuthMiddleware(), sanitizeGuestName(), assert, { createSocketAuthMiddleware }, { describe, it }, Task 4: Wire the playground module into the backend server

### Community 117 - "hitResultLines"
Cohesion: 0.20
Nodes (15): Battle Damage Feedback Implementation Plan, File Structure, Global Constraints, Review Focus, Task 0: Branch, Task 1: Pure animation helpers, Task 3: Stepped HP drain and the `-N` tick slot in HpBox, Task 5: New hit beat — tiers, drain-then-text, `-N` tick (+7 more)

### Community 118 - "REQUIRED CHANGES"
Cohesion: 0.14
Nodes (13): 1. Movement feel (highest priority), 2. Tile and map model, 3. Camera, 4. Character sprites and NPCs, 5. Tilesets and maps, 6. Field effects and transitions, 8. Audio hooks (no music files yet), CONTEXT (+5 more)

### Community 119 - "battleSessionService.test.js"
Cohesion: 0.07
Nodes (40): createMemoryHistoryStore(), createMemoryHpStore(), createMemoryPpStore(), assert, { CampaignError }, { createBattleAi }, {
	createBattleSessionService,
	createMemoryHistoryStore,
	snapshotPokemon,
}, { createFlagService, createMemoryFlagStore } (+32 more)

### Community 124 - "Overworld art changelog"
Cohesion: 0.14
Nodes (13): Overworld art changelog, Stage 2b: v2 tiles (approved from the slice), Stage 3a: v1 polish, side views and legs (whole cast), Stage 3b/3c: environment pass (tileset + Origin Town), Stage 3b: distinct building designs (v3), Stage 3d: home staircase redraw, Stage 3d: interiors (Care Centre, Mart, home) and door warps, Stage 3d v2: interiors repainted after the FireRed room references (+5 more)

### Community 125 - "Global Constraints"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 1: Encoding + DB Config — Implementation Plan, Global Constraints, Phase Completion, Task 1: Pin `utf8mb4` charset on the MySQL pool, Task 2: Document the Workbench re-export procedure, Task 3: Standalone mojibake verification script

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 127 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:components, test:sprites

### Community 128 - "pathlib"
Cohesion: 0.10
Nodes (7): build_throw_strip(), colorkey_to_alpha(), head_center_x(), main(), render(), rows_below(), seats()

### Community 129 - "build_all.py"
Cohesion: 0.22
Nodes (5): main(), pixel_rows(), BuiltMaps, tile_ids(), tileset_image()

### Community 130 - "useBattle.js"
Cohesion: 0.11
Nodes (18): DRAIN_MS, audio(), CUE_NAMES, CUES, isSoundOn(), noiseBuffer(), play(), setSoundOn() (+10 more)

### Community 131 - "express"
Cohesion: 0.12
Nodes (14): authService, express, router, { validateBody, loginSchema }, loginSchema, registerSchema, db, express (+6 more)

### Community 133 - "ref_node_assert"
Cohesion: 0.08
Nodes (29): boot(), DATA, GAUNTLET, json(), computeCamera(), parseTiledMap(), GYM_PUZZLES, fetchFromDisk() (+21 more)

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

### Community 147 - "fs"
Cohesion: 0.18
Nodes (9): fs, DEST, FALLBACK, fs, missing, path, placeholder, ROOT (+1 more)

### Community 148 - "tree"
Cohesion: 0.24
Nodes (4): house(), tree(), hex_at(), Objects

### Community 149 - "start-battle-engine.js"
Cohesion: 0.18
Nodes (8): args, child, { cmd, argsPrefix, useShell }, engineDir, fs, path, root, { spawn }

### Community 150 - "ref_path"
Cohesion: 0.22
Nodes (6): inventoryService, main(), parseArgs(), path, vite, @vitejs/plugin-react

### Community 154 - "bodies.py"
Cohesion: 0.38
Nodes (3): _views(), mirror(), swap()

### Community 155 - "MoveLabScreen.jsx"
Cohesion: 0.29
Nodes (8): defaultMon(), MonSetupPanel(), MoveLabScreen(), STAGE_KEYS, STATUS_OPTIONS, TRI_STATE_OPTIONS, triStateToValue(), valueToTriState()

### Community 156 - "slice_art.py"
Cohesion: 0.18
Nodes (9): _flecks(), marks(), _lawn(), marks(), rgb(), _sprite(), _surface(), _trail() (+1 more)

### Community 157 - "interiors.py"
Cohesion: 0.20
Nodes (18): build(), tile_id(), center(), extras(), home(), extras(), house(), extras() (+10 more)

### Community 158 - "typeEffectiveness.test.js"
Cohesion: 0.29
Nodes (4): ALL_TYPES, assert, { createTypeEffectivenessService }, { describe, it }

### Community 159 - "worldService.test.js"
Cohesion: 0.33
Nodes (8): createMemoryWorldStore(), createMysqlWorldStore(), createWorldService(), storyFlag(), assert, { createWorldService, createMemoryWorldStore, storyFlag }, make(), test

### Community 160 - "Global Constraints"
Cohesion: 0.20
Nodes (9): GBA/FRLG Redesign — Phase 2: Asset Pipeline (Pokémon Front/Back Sprites) — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Dex → filename resolver (`scripts/frlg_sprites/resolve.py`), Task 2: Download + validate one sprite (`scripts/frlg_sprites/fetch_one.py`), Task 3: CLI driver (`scripts/fetch_frlg_sprites.py`), Task 4: Run the full fetch and validate (+1 more)

### Community 161 - "setup-battle-engine.js"
Cohesion: 0.18
Nodes (7): engineDir, fs, launcher, path, reqFile, { spawnSync }, venvDir

### Community 162 - "snapshotPokemon"
Cohesion: 0.08
Nodes (29): defaultGetPlayerParty(), sanitizeMove(), snapshotPokemon(), defaultParty(), enemyMon(), playerMon(), freshStages(), gendersFromRate() (+21 more)

### Community 163 - "legendary/manifest.json"
Cohesion: 0.50
Nodes (3): frame, frames, legendaries

### Community 164 - "overworld/manifest.json"
Cohesion: 0.50
Nodes (3): columns, rows, sheets

### Community 165 - "slice-pokemon-sprites.py"
Cohesion: 0.36
Nodes (7): chroma_to_alpha(), crop_frac(), fail(), inspect(), main(), slice_sheet(), trim_transparent()

### Community 166 - "fence_tile"
Cohesion: 0.28
Nodes (4): _prop(), _cast(), fence_tile(), Fence

### Community 167 - "genderService.js"
Cohesion: 0.25
Nodes (7): FEMALE_ONLY_IDS, GENDERLESS_IDS, MALE_ONLY_IDS, rollGenderForSpecies(), assert, { describe, it }, { rollGenderForSpecies }

### Community 168 - "Route1"
Cohesion: 0.23
Nodes (3): Ground, layer(), Route1

### Community 169 - "slice_scene.py"
Cohesion: 0.16
Nodes (10): Task 4: Compose the screen and hold for approval, main(), render(), draw(), tile_img(), before(), main(), scene() (+2 more)

### Community 170 - "Aurelia art bible"
Cohesion: 0.22
Nodes (8): Aurelia art bible, Buildings, Characters, Frame, Ground, Light and value, Light at runtime, Reference rule

### Community 171 - "party.js"
Cohesion: 0.22
Nodes (6): partyArrangeSchema, express, partyService, { requireAuth }, router, { validateBody, partyArrangeSchema }

### Community 172 - "start"
Cohesion: 0.46
Nodes (8): start(), meet(), next(), route(), step(), travel(), warpFor(), solve()

### Community 174 - "Art / audio needed from a human"
Cohesion: 0.40
Nodes (4): Art / audio needed from a human, Blocking before public hosting, Mossgate placeholders, Still to draw

### Community 175 - "towns.py"
Cohesion: 0.14
Nodes (10): gate(), hollow_lab_door(), route(), target_of(), terrain(), town(), before_in_stage(), door() (+2 more)

### Community 176 - "battleBeats.test.js"
Cohesion: 0.33
Nodes (3): hit(), ctx, view

### Community 177 - "inventory.js"
Cohesion: 0.29
Nodes (6): inventoryUseSchema, express, inventoryService, { requireAuth }, router, { validateBody, inventoryUseSchema }

### Community 179 - "rewards.js"
Cohesion: 0.29
Nodes (6): rewardClaimSchema, express, { requireAuth }, rewardService, router, { validateBody, rewardClaimSchema }

### Community 180 - "main.py"
Cohesion: 0.10
Nodes (12): XP and leveling (Phase 5), add_experience_endpoint(), calculate_damage(), health_check(), read_root(), turn_order(), add_experience(), get_type_effectiveness() (+4 more)

### Community 182 - "Complete the Game: Plan"
Cohesion: 0.50
Nodes (3): Complete the Game: Plan, Rules for every slice, Slices

### Community 184 - "1. Awaitable `addLog`"
Cohesion: 0.40
Nodes (5): 1. Awaitable `addLog`, Call sites that change (add `await`), Call sites that do NOT change (stay fire-and-forget), Contract, Timing consequence

### Community 185 - "Restore methods"
Cohesion: 0.67
Nodes (3): Docker Compose (recommended), Manual, Restore methods

### Community 190 - "config/flags.js"
Cohesion: 0.28
Nodes (7): createFlags(), defaults, NAMES, assert, { createFlags }, test, truthy()

## Knowledge Gaps
- **953 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+948 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1500 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BattleRequest` connect `combat.py` to `test_combat.py`, `level1.py`, `main.py`, `hydrate.js`, `Move Lab — Battle Engine Move-Testing Playground`, `createBattleSessionService`, `Move`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **Why does `File Structure` connect `hydrate.js` to `battleSessionService.js`, `snapshotPokemon`, `combat.py`, `battleSessionService.test.js`, `createBattleSessionService`, `campaign.js`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `Object layers` connect `File format` to `start`, `tiles.py`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _953 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `battleSessionService.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07673469387755102 - nodes in this community are weakly interconnected._
- **Should `BattlePokemonSprite` be split into smaller, more focused modules?**
  _Cohesion score 0.06079664570230608 - nodes in this community are weakly interconnected._
- **Should `loader.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._