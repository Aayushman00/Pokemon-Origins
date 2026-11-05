# Overworld Architecture — Phase 0 Audit and Design

Status: **draft for approval. No feature code has been written.** Date: 2026-11-03.
Scope of this document: what exists today, what contradicts the overhaul brief, the proposed data model / API / module layout, the level-to-town mapping, risks, and a migration path. Phases 1-10 are not started.

## 0. Baseline (measured this session)

| Suite | Command | Result |
|-------|---------|--------|
| Backend | `cd backend && JWT_SECRET=x npm test` | 303 pass, 0 fail (51 suites) |
| Frontend | `cd frontend && npm test` (node:test + Vitest) | Vitest: 15 tests in 3 files pass; the `node --test` half ran before it and the command exited without a failure line in the tail I captured (I will capture the full count at the start of Phase 1) |
| Battle engine | `cd battle-engine && python3 -m pytest -q` | 36 pass (needed `pip install pytest httpx fastapi`; not preinstalled) |

`graphify` is not installed in this environment, so "`graphify update .` if present" is a no-op. There is no `CLAUDE.md` / `.claude/` in the repo.

## 1. Items in the repo that contradict the brief (need your ruling)

These are the "stop and tell me" items. None are silently resolved here.

1. **Ripped Nintendo art is already committed.** `scripts/fetch_frlg_sprites.py` downloads FireRed/LeafGreen sprites from Bulbagarden Archives into `frontend/public/sprites/{pokemon,battle}/` (dex 1-151, ~5 MB of `frontend/public`). `scripts/crop_battle_backgrounds.py` crops the 10 files in `frontend/public/backgrounds/` from an FRLG battle-BG sheet, and `scripts/crop_trainer_sprites.py` produced `frontend/public/sprites/trainers/player/{red,leaf}*.png` from FRLG overworld sheets. This conflicts with "all new art/audio is original or CC0". Also `assets/sprites/source/README.md` says "do not download a substitute", which the fetch script does. There is no `assets/LICENSES.md`.
   - My reading: the constraint governs *new* work, so I will not add more ripped assets, and I will start `assets/LICENSES.md` by listing the existing ripped assets honestly as "Nintendo/Game Freak, not licensed for redistribution". I will not delete them, since the battle screen depends on them.
   - Related: species, move, gym-leader, and town names (Brock, Pewter City, Lance, etc.) are Nintendo IP regardless of art. That is a product/legal decision, not something I can fix with original art.
2. **Party cap is 3, not 6.** `MAX_PARTY = 3` in `backend/src/services/partyService.js`; positions are 1..3; the reward flow "party < 3 adds, = 3 forces replacement"; the whole balance baseline (`docs/QA_CAMPAIGN_CHECKLIST.md`, `balance-sim.js`) assumes 3. Phase 4 asks for 6 + PC boxes. A PC already exists (`trainer_pokemon.in_pc`, migration 008) but is a single unbounded list, not 8x30 boxes.
3. **No gamepad support exists.** `grep getGamepads` finds nothing. The existing "mobile pad" (`MobilePad.jsx`) just dispatches synthetic `KeyboardEvent`s, and it is battle-only. The Phase 1 input layer is new work, not a reuse.
4. **No feature-flag mechanism exists** in `backend/src/config/env.js` or `frontend/src/config.js`. Needs one small helper per side before Phase 1 ships.
5. **Backend tests use `node --test`, not Vitest**, and `npm test` enumerates every test file by hand in `backend/package.json`. New backend tests must be appended to that list or they silently never run. Frontend has both node:test (`src/**/*.test.js`) and Vitest (`*.spec.jsx`).
6. **Battle sessions are campaign-only and in-memory.** `startBattle(trainerId, {level, battleNumber})` rejects anything that is not the trainer's current linear `(current_level, current_battle)`, and sessions live in a `Map` (lost on restart, single instance). Wild encounters, free-order trainers, whiteout and PvP cannot use it as-is. This is the biggest architectural item (see section 5).
7. **Playground is pixel-space and drag-based**: 3000x2000 px room, `resolveMove` clamps by speed, single hard-coded room `"main"`, no map/collision. Phase 9 replaces its server model, not just its client.
8. **`badges` table exists in the dump but nothing writes it**: columns `(id, trainer_id, badge_name, gym_leader, earned_at)`; only `resetService` deletes from it and the UI has `GymBadge.jsx`. Badges are not derived from progress today.
9. **Docs drift**: HLD says "six migrations" and `database/README.md` documents only 001-006, but 007-009 exist. Cosmetic; I will fix it when adding the new migrations.
10. **Trainer gender is a DB enum** (`Male|Female|Other`) and the "Hub" `PixelAvatar` is a hash-seeded 7x7 emblem, not a character sprite. The Phase 2 avatar system is net-new and replaces that emblem.
11. **Git attribution**: your brief says no `Co-Authored-By`/Claude lines. The session harness suggests adding them. I am following your brief (your instruction wins) and the commit for this doc carries no attribution.
12. **Move Lab today is a sandbox, not a custom-move system.** `/game/movelab` + `movePlaygroundService` runs a single move-vs-move exchange with overrides through the real engine. There are no stored/shareable custom moves; Phase 6b.6 is new, not an extension.

