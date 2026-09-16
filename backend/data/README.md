# Campaign data

Backend-owned, data-driven campaign config. The battle engine does not read these files.

| Path | Role |
|------|------|
| `campaign/levelN.json` | Ordered battles: `{ battleNumber, type, trainerId }` or `{ battleNumber, type: "legendary", encounterId }` |
| `trainers/*.json` | Trainer identity + party `{ pokemonId, level }` only (`regular`, `gym_leaders`, `elite_four`, `champion`) |
| `rewards/levelN_boss.json` | Boss reward pool: `{ level, source, optionCount, pool: [{ pokemonId, level }] }` |
| `encounters/legendary.json` | Legendary catalog: `{ id, name, pokemonId, level }` keyed by encounter id |
| `items.json` | Item catalog: `itemId`, `name`, `category` (`healing` / `evolution_stone` / `pp_restore`), `healAmount`, `usableInBattle`, `usableOverworld`, `description`. The DB stores quantities only — item stats always come from this file. |
| `move_meta.json` | Per-move battle metadata keyed by exact `pokedex.Move` name — currently `priority` (Gen 3 brackets; unlisted moves are 0). Read by the Node session for turn order. |
| `mart.json` | Mart stock and unlock rule: `{ unlock: { requiredUnlockedLevel, hint }, stock: [{ itemId, price }] }`. Item ids resolve against `items.json`; prices are server truth. Leaf Stone is deliberately not sold. |

Stats, types, and moves are **not** stored here. `campaignService` hydrates them from the `pokedex` MySQL schema (`Pokemon`, `Pokemon_Type`, `Pokemon_Move`, `Move`).

### Full campaign (Phase 10)

All ten levels are populated and playable under progress locks:

| Levels | Structure | Battle types |
|--------|-----------|--------------|
| 1–8 | 4 road trainers + gym leader (Brock, Misty, Lt. Surge, Erika, Koga, Sabrina, Blaine, Giovanni) | `trainer` ×4, `gym_boss` |
| 9 | Indigo Plateau: Lorelei, Bruno, Agatha, Lance, then Blue | `elite_four` ×4, `champion` |
| 10 | Legendary Gauntlet: Articuno, Zapdos, Moltres, Mew, Mewtwo | `legendary` ×5 |

Legendary battles reference `encounters/legendary.json` by `encounterId`; the loader resolves them and `campaignService` hydrates the single legendary like a one-mon trainer party (same Pokéball → Pokémon presentation, no trainer art anywhere).

**Reward offer rule (per battle type):** `gym_boss`, `champion`, and each `legendary` win creates a 3-option offer from that level's `rewards/levelN_boss.json` (the pool's `source` must match the battle type). `elite_four` and road `trainer` wins never create offers. Level 10 offers all draw from the shared level-10 pool — beating any legendary can offer other legendaries.

**Coins:** boss-type wins (`gym_boss`, `elite_four`, `champion`, `legendary`) pay 300; road `trainer` wins pay 100. (Phase 11 moved `elite_four` to the boss rate — they are full 3-mon Lv 50+ fights and fund late-game Hyper Potions; they still create no reward offers.)

### Balance (Phase 11)

Every number below is a data/constant knob — retune them together, not in isolation:

- **XP curve** (`xpService.js`): threshold L→L+1 = `XP_CURVE_SLOPE × L` (12·L), win XP = `XP_PER_ENEMY_LEVEL` (6) × Σ enemy levels. Campaign battles are one-time, so income is fixed (~21k XP); the linear curve carries a Lv 5 starter to ~Lv 55–60 by the gauntlet.
- **Enemy levels** (`trainers/*.json`, `encounters/legendary.json`): tuned so road fights sit within ±3 of the deterministic "carry" level, gym aces +1…+7 (Brock/Misty are deliberate early walls — the seeded starter stats and the claimed counter-pick carry those), E4/champion +4…+5, legendaries −4…+2 against the best claimed mon.
- **Reward pools** (`rewards/levelN_boss.json`): pool levels ≈ the *next* level's road tier, so a fresh claim is immediately fieldable. The level 10 pool mirrors the encounter levels (beat a legendary, claim a legendary).
- **Economy** (`walletService.js`, `mart.json`): 500 start, 100/win, 300/boss ⇒ ~9,100 coins over a full run vs ~6,500 of meaningful sinks (potion 100, super 250, hyper 1200, stones 800).

