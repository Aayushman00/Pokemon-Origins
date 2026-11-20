# Graph Report - Pokemon-Origins  (2026-11-05)

## Corpus Check
- 488 files · ~632,114 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 16, (none) 12, .example 4)

## Summary
- 3583 nodes · 7717 edges · 183 communities (161 shown, 22 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 679 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63b1d087`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan
- battleStatus.js
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
- useBattle.spec.jsx
- authService.js
- puzzles.generated.js
- HistoryScreen.jsx
- legendaries.py
- hydrate.js
- cells
- Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan
- move
- createPartyService
- new_tiles
- chat.test.js
- test_cast.py
- level1.py
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
- PlaygroundScreen.jsx
- pokemonDetailService.test.js
- createTypeEffectivenessService
- Required behavior
- High-Level Design (HLD) — Pokemon Origins
- Button
- pipeline.js
- battleService.js
- trainerVoice.test.js
- Overworld Architecture — Phase 0 Audit and Design
- Playground — Room Chat Design
- auth.js
- dojo
- tiles_v2.py
- createOverworld
- battleBeats.js
- town_art.py
- getErrorMessage
- nature.py
- ring
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
- content.test.js
- TitleScreen.jsx
- Gen 1 sprite sheet (source)
- PokemonSprite
- PHASES
- Gym leaders
- react
- createBattleSessionService
- movePlaygroundService.test.js
- profileService.js
- rbox
- harbor
- script.js
- createRenderer
- characters.py
- playground.js
- battleSessionService.js
- progressService.js
- Battle Damage Feedback
- BattleStage.jsx
- PokemonDetailRoutes.js
- createRoomState
- resetService.test.js
- socketAuth.test.js
- hitResultLines
- REQUIRED CHANGES
- battleSessionService.test.js
- Overworld art changelog
- Global Constraints
- dependencies
- scripts
- pil
- build_all.py
- vitest
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
- App.jsx
- Room
- test_buildings.py
- index.test.js
- world.test.js
- town_tiles
- crop_trainer_sprites.py
- vercel.json
- bodies.py
- MoveLabScreen.jsx
- slice_art.py
- interiors.py
- typeEffectiveness.test.js
- worldService.test.js
- games.js
- ref_path
- snapshotPokemon
- legendary/manifest.json
- overworld/manifest.json
- moves.js
- fence_tile
- File Structure
- test_route.py
- pathlib
- pixelsprite.spec.js
- party.js
- plank
- towns.py
- battleBeats.test.js
- OwnRooms
- main.py
- paint_cottage
- Complete the Game: Plan
- Restore methods
- startBattle
- roomState.test.js
- config/flags.js

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

## Communities (183 total, 22 thin omitted)

### Community 0 - "GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Player trainer sprite resolver, Task 2: Render the player's trainer during the encounter beat

### Community 1 - "battleStatus.js"
Cohesion: 0.10
Nodes (34): applyAttract(), applyConfusion(), applyDisable(), applyStatChanges(), applyStatus(), cureStatus(), executeBeat(), runBeat() (+26 more)

### Community 2 - "BattlePokemonSprite"
Cohesion: 0.06
Nodes (44): Current State (already implemented, verified this session), Global Constraints, Real Battle Sprites Implementation Plan, Self-Review, Task 1: Unit-test the battle sprite resolver, Task 2: Commit the BattleSim wiring + new sprite assets, Task 3: Full test suite sanity check, GBA/FRLG Redesign — Phase 11: Animation State Machine — Implementation Plan (+36 more)

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
Cohesion: 0.14
Nodes (24): _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _crit_stage(), _has_major_status(), _hit_check() (+16 more)

### Community 7 - "rewardService.js"
Cohesion: 0.09
Nodes (29): makeRewards(), createMemoryRewardStore(), createMysqlRewardStore(), createRewardService(), claimOffer(), createOfferForWin(), getPendingOffer(), getPublicParty() (+21 more)

### Community 8 - "evolutionService.test.js"
Cohesion: 0.10
Nodes (29): displayName(), createEvolutionService(), applyEvolutionToRow(), confirmLevelEvolution(), evolveWithStone(), findLevelEvolution(), findStoneEvolution(), getPendingEvolutions() (+21 more)

### Community 9 - "inventoryService.test.js"
Cohesion: 0.09
Nodes (31): inventoryService, main(), parseArgs(), path, makeInventory(), createInventoryService(), addItem(), consumeItem() (+23 more)

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
Cohesion: 0.14
Nodes (14): build(), hall(), lab(), lobby(), opening(), room(), statues(), route() (+6 more)

### Community 18 - "useBattle.spec.jsx"
Cohesion: 0.83
Nodes (3): foe(), mon(), state()

### Community 19 - "authService.js"
Cohesion: 0.11
Nodes (17): mysql, pool, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN }, login(), pool, register() (+9 more)

### Community 20 - "puzzles.generated.js"
Cohesion: 0.31
Nodes (18): at(), belts(), clean(), dirName(), dojo(), eq(), find(), gale() (+10 more)

### Community 21 - "HistoryScreen.jsx"
Cohesion: 0.11
Nodes (22): Palette, Primitives (`frontend/src/v2/ui/`), Rules, Style Guide — Pokemon Origins, Typography, initialTheme(), useTheme(), useUser() (+14 more)

### Community 22 - "legendaries.py"
Cohesion: 0.12
Nodes (15): Stage 3e v2: legendary detailing pass, articuno(), build(), flame_fill(), grid_layer(), mew(), mewtwo(), mirror_pts() (+7 more)

### Community 23 - "hydrate.js"
Cohesion: 0.16
Nodes (19): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, getPokedexDb(), hydrateFromSpecies() (+11 more)

### Community 24 - "cells"
Cohesion: 0.14
Nodes (5): cells(), layer(), Route, Terrain, Towns

### Community 25 - "Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan"
Cohesion: 0.11
Nodes (20): formatEvolutionRequirement(), { slugToTitleCase }, assert, { describe, it }, { formatEvolutionRequirement }, slugToTitleCase(), assert, { describe, it } (+12 more)

### Community 26 - "move"
Cohesion: 0.19
Nodes (14): listPlayers(), removePlayer(), move(), 1. Overview, 2. Prior Art Being Replaced, 3.1 Backend module: `backend/src/playground/`, 3.2 Frontend, 3. Architecture (+6 more)

### Community 27 - "createPartyService"
Cohesion: 0.11
Nodes (28): FEMALE_ONLY_IDS, GENDERLESS_IDS, MALE_ONLY_IDS, rollGenderForSpecies(), assert, { describe, it }, { rollGenderForSpecies }, createMemoryPartyStore() (+20 more)

### Community 28 - "new_tiles"
Cohesion: 0.08
Nodes (32): _brick_at(), bush(), door(), flowers_decal(), grass(), gym(), gym_sign(), herringbone() (+24 more)

### Community 29 - "chat.test.js"
Cohesion: 0.27
Nodes (9): createChatRing(), isRateLimited(), sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, attachPlayground(), Self-Review (+1 more)

### Community 30 - "test_cast.py"
Cohesion: 0.13
Nodes (5): Builds, Leaders, Players, stand(), torso_width()

### Community 31 - "level1.py"
Cohesion: 0.09
Nodes (22): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, Stats, XPUpdateRequest (+14 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "balance-sim.js"
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

### Community 34 - "OverworldScreen.jsx"
Cohesion: 0.09
Nodes (35): UserContext, TICK_MS, VIEW_H, VIEW_W, harness(), attachInput(), BUTTONS, createInputState() (+27 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.24
Nodes (13): buildEvolutionGraph(), nodeFor(), cleanFlavorText(), createMysqlEvolutionGraphStore(), createPokemonDetailService(), findPathToId(), flattenNext(), getEvolutionStore() (+5 more)

### Community 36 - "Database"
Cohesion: 0.13
Nodes (15): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed), Inventory seeding (Phase 7, dev utility) (+7 more)

### Community 37 - "fetch_frlg_sprites.py"
Cohesion: 0.05
Nodes (28): GBA/FRLG Redesign — Phase 2: Asset Pipeline (Pokémon Front/Back Sprites) — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Dex → filename resolver (`scripts/frlg_sprites/resolve.py`), Task 2: Download + validate one sprite (`scripts/frlg_sprites/fetch_one.py`), Task 3: CLI driver (`scripts/fetch_frlg_sprites.py`), Task 4: Run the full fetch and validate (+20 more)

### Community 38 - "buildings.py"
Cohesion: 0.11
Nodes (11): _awning(), center(), _emblem(), _finish(), home(), lab(), mart(), _prop() (+3 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "Battle System + Pokédex — GBA/FRLG Visual & UX Redesign"
Cohesion: 0.12
Nodes (16): 10. Testing approach, 11. Risks / rollback, 1. Problem statement, 2. Visual direction (binding for every phase), 3.1 Battle coordinate system, 3.2 Battle event stream vs developer log (Phase 8 core fix), 3.3 Animation state machine (Phase 11), 3.4 Move animation registry (Phase 12, deferred batch) (+8 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.17
Nodes (12): Architecture (short), Combat unit tests, Contributing, Database, Feature surface (current), Folder structure, License, Pokemon Origins (+4 more)

### Community 42 - "PlaygroundScreen.jsx"
Cohesion: 0.14
Nodes (25): fetchProfile(), isGuestId(), ChatLog(), Composer(), Roster(), RosterRow(), time(), PlaygroundScreen() (+17 more)

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
Cohesion: 0.09
Nodes (46): 7. Dialogue in-world, READ FIRST (do not skip), 6. Proposed module layout, typeColor(), DRAIN_MS, createMessageQueue(), REWARD_EVENT_TYPES, audio() (+38 more)

### Community 48 - "pipeline.js"
Cohesion: 0.12
Nodes (27): collisionAt(), createWorld(), checkConnections(), checkObjects(), checkReachable(), checkTiles(), checkTrainers(), checkWarps() (+19 more)

### Community 49 - "battleService.js"
Cohesion: 0.24
Nodes (7): axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, proxyError(), turnOrder()

### Community 50 - "trainerVoice.test.js"
Cohesion: 0.11
Nodes (14): addVoice(), fill(), introLine(), overworldLines(), { addVoice, introLine, overworldLines }, assert, champion, { describe, it } (+6 more)

### Community 51 - "Overworld Architecture — Phase 0 Audit and Design"
Cohesion: 0.08
Nodes (23): hasWonBattle(), 0. Baseline (measured this session), 10. Questions (decisions I will not guess), 11. What I need from you to start Phase 1, 12. Decisions recorded (Phase 0 approved 2026-11-03), 13. Phase 8c (new): Gemini-generated ambient NPC dialogue, 1. Items in the repo that contradict the brief (need your ruling), 2.1 Content (static JSON, `backend/data/`) (+15 more)

### Community 52 - "Playground — Room Chat Design"
Cohesion: 0.16
Nodes (13): push(), recent(), Task 2: Awaitable message queue, 1. Overview, 2.1 Backend module: `backend/src/playground/chat.js`, 2.2 `index.js` changes, 2.3 Frontend: `Playground.jsx`, 2. Architecture (+5 more)

### Community 53 - "auth.js"
Cohesion: 0.08
Nodes (24): jwt, { JWT_SECRET }, requireAuth(), inventoryUseSchema, martPurchaseSchema, express, inventoryService, { requireAuth } (+16 more)

### Community 54 - "dojo"
Cohesion: 0.16
Nodes (12): dojo(), bonsai(), face(), floor(), gong(), plate(), draw(), screen() (+4 more)

### Community 55 - "tiles_v2.py"
Cohesion: 0.05
Nodes (43): Object layers, mown_block(), text(), band_window(), barrel(), base_shadow(), bench(), boxed() (+35 more)

### Community 56 - "createOverworld"
Cohesion: 0.12
Nodes (41): ALERT_TICKS, createOverworld(), advanceRoom(), beginWarp(), bumpRoom(), enterRoom(), enterTriggers(), handleActorEvent() (+33 more)

### Community 57 - "battleBeats.js"
Cohesion: 0.22
Nodes (16): getMoveAnimCategory(), chipSteps(), faintSteps(), other(), planEvent(), planMove(), withFallback(), CANT_MOVE_TEXT (+8 more)

### Community 58 - "town_art.py"
Cohesion: 0.09
Nodes (23): disc(), _outline(), awning(), forge_pit(), great_dome(), gym_building(), home(), p_boulder() (+15 more)

### Community 59 - "getErrorMessage"
Cohesion: 0.19
Nodes (11): getErrorMessage(), API_URL, Card(), JourneyScreen(), RewardScreen(), TITLES, HubEvents(), HubScreen() (+3 more)

### Community 60 - "nature.py"
Cohesion: 0.07
Nodes (31): trunk_gym(), _bloom(), _blurred(), bush(), _canopy(), _cells(), crops(), _decal() (+23 more)

### Community 61 - "ring"
Cohesion: 0.13
Nodes (16): forge(), brazier(), face(), floor(), heat(), lava(), stone(), draw() (+8 more)

### Community 62 - "campaign.js"
Cohesion: 0.22
Nodes (8): completeBattleSchema, battleSessionService, campaignService, express, progressService, { requireAuth }, router, {
	validateBody,
	completeBattleSchema,
}

### Community 63 - "Move Lab — Battle Engine Move-Testing Playground"
Cohesion: 0.22
Nodes (8): defaultEngine(), Engine choice, Frontend design, Move Lab — Battle Engine Move-Testing Playground, Purpose, Scope, Testing, What's out of scope (confirmed with user)

### Community 64 - "index.js"
Cohesion: 0.15
Nodes (12): { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS }, { createRoomState }, { createSocketAuthMiddleware }, jwt, { JWT_SECRET }, { resolveMove, spawnPoint, CHAT_RADIUS_PX, ROOM_WIDTH, ROOM_HEIGHT }, clamp(), resolveMove() (+4 more)

### Community 65 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+8 more)

### Community 66 - "world_maps.py"
Cohesion: 0.08
Nodes (22): Original / CC0 (new work), Overworld art pipeline, blob_mask(), autotile_paths(), dawnbrook(), door(), dress_grass(), dress_pond() (+14 more)

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.22
Nodes (8): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), Known balance soft spots (honest), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "Tile"
Cohesion: 0.09
Nodes (22): bakery(), belt(), face(), floor(), cap(), make(), dome(), face() (+14 more)

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
Cohesion: 0.11
Nodes (18): blink(), despeckle(), hex_rgba(), _mat(), outline(), render(), resolve(), shade() (+10 more)

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
Cohesion: 0.12
Nodes (27): BUMP_TICKS, COL, DIR_NAMES, DIRS, HOP_ARC, HOP_TICKS, LEDGE_DIR, OPPOSITE (+19 more)

### Community 85 - "assets.test.js"
Cohesion: 0.36
Nodes (8): loadAssets(), loadImage(), loadLegendaries(), shinyCanvas(), swapPalette(), SPRITES, SHEET_NAMES, SHEETS

### Community 86 - "middleware/validate.js"
Cohesion: 0.08
Nodes (28): battleActionSchema, battleStartSchema, calculateDamageSchema, gymSolveSchema, idList, moveSchema, playgroundMonSchema, playgroundStagesSchema (+20 more)

### Community 87 - "content.test.js"
Cohesion: 0.17
Nodes (9): assert, campaignService, {
	createProgressService,
	createMemoryStore,
}, { describe, it, before }, fs, GYM_LEVELS, loader, { loadRewardPool } (+1 more)

### Community 88 - "TitleScreen.jsx"
Cohesion: 0.08
Nodes (31): createFlags(), isEnabled(), defaults, FLAG_NAMES, isEnabled, truthy(), MAX_CAMPAIGN_LEVEL, JourneyRoad() (+23 more)

### Community 90 - "PokemonSprite"
Cohesion: 0.16
Nodes (20): PokemonSprite(), applyDrop(), MAX_PARTY, HpPanel(), PartyBalls(), useSteppedNumber(), MoveLine(), PartyBoard() (+12 more)

### Community 91 - "PHASES"
Cohesion: 0.10
Nodes (19): Master prompt: Pokemon Origins overworld + FRLG-feel overhaul, NON-NEGOTIABLE CONSTRAINTS, OPEN QUESTIONS FOR ME (answer in Phase 0 if I haven't), Phase 0: Audit and design doc (no feature code), Phase 10: Retention and extras (only if I approve), Phase 1: Overworld engine (canvas, custom, no game framework), Phase 2: Avatar system (highly detailed pixel avatars), Phase 3: Core world content and the Start menu (+11 more)

### Community 92 - "Gym leaders"
Cohesion: 0.10
Nodes (19): 1. Willow Thornby: Grass, Mossgate Grove, 2. Mara Quill: Normal, Hearthfield, 3. Tavish Rook: Fighting, Ironbrook, 4. Coral Marlowe: Water, Saltmere Harbor, 5. Volt Dray: Electric, Dynamo Station, 6. Skye Corvin: Flying, Gale Spire, 7. Sage Ilmara: Psychic, Starfall Observatory, 8. Cinder Valko: Fire, Emberhold (+11 more)

### Community 93 - "react"
Cohesion: 0.21
Nodes (17): api, badgeCount(), cache, invalidateProfile(), NEEDS_TARGET, TrainerRecord(), CARD_THEMES, CardEditor() (+9 more)

### Community 94 - "createBattleSessionService"
Cohesion: 0.17
Nodes (26): clonePokemon(), createBattleSessionService(), applyWinAward(), confusionSelfHit(), endOfRoundChip(), fullHealPartyIfEarned(), getOwnedSession(), getSession() (+18 more)

### Community 98 - "movePlaygroundService.test.js"
Cohesion: 0.14
Nodes (15): createMovePlaygroundService(), buildMon(), runExchange(), assert, { CampaignError }, CHARMANDER, { createMovePlaygroundService }, { describe, it } (+7 more)

### Community 101 - "profileService.js"
Cohesion: 0.10
Nodes (26): CARD_THEMES, getBattleHistory(), getPublicProfile(), levelName(), loader, profileError(), summarizeCampaign(), summarizeRecord() (+18 more)

### Community 102 - "rbox"
Cohesion: 0.17
Nodes (13): book(), bookcase(), framed_picture(), glass_table(), mat(), paint_center(), paint_home(), paint_lab() (+5 more)

### Community 103 - "harbor"
Cohesion: 0.12
Nodes (14): GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Generate the flat shadow asset, Task 2: Swap the battle background to the real cropped asset, Task 3: Replace CSS blur shadows with real shadow images, harbor() (+6 more)

### Community 104 - "script.js"
Cohesion: 0.33
Nodes (6): DIRS, need(), parseScript(), ScriptError, validateScript(), VALIDATORS

### Community 105 - "createRenderer"
Cohesion: 0.09
Nodes (34): computeCamera(), actorPixel(), coverage(), CLOUD_ROWS, clouds(), KINDS, list(), particles() (+26 more)

### Community 106 - "characters.py"
Cohesion: 0.21
Nodes (6): Task 7: `MessageLog.jsx` + full-width move-resolution view, remove dev-log accordion, _as_list(), make(), head(), grid(), row()

### Community 107 - "playground.js"
Cohesion: 0.17
Nodes (9): assert, { describe, it }, { playgroundExchangeSchema }, playgroundExchangeSchema, express, movePlaygroundService, { requireAuth }, router (+1 more)

### Community 108 - "battleSessionService.js"
Cohesion: 0.14
Nodes (12): { addVoice, introLine, usesPlayerName }, { CampaignError }, { createBattleAi }, createMysqlHistoryStore(), createMysqlHpStore(), createMysqlPpStore(), crypto, defaultService (+4 more)

### Community 109 - "progressService.js"
Cohesion: 0.10
Nodes (28): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Boss reward cards (Phase 6, extended Phase 10), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules (+20 more)

### Community 110 - "Battle Damage Feedback"
Cohesion: 0.11
Nodes (17): ×0 (immune / no effect), 1. Awaitable `addLog`, 2. Impact tiers, 3. Damaging-move beat order, 4. Stepped HP drain, 5. `-N` damage tick, Battle Damage Feedback, Call sites that change (add `await`) (+9 more)

### Community 111 - "BattleStage.jsx"
Cohesion: 0.22
Nodes (9): BATTLE_SEATS, TYPE_COLORS, FX_FAMILY, fxFamily(), RANGED_FEEL_TYPES, seatDrop(), BattleStage(), monClass() (+1 more)

### Community 112 - "PokemonDetailRoutes.js"
Cohesion: 0.25
Nodes (6): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router

### Community 113 - "createRoomState"
Cohesion: 0.26
Nodes (11): createRoomState(), addPlayer(), getPlayer(), updatePosition(), Playground Drag Movement (Phase 1) Implementation Plan, Self-Review, Task 1: Movement resolution (pure function), Task 2: In-memory room state (+3 more)

### Community 114 - "resetService.test.js"
Cohesion: 0.19
Nodes (10): createResetService(), getPool(), resetTrainer(), DEFAULT_PROGRESS, defaultService, { STARTING_COINS }, assert, { createResetService, DEFAULT_PROGRESS } (+2 more)

### Community 116 - "socketAuth.test.js"
Cohesion: 0.32
Nodes (5): createSocketAuthMiddleware(), sanitizeGuestName(), assert, { createSocketAuthMiddleware }, { describe, it }

### Community 117 - "hitResultLines"
Cohesion: 0.21
Nodes (14): Battle Damage Feedback Implementation Plan, File Structure, Global Constraints, Review Focus, Task 0: Branch, Task 1: Pure animation helpers, Task 3: Stepped HP drain and the `-N` tick slot in HpBox, Task 4: Wire the queue into BattleSim and await beat lines (+6 more)

### Community 118 - "REQUIRED CHANGES"
Cohesion: 0.14
Nodes (13): 1. Movement feel (highest priority), 2. Tile and map model, 3. Camera, 4. Character sprites and NPCs, 5. Tilesets and maps, 6. Field effects and transitions, 8. Audio hooks (no music files yet), CONTEXT (+5 more)

### Community 119 - "battleSessionService.test.js"
Cohesion: 0.07
Nodes (41): createMemoryHistoryStore(), createMemoryHpStore(), createMemoryPpStore(), assert, { CampaignError }, { createBattleAi }, {
	createBattleSessionService,
	createMemoryHistoryStore,
	snapshotPokemon,
}, { createFlagService, createMemoryFlagStore } (+33 more)

### Community 124 - "Overworld art changelog"
Cohesion: 0.13
Nodes (14): Overworld art changelog, Stage 2a: deterministic builds, Stage 2b: v2 tiles (approved from the slice), Stage 3a: v1 polish, side views and legs (whole cast), Stage 3b/3c: environment pass (tileset + Origin Town), Stage 3b: distinct building designs (v3), Stage 3d: home staircase redraw, Stage 3d: interiors (Care Centre, Mart, home) and door warps (+6 more)

### Community 125 - "Global Constraints"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 1: Encoding + DB Config — Implementation Plan, Global Constraints, Phase Completion, Task 1: Pin `utf8mb4` charset on the MySQL pool, Task 2: Document the Workbench re-export procedure, Task 3: Standalone mojibake verification script

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 127 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:components, test:sprites

### Community 128 - "pil"
Cohesion: 0.20
Nodes (3): render(), rows_below(), seats()

### Community 129 - "build_all.py"
Cohesion: 0.17
Nodes (6): main(), pixel_rows(), grove(), BuiltMaps, tile_ids(), tileset_image()

### Community 130 - "vitest"
Cohesion: 0.20
Nodes (4): StartMenu(), @testing-library/react, @vitejs/plugin-react, vitest

### Community 131 - "express"
Cohesion: 0.09
Nodes (21): authService, express, router, { validateBody, loginSchema }, loginSchema, registerSchema, rewardClaimSchema, validateBody() (+13 more)

### Community 133 - "ref_node_assert"
Cohesion: 0.08
Nodes (35): createMemoryFlags(), boot(), DATA, GAUNTLET, json(), start(), meet(), next() (+27 more)

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
Cohesion: 0.15
Nodes (10): Collision layer, Conventions, File format, Map properties, Maps: authoring guide, Not checked, Pipeline, Scripts (+2 more)

### Community 143 - "Stage 1: plan"
Cohesion: 0.12
Nodes (15): Baseline, Commands you will run (after each stage), Decisions I need you to OK, Engine contract (verified in code), Files to change, Master palette plan, Overworld art refinement: audit (stage 0) and plan (stage 1), Stage 0: audit (+7 more)

### Community 144 - "App.jsx"
Cohesion: 0.12
Nodes (16): App(), Protected(), formatStatLabel(), STAT_LABELS, BagScreen(), DexEntryScreen(), dexNo(), Matchups() (+8 more)

### Community 145 - "Room"
Cohesion: 0.20
Nodes (4): floor_key(), pad(), inside(), Room

### Community 147 - "index.test.js"
Cohesion: 0.18
Nodes (5): assert, attachPlayground, { describe, it }, fakePool, { ROOM_WIDTH, ROOM_HEIGHT }

### Community 148 - "world.test.js"
Cohesion: 0.24
Nodes (8): asciiMap(), CODE, worldOf(), neighbourOrigin(), a, b, c, w

### Community 149 - "town_tiles"
Cohesion: 0.13
Nodes (15): Tile layers, sand(), speck(), drop(), ground(), lava(), mass_top(), plank() (+7 more)

### Community 150 - "crop_trainer_sprites.py"
Cohesion: 0.33
Nodes (4): build_throw_strip(), colorkey_to_alpha(), head_center_x(), main()

### Community 154 - "bodies.py"
Cohesion: 0.38
Nodes (3): _views(), mirror(), swap()

### Community 155 - "MoveLabScreen.jsx"
Cohesion: 0.29
Nodes (8): defaultMon(), MonSetupPanel(), MoveLabScreen(), STAGE_KEYS, STATUS_OPTIONS, TRI_STATE_OPTIONS, triStateToValue(), valueToTriState()

### Community 156 - "slice_art.py"
Cohesion: 0.05
Nodes (37): Art Overhaul Phase 0: Art Bible and One-Screen Slice Implementation Plan, Global Constraints, Review Focus, Task 1: Art bible, world palette and ground, Task 2: Tree, house and fence, Task 3: Draft player, Task 4: Compose the screen and hold for approval, fence() (+29 more)

### Community 157 - "interiors.py"
Cohesion: 0.21
Nodes (17): build(), tile_id(), center(), extras(), home(), extras(), house(), extras() (+9 more)

### Community 158 - "typeEffectiveness.test.js"
Cohesion: 0.29
Nodes (4): ALL_TYPES, assert, { createTypeEffectivenessService }, { describe, it }

### Community 159 - "worldService.test.js"
Cohesion: 0.13
Nodes (17): createMemoryWorldStore(), createMysqlWorldStore(), createWorldService(), storyFlag(), assert, { createWorldService, createMemoryWorldStore, storyFlag }, make(), test (+9 more)

### Community 160 - "games.js"
Cohesion: 0.29
Nodes (6): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, chooseStarterSchema

### Community 161 - "ref_path"
Cohesion: 0.06
Nodes (25): fs, vite, DEST, FALLBACK, fs, missing, path, placeholder (+17 more)

### Community 162 - "snapshotPokemon"
Cohesion: 0.07
Nodes (32): defaultGetPlayerParty(), sanitizeMove(), snapshotPokemon(), defaultParty(), enemyMon(), playerMon(), freshStages(), gendersFromRate() (+24 more)

### Community 163 - "legendary/manifest.json"
Cohesion: 0.50
Nodes (3): frame, frames, legendaries

### Community 164 - "overworld/manifest.json"
Cohesion: 0.50
Nodes (3): columns, rows, sheets

### Community 165 - "moves.js"
Cohesion: 0.29
Nodes (6): moveLearnResolveSchema, express, moveLearnService, { requireAuth }, router, {
	validateBody,
	moveLearnResolveSchema,
}

### Community 167 - "File Structure"
Cohesion: 0.33
Nodes (5): File Structure, Global Constraints, Playground Room Chat Implementation Plan, Task 1: Chat module (`chat.js`) — ring buffer, validation, rate limit, Task 3: Chat panel UI in `Playground.jsx`

### Community 168 - "test_route.py"
Cohesion: 0.05
Nodes (9): Ground, Shadows, Lab, reachable(), Bridge, Ground, layer(), Route1 (+1 more)

### Community 169 - "pathlib"
Cohesion: 0.13
Nodes (8): draw(), main(), main(), render(), draw(), tile_img(), leaders(), Portraits

### Community 170 - "pixelsprite.spec.js"
Cohesion: 0.33
Nodes (4): CLEAR, INK, PINK, RED

### Community 171 - "party.js"
Cohesion: 0.22
Nodes (6): partyArrangeSchema, express, partyService, { requireAuth }, router, { validateBody, partyArrangeSchema }

### Community 174 - "plank"
Cohesion: 0.29
Nodes (5): Art / audio needed from a human, Blocking before public hosting, Mossgate placeholders, Still to draw, plank()

### Community 175 - "towns.py"
Cohesion: 0.25
Nodes (5): gate(), hollow_lab_door(), target_of(), terrain(), town()

### Community 176 - "battleBeats.test.js"
Cohesion: 0.33
Nodes (3): hit(), ctx, view

### Community 180 - "main.py"
Cohesion: 0.09
Nodes (15): determine_turn_order(), add_experience_endpoint(), calculate_damage(), health_check(), read_root(), turn_order(), add_experience(), get_type_effectiveness() (+7 more)

### Community 182 - "Complete the Game: Plan"
Cohesion: 0.50
Nodes (3): Complete the Game: Plan, Rules for every slice, Slices

### Community 185 - "Restore methods"
Cohesion: 0.67
Nodes (3): Docker Compose (recommended), Manual, Restore methods

### Community 187 - "startBattle"
Cohesion: 0.16
Nodes (12): resolveWildTable(), startBattle(), playerName(), Battle Restart & FireRed Dialogue Box Implementation Plan, Global Constraints, Out of Scope (explicitly, from the user-supplied brief), Task 1: Backend — `force` option on battle-session restart, Task 2: Frontend — RESTART button with in-UI confirm (+4 more)

### Community 188 - "roomState.test.js"
Cohesion: 0.32
Nodes (6): colorFor(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 190 - "config/flags.js"
Cohesion: 0.28
Nodes (7): createFlags(), defaults, NAMES, assert, { createFlags }, test, truthy()

## Knowledge Gaps
- **953 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+948 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1498 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BattleRequest` connect `combat.py` to `snapshotPokemon`, `test_combat.py`, `main.py`, `startBattle`, `level1.py`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **Why does `File Structure` connect `snapshotPokemon` to `battleStatus.js`, `combat.py`, `evolutionService.test.js`, `hydrate.js`, `battleSessionService.test.js`, `startBattle`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `Object layers` connect `tiles_v2.py` to `ref_node_assert`, `File format`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _953 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `battleStatus.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10317460317460317 - nodes in this community are weakly interconnected._
- **Should `BattlePokemonSprite` be split into smaller, more focused modules?**
  _Cohesion score 0.06079664570230608 - nodes in this community are weakly interconnected._
- **Should `loader.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06363636363636363 - nodes in this community are weakly interconnected._