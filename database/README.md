# Database

Single dump: [`pokedex_data.sql`](pokedex_data.sql).

## Schemas

| Schema | Purpose |
|--------|---------|
| `pokedex` | Species, moves, types, abilities |
| `trainer` | Trainers, party Pokémon, moves, inventory |

Cross-schema FK: `trainer.trainer_pokemon_moves.move_id` → `pokedex.Move(move_id)`.

## Restore order (FK-safe)

The dump sets `FOREIGN_KEY_CHECKS=0` during load, then re-enables checks. Table order is also parent-before-child:

1. `pokedex` core tables (`Move`, `Pokemon`, …)
2. `pokemon_species` then `pokemon_genders`
3. `trainer.trainers` → `trainer_pokemon` → `trainer_pokemon_moves` → other trainer tables

## Restore methods

### Docker Compose (recommended)

```bash
npm run docker:db
# mounts dump + trainer_progress migration into MySQL init on first volume create
```

If the volume already exists and you need a clean restore:

```bash
docker compose down -v
npm run docker:db
```

### Manual

```bash
mysql -u root -p < database/pokedex_data.sql
```

Align `backend/.env`:

- `DB_NAME=pokedex`
- `TRAINER_DB_NAME=trainer`

## Migrations

Apply after the dump (trainer schema must exist). Do **not** rewrite `pokedex` tables.

| File | Purpose |
|------|---------|
| [`migrations/001_trainer_progress.sql`](migrations/001_trainer_progress.sql) | `trainer.trainer_progress` — campaign resume (`current_level`, `current_battle`, `unlocked_level`, `status`, timestamps) |
| [`migrations/002_reward_offers.sql`](migrations/002_reward_offers.sql) | `trainer.reward_offers` + `reward_offer_options` — one-time boss reward offers with server-authored option snapshots (stats, `types_json`, `moves_json`). `UNIQUE (trainer_id, level, battle_number)` enforces one offer per boss battle. |
| [`migrations/003_trainer_inventory.sql`](migrations/003_trainer_inventory.sql) | `trainer.trainer_inventory` — item quantities per trainer, `PRIMARY KEY (trainer_id, item_id)`. Item stats live in `backend/data/items.json`; the legacy name-keyed `trainer.inventory` table from the dump stays unused. |
| [`migrations/004_trainer_wallet.sql`](migrations/004_trainer_wallet.sql) | `trainer.trainer_wallet` — coins per trainer. Lazy-inits at 500 coins on first read (no backfill needed); moves only via server-side win awards (100 / 300 boss) and transactional mart purchases. |
| [`migrations/005_pending_move_learns.sql`](migrations/005_pending_move_learns.sql) | `trainer.trainer_pending_move_learns` — "wants to learn" offers created when a level-up teaches a learnset move but the mon already knows 4. Resolved (learn+forget or skip) via `POST /api/moves/learn`; `UNIQUE (trainer_pokemon_id, move_id, learned_at_level)` makes offer creation idempotent. |
| [`migrations/006_backfill_move_pp.sql`](migrations/006_backfill_move_pp.sql) | Data backfill, no schema change: `trainer_pokemon_moves.current_pp = pokedex.Move.pp` wherever it is `NULL`/`0` (rows written before Phase 14 stored 0 — battles now track and persist PP, so 0 would mean an unusable move). Idempotent; safe to re-run. |

### Existing volume / local MySQL

Compose init SQL only runs on **first** volume create. For an already-initialized database:

```bash
docker compose exec -T mysql mysql -u root -prootpassword < database/migrations/001_trainer_progress.sql
docker compose exec -T mysql mysql -u root -prootpassword < database/migrations/002_reward_offers.sql
docker compose exec -T mysql mysql -u root -prootpassword < database/migrations/003_trainer_inventory.sql
docker compose exec -T mysql mysql -u root -prootpassword < database/migrations/004_trainer_wallet.sql
docker compose exec -T mysql mysql -u root -prootpassword < database/migrations/005_pending_move_learns.sql
docker compose exec -T mysql mysql -u root -prootpassword < database/migrations/006_backfill_move_pp.sql
```

PowerShell:

