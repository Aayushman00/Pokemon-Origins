# Graph Report - Pokemon-Origins  (2026-09-23)

## Corpus Check
- 220 files · ~181,274 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 40 file(s) not represented in the graph (top: .ttf 20, (none) 11, .example 4)

## Summary
- 1543 nodes · 2806 edges · 110 communities (97 shown, 13 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 310 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d7363fe7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- BattleSim.jsx
- battleSessionService.js
- pokemonSprites.js
- loader.js
- frontend/package.json
- server.js
- combat.py
- rewardService.js
- evolutionService.test.js
- inventoryService.test.js
- scripts
- test_combat.py
- middleware/validate.js
- martService.test.js
- backend/package.json
- moveLearnService.test.js
- battleAi.test.js
- starterService.test.js
- progressService.js
- authService.js
- auth.js
- main.py
- socketAuth.test.js
- hydrate.js
- battleSessionService.test.js
- Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan
- move
- createPartyService
- BattlePokemonSprite
- chat.test.js
- index.js
- models.py
- dependencies
- balance-sim.js
- xpService.test.js
- pokemonDetailService.js
- Database
- fetch_frlg_sprites.py
- createChatRing
- validate-sprites.js
- Battle System + Pokédex — GBA/FRLG Visual & UX Redesign
- Pokemon Origins
- createRoomState
- pokemonDetailService.test.js
- createTypeEffectivenessService
- Required behavior
- High-Level Design (HLD) — Pokemon Origins
- pil
- slice-pokemon-sprites.py
- battleService.js
- express
- bootstrap-dev-sprites.js
- start-battle-engine.js
- content.test.js
- PokemonDetailRoutes.js
- createWalletService
- pokedex_data.sql
- Global Constraints
- resolve.py
- setup-battle-engine.js
- download_and_validate
- ref_path
- campaign.js
- trainer.js
- ref_node_assert_strict
- roomState.test.js
- loader.test.js
- QA — Campaign Loop Checklist (Phase 11)
- GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan
- GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan
- games.js
- evolutions.js
- moves.js
- rewards.js
- GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan
- GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan
- Animation Guide — Pokemon Origins
- rewardService.test.js
- GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan
- GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan
- devDependencies
- schemas.js
- Frontend — Pokemon Origins
- `reward_offers`
- `trainer_pending_move_learns`
- Style Guide — Pokemon Origins
- reorder-sql-dump.py
- Environment variables
- Gen 1 sprite sheet (source)
- `trainer_progress`
- `trainer_inventory`
- `trainer_wallet`
- Restore methods
- getAnimState
- campaignService.js
- dependencies
- Battle sessions (Phase 3 + Phase 4 party, JWT)
- typeEffectiveness.test.js
- PokemonSprite
- BattlePokemonSprite.jsx
- GBA/FRLG Redesign — Phase 6: Pokémon Sprite Rendering + Placement — Implementation Plan
- scripts

## God Nodes (most connected - your core abstractions)
1. `CampaignError` - 27 edges
2. `createBattleSessionService()` - 27 edges
3. `calculate_damage_result()` - 24 edges
4. `_battle()` - 24 edges
5. `react` - 24 edges
6. `_resolve()` - 23 edges
7. `BattlePokemonSprite()` - 20 edges
8. `createPartyService()` - 19 edges
9. `_pokemon()` - 19 edges
10. `getErrorMessage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Global Constraints` --references--> `move()`  [INFERRED]
  docs/superpowers/plans/2026-09-17-playground-chat.md → backend/src/services/battleAi.test.js
- `Task 5: Frontend Playground screen (drag-to-move)` --references--> `move()`  [INFERRED]
  docs/superpowers/plans/2026-09-17-playground-drag-movement.md → backend/src/services/battleAi.test.js
- `2.2 `index.js` changes` --references--> `move()`  [INFERRED]
  docs/superpowers/specs/2026-09-17-playground-chat-design.md → backend/src/services/battleAi.test.js
- `Inventory seeding (Phase 7, dev utility)` --references--> `addItem()`  [INFERRED]
  database/README.md → backend/src/services/inventoryService.js
- `Self-Review Notes` --references--> `getPokemonDetail()`  [INFERRED]
  docs/superpowers/plans/2026-09-18-pokedex-detail-poke-api.md → backend/src/services/pokemonDetailService.js

## Import Cycles
- 3-file cycle: `frontend/src/App.jsx -> frontend/src/pages/AuthPage/AuthPage.jsx -> frontend/src/pages/AuthPage/RegistrationForm.jsx -> frontend/src/App.jsx`
- 3-file cycle: `frontend/src/App.jsx -> frontend/src/pages/AuthPage/AuthPage.jsx -> frontend/src/pages/AuthPage/LoginForm.jsx -> frontend/src/App.jsx`
- 3-file cycle: `frontend/src/App.jsx -> frontend/src/pages/Game/Level.jsx -> frontend/src/pages/Game/BattleSim.jsx -> frontend/src/App.jsx`
- 4-file cycle: `frontend/src/App.jsx -> frontend/src/pages/Game/Game.jsx -> frontend/src/pages/Game/Level.jsx -> frontend/src/pages/Game/BattleSim.jsx -> frontend/src/App.jsx`

## Communities (110 total, 13 thin omitted)

### Community 0 - "BattleSim.jsx"
Cohesion: 0.06
Nodes (68): Primitives, GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Player trainer sprite resolver, Task 2: Render the player's trainer during the encounter beat, api (+60 more)

### Community 1 - "battleSessionService.js"
Cohesion: 0.06
Nodes (66): CampaignError, { CampaignError }, clonePokemon(), { createBattleAi }, createBattleSessionService(), applyStatChanges(), applyStatus(), cureStatus() (+58 more)

### Community 2 - "pokemonSprites.js"
Cohesion: 0.25
Nodes (13): Global Constraints, DEX_MAX, DEX_MIN, getPokemonSprite(), getPokemonSpriteFallback(), isLocalSpriteUrl(), isValidDex(), normalizeVariant() (+5 more)

### Community 3 - "loader.js"
Cohesion: 0.21
Nodes (17): { CampaignError }, DATA_DIR, ENCOUNTER_FILE, fs, getEncounter(), getTrainer(), {
	levelSchema,
	trainerCatalogSchema,
	encounterCatalogSchema,
}, listBattles() (+9 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.11
Nodes (17): axios, name, private, type, version, autoprefixer, eslint, eslint-plugin-react (+9 more)

### Community 5 - "server.js"
Cohesion: 0.06
Nodes (35): apiLimiter, app, attachPlayground, authLimiter, battleRoutes, bodyParser, campaignRoutes, cors (+27 more)

### Community 6 - "combat.py"
Cohesion: 0.14
Nodes (33): Any, _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _has_major_status(), _hit_check() (+25 more)

### Community 7 - "rewardService.js"
Cohesion: 0.15
Nodes (17): createMysqlRewardStore(), createRewardService(), claimOffer(), createOfferForWin(), getPendingOffer(), getPublicParty(), getStore(), pickDistinct() (+9 more)

### Community 8 - "evolutionService.test.js"
Cohesion: 0.10
Nodes (29): displayName(), createEvolutionService(), applyEvolutionToRow(), confirmLevelEvolution(), evolveWithStone(), findLevelEvolution(), findStoneEvolution(), getPendingEvolutions() (+21 more)

### Community 9 - "inventoryService.test.js"
Cohesion: 0.11
Nodes (28): makeInventory(), backend_src_services_evolutionservice_no_evolution_effect, createInventoryService(), addItem(), consumeItem(), getInventory(), getItem(), getQuantity() (+20 more)

### Community 10 - "scripts"
Cohesion: 0.07
Nodes (29): description, devDependencies, concurrently, dotenv, engines, node, dotenv, name (+21 more)

### Community 11 - "test_combat.py"
Cohesion: 0.23
Nodes (29): _battle(), _move(), _pokemon(), Tests for pure combat helpers (Gen 3 fidelity: STAB, crit 2x, stages, burn,…, Run with deterministic random.random rolls and a fixed 0.85-1.0 factor., _resolve(), test_accuracy_and_evasion_stages(), test_attack_stage_raises_damage() (+21 more)

### Community 12 - "middleware/validate.js"
Cohesion: 0.09
Nodes (24): battleActionSchema, battleStartSchema, calculateDamageSchema, martPurchaseSchema, moveSchema, pokemonSchema, registerSchema, validateBody() (+16 more)

### Community 13 - "martService.test.js"
Cohesion: 0.11
Nodes (25): createMartService(), getMart(), getStock(), getStore(), isAvailable(), purchase(), requiredUnlockedLevel(), createMemoryMartStore() (+17 more)

### Community 14 - "backend/package.json"
Cohesion: 0.08
Nodes (25): author, description, devDependencies, nodemon, axios, dotenv, keywords, license (+17 more)

### Community 15 - "moveLearnService.test.js"
Cohesion: 0.14
Nodes (22): createMemoryLearnsetStore(), createMemoryMoveStore(), createMoveLearnService(), getLearnsetStore(), getMoveStore(), getPendingLearns(), processLevelUp(), resolveLearn() (+14 more)

### Community 16 - "battleAi.test.js"
Cohesion: 0.10
Nodes (20): createLoggingPool(), mysql, pool, createBattleAi(), getChart(), pickMove(), defaultLoadChart(), effectiveness() (+12 more)

### Community 17 - "starterService.test.js"
Cohesion: 0.12
Nodes (19): statAtLevel(), createMemoryPartyStore(), createStarterService(), chooseStarter(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats() (+11 more)

### Community 18 - "progressService.js"
Cohesion: 0.13
Nodes (21): Boss reward cards (Phase 6, extended Phase 10), XP and leveling (Phase 5), countBattles(), { CampaignError }, createMysqlStore(), createProgressService(), assertLevelUnlocked(), completeBattle() (+13 more)

### Community 19 - "authService.js"
Cohesion: 0.12
Nodes (17): backend_src_config_env_jwt_expires_in, mysql, pool, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN }, login(), pool (+9 more)

### Community 20 - "auth.js"
Cohesion: 0.10
Nodes (19): backend_src_config_env_jwt_secret, jwt, { JWT_SECRET }, requireAuth(), inventoryUseSchema, express, inventoryService, { requireAuth } (+11 more)

### Community 21 - "main.py"
Cohesion: 0.08
Nodes (35): determine_turn_order(), Priority wins outright; ties fall back to (effective) speed; speed tie -> "tie"., add_experience_endpoint(), calculate_damage(), health_check(), get, post, read_root() (+27 more)

### Community 22 - "socketAuth.test.js"
Cohesion: 0.32
Nodes (5): createSocketAuthMiddleware(), sanitizeGuestName(), assert, { createSocketAuthMiddleware }, { describe, it }

### Community 23 - "hydrate.js"
Cohesion: 0.18
Nodes (16): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, getPokedexDb(), hydrateFromSpecies() (+8 more)

### Community 24 - "battleSessionService.test.js"
Cohesion: 0.10
Nodes (16): assert, { CampaignError }, { createBattleAi }, { createBattleSessionService }, {
	createInventoryService,
	createMemoryInventoryStore,
}, {
	createProgressService,
	createMemoryStore,
}, {
	createRewardService,
	createMemoryRewardStore,
}, {
	createWalletService,
	createMemoryWalletStore,
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
} (+8 more)

### Community 25 - "Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan"
Cohesion: 0.11
Nodes (19): formatEvolutionRequirement(), { slugToTitleCase }, createPokeApiClient(), slugToTitleCase(), assert, { describe, it }, { slugToTitleCase }, File Structure (+11 more)

### Community 26 - "move"
Cohesion: 0.19
Nodes (14): listPlayers(), removePlayer(), move(), 1. Overview, 2. Prior Art Being Replaced, 3.1 Backend module: `backend/src/playground/`, 3.2 Frontend, 3. Architecture (+6 more)

### Community 27 - "createPartyService"
Cohesion: 0.19
Nodes (14): createMysqlPartyStore(), createPartyService(), addPokemon(), getPartyRows(), getStore(), removeByPosition(), setCurrentHpByPosition(), updatePokemonByPosition() (+6 more)

### Community 28 - "BattlePokemonSprite"
Cohesion: 0.18
Nodes (13): GBA/FRLG Redesign — Phase 11: Animation State Machine — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: `battleAnimation.js` — animation states and variants, Task 2: Capture `critical_hit` and wire the outer sprite wrapper to the new states, GBA/FRLG Redesign — Polish Batch Phase 13: ATTACK/SEND_OUT Animation Upgrade — Implementation Plan, Global Constraints (+5 more)

### Community 29 - "chat.test.js"
Cohesion: 0.15
Nodes (14): isRateLimited(), backend_src_playground_chat_max_message_length, backend_src_playground_chat_min_message_interval_ms, sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, File Structure (+6 more)

### Community 30 - "index.js"
Cohesion: 0.16
Nodes (14): { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS }, { createRoomState }, { createSocketAuthMiddleware }, jwt, { JWT_SECRET }, { resolveMove, ROOM_WIDTH, ROOM_HEIGHT }, clamp(), backend_src_playground_movement_max_speed_px_per_sec (+6 more)

### Community 31 - "models.py"
Cohesion: 0.18
Nodes (13): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, BaseModel, Stats (+5 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "balance-sim.js"
Cohesion: 0.16
Nodes (15): {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
}, enemyLevels(), loader, { loadRewardPool }, main(), OFFER_BATTLE_TYPES, pad(), {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} (+7 more)

### Community 34 - "xpService.test.js"
Cohesion: 0.21
Nodes (13): applyExperience(), createMysqlXpStore(), createXpService(), awardWinXp(), getStore(), defaultService, LEVEL_INCREMENTS, backend_src_services_xpservice_max_level (+5 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.23
Nodes (14): buildEvolutionGraph(), nodeFor(), cleanFlavorText(), createMysqlEvolutionGraphStore(), createPokemonDetailService(), findPathToId(), flattenNext(), getEvolutionStore() (+6 more)

### Community 36 - "Database"
Cohesion: 0.13
Nodes (15): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed), Inventory seeding (Phase 7, dev utility) (+7 more)

### Community 37 - "fetch_frlg_sprites.py"
Cohesion: 0.20
Nodes (13): _is_valid_existing(), main(), Path, Fetch real FireRed/LeafGreen Pokemon sprites (dex 1-151) from Bulbagarden…, dex number (1-151) -> exact 'File:...' title, or raises if any of 1-151 is…, File:...' title -> current download URL, batched 50 titles per request., resolve_dex_map(), resolve_image_urls() (+5 more)

### Community 38 - "createChatRing"
Cohesion: 0.19
Nodes (13): createChatRing(), push(), recent(), 1. Overview, 2.1 Backend module: `backend/src/playground/chat.js`, 2.2 `index.js` changes, 2.3 Frontend: `Playground.jsx`, 2. Architecture (+5 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "Battle System + Pokédex — GBA/FRLG Visual & UX Redesign"
Cohesion: 0.11
Nodes (17): 10. Testing approach, 11. Risks / rollback, 1. Problem statement, 2. Visual direction (binding for every phase), 3.1 Battle coordinate system, 3.2 Battle event stream vs developer log (Phase 8 core fix), 3.3 Animation state machine (Phase 11), 3.4 Move animation registry (Phase 12, deferred batch) (+9 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.15
Nodes (13): Architecture (short), Combat unit tests, Contributing, Database, Folder structure, Frontend UI, License, Pokemon Origins (+5 more)

### Community 42 - "createRoomState"
Cohesion: 0.22
Nodes (13): attachPlayground(), createRoomState(), addPlayer(), getPlayer(), updatePosition(), Global Constraints, Playground Drag Movement (Phase 1) Implementation Plan, Self-Review (+5 more)

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

### Community 47 - "pil"
Cohesion: 0.18
Nodes (7): Image, pil, Crop the 10 usable battle backgrounds out of the uploaded FRLG battle-BG sheet,…, colorkey_to_alpha(), main(), Crop the player trainer sprites (Red, Leaf) from the uploaded overworld sheets…, Generate a flat, un-blurred elliptical battlefield shadow. This is not cropped…

### Community 48 - "slice-pokemon-sprites.py"
Cohesion: 0.31
Nodes (10): argparse, chroma_to_alpha(), crop_frac(), fail(), inspect(), main(), Path, One-time Gen 1 sprite-sheet slicer. Never import this from the API or the… (+2 more)

### Community 49 - "battleService.js"
Cohesion: 0.22
Nodes (9): backend_src_config_env_battle_engine_url, axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, proxyError(), turnOrder() (+1 more)

### Community 50 - "express"
Cohesion: 0.18
Nodes (9): authService, express, router, { validateBody, loginSchema }, loginSchema, db, express, router (+1 more)

### Community 51 - "bootstrap-dev-sprites.js"
Cohesion: 0.18
Nodes (9): fs, DEST, FALLBACK, fs, missing, path, placeholder, ROOT (+1 more)

### Community 52 - "start-battle-engine.js"
Cohesion: 0.18
Nodes (8): args, child, { cmd, argsPrefix, useShell }, engineDir, fs, path, root, { spawn }

### Community 53 - "content.test.js"
Cohesion: 0.20
Nodes (7): assert, campaignService, {
	createProgressService,
	createMemoryStore,
}, { describe, it, before }, GYM_LEVELS, loader, { loadRewardPool }

### Community 54 - "PokemonDetailRoutes.js"
Cohesion: 0.18
Nodes (9): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router, axios, backend_src_services_pokeapiclient_pokeapiclient (+1 more)

### Community 55 - "createWalletService"
Cohesion: 0.36
Nodes (8): BOSS_BATTLE_TYPES, createMysqlWalletStore(), createWalletService(), awardWinCoins(), ensureWallet(), getBalance(), getStore(), defaultService

### Community 56 - "pokedex_data.sql"
Cohesion: 0.38
Nodes (9): `Ability`, `Evolution`, `Move`, `Pokemon`, `Pokemon_Ability`, `Pokemon_Move`, `pokemon_species`, `Pokemon_Type` (+1 more)

### Community 57 - "Global Constraints"
Cohesion: 0.20
Nodes (9): GBA/FRLG Redesign — Phase 2: Asset Pipeline (Pokémon Front/Back Sprites) — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Dex → filename resolver (`scripts/frlg_sprites/resolve.py`), Task 2: Download + validate one sprite (`scripts/frlg_sprites/fetch_one.py`), Task 3: CLI driver (`scripts/fetch_frlg_sprites.py`), Task 4: Run the full fetch and validate (+1 more)

### Community 58 - "resolve.py"
Cohesion: 0.24
Nodes (8): io, Download one Bulbagarden sprite PNG and validate it before writing to disk., _fetch_all_category_members(), _get_json(), Resolve Bulbagarden Archives file titles and URLs via the MediaWiki API. Read-…, time, urllib_parse, urllib_request

### Community 59 - "setup-battle-engine.js"
Cohesion: 0.20
Nodes (8): ref_child_process, engineDir, fs, launcher, path, reqFile, { spawnSync }, venvDir

### Community 60 - "download_and_validate"
Cohesion: 0.24
Nodes (8): Verify database/pokedex_data.sql has no mojibake from a bad encoding round-…, download_and_validate(), Path, Live-network test: downloads one real, known-good sprite and one that does not…, test_downloads_and_validates_known_sprite(), test_raises_on_404(), sys, tempfile

### Community 61 - "ref_path"
Cohesion: 0.25
Nodes (7): inventoryService, main(), parseArgs(), path, ref_path, vite, @vitejs/plugin-react

### Community 62 - "campaign.js"
Cohesion: 0.22
Nodes (8): completeBattleSchema, battleSessionService, campaignService, express, progressService, { requireAuth }, router, {
	validateBody,
	completeBattleSchema,
}

### Community 63 - "trainer.js"
Cohesion: 0.25
Nodes (7): trainerIdParamsSchema, validateParams(), express, { requireAuth }, router, trainerService, {
	validateParams,
	trainerIdParamsSchema,
}

### Community 64 - "ref_node_assert_strict"
Cohesion: 0.12
Nodes (12): assert, attachPlayground, { describe, it }, fakePool, assert, { describe, it }, { formatEvolutionRequirement }, assert (+4 more)

### Community 65 - "roomState.test.js"
Cohesion: 0.32
Nodes (6): colorFor(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 66 - "loader.test.js"
Cohesion: 0.15
Nodes (11): resetCache(), assert, { CampaignError }, { describe, it, before }, {
	loadLevel,
	listBattles,
	countBattles,
	getTrainer,
	resetCache,
}, assert, campaignService, catalog (+3 more)

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.25
Nodes (7): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan"
Cohesion: 0.25
Nodes (7): GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Generate the flat shadow asset, Task 2: Swap the battle background to the real cropped asset, Task 3: Replace CSS blur shadows with real shadow images

### Community 69 - "GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan"
Cohesion: 0.25
Nodes (7): GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Add `currentMessage` state, give `addLog` an internal message queue, reset on round completion, Task 2: Show the real battle message in the dialog box, Task 3: Demote the developer log to a collapsed-by-default panel

### Community 70 - "games.js"
Cohesion: 0.29
Nodes (6): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, chooseStarterSchema

### Community 71 - "evolutions.js"
Cohesion: 0.29
Nodes (6): evolutionConfirmSchema, evolutionService, express, { requireAuth }, router, {
	validateBody,
	evolutionConfirmSchema,
}

### Community 72 - "moves.js"
Cohesion: 0.29
Nodes (6): moveLearnResolveSchema, express, moveLearnService, { requireAuth }, router, {
	validateBody,
	moveLearnResolveSchema,
}

### Community 73 - "rewards.js"
Cohesion: 0.29
Nodes (6): rewardClaimSchema, express, { requireAuth }, rewardService, router, { validateBody, rewardClaimSchema }

### Community 74 - "GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Trainer sprite crop script (`scripts/crop_trainer_sprites.py`), Task 2: Battle background crop script (`scripts/crop_battle_backgrounds.py`)

### Community 75 - "GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Create `battleLayout.js`, Task 2: Wire `BattleSim.jsx` to `battleLayout.js` and remove the now-duplicate CSS

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.33
Nodes (6): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Landing showcase, Reduced motion, Timing

### Community 78 - "rewardService.test.js"
Cohesion: 0.22
Nodes (12): makeRewards(), createMemoryRewardStore(), assert, {
	createPartyService,
	createMemoryPartyStore,
}, {
	createRewardService,
	createMemoryRewardStore,
	RewardError,
}, { describe, it }, makeFixture(), bossOffer() (+4 more)

### Community 79 - "GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan"
Cohesion: 0.33
Nodes (5): GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Swap victory-flow buttons to `.pixel-btn` chrome

### Community 80 - "GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan"
Cohesion: 0.33
Nodes (5): GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Restyle the command panel buttons; verify RESET/RESTART semantics unchanged

### Community 81 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, postcss, tailwindcss (+5 more)

### Community 82 - "schemas.js"
Cohesion: 0.17
Nodes (11): battleSchema, encounterCatalogSchema, encounterSchema, legendaryBattleSchema, levelSchema, partyMemberSchema, trainerBattleSchema, trainerCatalogSchema (+3 more)

### Community 83 - "Frontend — Pokemon Origins"
Cohesion: 0.40
Nodes (5): Frontend — Pokemon Origins, Layout (`src/`), Local, Routes, UI rules

### Community 84 - "`reward_offers`"
Cohesion: 0.67
Nodes (3): `reward_offer_options`, `reward_offers`, `trainers`

### Community 85 - "`trainer_pending_move_learns`"
Cohesion: 0.50
Nodes (3): `trainers`, `trainer_pending_move_learns`, `trainer_pokemon`

### Community 86 - "Style Guide — Pokemon Origins"
Cohesion: 0.50
Nodes (4): Palette, Rules, Style Guide — Pokemon Origins, Typography

### Community 88 - "Environment variables"
Cohesion: 0.50
Nodes (4): Backend (`backend/.env`), Battle engine (`battle-engine/.env`), Environment variables, Frontend (`frontend/.env`)

### Community 93 - "Restore methods"
Cohesion: 0.67
Nodes (3): Docker Compose (recommended), Manual, Restore methods

### Community 101 - "getAnimState"
Cohesion: 0.24
Nodes (7): GBA/FRLG Redesign — Polish Batch Phase 14: Critical-Hit Screen Flash — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Add the critical-hit screen flash, ANIMATION_VARIANTS, getAnimState()

### Community 102 - "campaignService.js"
Cohesion: 0.29
Nodes (6): getLevel1(), { CampaignError }, getLegacyLevel1(), { hydrateParty }, loader, toLegacyLevelPayload()

### Community 103 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 104 - "Battle sessions (Phase 3 + Phase 4 party, JWT)"
Cohesion: 0.29
Nodes (7): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules

### Community 105 - "typeEffectiveness.test.js"
Cohesion: 0.29
Nodes (4): ALL_TYPES, assert, { createTypeEffectivenessService }, { describe, it }

### Community 106 - "PokemonSprite"
Cohesion: 0.43
Nodes (6): Current State (already implemented, verified this session), Real Battle Sprites Implementation Plan, Task 1: Unit-test the battle sprite resolver, Task 2: Commit the BattleSim wiring + new sprite assets, Task 3: Full test suite sanity check, PokemonSprite()

### Community 107 - "BattlePokemonSprite.jsx"
Cohesion: 0.53
Nodes (3): Self-Review, BATTLE_SPRITE_BASE, getBattleSprite()

### Community 108 - "GBA/FRLG Redesign — Phase 6: Pokémon Sprite Rendering + Placement — Implementation Plan"
Cohesion: 0.33
Nodes (5): Finding (why this phase has no implementation tasks), GBA/FRLG Redesign — Phase 6: Pokémon Sprite Rendering + Placement — Implementation Plan, Global Constraints, Phase Completion, Task 1: Verify sprite rendering/placement claims

### Community 109 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:sprites

## Knowledge Gaps
- **619 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+614 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 774 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `completeBattle()` connect `progressService.js` to `Battle sessions (Phase 3 + Phase 4 party, JWT)`, `battleSessionService.js`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `XP and leveling (Phase 5)` connect `progressService.js` to `Battle sessions (Phase 3 + Phase 4 party, JWT)`, `main.py`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `add_experience()` connect `main.py` to `progressService.js`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `createBattleSessionService()` (e.g. with `battleSessionService.js` and `getSession()`) actually correct?**
  _`createBattleSessionService()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _619 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BattleSim.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05563853622106049 - nodes in this community are weakly interconnected._
- **Should `battleSessionService.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06298904538341157 - nodes in this community are weakly interconnected._