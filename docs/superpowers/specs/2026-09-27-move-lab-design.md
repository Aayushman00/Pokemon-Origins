# Move Lab — Battle Engine Move-Testing Playground

## Purpose

A dev/testing tool to exercise the real battle engine directly: pick any two
Pokémon, set up their state (level, status, HP%, stat stages), pick any move
in the game for each (movepool unrestricted, not learnset-filtered), run one
exchange, and inspect the exact resolved outcome — damage, type multiplier,
STAB, crit, status/stat changes applied, recoil/drain, faint. Built to test
the battle engine, not to be a game feature.

## Scope

One exchange = both sides pick a move, one round resolves (both mons act in
turn order), result is shown. Not a persistent multi-turn battle — no
switching, no fainting-and-continuing. Re-running is a fresh exchange.

## What's out of scope (confirmed with user)

- Nature/IV/EV/held-item stat effects: the engine doesn't model any of these
  (`backend/src/campaign/hydrate.js` stat formula has no individual
  variance). Not exposed in the UI.
- Ability is locked to whatever the species' real (first non-hidden) ability
  is — not freely assignable. The engine only implements Levitate, Static,
  and the four pinch-boost abilities as non-no-ops anyway.
- Learnset legality: any move can be assigned to any Pokémon, by design —
  this is a move-logic tester, not a team builder.

## Engine choice

Targets the live production engine: `battleSessionService.js` (Node,
server-authoritative turn/status/PP/stage bookkeeping) calling out over HTTP
to `battle-engine/app/combat.py` (Python) for the actual damage/accuracy/crit
math. This is what real battles run today — confirmed via
`backend/src/services/battleService.js` (`calculateDamage`/`turnOrder`
proxy) and `defaultEngine()` in `battleSessionService.js`. The playground
must reuse this exact path, not a reimplementation, so a bug found here is a
bug a player would actually hit.

## Backend design

### `backend/src/services/movePlaygroundService.js` (new)

Per exchange request, builds a throwaway `createBattleSessionService({...})`
using the same dependency-injection seams `battleSessionService.test.js`
already exercises to build a fully in-memory, DB-free session:

- `progress`: a memory-backed progress service pre-seeded so
  `getProgress()` matches whatever `{level, battleNumber}` `startBattle` is
  called with (satisfies the existing progress-gate check without touching
  the real progress table).
- `getPlayerParty`: returns a single synthetic Pokémon built from the
  request body's "mon A" fields.
- `getEnemyBattle`: returns `{ trainerName: "Move Lab", pokemon: <mon B> }`.
- `ai`: `{ pickMove: async () => requestedMoveIdForMonB }` — replaces the
  real enemy-AI move choice with the exact move the user picked for side B.
  (Confirm the real method name on `createBattleAi`'s returned object during
  implementation; test file's `ai` override is the reference.)
- `ppStore`/`hpStore`/`history`: `createMemoryPpStore()` /
  `createMemoryHpStore()` / `createMemoryHistoryStore()` (already exported
  from `battleSessionService.js`).
- `engine`: **not overridden** — defaults to `defaultEngine()`, i.e. the
  real HTTP calls to the Python damage engine. This is the whole point.
- `random`: real `Math.random` by default; RNG-override fields (below) are
  threaded through the request payload instead of touching this.

Flow: `startBattle(fixedFakeTrainerId, {level, battleNumber})` then one
`performAction(fixedFakeTrainerId, {move_id: monAMoveId, ...rngOverrides})`.
Because each request builds its own isolated service instance, the fake
trainer id can be a constant — no cross-request state ever exists.

### `snapshotPokemon()` edit (`battleSessionService.js`)

Currently always resets `status: null` and `stages: freshStages()`
regardless of input (`current_hp` is already respected if provided — no
change needed there). Add:

```js
status: raw.debugStatus ?? null,
stages: raw.debugStages ? { ...freshStages(), ...raw.debugStages } : freshStages(),
```

Real trainer/campaign rows never carry `debugStatus`/`debugStages`, so this
is additive and inert for every existing caller.

### RNG override plumbing (Python engine)

`battle-engine/app/combat.py` rolls accuracy, crit, and secondary-effect
chance via bare `random.random()` with no override hook. Add optional
fields to `BattleRequest`/`Move` in `battle-engine/app/models.py`:
`force_hit`, `force_crit`, `force_secondary` (default `None`/unset). Each of
the corresponding roll sites in `combat.py` checks the override before
calling `random.random()`. Defaults preserve exact current behavior — real
battles never send these fields, so production output is unchanged.
`movePlaygroundService.js` forwards per-side override flags down through to
the `BattleRequest` payload sent to the Python engine.

### New read endpoints

Backed by the **local pokedex MySQL tables** (`Pokemon`, `Move`, `Type`,
`Pokemon_Ability` — the same tables `backend/src/campaign/hydrate.js`
already queries via `config/db`), not the PokeAPI-backed dex service used
by the Pokédex browsing UI, since that data doesn't feed the battle engine:

- `GET /api/playground/species` — `{ pokemon_id, name, hp, attack, defense,
  special_attack, special_defense, speed, types, ability }` for every
  species.
- `GET /api/playground/moves` — `{ move_id, name, power, accuracy, pp,
  move_type }` for every move.

### `POST /api/playground/exchange` (new route, `requireAuth`)

Request body: two mon setups (`pokemon_id`, `level`, `move_id`, `status`,
`hp_percent`, `stages`, RNG overrides). Response: the round's event log as
already shaped by `performAction`'s return value (damage, crit, type
multiplier, stab, hits, ohko, status/stat changes, recoil/drain, faint).

## Frontend design

New page: `frontend/src/v2/pages/movelab/MoveLabScreen.jsx`, route
`/game/movelab` (protected, same `<Protected user={user}>` wrapper pattern
as the other `/game/*` routes in `App.jsx`). Named "Move Lab" to avoid
colliding with the existing `/playground` route (the unrelated multiplayer
drag-room feature).

Two mirrored panels (mon A / mon B), each with:

- Species picker (full list from `/api/playground/species`)
- Level input
- Ability shown read-only (species-derived, not editable)
- Status dropdown (Healthy/burn/paralysis/poison/sleep/freeze)
- HP% slider
- Six stat-stage steppers (atk/def/spa/spd/acc/eva, −6..+6)
- Move dropdown (full movepool from `/api/playground/moves`, unfiltered)
- RNG override checkboxes: force hit, force crit, force secondary-effect
  proc

A "Run exchange" button posts to `/api/playground/exchange` and renders the
full event breakdown returned.

## Testing

- `movePlaygroundService.test.js`: mirrors the DI pattern in
  `battleSessionService.test.js`; verifies species/status/stage overrides
  land on the synthetic Pokémon correctly, the forced enemy move is the one
  actually used, and RNG overrides force their respective outcomes.
- `battle-engine/tests/test_combat.py`: new cases for `force_hit`,
  `force_crit`, `force_secondary`, confirming default (unset) behavior is
  byte-for-byte unchanged.
- Frontend: manual verification via dev server (pick mons/moves, run
  exchange, confirm the rendered breakdown matches the API response) — no
  existing frontend test harness pattern to extend for this page.