`cd backend && node scripts/balance-sim.js` prints the whole ladder (per battle: carry level, best claim, enemy ace, gap) straight from these data files + live constants. Run it after any balance edit.

## API (JWT)

Progress lives in `trainer.trainer_progress`. New trainers default to level 1 / battle 1.

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/campaign/progress` | Current `current_level`, `current_battle`, `unlocked_level`, `completed`, `status` |
| `POST` | `/api/campaign/progress/complete-battle` | Body `{ level, battleNumber }`. Completes **only** the active battle (no skipping). Idempotent: repeating a finished battle does not unlock extra progress. Completing the last battle of a level unlocks the next level even if that level has no JSON yet. |
| `GET` | `/api/campaign/level/:levelNumber` | Hydrated battles + `legacy` payload. **403** if the level is locked for this trainer. **404** if unlocked but not configured (only past level 10 now). Legendary battles carry `encounter: { id, name, pokemonId, level, party }` instead of `trainer`. |

Legacy shim `GET /api/battle/level/1` still returns the full Level 1 trainer list (Level 1 is always unlocked). Prefer the campaign routes for progress-aware play.

`legacy.trainers[]` includes `battleNumber` so clients can map battles to progress.

## Battle sessions (Phase 3 + Phase 4 party, JWT)

The backend owns HP, turn order, the winner, and the party. The client sends actions only.

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/api/battle/start` | Body `{ level, battleNumber }`. Must equal the trainer's current progress battle (403 otherwise). Snapshots the trainer's **full party** (max 3) plus the enemy, or resumes the live session for that battle. 400 if the party is empty or fully fainted. Returns `{ state }`. |
| `POST` | `/api/battle/action` | Body `{ sessionId, action }` where `action` is `{ type: "move", moveId }`, `{ type: "switch", partyPosition }` (1–3), or `{ type: "item", itemId, partyPosition? }` (Phase 7). Resolves one round via the battle engine (`/turn_order/` + `/calculate_damage/`; speed tie favors the player). Returns `{ state, events, progress? }` — `progress` appears when a win advances the campaign. 403 wrong trainer, 409 finished session or action already resolving. |
| `GET` | `/api/battle/:sessionId` | Current authoritative state for resume/render. |

`state` includes `party[]` (each snapshot carries `position`), `activePosition`, and `requiresSwitch` alongside `player` (the active mon) and `enemy`. Phase 10 adds `battleType`, `enemyParty[]` (the full 1–N enemy side), and `enemyActivePosition` — `enemy` is always the active member of `enemyParty`.

### Enemy parties (Phase 10)

Enemy sides snapshot the trainer's **whole configured party** (e.g. Brock's Geodude + Onix). When the active enemy faints with reserves left, the server auto-sends the next mon in party order within the same action response:

```
{ actor: "enemy", type: "enemy_send", position, pokemon, remaining }
```

The incoming mon does **not** attack on the round it comes out (the player keeps the initiative — FireRed feel), and the battle is `won` only when every enemy party member has fainted. Enemy AI (`battleAi.js`, Phase 14) scores damaging moves with PP left by `power × type effectiveness × STAB` (chart lazily loaded once from `pokedex.type_damage_relations`; neutral if the DB is unavailable), never picks a 0× move when it has alternatives, and ~30% of the time opens with a status/stat move while the player's mon is healthy (>50% HP) and unstatused. It never switches voluntarily and never uses items. Player switch/item/move rules are unchanged.

### Party & switch rules

- Active mon starts at the lowest `position` with HP left; it changes only via a switch action.
- **Voluntary switch** (while the active mon stands): has priority but **consumes the turn** — events are `[{ type: "switch", fromPosition, toPosition, pokemon }, enemy move beat]`.
- **Forced switch** (active mon fainted, reserves left): `requiresSwitch: true` in state; `move` actions are rejected with 400 until a switch happens; the replacement is **free** (no enemy beat) — Gen 3-style.
- Switching to the active, a fainted, or an unknown position is a 400.
- The battle is `lost` only when every party member has fainted; losses never touch campaign progress.

