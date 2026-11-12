# Wild Encounters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-species uniform wild tables with the approved weighted tables (84 of 84 eligible species), add three water tables with shore zones on Routes 2, 4 and 7, and make the four trade evolutions happen at Lv 37.

**Architecture:** `backend/data/encounters/wild.json` changes shape to weighted slots; the server's wild roll (`defaultGetWildBattle`) picks a slot by weight, then a level. A new content test pins the design rules against the pokédex dump. Shore zones come from a new route-grid character `q` in the Python map generator, which emits encounter objects with the water table id. A SQL migration turns the trade rows of `Evolution` into `Level 37`.

**Tech Stack:** Node 20 (`node:test`), Express backend, MySQL 8 (Docker), Python 3 map generator (`scripts/overworld_art`), Tiled-format JSON maps.

**Spec:** `docs/superpowers/specs/2026-11-12-wild-encounters-design.md`

## Global Constraints

- Product name in any copy: "Pokemon Origins".
- Commits: no Claude co-author or "Generated with" lines.
- Banned from every wild table: legendaries 144, 145, 146, 150, 151; starter lines 1, 2, 4, 5, 7, 8; every final stage (a species that is some row's `evolved_pokemon_id` and no row's `base_pokemon_id`).
- Wild level max is strictly below the species' level-up evolution level. Trade evolutions count as `Level 37`.
- Each table's weights sum to exactly 100; no species twice in one table.
- Keep `minLevel` and the "This road is not open yet" check unchanged. Water tables use their route's `minLevel`.
- Table data is exactly `docs/superpowers/plans/2026-11-12-wild-encounters.wild.json` (generated from the validated spec tables; do not hand-edit odds).

## Review Focus

