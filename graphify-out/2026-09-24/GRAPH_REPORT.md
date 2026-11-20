# Graph Report - Pokemon-Origins  (2026-09-24)

## Corpus Check
- 254 files · ~202,353 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: (none) 11, .css 11, .example 4)

## Summary
- 1754 nodes · 3315 edges · 124 communities (107 shown, 17 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 344 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9dcb8936`
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
- inventoryService.js
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
- ref_node_assert_strict
- hydrate.js
- battleSessionService.test.js
- Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan
- move
- createPartyService
- loader.test.js
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
- pathlib
- slice-pokemon-sprites.py
- battleService.js
- useBattle.js
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
- TrainerScreen.jsx
- index.test.js
- roomState.test.js
- campaignService.test.js
- QA — Campaign Loop Checklist (Phase 11)
- GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan
- GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan
- express
- evolutions.js
- moves.js
- inventory.js
- GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan
- GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan
- Animation Guide — Pokemon Origins
- App.jsx
- GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan
- GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan
- BagScreen.jsx
- schemas.js
- Frontend — Pokemon Origins
- `reward_offers`
- `trainer_pending_move_learns`
- Style Guide — Pokemon Origins
- react
- AuthScreen.jsx
- Gen 1 sprite sheet (source)
- `trainer_progress`
- `trainer_inventory`
- `trainer_wallet`
- TrainerHoverCard.jsx
- createBattleSessionService
- mart.js
- campaignService.js
- BattleView.jsx
- battleSessionService.js
- level1.py
- Battle UI Redesign Implementation Plan
- inventoryService.test.js
- profileService.js
- Battle UI Redesign
- crop_trainer_sprites.py
- startBattle
- rewards.js
- runBeat
- typeEffectiveness.test.js
- main.jsx
- attachPlayground
- 3. Architecture
- `trainer_pokemon`
- frontend_src_index
- frontend_src_pages_game_battleground
- frontend_src_styles_tokens

## God Nodes (most connected - your core abstractions)
1. `react` - 47 edges
2. `createBattleSessionService()` - 29 edges
3. `CampaignError` - 27 edges
4. `calculate_damage_result()` - 24 edges
5. `_battle()` - 24 edges
6. `_resolve()` - 23 edges
7. `BattlePokemonSprite()` - 21 edges
8. `move()` - 19 edges
9. `createPartyService()` - 19 edges
10. `_pokemon()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Global Constraints` --references--> `move()`  [INFERRED]
  docs/superpowers/plans/2026-09-17-playground-chat.md → backend/src/services/battleAi.test.js
- `Task 5: Frontend Playground screen (drag-to-move)` --references--> `move()`  [INFERRED]
  docs/superpowers/plans/2026-09-17-playground-drag-movement.md → backend/src/services/battleAi.test.js
- `2.2 `index.js` changes` --references--> `move()`  [INFERRED]
  docs/superpowers/specs/2026-09-17-playground-chat-design.md → backend/src/services/battleAi.test.js
- `×0 (immune / no effect)` --references--> `move()`  [INFERRED]
  docs/superpowers/specs/2026-09-24-battle-damage-feedback-design.md → backend/src/services/battleAi.test.js
- `Non-goals` --references--> `move()`  [INFERRED]
  docs/superpowers/specs/2026-09-24-battle-damage-feedback-design.md → backend/src/services/battleAi.test.js

## Import Cycles
- None detected.

## Communities (124 total, 17 thin omitted)

### Community 0 - "GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Player trainer sprite resolver, Task 2: Render the player's trainer during the encounter beat

### Community 1 - "battleStatus.js"
Cohesion: 0.14
Nodes (20): applyStatChanges(), applyStatus(), clampStage(), effectiveSpeed(), fs, loadMoveMeta(), MAJOR_STATUSES, MOVE_META_FILE (+12 more)

### Community 2 - "BattlePokemonSprite"
Cohesion: 0.06
Nodes (44): Current State (already implemented, verified this session), Global Constraints, Real Battle Sprites Implementation Plan, Self-Review, Task 1: Unit-test the battle sprite resolver, Task 2: Commit the BattleSim wiring + new sprite assets, Task 3: Full test suite sanity check, GBA/FRLG Redesign — Phase 11: Animation State Machine — Implementation Plan (+36 more)

### Community 3 - "loader.js"
Cohesion: 0.21
Nodes (17): { CampaignError }, DATA_DIR, ENCOUNTER_FILE, fs, getEncounter(), getTrainer(), {
	levelSchema,
	trainerCatalogSchema,
	encounterCatalogSchema,
}, listBattles() (+9 more)

### Community 4 - "frontend/package.json"
Cohesion: 0.04
Nodes (45): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client (+37 more)

### Community 5 - "server.js"
Cohesion: 0.05
Nodes (36): apiLimiter, app, attachPlayground, authLimiter, battleRoutes, bodyParser, campaignRoutes, cors (+28 more)

### Community 6 - "combat.py"
Cohesion: 0.13
Nodes (35): Any, _ability_name(), _ability_power_multiplier(), accuracy_stage_multiplier(), calculate_damage_result(), clamp_stage(), _has_major_status(), _hit_check() (+27 more)

### Community 7 - "rewardService.js"
Cohesion: 0.10
Nodes (29): makeRewards(), createMemoryRewardStore(), createMysqlRewardStore(), createRewardService(), claimOffer(), createOfferForWin(), getPendingOffer(), getPublicParty() (+21 more)

### Community 8 - "evolutionService.test.js"
Cohesion: 0.10
Nodes (28): displayName(), createEvolutionService(), applyEvolutionToRow(), confirmLevelEvolution(), evolveWithStone(), findLevelEvolution(), findStoneEvolution(), getPendingEvolutions() (+20 more)

### Community 9 - "inventoryService.js"
Cohesion: 0.21
Nodes (16): createInventoryService(), addItem(), consumeItem(), getInventory(), getItem(), getQuantity(), getStore(), useItemOverworld() (+8 more)

### Community 10 - "scripts"
Cohesion: 0.07
Nodes (29): description, devDependencies, concurrently, dotenv, engines, node, dotenv, name (+21 more)

### Community 11 - "test_combat.py"
Cohesion: 0.23
Nodes (29): _battle(), _move(), _pokemon(), Tests for pure combat helpers (Gen 3 fidelity: STAB, crit 2x, stages, burn,…, Run with deterministic random.random rolls and a fixed 0.85-1.0 factor., _resolve(), test_accuracy_and_evasion_stages(), test_attack_stage_raises_damage() (+21 more)

### Community 12 - "middleware/validate.js"
Cohesion: 0.08
Nodes (29): authService, express, router, { validateBody, loginSchema }, battleActionSchema, battleStartSchema, calculateDamageSchema, loginSchema (+21 more)

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
Nodes (18): createMemoryPartyStore(), createStarterService(), chooseStarter(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats(), STARTER_POKEMON_IDS (+10 more)

### Community 18 - "progressService.js"
Cohesion: 0.14
Nodes (21): Boss reward cards (Phase 6, extended Phase 10), countBattles(), { CampaignError }, createMemoryStore(), createMysqlStore(), createProgressService(), assertLevelUnlocked(), completeBattle() (+13 more)

### Community 19 - "authService.js"
Cohesion: 0.12
Nodes (16): backend_src_config_env_jwt_expires_in, mysql, pool, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN }, login(), pool (+8 more)

### Community 20 - "auth.js"
Cohesion: 0.10
Nodes (19): backend_src_config_env_jwt_secret, jwt, { JWT_SECRET }, requireAuth(), express, { requireAuth }, router, trainerService (+11 more)

### Community 21 - "main.py"
Cohesion: 0.14
Nodes (17): XP and leveling (Phase 5), add_experience_endpoint(), calculate_damage(), health_check(), get, post, read_root(), turn_order() (+9 more)

### Community 22 - "ref_node_assert_strict"
Cohesion: 0.11
Nodes (15): assert, { createSocketAuthMiddleware }, { describe, it }, assert, { describe, it }, { rollGenderForSpecies }, assert, { createPokeApiClient } (+7 more)

### Community 23 - "hydrate.js"
Cohesion: 0.17
Nodes (18): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, getPokedexDb(), hydrateFromSpecies() (+10 more)

### Community 24 - "battleSessionService.test.js"
Cohesion: 0.10
Nodes (16): assert, { CampaignError }, { createBattleAi }, {
	createBattleSessionService,
	createMemoryHistoryStore,
	snapshotPokemon,
}, {
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
Cohesion: 0.12
Nodes (18): formatEvolutionRequirement(), { slugToTitleCase }, assert, { describe, it }, { formatEvolutionRequirement }, createPokeApiClient(), slugToTitleCase(), File Structure (+10 more)

### Community 26 - "move"
Cohesion: 0.14
Nodes (19): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules, removePlayer() (+11 more)

### Community 27 - "createPartyService"
Cohesion: 0.13
Nodes (20): FEMALE_ONLY_IDS, GENDERLESS_IDS, MALE_ONLY_IDS, rollGenderForSpecies(), createMysqlPartyStore(), createPartyService(), addPokemon(), getPartyRows() (+12 more)

### Community 28 - "loader.test.js"
Cohesion: 0.33
Nodes (5): resetCache(), assert, { CampaignError }, { describe, it, before }, {
	loadLevel,
	listBattles,
	countBattles,
	getTrainer,
	resetCache,
}

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
Cohesion: 0.15
Nodes (15): { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS }, { createRoomState }, { createSocketAuthMiddleware }, jwt, { JWT_SECRET }, { resolveMove, ROOM_WIDTH, ROOM_HEIGHT, CHAT_RADIUS_PX }, backend_src_playground_movement_chat_radius_px, clamp() (+7 more)

### Community 31 - "models.py"
Cohesion: 0.17
Nodes (13): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, BaseModel, Stats (+5 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "balance-sim.js"
Cohesion: 0.17
Nodes (14): {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
}, enemyLevels(), loader, { loadRewardPool }, main(), OFFER_BATTLE_TYPES, pad(), {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} (+6 more)

### Community 34 - "xpService.test.js"
Cohesion: 0.21
Nodes (13): applyExperience(), createMysqlXpStore(), createXpService(), awardWinXp(), getStore(), defaultService, LEVEL_INCREMENTS, backend_src_services_xpservice_max_level (+5 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.21
Nodes (15): buildEvolutionGraph(), nodeFor(), cleanFlavorText(), createMysqlEvolutionGraphStore(), createPokemonDetailService(), findPathToId(), flattenNext(), getEvolutionStore() (+7 more)

### Community 36 - "Database"
Cohesion: 0.11
Nodes (18): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Docker Compose (recommended), Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed) (+10 more)

### Community 37 - "fetch_frlg_sprites.py"
Cohesion: 0.20
Nodes (13): _is_valid_existing(), main(), Path, Fetch real FireRed/LeafGreen Pokemon sprites (dex 1-151) from Bulbagarden…, dex number (1-151) -> exact 'File:...' title, or raises if any of 1-151 is…, File:...' title -> current download URL, batched 50 titles per request., resolve_dex_map(), resolve_image_urls() (+5 more)

### Community 38 - "createChatRing"
Cohesion: 0.17
Nodes (14): createChatRing(), push(), recent(), Task 2: Awaitable message queue, 1. Overview, 2.1 Backend module: `backend/src/playground/chat.js`, 2.2 `index.js` changes, 2.3 Frontend: `Playground.jsx` (+6 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "Battle System + Pokédex — GBA/FRLG Visual & UX Redesign"
Cohesion: 0.15
Nodes (12): 10. Testing approach, 11. Risks / rollback, 1. Problem statement, 2. Visual direction (binding for every phase), 4. Asset pipeline, 5. Encoding fix, 6. Animation states (detail for Phase 11), 7. Pokédex (+4 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.12
Nodes (17): Architecture (short), Backend (`backend/.env`), Battle engine (`battle-engine/.env`), Combat unit tests, Contributing, Database, Environment variables, Folder structure (+9 more)

### Community 42 - "createRoomState"
Cohesion: 0.23
Nodes (12): createRoomState(), addPlayer(), getPlayer(), listPlayers(), updatePosition(), Playground Drag Movement (Phase 1) Implementation Plan, Self-Review, Task 1: Movement resolution (pure function) (+4 more)

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

### Community 47 - "pathlib"
Cohesion: 0.18
Nodes (6): pathlib, pil, re, Crop the 10 usable battle backgrounds out of the uploaded FRLG battle-BG sheet,…, Generate a flat, un-blurred elliptical battlefield shadow. This is not cropped…, Reorder database/pokedex_data.sql so parent tables precede FK children.

### Community 48 - "slice-pokemon-sprites.py"
Cohesion: 0.31
Nodes (10): argparse, chroma_to_alpha(), crop_frac(), fail(), inspect(), main(), Path, One-time Gen 1 sprite-sheet slicer. Never import this from the API or the… (+2 more)

### Community 49 - "battleService.js"
Cohesion: 0.16
Nodes (11): backend_src_config_env_battle_engine_url, axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, proxyError(), turnOrder() (+3 more)

### Community 50 - "useBattle.js"
Cohesion: 0.06
Nodes (49): Battle Damage Feedback Implementation Plan, File Structure, Global Constraints, Review Focus, Task 0: Branch, Task 1: Pure animation helpers, Task 3: Stepped HP drain and the `-N` tick slot in HpBox, Task 4: Wire the queue into BattleSim and await beat lines (+41 more)

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
Cohesion: 0.25
Nodes (7): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router, backend_src_services_pokeapiclient_pokeapiclient

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
Cohesion: 0.22
Nodes (9): io, json, Download one Bulbagarden sprite PNG and validate it before writing to disk., _fetch_all_category_members(), _get_json(), Resolve Bulbagarden Archives file titles and URLs via the MediaWiki API. Read-…, time, urllib_parse (+1 more)

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

### Community 63 - "TrainerScreen.jsx"
Cohesion: 0.14
Nodes (21): Task 5: `HpBox.jsx` — extract HP box, add gender symbol + player EXP bar, typeColor(), badgeCount(), HpPanel(), useSteppedNumber(), MoveLine(), BadgeCase(), RecentBattles() (+13 more)

### Community 64 - "index.test.js"
Cohesion: 0.18
Nodes (5): assert, attachPlayground, { describe, it }, fakePool, { ROOM_WIDTH, ROOM_HEIGHT }

### Community 65 - "roomState.test.js"
Cohesion: 0.32
Nodes (6): colorFor(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 66 - "campaignService.test.js"
Cohesion: 0.29
Nodes (6): assert, campaignService, catalog, { describe, it, before }, lookup(), { resetCache }

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.25
Nodes (7): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan"
Cohesion: 0.25
Nodes (7): GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Generate the flat shadow asset, Task 2: Swap the battle background to the real cropped asset, Task 3: Replace CSS blur shadows with real shadow images

### Community 69 - "GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan"
Cohesion: 0.25
Nodes (7): GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Add `currentMessage` state, give `addLog` an internal message queue, reset on round completion, Task 2: Show the real battle message in the dialog box, Task 3: Demote the developer log to a collapsed-by-default panel

### Community 70 - "express"
Cohesion: 0.17
Nodes (10): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, chooseStarterSchema, db, express (+2 more)

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

### Community 73 - "inventory.js"
Cohesion: 0.29
Nodes (6): inventoryUseSchema, express, inventoryService, { requireAuth }, router, { validateBody, inventoryUseSchema }

### Community 74 - "GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Trainer sprite crop script (`scripts/crop_trainer_sprites.py`), Task 2: Battle background crop script (`scripts/crop_battle_backgrounds.py`)

### Community 75 - "GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Create `battleLayout.js`, Task 2: Wire `BattleSim.jsx` to `battleLayout.js` and remove the now-duplicate CSS

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.33
Nodes (6): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Landing showcase, Reduced motion, Timing

### Community 78 - "App.jsx"
Cohesion: 0.12
Nodes (21): UserContext, useUser(), AppShell(), LINKS, frontend_src_v2_layout_shell, AuthScreen(), JourneyScreen(), frontend_src_v2_pages_hub_hub (+13 more)

### Community 79 - "GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan"
Cohesion: 0.33
Nodes (5): GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Swap victory-flow buttons to `.pixel-btn` chrome

### Community 80 - "GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan"
Cohesion: 0.33
Nodes (5): GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Restyle the command panel buttons; verify RESET/RESTART semantics unchanged

### Community 81 - "BagScreen.jsx"
Cohesion: 0.20
Nodes (14): api, getErrorMessage(), API_URL, BagScreen(), NEEDS_TARGET, frontend_src_v2_pages_bag_items, RewardScreen(), TITLES (+6 more)

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
Nodes (3): `trainer_pokemon`, `trainers`, `trainer_pending_move_learns`

### Community 86 - "Style Guide — Pokemon Origins"
Cohesion: 0.40
Nodes (5): Palette, Primitives, Rules, Style Guide — Pokemon Origins, Typography

### Community 87 - "react"
Cohesion: 0.17
Nodes (15): PokemonSprite(), formatStatLabel(), STAT_LABELS, frontend_src_v2_pages_dex_dex, DexEntryScreen(), dexNo(), dexNo(), DexScreen() (+7 more)

### Community 88 - "AuthScreen.jsx"
Cohesion: 0.14
Nodes (14): frontend_src_v2_pages_auth_auth, Composer(), frontend_src_v2_pages_playground_playground, PlaygroundScreen(), guestName(), usePlayground(), clamp(), scenery() (+6 more)

### Community 93 - "TrainerHoverCard.jsx"
Cohesion: 0.19
Nodes (13): cache, fetchProfile(), isGuestId(), useHubData(), ChatLog(), Roster(), RosterRow(), time() (+5 more)

### Community 94 - "createBattleSessionService"
Cohesion: 0.23
Nodes (18): CampaignError, clonePokemon(), createBattleSessionService(), getOwnedSession(), getSession(), grantWinXp(), performAction(), persistPpOnBattleEnd() (+10 more)

### Community 101 - "mart.js"
Cohesion: 0.29
Nodes (6): martPurchaseSchema, express, martService, { requireAuth }, router, { validateBody, martPurchaseSchema }

### Community 102 - "campaignService.js"
Cohesion: 0.29
Nodes (6): getLevel1(), { CampaignError }, getLegacyLevel1(), { hydrateParty }, loader, toLegacyLevelPayload()

### Community 103 - "BattleView.jsx"
Cohesion: 0.19
Nodes (13): frontend_src_v2_pages_battle_battle, BagMenu(), CommandMenu(), PartyMenu(), RestartMenu(), ResultPanel(), BattleStage(), monClass() (+5 more)

### Community 104 - "battleSessionService.js"
Cohesion: 0.12
Nodes (16): { CampaignError }, { createBattleAi }, endOfRoundChip(), createMemoryHistoryStore(), createMemoryPpStore(), createMysqlHistoryStore(), createMysqlPpStore(), crypto (+8 more)

### Community 105 - "level1.py"
Cohesion: 0.17
Nodes (16): determine_turn_order(), Priority wins outright; ties fall back to (effective) speed; speed tie -> "tie"., BattleSimRequest, get_level1(), LevelBattleStartRequest, load_level1_data(), BaseModel, get (+8 more)

### Community 106 - "Battle UI Redesign Implementation Plan"
Cohesion: 0.15
Nodes (15): defaultGetPlayerParty(), snapshotPokemon(), freshStages(), Battle UI Redesign Implementation Plan, Task 1: `genderService.js` — local gender assignment, Task 3: `trainerService.js` — surface `gender` and `experience` (bug fix), Task 4: `battleSessionService.snapshotPokemon` — live gender + XP fields, Task 6: `MoveMenu.jsx` — extract move-select UI, bump font size (+7 more)

### Community 107 - "inventoryService.test.js"
Cohesion: 0.16
Nodes (14): makeInventory(), createMemoryEvolutionStore(), backend_src_services_evolutionservice_no_evolution_effect, createMemoryInventoryStore(), assert, {
	createEvolutionService,
	createMemoryEvolutionStore,
	NO_EVOLUTION_EFFECT,
}, {
	createInventoryService,
	createMemoryInventoryStore,
	InventoryError,
	loadItemCatalog,
}, {
	createPartyService,
	createMemoryPartyStore,
} (+6 more)

### Community 108 - "profileService.js"
Cohesion: 0.24
Nodes (9): getPublicProfile(), levelName(), loader, summarizeCampaign(), summarizeRecord(), assert, { describe, it }, { summarizeCampaign, summarizeRecord } (+1 more)

### Community 109 - "Battle UI Redesign"
Cohesion: 0.18
Nodes (10): sanitizeMove(), 2. `HpBox.jsx`, 3. `MoveMenu.jsx`, 4. `MessageLog.jsx` + fullwidth flow, 5. Type-based move animations, 6. File layout, Battle UI Redesign, Context (+2 more)

### Community 110 - "crop_trainer_sprites.py"
Cohesion: 0.33
Nodes (8): Image, build_throw_strip(), colorkey_to_alpha(), head_center_x(), main(), Crop the player trainer sprites (Red, Leaf) from the uploaded overworld sheets…, Horizontal centre of the opaque pixels in the frame's top rows., Equal-width cells, every frame bottom-aligned and head-aligned. Returns (strip,…

### Community 111 - "startBattle"
Cohesion: 0.29
Nodes (7): startBattle(), Battle Restart & FireRed Dialogue Box Implementation Plan, Global Constraints, Out of Scope (explicitly, from the user-supplied brief), Task 1: Backend — `force` option on battle-session restart, Task 2: Frontend — RESTART button with in-UI confirm, Task 3: FireRed-style navy dialogue box

### Community 112 - "rewards.js"
Cohesion: 0.29
Nodes (6): rewardClaimSchema, express, { requireAuth }, rewardService, router, { validateBody, rewardClaimSchema }

### Community 113 - "runBeat"
Cohesion: 0.33
Nodes (7): cureStatus(), executeBeat(), processFaint(), runBeat(), cantMoveLine(), statusEndLine(), statusGate()

### Community 114 - "typeEffectiveness.test.js"
Cohesion: 0.29
Nodes (4): ALL_TYPES, assert, { createTypeEffectivenessService }, { describe, it }

### Community 115 - "main.jsx"
Cohesion: 0.29
Nodes (5): App(), frontend_src_v2_styles_base, frontend_src_v2_styles_components, frontend_src_v2_styles_tokens, ref_react_dom_client

### Community 116 - "attachPlayground"
Cohesion: 0.60
Nodes (4): attachPlayground(), createSocketAuthMiddleware(), sanitizeGuestName(), Task 4: Wire the playground module into the backend server

### Community 117 - "3. Architecture"
Cohesion: 0.40
Nodes (5): 3.1 Battle coordinate system, 3.2 Battle event stream vs developer log (Phase 8 core fix), 3.3 Animation state machine (Phase 11), 3.4 Move animation registry (Phase 12, deferred batch), 3. Architecture

## Knowledge Gaps
- **673 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+668 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 856 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `completeBattle()` connect `progressService.js` to `move`, `main.py`, `createBattleSessionService`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `XP and leveling (Phase 5)` connect `main.py` to `move`, `progressService.js`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `add_experience()` connect `main.py` to `combat.py`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `createBattleSessionService()` (e.g. with `battleSessionService.js` and `getSession()`) actually correct?**
  _`createBattleSessionService()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _673 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `battleStatus.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `BattlePokemonSprite` be split into smaller, more focused modules?**
  _Cohesion score 0.06079664570230608 - nodes in this community are weakly interconnected._