## 2. Current campaign data model

### 2.1 Content (static JSON, `backend/data/`)
- `campaign/levelN.json` (N = 1..10): `{ level, name, battles[] }`, each battle `{ battleNumber, type, trainerId | encounterId }`. `type` is one of `trainer`, `gym_boss`, `elite_four`, `champion`, `legendary`. Loaded/validated by `src/campaign/{loader,schemas}.js`, hydrated to full stat blocks by `hydrate.js` (`statAtLevel`, learnset moves from the `pokedex` schema).
- `trainers/{regular,gym_leaders,elite_four,champion}.json` keyed by id; `encounters/legendary.json`; `rewards/levelN_boss.json` = `{level, source, optionCount, pool[{pokemonId, level}]}`.
- `items.json`, `mart.json`, `move_meta.json`.

All 10 levels have exactly 5 battles: 4 road trainers + 1 boss (levels 1-8), E4x4 + Champion (level 9), 5 legendaries (level 10).

### 2.2 Per-trainer state (MySQL `trainer` schema)
| Table | Role | Key columns |
|-------|------|-------------|
| `trainers` | account | `trainer_id, name, gender, email, password, level, created_at` |
| `trainer_pokemon` | party + PC | stats, `position`, `in_pc`, `status`, `experience` (per-level buffer) |
| `trainer_pokemon_moves` | moves | `move_id`→`pokedex.Move`, `current_pp` |
| `trainer_progress` (001) | campaign cursor | `current_level, current_battle, unlocked_level, status` |
| `reward_offers` + `reward_offer_options` (002) | boss 3-card offer | `UNIQUE(trainer_id, level, battle_number)` |
| `trainer_inventory` (003) | items | `PK(trainer_id, item_id)` |
| `trainer_wallet` (004) | coins | lazy-init 500 |
| `trainer_pending_move_learns` (005) | move-learn queue | idempotent via UNIQUE |
| `trainer_card` (009) | theme/motto/favorite | |
| `badges` (dump) | unused | see 1.8 |
| `battles` (dump) | battle history | used by trainer history page |

### 2.3 Progress semantics
`(current_level, current_battle)` is a single linear cursor; `unlocked_level = max(unlocked_level, level+1)` on boss win; `current_level = 11` means "campaign complete". `completeBattle` is idempotent for already-passed battles and requires `battleSessionService.hasWonBattle`. The mart unlocks when `unlocked_level >= 2` (martService). Coins: 100 per road win, 300 boss/E4/champion/legendary. XP, coins and the reward offer are first-win-only, enforced in the session win path.

### 2.4 Runtime battle path
Frontend → `/api/battle/*` → `battleSessionService` (1792 lines; in-memory sessions keyed by session id and by trainer) → `battleService` HTTP → FastAPI engine for damage/crit/miss/turn order. Status, stages, abilities (first non-hidden), switch/item turns, multi-mon enemy parties, XP/evolution/move-learn hooks all live in the session service. Server already decides all outcomes; client sends intents only. This is the property we must preserve.