On a win the server calls `progressService.completeBattle` internally. `POST /api/campaign/progress/complete-battle` requires a **won session** for that battle (replays of already-completed battles stay idempotent) and exists as the recovery path if the award fails mid-action.

### Battle fidelity — Gen 3 / FireRed-style (Phase 14)

The Python engine ([battle-engine/app/combat.py](../../battle-engine/app/combat.py)) stays stateless math; the Node session owns every stateful rule below. Engine payloads now carry each side's `status`, `stages`, and `ability`, and the engine answers with a rich verdict (`stab`, `type_multiplier`, `critical_hit`, `status_effect_applied`, `attacker_status_applied`, `stat_changes`, `recoil_fraction`, `drain_fraction`, `hits`, `ohko`, `heal_amount`) that the session turns into state changes + events. All new fields are optional, so old payloads and test stubs keep working.

**Damage math (engine):**

- **STAB ×1.5** when the move type is one of the attacker's types; **crit 1/16 at ×2.0** (Gen 3 value; crits do *not* ignore stat stages — simplification); random factor 0.85–1.0; type chart unchanged.
- **Stat stages** −6…+6 with Gen 3 multipliers — `(2+s)/2` when raised, `2/(2−s)` when lowered — applied to atk/def/spa/spd in damage and acc/eva in the hit roll (`(3+s)/3`). Node applies the `spe` stage (and paralysis ×0.25) to turn-order speeds.
- **Burn halves physical attack**; special moves are unaffected.
- **Move effects** come from `battle-engine/app/data/move_effects.json` (~60 Gen 1 campaign moves keyed by exact `pokedex.Move` name, e.g. `Take-down`): secondary status + chance, pure status, stat changes, recoil / drain fractions, multi-hit (one accuracy roll; Gen 3 hit weights 2/3 hits 37.5% each, 4/5 hits 12.5% each), always-hit (Swift), OHKO (30% accuracy, fails against a higher-level defender, damage = defender's current HP), heal (fraction of max HP). Unlisted moves are plain damage.

**Turn order:** move priority from [move_meta.json](move_meta.json) wins first (Quick-attack +1, Extreme-speed +2, Protect-family +3, Counter −5, Roar −6, …); equal priority falls to **effective speed** (spe stage, ×0.25 when paralyzed); a full tie goes to the player (unchanged, deterministic). Protect/Counter special mechanics are out of scope — the meta file only orders them.

**Major statuses (brn/par/psn/slp/frz):** one per mon at a time; a second status fails silently ("But it failed!"). Session-only — cleared at battle end, never written to `trainer_pokemon.status` (no Pokémon Centers or cure items — documented simplification). Statuses survive switches; stat stages do not.

- **Sleep** blocks 1–4 move attempts (rolled on apply), then the mon wakes on its next attempt (`status_end`, reason `wake`).
- **Freeze** thaws 20% per attempt, or instantly when hit by a damaging Fire-type move (`status_end`, reason `thaw` / `fire_thaw`).
- **Paralysis** fully blocks 25% of attempts and quarters effective speed.
- **Burn / poison** chip **1/8 max HP** (min 1) at end of round in that round's turn order; chip can faint a mon and reuses the normal faint/forced-switch/win-loss pipeline. Toxic behaves as plain poison (simplification).
- Blocked turns (`cant_move`) do **not** spend PP.

**Abilities:** the snapshot loads each species' **first non-hidden ability** (lowest `ability_id` — documented rule) from `pokedex.Pokemon_Ability`. Wired: **Levitate** (Ground moves deal 0×), **Static** (30% chance a *physical* hit paralyzes the attacker; contact ≈ physical — simplification), **Overgrow / Blaze / Torrent / Swarm** (×1.5 on same-type moves at ≤⅓ HP). Every other ability is a listed no-op and never crashes anything.

**PP + Struggle:** move PP snapshots from `trainer_pokemon_moves.current_pp` (`NULL` = full base `Move.pp`; enemies always start full via hydrate). PP is spent when the move executes — misses included, status-blocked turns excluded — with `pp_change` events. Choosing a 0-PP move is a 400; with **every** move at 0 the state flags `mustStruggle` and only **Struggle** (`moveId: -1`) is accepted: power 50, **typeless** (no STAB, no type chart, ignores Levitate), always hits, ¼-of-damage recoil (Gen 2–3 style). Player PP persists to `trainer_pokemon_moves` at battle end — **win or loss** — so PP is a real resource across the campaign; the **Elixir** (mart, ~300) is the refill valve. Enemy PP is session-only. Sessions are in-memory: a mid-battle backend restart loses that battle's PP usage (documented).

**New action events** (same `events[]` contract): `pp_change`, `cant_move`, `status_applied`, `status_end` (reason `wake` / `thaw` / `fire_thaw`), `status_damage`, `stat_change` (`failed: true` at the ±6 clamp → "won't go any higher!"), `recoil`, `drain`, `heal_move`; `move` events also carry `stab`, `type_multiplier`, `critical_hit`, `hits`, `ohko`. The FIGHT grid shows live PP and disables 0-PP moves, HP boxes and party rows wear BRN/PAR/PSN/SLP/FRZ badges, and the log narrates every event above.

**Out of scope (documented):** confusion, weather, two-turn/binding moves, Protect/Counter mechanics, held items, crit-stage moves; crits don't ignore stages; sleep/freeze/para rates fixed at 1–4 turns / 20% / 25%; chip fixed at 1/8.

### XP and leveling (Phase 5)

XP is granted **server-side on a win only**, by `xpService` from inside the session win path. Clients never send XP; they only render events.

- **Recipient**: the Pokémon active at the moment of victory.
- **Gain**: 6 × the **sum of enemy party levels** (identical to the old enemy-level × 6 for one-mon battles; Brock's Geodude 12 + Onix 14 pays 156 XP).
- **Formula** (Phase 11 curve): `trainer_pokemon.experience` is a **per-level buffer**, not a lifetime total; advancing from level L to L+1 costs `XP_CURVE_SLOPE × L` = 12·L XP (linear — see the Balance section for why the original cubic engine curve was replaced). Levels cap at 100 (excess XP stays buffered). The battle-engine's Python `add_experience` helpers still use L³ but are not called by the campaign win path.
- **Per level gained** (engine increments): max_hp +5, attack +2, defense +2, speed +1, special_atk +2, special_def +2. Stored `current_hp` grows by the max_hp delta, clamped to the new max — **no full heal**; battle HP still never writes back.
- **Persistence**: `UPDATE trainer_pokemon` by row `id` + `trainer_id`; the next `POST /api/battle/start` snapshots the new level/stats.
- **Anti-duplicate**: XP is tied to the **first-time** `completeBattle` result (`alreadyCompleted` grants nothing) plus a per-session `xpAwarded` flag; won battles cannot be restarted, so XP cannot be farmed.

The action response appends reward events after the battle beats:

```
{ actor: "player", type: "xp_gain",  position, nickname, amount, xp, xpToNext, level }
{ actor: "player", type: "level_up", position, nickname, fromLevel, level, statIncreases }
```

`level_up` appears only when a threshold was crossed (multi-level gains still produce a single event with the final level). If progress persistence fails at win time, XP is skipped too — the recovery endpoint does not re-run rewards (documented limitation).

Sessions live in an **in-memory Map**: resume survives refresh but not a backend restart or multiple instances; restart the battle via `POST /api/battle/start` in that case. One session per trainer; finished sessions are replaced on the next start. Battle HP is session-local — it is never written back to `trainer_pokemon`, so parties start each battle at their stored HP.

### Boss reward cards (Phase 6, extended Phase 10)

Winning a boss-type battle (`gym_boss` on levels 1–8, the `champion` on level 9, each `legendary` on level 10) creates a **one-time reward offer** with exactly 3 options picked from that level's `rewards/levelN_boss.json` (the pool `source` must match the battle type). Options are hydrated from the pokedex DB (same math as campaign hydration) and **snapshotted into `trainer.reward_offers` / `reward_offer_options`** — the claim never trusts client stats or species; there is no `pokemonId` field in the claim API at all.

**Win-path order** (inside the session win path): battle beats resolve → `progressService.completeBattle` → XP award → coins → reward offer. XP and offers are both gated on the **first-time** completion (`alreadyCompleted` creates nothing); offers are additionally unique per `(trainer, level, battleNumber)` in the DB. Road-trainer and `elite_four` wins never create offers. If offer creation fails, progress + XP stand and no offer exists (no retry hook — documented limitation). `GET /api/rewards/pending` surfaces one pending offer at a time; on level 10 an unclaimed offer simply resurfaces after the next legendary win is claimed or deferred.

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/api/battle/action` | On a first-time boss win the response also carries `reward` (the public offer). |
| `GET` | `/api/rewards/pending` | `{ reward, party? }` — the outstanding offer in public shape (`offerId`, `level`, `battleNumber`, `source`, `options[]` with `optionId`, species/level/stats/types) plus the current party when an offer exists. `reward: null` when nothing is pending. |
| `POST` | `/api/rewards/claim` | Body `{ offerId, optionId, replacePartyPosition? }`. Validates the offer belongs to the trainer and is unclaimed (404 / 409), the option is one of the 3 stored ones (400). Party < 3: adds at the lowest free position. Party at 3: `replacePartyPosition` (1–3) is required (400 without it); that member is removed (moves + row) and the reward takes the freed slot. Returns `{ pokemon, position, party }`. |

Claims are **one-time**: the offer flips `pending -> claimed` atomically before the party write; if the party write fails the offer reopens (best effort) so the trainer can retry. The claimed mon starts at full HP, `experience 0`, with its pool-config level and snapshot moves at full PP (offers created before Phase 14 lack `pp` in their snapshot and insert `current_pp 0` — an Elixir tops them up).

Frontend: after the boss win (and on resume), the Level 1 flow shows the 3 cards via `RewardPicker` (Pokémon sprites only — no trainer art), with a replacement picker when the party is full, then continues to the level-complete screen. "Claim later" leaves the offer pending; it resurfaces on the next visit.

### Inventory / bag (Phase 7)

Quantities live in `trainer.trainer_inventory` keyed by the `items.json` catalog `itemId`; the server owns all item effects — clients can never forge HP or invent items. There is **no public grant API**: quantities only go up via `npm run seed:inventory` (dev) and, later, the Phase 8 mart.

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/inventory` | `{ items: [{ itemId, name, category, quantity, usableInBattle, usableOverworld, healAmount?, description }] }` — owned items only (quantity > 0). |
| `POST` | `/api/inventory/use` | **Overworld use only** (no sessionId). Body `{ itemId, partyPosition? }`. Healing items require a `partyPosition`, heal stored `trainer_pokemon.current_hp` clamped to `max_hp`, and consume one item **after** the heal persisted. Returns `{ item, amount, pokemon, items }`. Evolution stones (Phase 9) also require a `partyPosition`: the pokedex `Evolution` table decides the outcome, the species change persists first, then the stone is consumed; returns `{ item, evolved, items }`. A stone with no Evolution row for the target species is a 400 with code `NO_EVOLUTION_EFFECT` and is **not consumed**. |
| `POST` | `/api/battle/action` | In-battle use via `{ type: "item", itemId, partyPosition? }` — see rules below. |

**Context rules (server-enforced):** Potion (20 HP), Super Potion (50 HP), and Hyper Potion (200 HP, Phase 11 — late-game mons run 200+ max HP) work overworld **and** in battle; stones (Fire/Water/Thunder/Leaf) and the Elixir (Phase 14, `pp_restore` — restores every move of one party member to full PP, targets a `partyPosition`, rejected on a mon already at full PP) work overworld only — in battle they are always rejected (400) before anything is consumed. The Elixir is the PP economy valve: there are no Pokémon Centers and PP persists across battles, so it keeps a party from being Struggle-locked (~300 coins at the mart).

**Battle item rules:** blocked while a forced switch is pending; the item must be `usableInBattle`; the heal targets `partyPosition` when given, else the **active mon**; fainted targets are rejected (no revives yet), full-HP targets are rejected without consuming. The persisted quantity decrement is the atomic stock gate, then the heal applies to **session-local HP** (battle HP still never writes back — quantities are the only persisted effect of a battle item). Using an item **costs the turn** like a voluntary switch: the enemy gets one beat against the active mon. Events: `{ actor: "player", type: "item", itemId, itemName, position, nickname, amount, targetHpAfter }` followed by the enemy's `move` beat. Rejections happen before anything is consumed, so no turn passes.

**No-revive rule:** healing items cannot target a Pokémon at 0 HP, overworld or in battle — reviving needs a dedicated item type (not in Phase 7).

### Coins + Mart (Phase 8)

Coins live in `trainer.trainer_wallet` and are server-owned. The wallet lazy-inits at **500 coins** on first read. A first-time battle win pays a flat **100 coins** (boss-type wins — `gym_boss`, `elite_four`, `champion`, `legendary` — pay **300** instead, Phase 11) inside the battle win path, behind the same idempotency gate as XP — replays and losses pay nothing. The win response includes a `{ type: "coins", amount, balance }` event. Win-path order: progress → XP → coins → boss reward offer.

The mart unlocks when `unlocked_level >= 2` — i.e. exactly after the Level 1 gym_boss (Brock) is first completed.

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/mart` | `{ available, coins, stock }` — stock is `[]` plus an `unlockHint` while locked (still 200 so the client can render the locked state). Stock rows merge `mart.json` prices with `items.json` catalog data. |
| `POST` | `/api/mart/purchase` | Body `{ itemId, quantity? }` (1–10, default 1). Locked mart → 403 `MART_LOCKED`; unknown/unsold item → 400; insufficient coins → 400 `INSUFFICIENT_FUNDS`. The coin debit and inventory credit run in **one DB transaction** (memory store compensates with a refund) — they succeed together or not at all. Returns `{ purchased, coins, items }`. |

Buying a stone adds inventory; using it from the Bag evolves a valid target (Phase 9). There is no sell-back, and prices/stock can never come from the client.

### Evolution (Phase 9)

Rules are read from the pokedex `Evolution` table (`base_pokemon_id`, `evolved_pokemon_id`, `evolution_method`, `evolution_condition`) — never invented server- or client-side. Supported methods: `level-up` (conditions like `"Level 16"`) and `use-item` (conditions like `"Use fire-stone"`); anything else (trade, …) is skipped, never offered, never applied. The stone `itemId` ↔ condition-token mapping lives in `evolutionService.js` (`STONE_TOKEN_BY_ITEM_ID`; `moon-stone` is mapped but has no item yet).

**Level evolutions are pending + confirm** (no auto-evolve, no new tables): a party member whose level meets a `level-up` requirement shows up in the pending list, derived live from `trainer_pokemon` + `Evolution` on every read. The battle win response emits `{ type: "evolution_available", position, nickname, fromPokemonId, toPokemonId, requiredLevel, level }` after a qualifying `level_up` event; the trainer confirms on the Game hub. Ignoring it just leaves it pending.

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/evolutions/pending` | `{ pending: [{ position, nickname, level, fromPokemonId, toPokemonId, toName, requiredLevel }] }` — derived live, empty array when nothing qualifies. |
| `POST` | `/api/evolutions/confirm` | Body `{ partyPosition }`. Re-derives the rule server-side (a mon below threshold or without a rule → 400 — the client cannot forge a species) and applies the evolution. Returns `{ evolved }`. |

**Applying an evolution** (level or stone): `trainer_pokemon.pokemon_id` flips to the evolved species; level and XP buffer stay; **moves are kept as-is** (no learnset rebuild — Phase 9 limitation). Stats gain the **species difference** at the current level computed with the campaign hydrate formula (`statAtLevel(evolved) − statAtLevel(base)`, clamped ≥ 0 per stat), preserving Phase 5 level-up increments. `current_hp` grows by the max-HP delta (no free heal, fainted stays 0 — evolution never revives). Nicknames: the default species name follows the evolution (Charmander → Charmeleon); custom nicknames are kept. The `evolved` payload is `{ position, fromPokemonId, fromName, toPokemonId, toName, fromNickname, nickname, level, stats }`.