1. **A map zone names a table that is not in `wild.json`** → the server answers 404 "Unknown encounter table" mid-walk. Expect every map's encounter `table` to exist. Test in Task 4.
2. **A wild table no map uses** (e.g. `route_7_marsh` with no zone) → species silently uncatchable, breaking "84 of 84". Expect every table referenced by at least one map. Test in Task 4.
3. **Weight roll at the edges** (`random()` returns 0 or 0.99999) → must return the first / last slot, never `undefined`. Test in Task 1.
4. **Shore tiles under a trainer or blocking the only path** → trainers never stand in an encounter patch, and the route stays crossable. `npm run validate:maps` (proves trainers can't be skipped and maps connect) plus a Python test in Task 4.
5. **Pokédex detail page still says "Trade"** for Kadabra/Machoke/Graveler/Haunter (it formats PokeAPI data, not our DB) → expect "Lv. 37". Test in Task 3.

---

### Task 1: Weighted wild tables and the roll

**Files:**
- Modify: `backend/data/encounters/wild.json` (replace whole file)
- Modify: `backend/src/services/battleSessionService.js:296-304` (`defaultGetWildBattle`), `:1883` (exports)
- Modify: `backend/src/campaign/loader.js:218` (doc comment only)
- Test: `backend/src/services/battleSessionService.test.js`, `backend/src/campaign/loader.test.js:66-72`

**Interfaces:**
- Produces: `rollWild(table, random) -> { pokemonId: number, level: number }`, exported from `battleSessionService.js`. `table` is `{ levels: [lo, hi], slots: [{ id, weight, levels? }] }`; `random` returns `[0, 1)`.
- Table shape (Tasks 2 and 4 read it): `{ minLevel: number, levels: [number, number], slots: [{ id: number, weight: number, levels?: [number, number] }] }`.

- [ ] **Step 1: Write the failing tests** in `battleSessionService.test.js`, new `describe("rollWild")`:

```js
const { rollWild } = require("./battleSessionService");
const seq = (...xs) => () => xs.shift();
const table = { levels: [10, 12], slots: [{ id: 1, weight: 70 }, { id: 2, weight: 30, levels: [5, 5] }] };

it("picks by weight: the first 70% is slot 1, the rest slot 2", () => {
	assert.equal(rollWild(table, seq(0, 0)).pokemonId, 1);
	assert.equal(rollWild(table, seq(0.6999, 0)).pokemonId, 1);
	assert.equal(rollWild(table, seq(0.7, 0)).pokemonId, 2);
	assert.equal(rollWild(table, seq(0.99999, 0)).pokemonId, 2);
});
it("uses the slot's own levels, else the table's, inclusive", () => {
	assert.deepEqual(rollWild(table, seq(0.9, 0.99)), { pokemonId: 2, level: 5 });
	assert.equal(rollWild(table, seq(0, 0)).level, 10);
	assert.equal(rollWild(table, seq(0, 0.99999)).level, 12);
});
```

Update `loader.test.js` "has a wild table for every route": replace the `table.species.length` assertion with `assert.ok(table.slots.length >= 2 && table.levels[0] <= table.levels[1], \`route_${n}\`)`.

- [ ] **Step 2: Run** `cd backend && node --test src/services/battleSessionService.test.js src/campaign/loader.test.js` → FAIL (`rollWild is not a function`; `table.slots` undefined).

- [ ] **Step 3: Implement.** Copy `docs/superpowers/plans/2026-11-12-wild-encounters.wild.json` over `backend/data/encounters/wild.json`. Add `rollWild` (cumulative weight walk over `slots` against `random() * total`; fall back to the last slot) and make `defaultGetWildBattle` call it instead of indexing `species`. Export `rollWild`. Update the `getWildTable` doc comment to `({ minLevel, levels, slots })`.

- [ ] **Step 4: Run** the same command → PASS. Then `npm test` in `backend` → all pass.

- [ ] **Step 5: Commit** `git add backend/data/encounters/wild.json backend/src/services/battleSessionService.js backend/src/services/battleSessionService.test.js backend/src/campaign/loader.js backend/src/campaign/loader.test.js && git commit -m "Wild encounters: weighted slots with per-slot levels"`

---

### Task 2: Rules check for the tables

**Files:**
- Create: `backend/src/campaign/wild.test.js`
- Modify: `backend/package.json` (`test` script: add `src/campaign/wild.test.js` after `src/campaign/content.test.js`)

**Interfaces:**
- Consumes: table shape from Task 1; the `INSERT INTO \`Evolution\` VALUES (...)` line of `database/pokedex_data.sql` (rows `(id,base,evolved,'method','condition')`).

- [ ] **Step 1: Write the test.** Parse the Evolution rows with a regex over that SQL line. Constants in the test: `BANNED = [144, 145, 146, 150, 151, 1, 2, 4, 5, 7, 8]`, `TRADE_LEVEL = 37` with a comment pointing at `database/migrations/014_trade_evolutions_by_level.sql`. Derive `finals` (evolved, never base), `ceiling[id]` (min level of its `level-up` rows; `trade` rows count as `TRADE_LEVEL`), `eligible` = 1..151 minus banned minus finals. One `it` each, every failure message naming table and species id:
  - every table's weights sum to 100 and no id repeats;
  - no banned or final species;
  - every slot range has `lo <= hi`, lies inside the table's `levels`, and `hi < ceiling[id]` when a ceiling exists;
  - `eligible.length === 84` and every eligible id is in some table.

- [ ] **Step 2: Run** `cd backend && node --test src/campaign/wild.test.js` → PASS (the data was validated while drafting). Prove it bites: change one `route_1` weight 30→31, rerun → FAIL naming `route_1`; revert.

- [ ] **Step 3: Commit** `git add backend/src/campaign/wild.test.js backend/package.json && git commit -m "Wild encounters: test the table rules against the pokedex"`

---

### Task 3: Trade evolutions at Lv 37

**Files:**
- Create: `database/migrations/014_trade_evolutions_by_level.sql`
- Modify: `docker-compose.yml` (after the `013_world_state.sql` line add `- ./database/migrations/014_trade_evolutions_by_level.sql:/docker-entrypoint-initdb.d/13_trade_evolutions_by_level.sql`)
- Modify: `backend/src/services/evolutionRequirement.js:19`, `backend/src/services/evolutionService.js:17-18` (doc comment)
- Test: `backend/src/services/evolutionRequirement.test.js:34-38`

- [ ] **Step 1: Update the test** "formats a trade requirement": expect `"Lv. 37"`, rename it "shows trade evolutions at their Lv 37 replacement".

- [ ] **Step 2: Run** `cd backend && node --test src/services/evolutionRequirement.test.js` → FAIL (`'Trade' !== 'Lv. 37'`).

- [ ] **Step 3: Implement.** `formatEvolutionRequirement` returns `"Lv. 37"` for trigger `trade` (comment: no trading in the game; Gen 1's four trade evolutions happen at 37, see migration 014). Migration, header in the style of `013_world_state.sql` (purpose, "Apply after 013", re-runnable, rollback = set the four rows back to `'trade', ''`):

```sql
USE `pokedex`;
UPDATE `Evolution` SET `evolution_method` = 'level-up', `evolution_condition` = 'Level 37'
WHERE `evolution_method` = 'trade' AND `base_pokemon_id` IN (64, 67, 75, 93);
```

In `evolutionService.js`'s header, replace "Anything else (trade, …) is skipped" with: trade rows were turned into `Level 37` level-ups by migration 014; any other method is skipped.

- [ ] **Step 4: Run** `cd backend && npm test` → PASS.

- [ ] **Step 5: Apply to the running database** (container name from `docker ps`, root password from the compose env): `docker exec -i <mysql container> mysql -uroot -p<password> < database/migrations/014_trade_evolutions_by_level.sql`, then `docker exec <mysql container> mysql -uroot -p<password> -e "SELECT base_pokemon_id, evolution_method, evolution_condition FROM pokedex.Evolution WHERE base_pokemon_id IN (64,67,75,93)"` → four rows `level-up | Level 37`.

- [ ] **Step 6: Commit** `git add database/migrations/014_trade_evolutions_by_level.sql docker-compose.yml backend/src/services/evolutionRequirement.js backend/src/services/evolutionRequirement.test.js backend/src/services/evolutionService.js && git commit -m "Trade evolutions happen at Lv 37"`

---

### Task 4: Shore encounter zones on Routes 2, 4 and 7

**Files:**
- Modify: `scripts/overworld_art/world_maps.py:276` (`grass_runs`)
- Modify: `scripts/overworld_art/towns.py:18` (`COMMON`), `:376-399` (`route`)
- Modify: `scripts/overworld_art/route_layouts.json` (grids of `route_2`, `route_4`, `route_7`)
- Regenerate: `frontend/public/maps/route_2.json`, `route_4.json`, `route_7.json`
- Test: `scripts/overworld_art/test_route.py`, `backend/src/campaign/wild.test.js`

**Interfaces:**
- Produces: `grass_runs(grid, char="g")` yields `(x, y, w)` runs of `char`; `WATER_TABLES = {"route_2": "route_2_pond", "route_4": "route_4_shore", "route_7": "route_7_marsh"}` in `towns.py`.
- Consumes: table ids from Task 1.

Grid edits (x = column, y = row, 0-based; replace the existing character with `q`). Each patch is walkable, touches water, sits off the main path, and holds no trainer:

| Route | Cells set to `q` | Where |
|---|---|---|
| route_2 | y15 x17; y16 x14-17; y17 x14-17 | reed nook on the west bank, south of the bridge (9 tiles) |
| route_4 | y12 x24-33 | strip of beach along the sea (10 tiles) |
| route_7 | y9 x18-19; y10 x17-18; y11 x18-19; y12 x19-20 | reeds on the marsh's west bank (8 tiles) |

- [ ] **Step 1: Guard against losing hand edits.** Copy the three current map files to the scratchpad, regenerate them (Step 5's command) with no code changes, and `diff` each against its copy. Any difference → stop and report: the maps were edited by hand, and regenerating would lose that.

- [ ] **Step 2: Write the failing tests.** In `test_route.py`, new class `ShoreZones` over `("route_2", "route_4", "route_7")`, building each map with `towns.route(rid)`:
  - the `encounters` object group has objects whose `table` property is `WATER_TABLES[rid]`, and their total tile area equals the count of `q` in that route's grid;
  - every tile of those objects is 4-adjacent to a `~` cell or another `q` cell, and no trainer's `(x, y)` from `route_layouts.json` falls inside one.

  In `backend/src/campaign/wild.test.js`, read every `frontend/public/maps/*.json` and collect each `encounters` object's `table` property:
  - every collected table exists in `wild.json` (Review Focus 1);
  - every key of `wild.json` is collected at least once (Review Focus 2).

- [ ] **Step 3: Run** `python -m unittest scripts.overworld_art.test_route` and `cd backend && node --test src/campaign/wild.test.js` → FAIL (no water-table zones; three tables unused).

- [ ] **Step 4: Implement.** Add `"q": "grass"` to `COMMON` (shore reeds draw as tall grass for now; the spec lets fishing take over later). Add the `char` parameter to `grass_runs`. In `route()`, after the grass loop, emit `m.obj("encounters", f"shore_{i + 1}", x, y, w, 1, table=WATER_TABLES[rid])` for each run of `q` when `rid in WATER_TABLES`. Make the grid edits from the table above.

- [ ] **Step 5: Regenerate** the three maps only (repo root):

```bash
python -c "import json; from pathlib import Path; from scripts.overworld_art.towns import MAPS; [Path(f'frontend/public/maps/{r}.json').write_text(json.dumps(MAPS[r](), indent=1) + '\n') for r in ('route_2', 'route_4', 'route_7')]"
```

- [ ] **Step 6: Run** `python -m unittest scripts.overworld_art.test_route`, `cd backend && npm test`, `npm run validate:maps` (repo root), `cd frontend && npx vitest run src/v2/overworld` → all PASS.

- [ ] **Step 7: Commit** `git add scripts/overworld_art/world_maps.py scripts/overworld_art/towns.py scripts/overworld_art/route_layouts.json scripts/overworld_art/test_route.py backend/src/campaign/wild.test.js frontend/public/maps/route_2.json frontend/public/maps/route_4.json frontend/public/maps/route_7.json && git commit -m "Shore reeds with water encounters on Routes 2, 4 and 7"`

---

### Task 5: Check it in the game

No code. Delete the temporary `frontend/.env.development.local` (it points the frontend at port 5001), then restart the stack with `npm run dev` from the repo root.

- [ ] Walk Route 1 grass; ten encounters show only Pidgey, Rattata, Caterpie, Weedle, Nidoran♀/♂ or Pikachu, Lv 2-5.
- [ ] On Route 2, step into the reeds south of the bridge (16,16); the encounter is Magikarp, Poliwag or Goldeen, Lv 8-12.
- [ ] A Kadabra that reaches Lv 37 by a win gets the evolution prompt for Alakazam (`GET /api/evolutions/pending` lists it).