## 3. How the 10 levels map to the world (Phase 7 preview, for sign-off)

The existing content is already shaped like a Kanto-style run, so **no recount is needed**: levels 1-8 are 8 gyms, level 9 is Elite Four + Champion, level 10 is a post-game legendary gauntlet.

| Level | Content name | World mapping | Gauntlet 1-4 → | Boss → |
|------:|---|---|---|---|
| 1 | Mossgate | Town 2 + Route 1 (Town 1 = starting town, no battles) | 4 route/gym-yard trainers with line of sight | Gym leader 1 (badge 1) |
| 2-8 | Hearthfield … Emberhold | one town + route each | trainers split between route and gym interior | Gym leaders 2-8 |
| 9 | Zenith Summit | lobby plus 5 rooms in a line, doors back stay open | E4 x4 | Champion |
| 10 | Legendary Gauntlet | post-game cave map, 5 static encounters (not trainers) | — | — |

Proposed rule: the Phase-3 starting town, Route 1, the first town, a cave and one gym are authored first, and only gym 1 is wired to level 1. Levels 2-8 get maps in Phase 7 after the engine proves out. The "Rival" arc is new content; nothing in `backend/data` models a rival.

## 4. Proposed schema changes (all idempotent; each gets a rollback note)

Numbering continues from 009. All use the repo's `information_schema`-guarded `ALTER` style and `CREATE TABLE IF NOT EXISTS`. Nothing touches `pokedex`.

| # | File | Change | Rollback note |
|---|------|--------|---------------|
| 010 | `010_trainer_avatar.sql` | `trainer_avatar(trainer_id PK, avatar_json JSON, updated_at)` | `DROP TABLE trainer_avatar` (UI falls back to emblem) |
| 011 | `011_trainer_world.sql` | `trainer_world(trainer_id PK, map_id, x, y, facing, last_center_map, last_center_x, last_center_y, updated_at)` | drop table; hub fallback still works |
| 012 | `012_trainer_flags.sql` | `trainer_flags(trainer_id, flag VARCHAR(64), value INT DEFAULT 1, set_at, PK(trainer_id, flag))` | drop table |
| 013 | `013_trainer_badges.sql` | **Reuse the existing `badges` table** (add `UNIQUE(trainer_id, badge_name)` and `level` column) instead of a new table | drop the unique index and column |
| 014 | `014_party_cap_and_boxes.sql` | `trainer_pokemon.box INT NULL`, `box_slot INT NULL`; **only if you approve a 6-cap** | drop columns; the cap lives in code (`MAX_PARTY`) |
| 015 | `015_pokedex_seen_caught.sql` | `trainer_pokedex(trainer_id, pokemon_id, seen, caught, PK)` | drop table |
| 016 | `016_trainer_encounter_log.sql` (optional) | server-rolled encounter nonce to reject client-claimed outcomes | drop table |

Later phases add `custom_moves`, `trades`, `pvp_ladder`, and `raid_events`; they are not designed here.

The existing `trainer_progress` row stays and **remains the source of truth for story order**. The world adds map/flag/badge state beside it rather than replacing it.

## 5. Proposed server-side changes

