# Graph Report - Pokemon-Origins  (2026-11-04)

## Corpus Check
- 396 files · ~357,766 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .css 16, (none) 12, .example 4)

## Summary
- 2879 nodes · 6094 edges · 166 communities (142 shown, 24 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 554 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `780dfa4e`
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
- Battle Damage Feedback
- martService.test.js
- backend/package.json
- moveLearnService.test.js
- battleAi.test.js
- starterService.test.js
- content.test.js
- authService.js
- playground.js
- pathlib
- legendaries.py
- hydrate.js
- gym_v3
- Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan
- move
- createPartyService
- tiles.py
- chat.test.js
- build_sprites.py
- Move
- dependencies
- battleSessionService.test.js
- OverworldScreen.jsx
- pokemonDetailService.js
- Database
- resolve.py
- createChatRing
- validate-sprites.js
- Battle System + Pokédex — GBA/FRLG Visual & UX Redesign
- Pokemon Origins
- createRoomState
- pokemonDetailService.test.js
- createTypeEffectivenessService
- Required behavior
- High-Level Design (HLD) — Pokemon Origins
- flagService.test.js
- script.js
- battleService.js
- battleBeats.js
- pipeline.js
- test_art.py
- auth.js
- fetch_one.py
- tiles_v2.py
- createOverworld
- world.test.js
- PlaygroundScreen.jsx
- Button
- house_v2
- ref_path
- campaign.js
- react
- index.js
- devDependencies
- world/maps.test.js
- QA — Campaign Loop Checklist (Phase 11)
- world_maps.py
- GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan
- trainers.js
- Global Constraints
- compose.py
- battle.js
- GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan
- GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan
- README.md
- Animation Guide — Pokemon Origins
- App.jsx
- GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan
- GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan
- puzzles.js
- slice-pokemon-sprites.py
- Frontend — Pokemon Origins
- logic/movement.js
- render_map.py
- db.js
- useBattle.js
- TitleScreen.jsx
- Gen 1 sprite sheet (source)
- PartyBoard.jsx
- PHASES
- Gym leaders
- TrainerScreen.jsx
- createBattleSessionService
- movePlaygroundService.test.js
- fetch_frlg_sprites.py
- rbox
- GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan
- ref_node_assert
- renderer.js
- characters.py
- express
- profileService.js
- movePlaygroundService.js
- crop_trainer_sprites.py
- build_all.py
- PokemonDetailRoutes.js
- battleAnimation.js
- resetService.test.js
- attachPlayground
- src/flags.js
- REQUIRED CHANGES
- Move Lab — Battle Engine Move-Testing Playground
- Art / audio needed from a human
- Global Constraints
- dependencies
- scripts
- middleware/validate.js
- roomState.test.js
- WorldTests
- BattleStage.jsx
- shell
- mapModel.js
- gen_overworld_placeholders.py
- config/flags.js
- rewards.js
- bodies.py
- SheetTests
- battleBeats.test.js
- paint_mart
- File format
- Stage 1: plan
- Battle Damage Feedback Implementation Plan
- Room
- gymPuzzles.js
- MobilePad.jsx
- vite.config.js
- pil
- assets.test.js
- vercel.json
- Tile
- MoveLabScreen.jsx
- interiors.py
- snapshotPokemon
- legendary/manifest.json
- overworld/manifest.json
- setup-battle-engine.js
- overworld_art/README.md
- start-battle-engine.js
- bootstrap-dev-sprites.js
- party.js
- Restore methods

## God Nodes (most connected - your core abstractions)
1. `react` - 64 edges
2. `_battle()` - 48 edges
3. `_resolve()` - 46 edges
4. `Button()` - 46 edges
5. `createBattleSessionService()` - 43 edges
6. `new_tiles()` - 43 edges
7. `Panel()` - 41 edges
8. `Tile` - 35 edges
9. `CampaignError` - 34 edges
10. `_move()` - 34 edges

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

## Communities (166 total, 24 thin omitted)

### Community 0 - "GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Player trainer sprite resolver, Task 2: Render the player's trainer during the encounter beat

### Community 1 - "battleSessionService.js"
Cohesion: 0.08
Nodes (40): { CampaignError }, { createBattleAi }, applyStatChanges(), applyStatus(), createMysqlHistoryStore(), createMysqlHpStore(), createMysqlPpStore(), crypto (+32 more)

### Community 2 - "BattlePokemonSprite"
Cohesion: 0.05
Nodes (51): Current State (already implemented, verified this session), Global Constraints, Real Battle Sprites Implementation Plan, Self-Review, Task 1: Unit-test the battle sprite resolver, Task 2: Commit the BattleSim wiring + new sprite assets, Task 3: Full test suite sanity check, GBA/FRLG Redesign — Phase 11: Animation State Machine — Implementation Plan (+43 more)

### Community 3 - "loader.js"
Cohesion: 0.06
Nodes (48): CampaignError, { CampaignError }, countBattles(), DATA_DIR, ENCOUNTER_FILE, findTrainerBattle(), fs, getEncounter() (+40 more)

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
Cohesion: 0.11
Nodes (27): makeInventory(), createInventoryService(), addItem(), consumeItem(), getInventory(), getItem(), getQuantity(), getStore() (+19 more)

### Community 10 - "scripts"
Cohesion: 0.06
Nodes (31): description, devDependencies, concurrently, dotenv, engines, node, dotenv, name (+23 more)

### Community 11 - "test_combat.py"
Cohesion: 0.14
Nodes (47): _battle(), _move(), _pokemon(), _resolve(), test_accuracy_and_evasion_stages(), test_attack_stage_raises_damage(), test_attract_applies_volatile_effect(), test_battle_armor_blocks_crits() (+39 more)

### Community 12 - "Battle Damage Feedback"
Cohesion: 0.11
Nodes (17): ×0 (immune / no effect), 1. Awaitable `addLog`, 2. Impact tiers, 3. Damaging-move beat order, 4. Stepped HP drain, 5. `-N` damage tick, Battle Damage Feedback, Call sites that change (add `await`) (+9 more)

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
Cohesion: 0.24
Nodes (9): createBattleAi(), getChart(), pickMove(), effectiveness(), hasPp(), assert, CHART, { createBattleAi, effectiveness } (+1 more)

### Community 17 - "starterService.test.js"
Cohesion: 0.13
Nodes (16): createStarterService(), chooseStarter(), defaultService, { PartyError }, partyServiceModule, scaleStarterStats(), STARTER_POKEMON_IDS, starterStats (+8 more)

### Community 18 - "content.test.js"
Cohesion: 0.07
Nodes (35): Battle fidelity — Gen 3 / FireRed-style (Phase 14), Battle sessions (Phase 3 + Phase 4 party, JWT), Boss reward cards (Phase 6, extended Phase 10), Coins + Mart (Phase 8), Enemy parties (Phase 10), Evolution (Phase 9), Inventory / bag (Phase 7), Party & switch rules (+27 more)

### Community 19 - "authService.js"
Cohesion: 0.12
Nodes (14): registerSchema, authService, express, router, { validateBody, registerSchema }, bcrypt, jwt, { JWT_SECRET, JWT_EXPIRES_IN } (+6 more)

### Community 20 - "playground.js"
Cohesion: 0.17
Nodes (9): assert, { describe, it }, { playgroundExchangeSchema }, playgroundExchangeSchema, express, movePlaygroundService, { requireAuth }, router (+1 more)

### Community 21 - "pathlib"
Cohesion: 0.07
Nodes (21): determine_turn_order(), add_experience_endpoint(), calculate_damage(), health_check(), read_root(), turn_order(), BattleSimRequest, get_level1() (+13 more)

### Community 22 - "legendaries.py"
Cohesion: 0.06
Nodes (31): Overworld art changelog, Stage 2a: deterministic builds, Stage 2b: v2 tiles (approved from the slice), Stage 3a: v1 polish, side views and legs (whole cast), Stage 3b/3c: environment pass (tileset + Origin Town), Stage 3b: distinct building designs (v3), Stage 3d: home staircase redraw, Stage 3d: interiors (Care Centre, Mart, home) and door warps (+23 more)

### Community 23 - "hydrate.js"
Cohesion: 0.14
Nodes (22): {
	lookupSpecies,
	hydrateFromSpecies,
}, main(), parseArgs(), partyService, path, { CampaignError }, getPokedexDb(), hydrateFromSpecies() (+14 more)

### Community 24 - "gym_v3"
Cohesion: 0.15
Nodes (13): mown_block(), band_window(), base_shadow(), boxed(), center_v3(), emblem_heart(), emblem_star(), glass_doors() (+5 more)

### Community 25 - "Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan"
Cohesion: 0.10
Nodes (21): formatEvolutionRequirement(), { slugToTitleCase }, assert, { describe, it }, { formatEvolutionRequirement }, createPokeApiClient(), slugToTitleCase(), assert (+13 more)

### Community 26 - "move"
Cohesion: 0.22
Nodes (12): removePlayer(), move(), 1. Overview, 2. Prior Art Being Replaced, 3.1 Backend module: `backend/src/playground/`, 3.2 Frontend, 3. Architecture, 4. Event Contract (+4 more)

### Community 27 - "createPartyService"
Cohesion: 0.10
Nodes (30): FEMALE_ONLY_IDS, GENDERLESS_IDS, MALE_ONLY_IDS, rollGenderForSpecies(), createMemoryPartyStore(), createMysqlPartyStore(), createPartyService(), addPokemon() (+22 more)

### Community 28 - "tiles.py"
Cohesion: 0.11
Nodes (20): _brick_at(), bush(), door(), grass(), gym(), gym_sign(), herringbone(), house() (+12 more)

### Community 29 - "chat.test.js"
Cohesion: 0.15
Nodes (12): isRateLimited(), sanitizeMessage(), assert, {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
}, { describe, it }, File Structure, Global Constraints, Playground Room Chat Implementation Plan (+4 more)

### Community 30 - "build_sprites.py"
Cohesion: 0.17
Nodes (9): main(), ui_art(), hex_rgba(), ramp_for(), resolve(), contact_sheet(), walk_gif(), build_sheet() (+1 more)

### Community 31 - "Move"
Cohesion: 0.16
Nodes (12): API (JWT), Balance (Phase 11), Campaign data, Full campaign (Phase 10), Move, Pokemon, Stats, XPUpdateRequest (+4 more)

### Community 32 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, axios, bcrypt, cookie-parser, cors, dotenv, express, express-rate-limit (+8 more)

### Community 33 - "battleSessionService.test.js"
Cohesion: 0.06
Nodes (39): {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
}, enemyLevels(), loader, { loadRewardPool }, main(), OFFER_BATTLE_TYPES, pad(), {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} (+31 more)

### Community 34 - "OverworldScreen.jsx"
Cohesion: 0.10
Nodes (31): TICK_MS, VIEW_H, VIEW_W, harness(), attachInput(), BUTTONS, createInputState(), DIR_BUTTONS (+23 more)

### Community 35 - "pokemonDetailService.js"
Cohesion: 0.21
Nodes (15): buildEvolutionGraph(), nodeFor(), cleanFlavorText(), createMysqlEvolutionGraphStore(), createPokemonDetailService(), findPathToId(), flattenNext(), getEvolutionStore() (+7 more)

### Community 36 - "Database"
Cohesion: 0.13
Nodes (15): Battle fidelity / PP (Phase 14 — migration 006), Coins + Mart (Phase 8), Database, Evolution (Phase 9 — no migration needed), Existing volume / local MySQL, Fresh Compose volume, Full campaign (Phase 10 — no migration needed), Inventory seeding (Phase 7, dev utility) (+7 more)

### Community 37 - "resolve.py"
Cohesion: 0.16
Nodes (7): _fetch_all_category_members(), _get_json(), resolve_dex_map(), resolve_image_urls(), test_back_map_covers_all_151_no_ambiguity(), test_front_map_covers_all_151_no_ambiguity(), test_resolve_image_urls_matches_known_url()

### Community 38 - "createChatRing"
Cohesion: 0.17
Nodes (14): createChatRing(), push(), recent(), Task 2: Awaitable message queue, 1. Overview, 2.1 Backend module: `backend/src/playground/chat.js`, 2.2 `index.js` changes, 2.3 Frontend: `Playground.jsx` (+6 more)

### Community 39 - "validate-sprites.js"
Cohesion: 0.14
Nodes (12): ALLOWED, args, DIR, frontOnly, fs, malformed, missing, OPTIONAL (+4 more)

### Community 40 - "Battle System + Pokédex — GBA/FRLG Visual & UX Redesign"
Cohesion: 0.12
Nodes (16): 10. Testing approach, 11. Risks / rollback, 1. Problem statement, 2. Visual direction (binding for every phase), 3.1 Battle coordinate system, 3.2 Battle event stream vs developer log (Phase 8 core fix), 3.3 Animation state machine (Phase 11), 3.4 Move animation registry (Phase 12, deferred batch) (+8 more)

### Community 41 - "Pokemon Origins"
Cohesion: 0.12
Nodes (16): Architecture (short), Backend (`backend/.env`), Battle engine (`battle-engine/.env`), Combat unit tests, Contributing, Database, Environment variables, Feature surface (current) (+8 more)

### Community 42 - "createRoomState"
Cohesion: 0.21
Nodes (13): createRoomState(), addPlayer(), getPlayer(), listPlayers(), updatePosition(), Global Constraints, Playground Drag Movement (Phase 1) Implementation Plan, Self-Review (+5 more)

### Community 43 - "pokemonDetailService.test.js"
Cohesion: 0.18
Nodes (10): assert, { createPokemonDetailService }, { createTypeEffectivenessService }, { describe, it }, EVOLUTION_ROWS, fakeEvolutionStore(), fakeService(), POKEMON (+2 more)

### Community 44 - "createTypeEffectivenessService"
Cohesion: 0.19
Nodes (14): ALL_TYPES, createTypeEffectivenessService(), getCombinedMultipliers(), getMatchups(), getWeaknesses(), assert, { createTypeEffectivenessService }, { describe, it } (+6 more)

### Community 45 - "Required behavior"
Cohesion: 0.17
Nodes (11): Data flow, Errors, Evolutions, Height/weight/category/gender/abilities, Pokédex Detail Page: PokéAPI-Sourced Types, Weaknesses, Stats, Evolutions, Problem, Required behavior, Stats (+3 more)

### Community 46 - "High-Level Design (HLD) — Pokemon Origins"
Cohesion: 0.17
Nodes (12): 1. System Overview, 2. Architectural Goals, 4.1 Browser ↔ backend, 4.2 Backend ↔ battle-engine (BFF), 4.3 Backend ↔ MySQL, 4. Component Interfaces, 5. Key user flows, 6. System qualities (as built) (+4 more)

### Community 47 - "flagService.test.js"
Cohesion: 0.36
Nodes (7): createFlagService(), createMemoryFlagStore(), createMysqlFlagStore(), assert, { createFlagService, createMemoryFlagStore }, make(), test

### Community 48 - "script.js"
Cohesion: 0.27
Nodes (7): paginate(), DIRS, need(), parseScript(), ScriptError, validateScript(), VALIDATORS

### Community 49 - "battleService.js"
Cohesion: 0.18
Nodes (8): axios, { BATTLE_ENGINE_URL }, calculateDamage(), campaignService, client, proxyError(), turnOrder(), axios

### Community 50 - "battleBeats.js"
Cohesion: 0.22
Nodes (16): chipSteps(), faintSteps(), other(), planEvent(), planMove(), withFallback(), CANT_MOVE_TEXT, REWARD_EVENT_TYPES (+8 more)

### Community 51 - "pipeline.js"
Cohesion: 0.26
Nodes (15): collisionAt(), createWorld(), checkConnections(), checkObjects(), checkReachable(), checkTiles(), checkTrainers(), checkWarps() (+7 more)

### Community 53 - "auth.js"
Cohesion: 0.08
Nodes (24): jwt, { JWT_SECRET }, requireAuth(), inventoryUseSchema, express, inventoryService, { requireAuth }, router (+16 more)

### Community 54 - "fetch_one.py"
Cohesion: 0.21
Nodes (3): download_and_validate(), test_downloads_and_validates_known_sprite(), test_raises_on_404()

### Community 55 - "tiles_v2.py"
Cohesion: 0.11
Nodes (19): new_tiles(), barrel(), bench(), crate(), doormat(), flower_head(), flowers_v2(), _ground() (+11 more)

### Community 56 - "createOverworld"
Cohesion: 0.15
Nodes (32): ALERT_TICKS, createOverworld(), beginWarp(), handleActorEvent(), npcsOf(), onMapEnter(), pump(), runScript() (+24 more)

### Community 57 - "world.test.js"
Cohesion: 0.24
Nodes (8): asciiMap(), CODE, worldOf(), neighbourOrigin(), a, b, c, w

### Community 58 - "PlaygroundScreen.jsx"
Cohesion: 0.10
Nodes (28): API_URL, isGuestId(), ChatLog(), Composer(), Roster(), RosterRow(), time(), PlaygroundScreen() (+20 more)

### Community 59 - "Button"
Cohesion: 0.19
Nodes (29): Primitives (`frontend/src/v2/ui/`), 7. Dialogue in-world, READ FIRST (do not skip), 6. Proposed module layout, BagScreen(), BagMenu(), CommandMenu(), LearnMenu() (+21 more)

### Community 60 - "house_v2"
Cohesion: 0.17
Nodes (7): chimney(), door_v2(), house_v2(), roof_v2(), vent(), wall_v2(), window3()

### Community 61 - "ref_path"
Cohesion: 0.40
Nodes (4): inventoryService, main(), parseArgs(), path

### Community 62 - "campaign.js"
Cohesion: 0.22
Nodes (8): completeBattleSchema, battleSessionService, campaignService, express, progressService, { requireAuth }, router, {
	validateBody,
	completeBattleSchema,
}

### Community 63 - "react"
Cohesion: 0.21
Nodes (13): formatStatLabel(), STAT_LABELS, DexEntryScreen(), dexNo(), Matchups(), dexNo(), DexScreen(), TypeBadge() (+5 more)

### Community 64 - "index.js"
Cohesion: 0.09
Nodes (17): { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS }, { createRoomState }, { createSocketAuthMiddleware }, jwt, { JWT_SECRET }, { resolveMove, spawnPoint, CHAT_RADIUS_PX, ROOM_WIDTH, ROOM_HEIGHT }, assert, attachPlayground (+9 more)

### Community 65 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+8 more)

### Community 66 - "world/maps.test.js"
Cohesion: 0.31
Nodes (6): canStand(), getMap(), index, assert, { canStand, getMap }, { describe, it }

### Community 67 - "QA — Campaign Loop Checklist (Phase 11)"
Cohesion: 0.22
Nodes (8): 1. Auth → starter → Level 1 → Brock → reward → mart, 2. Levels 2–8 gym path, 3. Level 9 — Elite Four + Champion, 4. Level 10 — Legendary Gauntlet, 5. Battle mechanics regression, 6. Economy sanity (full run), Known balance soft spots (honest), QA — Campaign Loop Checklist (Phase 11)

### Community 68 - "world_maps.py"
Cohesion: 0.10
Nodes (21): Original / CC0 (new work), Mossgate placeholders, grove(), blob_mask(), blob_masks(), plank(), autotile_paths(), dawnbrook() (+13 more)

### Community 69 - "GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan"
Cohesion: 0.25
Nodes (7): GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Add `currentMessage` state, give `addLog` an internal message queue, reset on round completion, Task 2: Show the real battle message in the dialog box, Task 3: Demote the developer log to a collapsed-by-default panel

### Community 70 - "trainers.js"
Cohesion: 0.12
Nodes (15): battleHistoryQuerySchema, trainerCardSchema, trainerIdParamsSchema, validateParams(), express, profileService, { requireAuth }, resetService (+7 more)

### Community 71 - "Global Constraints"
Cohesion: 0.20
Nodes (9): GBA/FRLG Redesign — Phase 2: Asset Pipeline (Pokémon Front/Back Sprites) — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Dex → filename resolver (`scripts/frlg_sprites/resolve.py`), Task 2: Download + validate one sprite (`scripts/frlg_sprites/fetch_one.py`), Task 3: CLI driver (`scripts/fetch_frlg_sprites.py`), Task 4: Run the full fetch and validate (+1 more)

### Community 72 - "compose.py"
Cohesion: 0.18
Nodes (11): blink(), despeckle(), _mat(), outline(), render(), shade(), m_at(), stack() (+3 more)

### Community 73 - "battle.js"
Cohesion: 0.20
Nodes (9): battleActionSchema, battleStartSchema, calculateDamageSchema, battleService, battleSessionService, express, { requireAuth }, router (+1 more)

### Community 74 - "GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 3: Trainer Sprites + Battle Background Crop — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Trainer sprite crop script (`scripts/crop_trainer_sprites.py`), Task 2: Battle background crop script (`scripts/crop_battle_backgrounds.py`)

### Community 75 - "GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 4: Battle Coordinate System — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Create `battleLayout.js`, Task 2: Wire `BattleSim.jsx` to `battleLayout.js` and remove the now-duplicate CSS

### Community 77 - "Animation Guide — Pokemon Origins"
Cohesion: 0.33
Nodes (6): Animation Guide — Pokemon Origins, Battle beat order (Phase 3 contract), Do / Don't, Reduced motion, Timing, Title showcase

### Community 78 - "App.jsx"
Cohesion: 0.09
Nodes (19): Palette, Rules, Style Guide — Pokemon Origins, Typography, App(), Protected(), isEnabled, initialTheme() (+11 more)

### Community 79 - "GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan"
Cohesion: 0.33
Nodes (5): GBA/FRLG Redesign — Phase 10: Victory Flow Button Restyle — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Swap victory-flow buttons to `.pixel-btn` chrome

### Community 80 - "GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan"
Cohesion: 0.33
Nodes (5): GBA/FRLG Redesign — Phase 9: Command Panel Restyle + RESET/RUN Verification — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Restyle the command panel buttons; verify RESET/RESTART semantics unchanged

### Community 81 - "puzzles.js"
Cohesion: 0.30
Nodes (17): at(), belts(), clean(), dojo(), eq(), find(), gale(), mirror() (+9 more)

### Community 82 - "slice-pokemon-sprites.py"
Cohesion: 0.36
Nodes (7): chroma_to_alpha(), crop_frac(), fail(), inspect(), main(), slice_sheet(), trim_transparent()

### Community 83 - "Frontend — Pokemon Origins"
Cohesion: 0.40
Nodes (5): Frontend — Pokemon Origins, Layout (`src/`), Local, Routes, UI rules

### Community 84 - "logic/movement.js"
Cohesion: 0.13
Nodes (26): BUMP_TICKS, COL, DIR_NAMES, DIRS, HOP_ARC, HOP_TICKS, LEDGE_DIR, OPPOSITE (+18 more)

### Community 85 - "render_map.py"
Cohesion: 0.38
Nodes (4): main(), render(), draw(), tile_img()

### Community 86 - "db.js"
Cohesion: 0.15
Nodes (11): mysql, pool, promisePool, rawQuery, TRANSIENT_ERROR_CODES, mysql, pool, defaultLoadChart() (+3 more)

### Community 87 - "useBattle.js"
Cohesion: 0.11
Nodes (17): audio(), CUE_NAMES, CUES, isSoundOn(), noiseBuffer(), play(), setSoundOn(), IDLE_FX (+9 more)

### Community 88 - "TitleScreen.jsx"
Cohesion: 0.11
Nodes (24): MAX_CAMPAIGN_LEVEL, JourneyRoad(), sign, stage, DIGLETT_MAP, DIGLETT_PAL, NamePlate(), pickDiggSpot() (+16 more)

### Community 90 - "PartyBoard.jsx"
Cohesion: 0.19
Nodes (19): typeColor(), DRAIN_MS, HpPanel(), PartyBalls(), useSteppedNumber(), MoveLine(), PartyBoard(), same() (+11 more)

### Community 91 - "PHASES"
Cohesion: 0.10
Nodes (19): Master prompt: Pokemon Origins overworld + FRLG-feel overhaul, NON-NEGOTIABLE CONSTRAINTS, OPEN QUESTIONS FOR ME (answer in Phase 0 if I haven't), Phase 0: Audit and design doc (no feature code), Phase 10: Retention and extras (only if I approve), Phase 1: Overworld engine (canvas, custom, no game framework), Phase 2: Avatar system (highly detailed pixel avatars), Phase 3: Core world content and the Start menu (+11 more)

### Community 92 - "Gym leaders"
Cohesion: 0.10
Nodes (19): 1. Willow Thornby: Grass, Mossgate Grove, 2. Mara Quill: Normal, Hearthfield, 3. Tavish Rook: Fighting, Ironbrook, 4. Coral Marlowe: Water, Saltmere Harbor, 5. Volt Dray: Electric, Dynamo Station, 6. Skye Corvin: Flying, Gale Spire, 7. Sage Ilmara: Psychic, Starfall Observatory, 8. Cinder Valko: Fire, Emberhold (+11 more)

### Community 93 - "TrainerScreen.jsx"
Cohesion: 0.14
Nodes (29): api, getErrorMessage(), PokemonSprite(), badgeCount(), cache, fetchProfile(), NEEDS_TARGET, HubEvents() (+21 more)

### Community 94 - "createBattleSessionService"
Cohesion: 0.10
Nodes (41): clonePokemon(), createBattleSessionService(), applyAttract(), applyConfusion(), applyDisable(), applyWinAward(), confusionSelfHit(), cureStatus() (+33 more)

### Community 98 - "movePlaygroundService.test.js"
Cohesion: 0.19
Nodes (12): assert, { CampaignError }, CHARMANDER, { createMovePlaygroundService }, { describe, it }, EMBER, fakeLookupMove(), fakeLookupSpecies() (+4 more)

### Community 102 - "rbox"
Cohesion: 0.17
Nodes (11): book(), framed_picture(), glass_table(), mat(), paint_center(), paint_home(), plant_palm(), rbox() (+3 more)

### Community 103 - "GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan"
Cohesion: 0.25
Nodes (7): GBA/FRLG Redesign — Phase 5: Backgrounds + Shadows — Implementation Plan, Global Constraints, Phase Completion, Rulings (made during planning, binding on this plan), Task 1: Generate the flat shadow asset, Task 2: Swap the battle background to the real cropped asset, Task 3: Replace CSS blur shadows with real shadow images

### Community 104 - "ref_node_assert"
Cohesion: 0.09
Nodes (14): assert, { describe, it, before }, gyms, loader, assert, { describe, it }, { rollGenderForSpecies }, assert (+6 more)

### Community 105 - "renderer.js"
Cohesion: 0.18
Nodes (17): TILE, computeCamera(), actorPixel(), coverage(), createRenderer(), drawActor(), drawAlert(), drawBorder() (+9 more)

### Community 106 - "characters.py"
Cohesion: 0.21
Nodes (6): Task 7: `MessageLog.jsx` + full-width move-resolution view, remove dev-log accordion, _as_list(), make(), head(), grid(), row()

### Community 107 - "express"
Cohesion: 0.17
Nodes (10): express, { requireAuth }, router, starterService, { validateBody, chooseStarterSchema }, chooseStarterSchema, db, express (+2 more)

### Community 108 - "profileService.js"
Cohesion: 0.20
Nodes (15): CARD_THEMES, getBattleHistory(), getPublicProfile(), levelName(), loader, profileError(), summarizeCampaign(), summarizeRecord() (+7 more)

### Community 109 - "movePlaygroundService.js"
Cohesion: 0.10
Nodes (27): createMemoryHistoryStore(), createMemoryHpStore(), createMemoryPpStore(), { CampaignError }, {
	createBattleSessionService,
	createMemoryPpStore,
	createMemoryHpStore,
	createMemoryHistoryStore,
}, createMovePlaygroundService(), buildMon(), buildSandboxService() (+19 more)

### Community 110 - "crop_trainer_sprites.py"
Cohesion: 0.33
Nodes (4): build_throw_strip(), colorkey_to_alpha(), head_center_x(), main()

### Community 111 - "build_all.py"
Cohesion: 0.31
Nodes (4): main(), pixel_rows(), tile_ids(), tileset_image()

### Community 112 - "PokemonDetailRoutes.js"
Cohesion: 0.25
Nodes (6): { createPokemonDetailService }, { createTypeEffectivenessService }, express, { pokeApiClient }, pokemonDetailService, router

### Community 113 - "battleAnimation.js"
Cohesion: 0.18
Nodes (15): Task 8: Type-based move animations, File Structure, Task 0: Branch, Task 1: Pure animation helpers, Task 3: Stepped HP drain and the `-N` tick slot in HpBox, Task 4: Wire the queue into BattleSim and await beat lines, Task 5: New hit beat — tiers, drain-then-text, `-N` tick, Files touched (+7 more)

### Community 114 - "resetService.test.js"
Cohesion: 0.19
Nodes (10): createResetService(), getPool(), resetTrainer(), DEFAULT_PROGRESS, defaultService, { STARTING_COINS }, assert, { createResetService, DEFAULT_PROGRESS } (+2 more)

### Community 116 - "attachPlayground"
Cohesion: 0.27
Nodes (7): attachPlayground(), createSocketAuthMiddleware(), sanitizeGuestName(), assert, { createSocketAuthMiddleware }, { describe, it }, Task 4: Wire the playground module into the backend server

### Community 117 - "src/flags.js"
Cohesion: 0.33
Nodes (5): createFlags(), isEnabled(), defaults, FLAG_NAMES, truthy()

### Community 118 - "REQUIRED CHANGES"
Cohesion: 0.14
Nodes (13): 1. Movement feel (highest priority), 2. Tile and map model, 3. Camera, 4. Character sprites and NPCs, 5. Tilesets and maps, 6. Field effects and transitions, 8. Audio hooks (no music files yet), CONTEXT (+5 more)

### Community 119 - "Move Lab — Battle Engine Move-Testing Playground"
Cohesion: 0.15
Nodes (12): defaultEngine(), Backend design, Engine choice, Frontend design, Move Lab — Battle Engine Move-Testing Playground, `POST /api/playground/exchange` (new route, `requireAuth`), Purpose, RNG override plumbing (Python engine) (+4 more)

### Community 124 - "Art / audio needed from a human"
Cohesion: 0.40
Nodes (4): Art / audio needed from a human, Blocking before public hosting, Dawnbrook placeholders, Phase 1 placeholders (work, but look like placeholders)

### Community 125 - "Global Constraints"
Cohesion: 0.29
Nodes (6): GBA/FRLG Redesign — Phase 1: Encoding + DB Config — Implementation Plan, Global Constraints, Phase Completion, Task 1: Pin `utf8mb4` charset on the MySQL pool, Task 2: Document the Workbench re-export procedure, Task 3: Standalone mojibake verification script

### Community 126 - "dependencies"
Cohesion: 0.25
Nodes (8): dependencies, axios, framer-motion, react, react-dom, react-router-dom, react-transition-group, socket.io-client

### Community 127 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:components, test:sprites

### Community 128 - "middleware/validate.js"
Cohesion: 0.07
Nodes (30): authService, express, router, { validateBody, loginSchema }, evolutionConfirmSchema, idList, loginSchema, martPurchaseSchema (+22 more)

### Community 129 - "roomState.test.js"
Cohesion: 0.32
Nodes (6): colorFor(), hashToUint(), PALETTE, assert, { createRoomState, colorFor }, { describe, it }

### Community 131 - "BattleStage.jsx"
Cohesion: 0.36
Nodes (6): TYPE_COLORS, fxFamily(), seatDrop(), BattleStage(), monClass(), THEMES

### Community 133 - "mapModel.js"
Cohesion: 0.08
Nodes (30): createMemoryFlags(), boot(), fail(), MapError, OBJECT_GROUPS, parseObject(), parseTiledMap(), propsToObject() (+22 more)

### Community 134 - "gen_overworld_placeholders.py"
Cohesion: 0.05
Nodes (37): hasWonBattle(), 0. Baseline (measured this session), 10. Questions (decisions I will not guess), 11. What I need from you to start Phase 1, 12. Decisions recorded (Phase 0 approved 2026-11-03), 13. Phase 8c (new): Gemini-generated ambient NPC dialogue, 1. Items in the repo that contradict the brief (need your ruling), 2.1 Content (static JSON, `backend/data/`) (+29 more)

### Community 136 - "config/flags.js"
Cohesion: 0.28
Nodes (7): createFlags(), defaults, NAMES, assert, { createFlags }, test, truthy()

### Community 137 - "rewards.js"
Cohesion: 0.29
Nodes (6): rewardClaimSchema, express, { requireAuth }, rewardService, router, { validateBody, rewardClaimSchema }

### Community 138 - "bodies.py"
Cohesion: 0.38
Nodes (3): _views(), mirror(), swap()

### Community 141 - "paint_mart"
Cohesion: 0.19
Nodes (7): bottle(), box_item(), glass_counter(), glass_pane(), paint_mart(), potion(), shelf_unit()

### Community 142 - "File format"
Cohesion: 0.17
Nodes (11): Collision layer, Conventions, File format, Map properties, Maps: authoring guide, Not checked, Object layers, Pipeline (+3 more)

### Community 143 - "Stage 1: plan"
Cohesion: 0.12
Nodes (15): Baseline, Commands you will run (after each stage), Decisions I need you to OK, Engine contract (verified in code), Files to change, Master palette plan, Overworld art refinement: audit (stage 0) and plan (stage 1), Stage 0: audit (+7 more)

### Community 144 - "Battle Damage Feedback Implementation Plan"
Cohesion: 0.50
Nodes (3): Battle Damage Feedback Implementation Plan, Global Constraints, Review Focus

### Community 145 - "Room"
Cohesion: 0.15
Nodes (4): floor_key(), pad(), Room, inside()

### Community 146 - "gymPuzzles.js"
Cohesion: 0.21
Nodes (10): buildPuzzle(), engine, FILE, fs, getGymPuzzle(), listGymPuzzles(), load(), path (+2 more)

### Community 147 - "MobilePad.jsx"
Cohesion: 1.00
Nodes (3): Key(), MobilePad(), press()

### Community 149 - "pil"
Cohesion: 0.20
Nodes (3): render(), rows_below(), seats()

### Community 150 - "assets.test.js"
Cohesion: 0.36
Nodes (8): loadAssets(), loadImage(), loadLegendaries(), shinyCanvas(), swapPalette(), SPRITES, SHEET_NAMES, SHEETS

### Community 154 - "Tile"
Cohesion: 0.11
Nodes (15): flower_bed(), flowers_decal(), hexrgb(), mown(), rng(), r(), tall_grass(), Tile (+7 more)

### Community 155 - "MoveLabScreen.jsx"
Cohesion: 0.29
Nodes (8): defaultMon(), MonSetupPanel(), MoveLabScreen(), STAGE_KEYS, STATUS_OPTIONS, TRI_STATE_OPTIONS, triStateToValue(), valueToTriState()

### Community 157 - "interiors.py"
Cohesion: 0.19
Nodes (16): build(), tile_id(), center(), extras(), home(), extras(), house(), lab() (+8 more)

### Community 162 - "snapshotPokemon"
Cohesion: 0.11
Nodes (21): defaultGetPlayerParty(), sanitizeMove(), snapshotPokemon(), defaultParty(), enemyMon(), playerMon(), freshStages(), Task 3: `trainerService.js` — surface `gender` and `experience` (bug fix) (+13 more)

### Community 163 - "legendary/manifest.json"
Cohesion: 0.50
Nodes (3): frame, frames, legendaries

### Community 164 - "overworld/manifest.json"
Cohesion: 0.50
Nodes (3): columns, rows, sheets

### Community 165 - "setup-battle-engine.js"
Cohesion: 0.18
Nodes (7): engineDir, fs, launcher, path, reqFile, { spawnSync }, venvDir

### Community 167 - "start-battle-engine.js"
Cohesion: 0.18
Nodes (8): args, child, { cmd, argsPrefix, useShell }, engineDir, fs, path, root, { spawn }

### Community 169 - "bootstrap-dev-sprites.js"
Cohesion: 0.20
Nodes (8): DEST, FALLBACK, fs, missing, path, placeholder, ROOT, SRC

### Community 171 - "party.js"
Cohesion: 0.22
Nodes (6): partyArrangeSchema, express, partyService, { requireAuth }, router, { validateBody, partyArrangeSchema }

### Community 177 - "Restore methods"
Cohesion: 0.67
Nodes (3): Docker Compose (recommended), Manual, Restore methods

## Knowledge Gaps
- **906 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+901 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1269 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BattleRequest` connect `combat.py` to `test_combat.py`, `Move Lab — Battle Engine Move-Testing Playground`, `pathlib`, `hydrate.js`, `createBattleSessionService`, `Move`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `File Structure` connect `hydrate.js` to `snapshotPokemon`, `combat.py`, `evolutionService.test.js`, `auth.js`, `createBattleSessionService`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `Battle UI Redesign Implementation Plan` connect `createPartyService` to `snapshotPokemon`, `pokemonDetailService.js`, `characters.py`, `battleAnimation.js`, `Button`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _906 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `battleSessionService.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0824524312896406 - nodes in this community are weakly interconnected._
- **Should `BattlePokemonSprite` be split into smaller, more focused modules?**
  _Cohesion score 0.05009920634920635 - nodes in this community are weakly interconnected._
- **Should `loader.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06298701298701298 - nodes in this community are weakly interconnected._