```powershell
Get-Content database/migrations/001_trainer_progress.sql | docker compose exec -T mysql mysql -u root -prootpassword
Get-Content database/migrations/002_reward_offers.sql | docker compose exec -T mysql mysql -u root -prootpassword
Get-Content database/migrations/003_trainer_inventory.sql | docker compose exec -T mysql mysql -u root -prootpassword
Get-Content database/migrations/004_trainer_wallet.sql | docker compose exec -T mysql mysql -u root -prootpassword
Get-Content database/migrations/005_pending_move_learns.sql | docker compose exec -T mysql mysql -u root -prootpassword
Get-Content database/migrations/006_backfill_move_pp.sql | docker compose exec -T mysql mysql -u root -prootpassword
```

Or from a host client:

```bash
mysql -u root -p < database/migrations/001_trainer_progress.sql
mysql -u root -p < database/migrations/002_reward_offers.sql
mysql -u root -p < database/migrations/003_trainer_inventory.sql
mysql -u root -p < database/migrations/004_trainer_wallet.sql
mysql -u root -p < database/migrations/005_pending_move_learns.sql
mysql -u root -p < database/migrations/006_backfill_move_pp.sql
```

### Fresh Compose volume

`docker-compose.yml` also mounts `001_trainer_progress.sql`, `002_reward_offers.sql`, `003_trainer_inventory.sql`, `004_trainer_wallet.sql`, `005_pending_move_learns.sql`, and `006_backfill_move_pp.sql` into `/docker-entrypoint-initdb.d/` so new volumes get the tables (and the PP backfill) after `pokedex_data.sql`.

New authenticated trainers start at level 1 / battle 1. The backend **lazy-inserts** a progress row on `GET /api/campaign/progress` if missing.

## Party seeding (Phase 4, dev utility)

`trainer_pokemon.position` (1–3) orders the party; the cap of 3 is enforced in `backend/src/services/partyService.js` (no DB constraint). The starter flow fills position 1; to fill the remaining slots for local testing:

```bash
cd backend
npm run seed:party -- <trainerId>                 # adds Pidgey (16) and Rattata (19) at Lv 5
npm run seed:party -- <trainerId> 25:8 133:10     # explicit pokemonId:level pairs
```

Stats/moves are hydrated from the `pokedex` schema with the campaign stat formula; inserts go through `partyService`, so the 4th mon is rejected and each new mon takes the lowest free position. `current_pp` starts at the move's full base PP (`pokedex.Move.pp`) — battles decrement and persist it (Phase 14). Requires `backend/.env` DB settings; run against a live MySQL.

## Inventory seeding (Phase 7, dev utility)

There is no public grant API — items enter a trainer's bag via this script (or the Phase 8 mart later):

```bash
cd backend
npm run seed:inventory -- <trainerId>             # 3x Potion, 1x Super Potion, 1x Fire Stone
npm run seed:inventory -- <trainerId> 1:5 2:2     # explicit itemId:qty pairs (ids from backend/data/items.json)
```

Grants go through `inventoryService.addItem`, so unknown item ids are rejected. Requires `backend/.env` DB settings and the `003_trainer_inventory.sql` migration applied.

Smoke check: seed potions → battle → BAG → Potion → active mon's HP rises by 20 (server event) and the enemy takes its beat → next `GET /api/inventory` shows the decremented quantity. Overworld: hub → Bag → Potion → pick a hurt party member → stored HP rises (capped at max).

## Coins + Mart (Phase 8)

Coins live in `trainer_wallet` (migration 004) and start at **500** via lazy init — no seed script needed. Wins pay 100 (boss 300) exactly once per battle; the mart (`/api/mart`) unlocks after the Level 1 boss (`unlocked_level >= 2`).

Mart smoke check: beat Brock (or set `unlocked_level = 2` for the trainer in `trainer_progress`) → hub → Mart → coins visible → BUY Potion → coins drop by 100 and the owned count rises → `GET /api/inventory` confirms. Buying with insufficient coins answers 400 `INSUFFICIENT_FUNDS`; a locked mart answers 403 `MART_LOCKED` on purchase.

## Evolution (Phase 9 — no migration needed)

Evolution rules are **read** from the pokedex `Evolution` table already in the dump (`level-up` + `"Level N"` and `use-item` + `"Use <stone>"` rows; trade rows are skipped). Level evolutions are pending+confirm, derived live from `trainer_pokemon` + `Evolution` — no offer table. Applying an evolution updates `trainer_pokemon` in place (`pokemon_id`, `nickname` when it was the default species name, and the stat columns via the hydrate species-delta); `level`, `experience`, and `moves` are untouched.