### 5.1 The battle-session decoupling (needed from Phase 4 on)
Extract the "which battle is this" part of `startBattle` into a *battle source* with three kinds:
- `campaign` (today's behavior, unchanged, still guarded by the linear cursor),
- `wild` (server-rolled species/level from an encounter table, caught-or-fled outcome),
- `world_trainer` (a campaign trainer reached through the overworld: validated against the map's trainer id, the trainer's defeated flag and its place in the level's gauntlet order).

The session core (damage, status, switch, XP, win/loss) stays. Smallest change: add an optional `source` to `startBattle`, keep `{level, battleNumber}` as the campaign source, and move the progress guard behind it. Flag-off behavior is byte-identical. Sessions remain in-memory for now; a restart mid-battle is already documented as "restart cleanly". Persisting sessions is **not** proposed here.

### 5.2 API list (new; all JWT, Zod-validated, rate-limited, parameterized SQL)
| Method + path | Purpose | Phase |
|---|---|---|
| `GET /api/world/state` | map id, tile, facing, flags, badges, last center | 1/3 |
| `POST /api/world/save` | persist position (validated against map bounds/collision; autosave on map change) | 3 |
| `POST /api/world/event` | resolve a scripted event (`give`, `setFlag`, `heal`, `warp`, `shop`, `battle`) server-side; client sends only the event id | 1/3 |
| `POST /api/world/heal` | Pokemon Center heal (HP/PP/status), requires being on a center map | 3 |
| `POST /api/mart/sell` | sell at half price | 3 |
| `POST /api/avatar` / `GET /api/avatar/:trainerId` | avatar JSON, schema-validated | 2 |
| `POST /api/encounters/roll` | server rolls a wild encounter for a grass/water/cave tile; returns a signed encounter token | 4 |
| `POST /api/battle/wild/start`, `POST /api/battle/:id/catch` | wild session + catch with server-side formula | 4 |
| `GET/POST /api/pc/*` | boxes: move, withdraw, release | 4 |
| `POST /api/world/blackout` | whiteout: respawn at last center, halve coins (server-computed, not client-triggered) | 5 |
| `GET /api/campaign/progress` | gains `badges[]`, `town` derived fields; shape stays backward compatible | 7 |

Existing endpoints (`/api/campaign/*`, `/api/battle/*`, rewards, mart, evolutions, moves, inventory) are unchanged until Phase 7.

### 5.3 Where the server stays authoritative
The map files ship to the client (needed to render and predict), but the server loads the *same* JSON for collision, warps, encounter tables and triggers when validating `world/save`, `world/event`, and encounter rolls. Client-claimed positions are re-validated, never trusted; wild outcomes and catches are computed on the server; trainer defeat/whiteout/heal are server writes.

### 5.4 Feature flags
`backend/src/config/flags.js` (read env `FLAG_*`, defaults off) and `frontend/src/flags.js` (reads `VITE_FLAG_*`, with a try/catch'd `localStorage` override for dev). `GET /api/flags` returns the server's effective flags so the client never gets out of sync with what the server will accept. Every new mechanic gets one flag. The `OVERWORLD` flag gates the new world route; the legacy `/level/:n` route is untouched while it is off.

## 6. Proposed module layout

```
frontend/src/v2/overworld/
  engine/        loop.js (fixed timestep), scale.js (integer scaling), input.js (kbd+gamepad+pad), camera.js
  logic/         movement.js, collision.js, warps.js, events.js, script.js   # pure, no canvas/DOM
  render/        canvas.js, tilemap.js, sprites.js, anim.js
  maps/          loader.js (Tiled JSON → internal), stream.js (adjacent maps)
  ui/            OverworldScreen.jsx, StartMenu.jsx, dialogue bridge to DialogueBox
  *.test.js      pure-logic tests (node:test, no canvas)
frontend/src/v2/avatar/        layers, palette remap, creator screen
frontend/public/maps/*.json    Tiled exports + tilesets
backend/src/world/             maps.js (server-side map index), events.js, encounters.js, catch.js, flags (service)
backend/src/config/flags.js
backend/data/world/            encounters per map, scripted event tables, town↔level mapping
docs/design/MAPS.md            authoring guide (Phase 3)
assets/LICENSES.md, assets/TODO_ART_AUDIO.md, assets/sprites/avatar/SPEC.md
```

Rules: `logic/` imports nothing from React or canvas; `render/` imports `logic/`; `ui/` composes both. Reuse `Panel`, `DialogueBox`, `MenuList`, `Modal`, `Toast`, `Bars`, `sfx.js`, `battleBeats`, `battleMessageQueue` rather than rebuilding them. The existing `useTypewriter` hook backs dialogue.

## 7. Migration path for existing players

Principle: **no existing column is changed or dropped**, so any rollback is "turn the flag off".

1. Apply migrations 010-013 (additive). With `OVERWORLD` off nothing changes.
2. A one-shot, idempotent `scripts/migrate-progress-to-world.js` (dry-run by default, `--apply` to write, logs counts) derives from each `trainer_progress` row:
   - badges: one per cleared gym level, i.e. levels `1..min(8, current_level-1)` (or `unlocked_level-1`; see Q6),
   - town unlock flags `town_N_unlocked` for `N <= unlocked_level`,
   - story flags (`has_starter`, `mart_unlocked` iff `unlocked_level >= 2`, `rival_beat_1` etc.),
   - an initial `trainer_world` row = the town matching `current_level` (arrival tile, facing down), `last_center` = that town's center.
3. Mid-gauntlet players (`current_battle` 2..5 inside a level) land in that town with the earlier trainers flagged defeated, the rest undefeated, the gym leader gated by the existing order.
4. Level-9/10 players: E4 progress maps to its lockout run position; a player who beat Blue gets the Champion flag and legendary-cave access.
5. Rollback: set `OVERWORLD=false`; `/game` hub and `/level/:n` keep working off untouched `trainer_progress`. To undo data: `DELETE` from `trainer_world`/`trainer_flags` and (if desired) the badge rows the script inserted (tagged with a `source='migration'` marker so they can be removed precisely).

Reward offers, coins, inventory, pending evolutions/move-learns are left as-is and continue to resolve through the existing endpoints; Phase 7 only changes where the UI surfaces them.

## 8. Risks

| Risk | Why it matters | Mitigation |
|------|----------------|-----------|
| **Scope**: eleven phases is a full game | Art, music, maps, and avatar sheets are human-quality work | Placeholder-first plus specs and `TODO_ART_AUDIO.md`; each phase independently shippable behind flags |
| **Battle session coupling** (1.6) | Wild/world battles need a non-linear source | Section 5.1; regression test that flag-off path is identical |
| **In-memory sessions + single-instance sockets** | Playground scale (Phase 9) and any restart lose state | Ask Q4; Redis adapter is already listed as out-of-scope in HLD |
| **Party cap 3 → 6** | Changes economy/balance, reward "forced replacement" flow, hub layout | Behind a flag; rerun `balance-sim.js`; only after your ruling |
| **60 fps with React** | Canvas loop must not trigger React renders per frame | Loop owns the canvas; React only mounts overlays on events |
| **Integer scaling vs. Retina/DPR** | 240x160 at fractional DPR can shimmer | Compute scale from `floor(min(w/240, h/160))`, snap CSS size to device pixels, test at odd window sizes |
| **Map authoring pipeline** | No Tiled maps/tilesets exist; original tileset art is needed | Phase 3 delivers placeholder tilesets plus `MAPS.md`; maps validated by a script |
| **IP exposure** (1.1) | Names/species/ripped art | Your decision; documented in `LICENSES.md` |
| **Test discipline** | `backend/package.json` test list is hand-maintained | Add a guard script that fails if a `*.test.js` is not listed |
| **Graph tooling absent** | `graphify` not installed | Skipped; noted in each phase summary |

## 9. Phase gating

Each phase ends with: tests green (real output pasted), summary, then I stop. Phase 1 will be ready to start the moment you approve this document and answer the questions below. Phase 7 gets its own proposal before any implementation, as you asked.

## 10. Questions (decisions I will not guess)

1. **Ripped assets.** Keep the existing FRLG-derived sprites/backgrounds for now (documented as unlicensed), or do you want a replacement plan with original art before any public hosting? (Section 1.1.)
2. **Party size.** Approve raising the cap from 3 to 6 (Phase 4), with a flagged rollout and balance re-baseline? Or stay at 3 and cap boxes accordingly?
3. **Level/town count.** The data already is 8 gyms + E4/Champion + a legendary gauntlet. Confirm we keep exactly that (recommended) rather than inventing new gyms.
4. **Playground.** Replace the free-drag room outright when Phase 9 lands (recommended: two movement models doubles the server code), or keep both behind a flag?
5. **Hosting and size budget** for maps, music, sprite sheets (a rough MB ceiling, and static host vs. the existing Vite/`_redirects` setup).
6. **Concurrency target** per room and overall (10? 50? 200?). It decides whether Socket.IO stays single-instance.
7. **Badge migration rule.** Should a player who beat a gym boss but has not yet "claimed" the reward offer still get the badge? (Recommended: yes, badge is granted on the win.)
8. **IP/naming.** Keep the Kanto town and character names as-is, or rename to originals in the maps and dialogue?
9. **Start-of-game change.** New accounts currently pick a starter on the hub. In the target experience the Professor hands it over in the lab. Should that replace `StarterPick` for new accounts when the flag is on (recommended), with existing accounts unaffected?

## 11. What I need from you to start Phase 1

Answers to Q1-Q4 and Q9 are enough to begin; Q5-Q8 can wait until Phases 3, 8, and 9. If you answer nothing, my default is: keep the assets, stay at party 3 until Phase 4, keep the 10-level layout, replace the playground in Phase 9, and flag everything off.

## 12. Decisions recorded (Phase 0 approved 2026-11-03)

| Q | Decision |
|---|----------|
| 1 | Keep existing FRLG-derived assets; list as unlicensed in `assets/LICENSES.md`; `TODO_ART_AUDIO.md` gets a "replace before public hosting" item. All **new** assets original/CC0. |
| 2 | Party cap 3 → 6 in Phase 4 behind a flag; `balance-sim.js` re-baseline; reward forced-replacement flow updated. |
| 3 | Exactly 8 gyms + E4/Champion + legendary gauntlet. No invented gyms. |
| 4 | Playground free-drag room is replaced by the tile-grid world in Phase 9 (one movement model). |
| 5 | Deferred to Phase 8. Working assumption: static host, 50 MB total for maps/music/sprite sheets. |
| 6 | Deferred to Phase 9. Assume 50 per room, ~200 overall, single-instance Socket.IO until measured. |
| 7 | Badge is granted on the gym win, independent of claiming the reward offer. |
| 8 | Keep Kanto names during development, but **every name lives in one data file** (`backend/data/world/names.json`, created when the first name is needed in Phase 3) so a rename is data-only. |
| 9 | With `OVERWORLD` on, new accounts receive the starter from the Professor in the lab, replacing `StarterPick`; existing accounts unaffected. |

## 13. Phase 8c (new): Gemini-generated ambient NPC dialogue

Placement: after Phase 8 (music / pixel UI). Backend-only; flagged (`FLAG_AI_DIALOGUE`, plus a separate kill switch); off by default.

- **Hybrid.** Story beats, gym speeches and the tutorial stay hand-authored in map scripts. Gemini covers only ambient NPC chatter, trainer taunts, rival banter, nurse lines and signs.
- **Pre-generate and cache.** A generation job fills `npc_dialogue_cache` keyed by `(npc_id, context_key)` where `context_key` buckets badge count, time-of-day band and lead-Pokemon type. `GET /api/dialogue/:npcId` reads the cache only. **No model call on the request path.**
- **Output contract.** Structured JSON `{lines: string[]}`; max 3 lines x 36 chars; Zod-validated; banned-word filter; on failure retry up to N times, then fall back to the NPC's static line. A provider outage can never block the game: the endpoint always returns a line.
- **Persona sheets.** Per-NPC data file: name, class, town, tone, never-say list (lives with the names file so a rename stays data-only).
- **Injection defense.** Player nicknames / chat reach the prompt only as quoted data fields, never as instructions. Output is plain text only: it can never trigger scripts, items, warps or any game state (the client renders it through `say` and nothing else).
- **Controls.** Kill switch flag, in-game report button (stores `(cache_id, trainer_id, reason)` and disables that line), per-user rate limit on the endpoint, hard daily budget cap on generation calls (job stops when reached), Flash-tier model, API key in server env only.
- **Out of scope.** No live free-text conversation, ever.
- **Schema (sketch, finalized in that phase):** `npc_dialogue_cache(id, npc_id, context_key, lines_json, model, created_at, disabled)`, `npc_dialogue_reports`, `ai_dialogue_budget(day, calls)`.
- **Tests (that phase):** schema/length validator, banned-word filter, injection fixtures, fallback on provider error, cache-only read path, budget cap.