Evolution smoke check: mart → buy Water Stone (800) → seed/own an Eevee (`npm run seed:party -- <trainerId> 133:10`) → hub → Bag → Water Stone → pick Eevee → Vaporeon reveal, stone consumed, party row now `pokemon_id 134`. Level path: win battles until Charmander hits Lv 16 → win response says "can now evolve" → hub shows the pending card → EVOLVE → Charmeleon; the next battle start snapshot uses the evolved species/stats. A Water Stone on Charmander answers 400 `NO_EVOLUTION_EFFECT` and keeps the stone.

## Move learning (migration 005)

Learnsets are **read** from `pokedex.Pokemon_Move` (`level_learned` per species) — the same data the enemy hydrator uses, but player moves are never silently overwritten. On a level-up win, each crossed learnset move either auto-learns (mon knows < 4 moves; row appended to `trainer_pokemon_moves` with `current_pp` = `Move.pp`) or creates a pending offer in `trainer_pending_move_learns` (migration 005). The trainer resolves offers on the hub via `POST /api/moves/learn`: **learn + forget** (transactional swap; the dropped move is archived into the dump's `forgotten_moves` table) or **skip**. The offer's UNIQUE key makes creation idempotent, and rows survive refresh/restart.

Move-learn smoke check: level a mon with 4 moves into a learnset level (e.g. Charmander to Lv 13 — Rage) → win log says "wants to learn" → hub shows the MOVE LEARNING panel → pick a move to forget → confirm → next battle's FIGHT menu shows the new move; `trainer_pokemon_moves` still has exactly 4 rows and `forgotten_moves` gained one. Skipping leaves moves unchanged and clears the offer. With < 4 moves the win log says "learned" and no offer is created.

## Full campaign (Phase 10 — no migration needed)

Levels 2–10 are pure content + engine wiring: campaign/trainer/encounter/reward JSON under `backend/data/`, multi-mon enemy parties inside the in-memory battle sessions, and the generic `/level/:levelNumber` frontend route. No schema changes; `trainer_progress`, `reward_offers`, `trainer_inventory`, and `trainer_wallet` are reused as-is. Completing level 10's last battle leaves `current_level = 11` — the hub renders that as "campaign complete" (there is no level 11 file).

Campaign smoke check: beat Brock → claim the reward card → level-complete screen offers "Continue to Level 2" and the hub button reads "Continue — Level 2 · Battle 1" → Misty's road opens with Swimmer Luis. Multi-mon: any gym boss (e.g. Brock) — KO the first mon → "Brock sent out Onix!" with the second sprite sliding in and the enemy party dots updating → the win only lands after every enemy mon faints, XP pays 6 × (sum of enemy levels). Level 9: E4 wins pay 100 coins and create no reward offers; beating Blue creates the champion offer. Level 10: each legendary is a wild single-mon fight ("A wild Articuno appeared!") and pays a boss reward offer from the shared legendary pool.

## Battle fidelity / PP (Phase 14 — migration 006)

Battles now track PP: sessions snapshot `trainer_pokemon_moves.current_pp` (a `NULL` counts as full base PP), decrement it as moves execute, and **persist it back at battle end — win or loss** (`UPDATE trainer_pokemon_moves SET current_pp = ...` per move). Migration 006 backfills legacy rows that stored `0` (the old "PP untracked" convention) so existing parties don't start Struggle-locked. Major statuses and stat stages are **session-only** and are never written to `trainer_pokemon` — no schema impact.

PP smoke check: battle → FIGHT menu shows `PP n/m` and each use ticks it down → win or lose, then `SELECT current_pp FROM trainer_pokemon_moves WHERE trainer_pokemon_id = <id>` shows the spent value → mart → buy an Elixir (300) → Bag → Elixir → pick the mon → PP back to full (using it on a full-PP mon answers 400 `PP_ALREADY_FULL` and keeps the item). Emptying every move's PP in battle flips the FIGHT menu to a single STRUGGLE button.

## XP columns (Phase 5 — no migration needed)

Win XP reuses existing `trainer_pokemon` columns: `experience` holds a **per-level XP buffer** (threshold to the next level is `level³`, engine formula), and `level` plus the stat columns (`max_hp`, `current_hp`, `attack`, `defense`, `speed`, `special_atk`, `special_def`) are updated in place on level-up. Writes go through `backend/src/services/xpService.js`.

## Notes

- Dump encoding is UTF-8 (converted from UTF-16 for reliable MySQL client/Docker init).
- Reorder helper: `python scripts/reorder-sql-dump.py` (idempotent only if current order matches expected parents/children).
