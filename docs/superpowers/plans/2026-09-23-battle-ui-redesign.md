# Battle UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a gender icon + live EXP bar to battle HP boxes, restyle the move-select UI, replace the single-line battle message with a full accumulating log that takes over the bottom bar during move resolution, and add type-based move animations — while extracting the touched battle-UI pieces out of the monolithic `BattleSim.jsx` into their own files.

**Architecture:** Backend: one new local (non-PokeAPI) gender-assignment helper wired into the single existing `partyService.addPokemon()` choke point, plus two additive fields (`gender`, `experience`/`xp_to_next`) surfaced on the already-existing battle session snapshot. Frontend: three new presentational components (`HpBox`, `MoveMenu`, `MessageLog`) under `frontend/src/pages/Game/battle/`, wired from `BattleSim.jsx` exactly where the equivalent inline JSX lives today, plus a type-category split in the existing attack-lunge/hit-flash logic.

**Tech Stack:** Node.js/Express + MySQL (backend, `node:test`), React + Framer Motion + Vite (frontend, `node:test`).

**Spec:** `docs/superpowers/specs/2026-09-23-battle-ui-redesign-design.md`

## Global Constraints

- No live PokeAPI calls from any gameplay-critical path (starter pick, reward pokémon creation, battle start) — confirmed during planning that `pokemonDetailService.js`'s `gendersFromRate()`/`client.getSpecies()` are Pokédex-page-only, backed by a live HTTP call; gender assignment for owned Pokémon must be a local, synchronous computation instead (Ruling, see below).
- `trainer_pokemon.gender` is nullable; old rows read back `NULL` and simply show no gender symbol — no backfill migration.
- Backend tests run via the fixed file list in `backend/package.json`'s `"test"` script — any new backend test file must be appended to that string or it silently never runs.
- Frontend tests run individually via `node --test <path>` (no aggregate script exists yet) — confirmed working ESM + `node:test` via the existing `battleAnimation.test.js`.
- `battleLayout.js`'s `slotStyle()`/`shadowStyle()` positions are explicitly not to move (user instruction from an earlier session) — the EXP bar addition must grow the player HP box's own height, not shift sprite/shadow positioning.
- Keep this project's existing cream (`#f8f8f8`/`#e8e8c8`) / navy (`#1f3b57`) LCD palette everywhere — do not introduce FireRed's purple move-info borders or any other reference-screenshot color not already in `BattleGround.css`.

**Ruling (made during planning, carried from the spec's Section 1):** the spec described gender data as coming from the species' `gender_rate` "per the existing convention" without naming a source. The only existing `gender_rate` in this codebase is a live PokeAPI field read by `pokemonDetailService.js` for the read-only Pokédex page — unsuitable for a gameplay creation path (network dependency, latency, no offline safety). Task 1 instead introduces a small local override table (Gen 1's genderless and single-gender species) plus a 50/50 weighted random default for everything else. This is a known simplification (ponytail: doesn't reproduce every species' real skewed gender ratio, e.g. real Gyarados is ~87.5% male) — upgrade path is a full local `gender_rate`-per-species table if that accuracy ever matters. The spec also said gender would be assigned "at creation time... in the two places a trainer_pokemon row is created: starter selection and catching a wild Pokémon" — planning found there is no catch flow in this codebase, and starter pick + boss/legendary rewards both already funnel through the single `partyService.addPokemon()` function, so the roll is wired there once, not duplicated per caller.

---

## Task 1: `genderService.js` — local gender assignment

**Files:**
- Create: `backend/src/services/genderService.js`
- Test: `backend/src/services/genderService.test.js`

**Interfaces:**
- Produces: `rollGenderForSpecies(pokemonId, random = Math.random) => 'male' | 'female' | 'genderless'` — pure function, no I/O. `random` is injectable (matches this codebase's existing `deps.random || Math.random` convention in `battleSessionService.js`) so tests are deterministic.

- [ ] **Step 1: Write the failing test**

```js
// backend/src/services/genderService.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { rollGenderForSpecies } = require("./genderService");

describe("rollGenderForSpecies", () => {
  it("returns genderless for a genderless species (Ditto, id 132)", () => {
    assert.equal(rollGenderForSpecies(132), "genderless");
  });

  it("returns male for a male-only species (Hitmonlee, id 106)", () => {
    assert.equal(rollGenderForSpecies(106), "male");
  });

  it("returns female for a female-only species (Kangaskhan, id 115)", () => {
    assert.equal(rollGenderForSpecies(115), "female");
  });

  it("rolls male when random() < 0.5 for a standard species", () => {
    assert.equal(rollGenderForSpecies(4, () => 0.1), "male");
  });

  it("rolls female when random() >= 0.5 for a standard species", () => {
    assert.equal(rollGenderForSpecies(4, () => 0.9), "female");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/services/genderService.test.js` (from `backend/`)
Expected: FAIL — `Cannot find module './genderService'`

- [ ] **Step 3: Write minimal implementation**

```js
// backend/src/services/genderService.js
/**
 * Assigns a gender to a newly created trainer_pokemon row.
 *
 * Gameplay creation paths (starter pick, boss/legendary reward) must stay
 * fast and offline-safe, so this never calls the live PokeAPI (unlike
 * pokemonDetailService's Pokédex-only gendersFromRate/getSpecies, which
 * does). Instead it uses a small local override table for Gen 1's
 * genderless and single-gender species, and a 50/50 weighted random roll
 * for everything else.
 *
 * ponytail: a flat 50/50 default doesn't match every species' real
 * PokeAPI gender_rate (e.g. Gyarados is ~87.5% male) -- upgrade to a full
 * local gender_rate-per-species table if per-species accuracy ever matters.
 */

// Gen 1 Pokédex ids with no gender (Magnemite/Magneton, Voltorb/Electrode,
// Staryu/Starmie, Ditto, the three legendary birds, Mewtwo, Mew).
const GENDERLESS_IDS = new Set([81, 82, 100, 101, 120, 121, 132, 144, 145, 146, 150, 151]);
// Gen 1 Pokédex ids that are always male (Hitmonlee, Hitmonchan).
const MALE_ONLY_IDS = new Set([106, 107]);
// Gen 1 Pokédex ids that are always female (Kangaskhan).
const FEMALE_ONLY_IDS = new Set([115]);

function rollGenderForSpecies(pokemonId, random = Math.random) {
  const id = Number(pokemonId);
  if (GENDERLESS_IDS.has(id)) return "genderless";
  if (MALE_ONLY_IDS.has(id)) return "male";
  if (FEMALE_ONLY_IDS.has(id)) return "female";
  return random() < 0.5 ? "male" : "female";
}

module.exports = {
  rollGenderForSpecies,
  GENDERLESS_IDS,
  MALE_ONLY_IDS,
  FEMALE_ONLY_IDS,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/services/genderService.test.js` (from `backend/`)
Expected: PASS (5/5)

- [ ] **Step 5: Register the new test file and commit**

Edit `backend/package.json`'s `"test"` script string: append `src/services/genderService.test.js` to the end of the existing space-separated file list (it is one long string — insert before the closing quote, after `src/playground/index.test.js`).

```bash
git add src/services/genderService.js src/services/genderService.test.js package.json
git commit -m "feat: add local gender-assignment helper (no PokeAPI dependency)"
```

---

## Task 2: Wire gender into `partyService.addPokemon` + persist column

**Files:**
- Create: `database/migrations/007_trainer_pokemon_gender.sql`
- Modify: `backend/src/services/partyService.js:1` (add require), `:94-101` (SELECT column list), `:102-127` (INSERT column list + params), `:232-247` (`addPokemon`)
- Test: `backend/src/services/partyService.test.js`

**Interfaces:**
- Consumes: `rollGenderForSpecies(pokemonId, random?)` from Task 1 (`./genderService`).
- Produces: every row returned by `partyService.getPartyRows()` / `.list()` now carries a `gender` field (`'male' | 'female' | 'genderless' | null` for pre-migration rows).

- [ ] **Step 1: Write the failing tests**

Add to `backend/src/services/partyService.test.js` (inside the existing `describe("partyService", ...)` block, using the file's existing `mon()` fixture helper):

```js
it("assigns a gender to a newly added Pokémon", async () => {
  const service = createPartyService({ store: createMemoryPartyStore() });
  await service.addPokemon(1, mon({ pokemon_id: 132 }), []); // Ditto: genderless
  const rows = await service.getPartyRows(1);
  assert.equal(rows[0].gender, "genderless");
});

it("does not overwrite an explicitly provided gender", async () => {
  const service = createPartyService({ store: createMemoryPartyStore() });
  await service.addPokemon(1, mon({ gender: "female" }), []);
  const rows = await service.getPartyRows(1);
  assert.equal(rows[0].gender, "female");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test src/services/partyService.test.js` (from `backend/`)
Expected: FAIL — `rows[0].gender` is `undefined`, not `"genderless"`/`"female"`

- [ ] **Step 3: Write the migration**

```sql
-- database/migrations/007_trainer_pokemon_gender.sql
-- Battle UI redesign: per-owned-Pokémon gender (trainer schema).
-- Apply after 001-006. Safe to re-run (ADD COLUMN IF NOT EXISTS, MySQL 8).
--
-- Nullable: existing rows read back NULL (no gender shown in the UI) --
-- only genderService.rollGenderForSpecies, called once from
-- partyService.addPokemon at creation time, ever assigns a value. No
-- backfill: pre-existing party members simply show no gender symbol.

USE `trainer`;

ALTER TABLE `trainer_pokemon`
  ADD COLUMN IF NOT EXISTS `gender` ENUM('male','female','genderless') NULL AFTER `status`;
```

- [ ] **Step 4: Wire the roll into `addPokemon` and thread the column through both stores**

In `backend/src/services/partyService.js`, add near the top of the file (after the `PARTY_FULL_MESSAGE` constant, before `createMemoryPartyStore`):

```js
const { rollGenderForSpecies } = require("./genderService");
```

Change `addPokemon` (currently lines 232-247) to:

```js
async function addPokemon(trainerId, mon, moves = []) {
  const rows = await getStore().list(trainerId);
  if (rows.length >= MAX_PARTY) {
    throw new PartyError(400, PARTY_FULL_MESSAGE);
  }
  const taken = new Set(rows.map((row) => Number(row.position)));
  let position = 1;
  while (taken.has(position) && position <= MAX_PARTY) {
    position += 1;
  }
  if (position > MAX_PARTY) {
    throw new PartyError(400, PARTY_FULL_MESSAGE);
  }
  const monWithGender = {
    ...mon,
    gender: mon.gender ?? rollGenderForSpecies(mon.pokemon_id),
  };
  const id = await getStore().insert(trainerId, monWithGender, moves, position);
  return { id, position };
}
```

In `createMysqlPartyStore`'s `list()` (currently lines 93-101), add `gender` to the SELECT column list:

```js
async list(trainerId) {
  const [rows] = await pool.query(
    `SELECT id, trainer_id, pokemon_id, nickname, level, current_hp, max_hp,
            attack, defense, speed, special_atk, special_def, experience, status, gender, position
     FROM trainer_pokemon WHERE trainer_id = ? ORDER BY position ASC`,
    [trainerId]
  );
  return rows;
},
```

In `createMysqlPartyStore`'s `insert()` (currently lines 102-127), add `gender` to both the column list and the bound params (immediately after `status` in each):

```js
async insert(trainerId, mon, moves, position) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO trainer_pokemon
         (trainer_id, pokemon_id, nickname, level, current_hp, max_hp,
          attack, defense, speed, special_atk, special_def, experience, status, gender, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trainerId,
        mon.pokemon_id,
        mon.nickname,
        mon.level,
        mon.current_hp,
        mon.max_hp,
        mon.attack,
        mon.defense,
        mon.speed,
        mon.special_atk,
        mon.special_def,
        mon.experience ?? 0,
        mon.status ?? "Healthy",
        mon.gender ?? null,
        position,
      ]
    );
    const trainerPokemonId = result.insertId;
    for (const move of moves || []) {
      await connection.query(
        `INSERT INTO trainer_pokemon_moves
           (trainer_pokemon_id, move_id, current_pp)
         VALUES (?, ?, ?)`,
        [trainerPokemonId, move.move_id, move.pp || 0]
      );
    }
    await connection.commit();
    return trainerPokemonId;
  } catch (txError) {
    await connection.rollback();
    throw txError;
  } finally {
    connection.release();
  }
},
```

`createMemoryPartyStore`'s `insert()` needs no change — it already spreads `...mon`, so `mon.gender` (set by `addPokemon` above) flows through automatically. `createMysqlPartyStore` has no existing direct unit test (confirmed during planning — only the memory store is exercised by `partyService.test.js`); do not add a new MySQL-integration test, that would be inventing coverage the file doesn't otherwise have.

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test src/services/partyService.test.js` (from `backend/`)
Expected: PASS, including the two new tests and every pre-existing test in the file (position assignment, party-full errors, etc. are unaffected)

- [ ] **Step 6: Commit**

```bash
git add ../database/migrations/007_trainer_pokemon_gender.sql src/services/partyService.js src/services/partyService.test.js
git commit -m "feat: assign gender on Pokémon creation, persist trainer_pokemon.gender"
```

---

## Task 3: `trainerService.js` — surface `gender` and `experience` (bug fix)

**Files:**
- Modify: `backend/src/services/trainerService.js:6` (SELECT column list), `:78-95` (returned per-pokémon object)

**Interfaces:**
- Consumes: the `gender` column added in Task 2.
- Produces: `getTrainerData(trainerId).pokemon[i]` now includes `gender` and `experience` — both are read by Task 4's `battleSessionService.snapshotPokemon()` via `defaultGetPlayerParty()`.

**Note (no test added — matches existing file convention):** `trainerService.js` has zero existing tests (it is raw multi-query SQL glue with no injectable store, unlike `partyService.js`); this codebase's convention (confirmed during planning) is to leave such files untested rather than bolt on a new test harness for one file. This task's correctness is exercised indirectly by Task 4's `battleSessionService` tests, which inject a fake `getPlayerParty` carrying the same shape this function must now produce — but that only proves the *shape* is right, not this specific SQL. Verify manually: after this change and a real login, `GET /trainer/:id/data`'s `pokemon[].experience` should be a positive integer (not `undefined`) for any leveled-up party member.

- [ ] **Step 1: Add `gender` to the SELECT and both returned objects**

In `backend/src/services/trainerService.js`, change the pokemon SELECT (currently line 6, sic — actually line 15-17 per the file's second query) from:

```js
const [pokemonRows] = await trainer_db.query(
  `SELECT id, trainer_id, pokemon_id, nickname, level, current_hp, max_hp,
            attack, defense, speed, special_atk, special_def, experience, status, position
     FROM trainer_pokemon WHERE trainer_id = ? ORDER BY position ASC`,
  [trainerId]
);
```

to:

```js
const [pokemonRows] = await trainer_db.query(
  `SELECT id, trainer_id, pokemon_id, nickname, level, current_hp, max_hp,
            attack, defense, speed, special_atk, special_def, experience, status, gender, position
     FROM trainer_pokemon WHERE trainer_id = ? ORDER BY position ASC`,
  [trainerId]
);
```

Then change the returned per-pokémon object (currently lines 78-95) from:

```js
return {
  id: p.id,
  position: p.position,
  pokemon_id: p.pokemon_id,
  nickname: p.nickname,
  level: p.level,
  max_hp: p.max_hp,
  current_hp: p.current_hp,
  attack: p.attack,
  defense: p.defense,
  speed: p.speed,
  special_atk: p.special_atk,
  special_def: p.special_def,
  status: p.status,
  types,
  ability,
  moves,
};
```

to:

```js
return {
  id: p.id,
  position: p.position,
  pokemon_id: p.pokemon_id,
  nickname: p.nickname,
  level: p.level,
  max_hp: p.max_hp,
  current_hp: p.current_hp,
  attack: p.attack,
  defense: p.defense,
  speed: p.speed,
  special_atk: p.special_atk,
  special_def: p.special_def,
  status: p.status,
  gender: p.gender,
  experience: p.experience,
  types,
  ability,
  moves,
};
```

(`experience` was already selected by the SQL query at line 16 but was previously dropped on the way out — this is a pre-existing bug this task also fixes, confirmed during planning by reading the full function body.)

- [ ] **Step 2: Manual verification**

Run: `cd backend && node --test` (the full suite — this file has no direct tests, but this confirms the change didn't break anything that depends on `trainerService`, e.g. `campaignService.test.js`/`battleSessionService.test.js` if they happen to exercise the real module path)
Expected: PASS, same pass count as before this task

- [ ] **Step 3: Commit**

```bash
git add src/services/trainerService.js
git commit -m "fix: surface gender and experience on trainer party data"
```

---

## Task 4: `battleSessionService.snapshotPokemon` — live gender + XP fields

**Files:**
- Modify: `backend/src/services/battleSessionService.js:1-18` (add requires), `:126-157` (`snapshotPokemon`)
- Test: `backend/src/services/battleSessionService.test.js`

**Interfaces:**
- Consumes: `xpNeededForLevel(level)` from `./xpService` (already exported, confirmed during planning); `rollGenderForSpecies(pokemonId)` from `./genderService` (Task 1).
- Produces: every snapshot pokémon object (`session.player`, `session.enemy`, and all party-list entries returned by `startBattle`/`performAction`) now carries `gender: 'male' | 'female' | 'genderless'` and `experience: number`, `xp_to_next: number`. Enemy pokémon (which have no DB row / no `raw.gender`) get a gender rolled once at session-start snapshot time and it stays stable for the rest of that battle, because `session.enemyParty`/`session.player` are mutated in place across turns rather than re-snapshotted.

- [ ] **Step 1: Write the failing tests**

Add to `backend/src/services/battleSessionService.test.js` (a new `describe` block near the top-level tests, using the file's existing `playerMon()`/`enemyMon()` fixtures):

```js
const { snapshotPokemon, xpNeededForLevel } = (() => {
  const battleSessionService = require("./battleSessionService");
  const { xpNeededForLevel } = require("./xpService");
  return { snapshotPokemon: battleSessionService.snapshotPokemon, xpNeededForLevel };
})();

describe("snapshotPokemon gender/xp fields", () => {
  it("carries a raw.gender straight through unchanged", () => {
    const snap = snapshotPokemon(playerMon({ gender: "female" }), 1);
    assert.equal(snap.gender, "female");
  });

  it("rolls a gender when raw.gender is absent (e.g. enemy config data)", () => {
    const snap = snapshotPokemon(enemyMon({ pokemon_id: 132 }), 1); // Ditto: genderless
    assert.equal(snap.gender, "genderless");
  });

  it("exposes experience and xp_to_next matching xpService's curve", () => {
    const snap = snapshotPokemon(playerMon({ level: 5, experience: 30 }), 1);
    assert.equal(snap.experience, 30);
    assert.equal(snap.xp_to_next, xpNeededForLevel(5));
  });

  it("defaults experience to 0 when raw.experience is absent", () => {
    const snap = snapshotPokemon(playerMon({ experience: undefined }), 1);
    assert.equal(snap.experience, 0);
  });
});
```

(This file already imports `snapshotPokemon` indirectly through its top-level requires block — check the top of the file first; if `snapshotPokemon` is not already destructured from `require("./battleSessionService")` at the top, add it to that existing require instead of the local IIFE above, to match the file's style. Either form is acceptable; prefer matching the file's existing top-level require block if one already imports from `./battleSessionService`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test src/services/battleSessionService.test.js` (from `backend/`)
Expected: FAIL — `snap.gender` and `snap.xp_to_next` are `undefined`

- [ ] **Step 3: Add the requires and extend `snapshotPokemon`**

In `backend/src/services/battleSessionService.js`, add after the existing `const { createBattleAi } = require("./battleAi");` (line 18):

```js
const { xpNeededForLevel } = require("./xpService");
const { rollGenderForSpecies } = require("./genderService");
```

Change `snapshotPokemon` (currently lines 126-157) from:

```js
function snapshotPokemon(raw, fallbackPosition = null) {
	const maxHp = Number(raw.max_hp);
	const currentHp = raw.current_hp == null ? maxHp : Number(raw.current_hp);
	return {
		// DB row id (trainer_pokemon.id) — used to persist XP/PP after battle
		id: raw.id ?? null,
		position: raw.position != null ? Number(raw.position) : fallbackPosition,
		pokemon_id: raw.pokemon_id,
		nickname: raw.nickname,
		level: Number(raw.level) || 1,
		max_hp: maxHp,
		current_hp: Math.max(0, Math.min(maxHp, currentHp)),
		attack: Number(raw.attack),
		defense: Number(raw.defense),
		speed: Number(raw.speed),
		special_atk: Number(raw.special_atk),
		special_def: Number(raw.special_def),
		// Major battle status (brn/par/psn/slp/frz) — session-scoped, always
		// starts clean (the DB's cosmetic status string is ignored).
		status: null,
		statusTurns: 0,
		stages: freshStages(),
		ability: raw.ability
			? {
					id: raw.ability.id ?? raw.ability.ability_id ?? null,
					name: raw.ability.name,
			  }
			: null,
		types: Array.isArray(raw.types) && raw.types.length ? raw.types : ["Normal"],
		moves: (raw.moves || []).map(sanitizeMove),
	};
}
```

to:

```js
function snapshotPokemon(raw, fallbackPosition = null) {
	const maxHp = Number(raw.max_hp);
	const currentHp = raw.current_hp == null ? maxHp : Number(raw.current_hp);
	const level = Number(raw.level) || 1;
	return {
		// DB row id (trainer_pokemon.id) — used to persist XP/PP after battle
		id: raw.id ?? null,
		position: raw.position != null ? Number(raw.position) : fallbackPosition,
		pokemon_id: raw.pokemon_id,
		nickname: raw.nickname,
		level,
		max_hp: maxHp,
		current_hp: Math.max(0, Math.min(maxHp, currentHp)),
		attack: Number(raw.attack),
		defense: Number(raw.defense),
		speed: Number(raw.speed),
		special_atk: Number(raw.special_atk),
		special_def: Number(raw.special_def),
		// Major battle status (brn/par/psn/slp/frz) — session-scoped, always
		// starts clean (the DB's cosmetic status string is ignored).
		status: null,
		statusTurns: 0,
		stages: freshStages(),
		ability: raw.ability
			? {
					id: raw.ability.id ?? raw.ability.ability_id ?? null,
					name: raw.ability.name,
			  }
			: null,
		types: Array.isArray(raw.types) && raw.types.length ? raw.types : ["Normal"],
		moves: (raw.moves || []).map(sanitizeMove),
		// Battle UI redesign: gender symbol + live EXP bar. Player rows carry
		// a real assigned gender (Task 2); enemy config data has none, so one
		// is rolled here once, at session-start snapshot time, and stays
		// stable for the whole battle (session.player/enemyParty are mutated
		// in place across turns, not re-snapshotted).
		gender: raw.gender || rollGenderForSpecies(raw.pokemon_id),
		experience: Number(raw.experience) || 0,
		xp_to_next: xpNeededForLevel(level),
	};
}
```

`clonePokemon()` needs no change — `gender`, `experience`, and `xp_to_next` are plain values already copied by its existing `{ ...pokemon, ... }` spread.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/services/battleSessionService.test.js` (from `backend/`)
Expected: PASS, including all 4 new tests and every pre-existing test in the file

- [ ] **Step 5: Commit**

```bash
git add src/services/battleSessionService.js src/services/battleSessionService.test.js
git commit -m "feat: expose live gender and XP progress on battle session snapshots"
```

---

## Task 5: `HpBox.jsx` — extract HP box, add gender symbol + player EXP bar

**Files:**
- Create: `frontend/src/pages/Game/battle/HpBox.jsx`
- Modify: `frontend/src/pages/Game/BattleSim.jsx:1086-1256` (replace inline JSX with `<HpBox>` calls), add import near line 10
- Modify: `frontend/src/pages/Game/BattleGround.css` (add `.gba-exp-container`/`.gba-exp-bar`/`.gba-exp-fill`, `.gba-gender-male`/`.gba-gender-female`; bump `.gba-hp-box.player-hp-box` height)

**Interfaces:**
- Consumes: `getHealthColorClass(percent)` (already defined in `BattleSim.jsx` — pass as a prop, do not redefine it), `StatusBadge` (already defined in `BattleSim.jsx` at module scope — import it into the new file instead of passing as a prop, since it takes no closure state), `motion` from `framer-motion`.
- Produces: `<HpBox pokemon role party activePosition opponentMove />` where:
  - `pokemon`: a snapshot pokémon object (now carrying `gender`, `experience`, `xp_to_next` per Task 4) — for the enemy call site this is `trainerPokemon`, for the player call site this is `userPokemon` (same variable names `BattleSim.jsx` already uses).
  - `role`: `'enemy' | 'player'` — gates the EXP bar (player only) and which CSS modifier class (`enemy-hp-box`/`player-hp-box`) is applied.
  - `party`: the full party array for the dot-row (`enemyParty` for the enemy box, `party` for the player box — same variables already in scope at each call site).
  - `activePosition`: `enemyActivePosition` for the enemy box, `activePosition` for the player box (same variables already in scope).
  - `opponentMove`: only meaningful on the enemy box; pass `null` for the player box.
  - `style`: pass through the inline style object the player box currently has (`{ animationDelay: ..., animationFillMode: 'both' }`) as an optional prop, `undefined` for the enemy box.

- [ ] **Step 1: Create `HpBox.jsx`**

```jsx
// frontend/src/pages/Game/battle/HpBox.jsx
import React from 'react';
import { motion } from 'framer-motion';

const STATUS_BADGE_COLORS = {
  brn: 'status-brn',
  par: 'status-par',
  psn: 'status-psn',
  slp: 'status-slp',
  frz: 'status-frz',
};

const StatusBadge = ({ status }) =>
  status ? (
    <span className={`gba-status-badge ${STATUS_BADGE_COLORS[status] || ''}`}>
      {String(status).toUpperCase()}
    </span>
  ) : null;

const GenderSymbol = ({ gender }) => {
  if (gender === 'male') return <span className="gba-gender-male"> ♂</span>;
  if (gender === 'female') return <span className="gba-gender-female"> ♀</span>;
  return null;
};

/**
 * One HP box (name, gender, level, status, party dots, HP bar+number, and
 * -- player role only -- a live EXP bar). Lifted out of BattleSim.jsx's
 * inline JSX; same props/data the two call sites already compute, no new
 * data flow.
 */
const HpBox = ({
  pokemon,
  role, // 'enemy' | 'player'
  party,
  activePosition,
  opponentMove,
  getHealthColorClass,
  style,
}) => {
  const healthPercent = (pokemon.current_hp / pokemon.max_hp) * 100;
  const expPercent =
    role === 'player'
      ? Math.max(0, Math.min(100, (pokemon.experience / pokemon.xp_to_next) * 100))
      : 0;

  return (
    <div className={`gba-hp-box ${role}-hp-box`} style={style}>
      <div className="gba-pokemon-name">
        {pokemon.nickname}
        <GenderSymbol gender={pokemon.gender} />{' '}
        <span className="gba-level-text">Lv.{pokemon.level}</span>
        <StatusBadge status={pokemon.status} />
      </div>
      {party.length > 1 && (
        <div className="gba-party-dots" aria-hidden="true">
          {party.map((mon) => {
            const hp =
              pokemon && mon.position === pokemon.position ? pokemon.current_hp : mon.current_hp;
            return (
              <span
                key={mon.position}
                className={`gba-party-dot ${hp <= 0 ? 'fainted' : ''} ${
                  mon.position === activePosition ? 'active' : ''
                }`}
              />
            );
          })}
        </div>
      )}
      <div className="gba-health-container">
        <div className="gba-health-bar">
          <motion.div
            className={`gba-health-fill ${getHealthColorClass(healthPercent)}`}
            initial={{ width: '100%' }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        {role === 'player' && (
          <div className="gba-hp-text">
            HP: {pokemon.current_hp}/{pokemon.max_hp}
          </div>
        )}
      </div>
      {role === 'player' && (
        <div className="gba-exp-container">
          <div className="gba-exp-bar">
            <motion.div
              className="gba-exp-fill"
              initial={{ width: '0%' }}
              animate={{ width: `${expPercent}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      )}
      {role === 'enemy' && opponentMove && (
        <div className="opponent-move">Move: {opponentMove.name}</div>
      )}
    </div>
  );
};

export default HpBox;
```

- [ ] **Step 2: Wire `HpBox` into `BattleSim.jsx`**

Add the import near the top (after the existing `import LcdPanel from '../../components/Shell/LcdPanel';` at line 10):

```js
import HpBox from './battle/HpBox';
```

Replace the enemy HP box block (currently lines 1086-1124, the `{introStarted && (<div className="gba-hp-box enemy-hp-box">...</div>)}`) with:

```jsx
{introStarted && (
  <HpBox
    pokemon={trainerPokemon}
    role="enemy"
    party={enemyParty}
    activePosition={enemyActivePosition}
    opponentMove={opponentMove}
    getHealthColorClass={getHealthColorClass}
  />
)}
```

Replace the player HP box block (currently lines 1213-1255, the `{introStarted && (<div className="gba-hp-box player-hp-box" style={{...}}>...</div>)}`) with:

```jsx
{introStarted && (
  <HpBox
    pokemon={userPokemon}
    role="player"
    party={party}
    activePosition={activePosition}
    opponentMove={null}
    getHealthColorClass={getHealthColorClass}
    style={{ animationDelay: reduceMotion ? '0s' : '0.45s', animationFillMode: 'both' }}
  />
)}
```

(`trainerHealthPercent`/`userHealthPercent` local variables that fed the old inline `motion.div` are no longer read directly by `BattleSim.jsx` after this change if nothing else in the file uses them — check with a grep for their names after this edit; if unused elsewhere, remove their `const` declarations, otherwise leave them.)

- [ ] **Step 3: Add the new CSS**

In `frontend/src/pages/Game/BattleGround.css`, change `.gba-hp-box.player-hp-box`'s height (currently `height: 80px;` inside the block starting at line 196) to `height: 100px;` — the extra ~20px fits the new EXP bar without touching `battleLayout.js`'s `slotStyle()`/`shadowStyle()` positioning (per Global Constraints).

Add near the existing `.gba-hp-text` rule (after line ~326):

```css
.gba-exp-container {
  margin-top: 4px;
}

.gba-exp-bar {
  position: relative;
  width: 100%;
  height: 5px;
  background: #333;
  border: 1px solid #000;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
}

.gba-exp-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(to bottom, #5b93ff, #3b82f6);
  transition: width 1s steps(10, end);
}

.gba-gender-male {
  color: #5b93ff;
  font-weight: bold;
}

.gba-gender-female {
  color: #ff6b9d;
  font-weight: bold;
}
```

- [ ] **Step 4: Manual verification**

Run: `cd frontend && npm run dev`, open a battle in the browser (from the hub, Continue into any level), confirm:
- Enemy and player HP boxes render exactly as before, plus a ♂/♀ symbol next to each name (or none, for a pre-migration party member with `gender: null`).
- The player HP box shows a thin blue bar under the HP number, filled proportionally.
- Sprite positions and shadow positions are unchanged (Global Constraint).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Game/battle/HpBox.jsx src/pages/Game/BattleSim.jsx src/pages/Game/BattleGround.css
git commit -m "refactor: extract HpBox component, add gender symbol and EXP bar"
```

---

## Task 6: `MoveMenu.jsx` — extract move-select UI, bump font size

**Files:**
- Create: `frontend/src/pages/Game/battle/MoveMenu.jsx`
- Modify: `frontend/src/pages/Game/BattleSim.jsx:1420-1523` (replace inline JSX with `<MoveMenu>`)
- Modify: `frontend/src/pages/Game/BattleGround.css:473-543` (font-size bumps)

**Interfaces:**
- Consumes: `TYPE_COLORS` from `../../../utils/typeColors` (import directly in the new file, same as `BattleSim.jsx` already does).
- Produces: two sibling render outputs from one component — `<MoveMenu>` renders the move grid (for the `.gba-dialog-box` slot) via a `part="grid"` prop and the info panel (for the `.gba-menu-box` slot) via `part="info"`, since the spec's existing split has the grid on the left and info on the right, in two different DOM positions in `BattleSim.jsx`'s tree. Props: `{ part, grid, menuCursor, hoveredMove, mustStruggle, onSelectMove, onHoverMove, onLeaveHover, onFocusMove, onBlurMove }`.

- [ ] **Step 1: Create `MoveMenu.jsx`**

```jsx
// frontend/src/pages/Game/battle/MoveMenu.jsx
import React from 'react';
import { TYPE_COLORS } from '../../../utils/typeColors';

/**
 * Move-select UI, split across two DOM slots by BattleSim.jsx's existing
 * dialog-box/menu-box layout: part="grid" is the 2x2 move buttons (dialog
 * box side), part="info" is the PP/type/description panel (menu box
 * side). Lifted from BattleSim.jsx's inline JSX -- same props/behavior,
 * arrow-key navigation is unchanged (still driven by BattleSim.jsx's
 * existing keydown effect and menuCursor state).
 */
const MoveMenu = ({
  part,
  grid,
  menuCursor,
  hoveredMove,
  mustStruggle,
  onSelectMove,
  onHoverMove,
  onLeaveHover,
  onFocusMove,
  onBlurMove,
}) => {
  if (part === 'grid') {
    if (mustStruggle) {
      return (
        <div className="gba-move-grid">
          <button
            className="gba-move-btn gba-move-btn--struggle"
            onClick={() => onSelectMove({ move_id: -1, name: 'Struggle', move_type: 'Normal' })}
          >
            STRUGGLE
          </button>
        </div>
      );
    }
    return (
      <div className="gba-move-grid">
        {grid.map((move, index) =>
          move ? (
            <button
              key={move.move_id}
              className={`gba-move-btn ${menuCursor === index ? 'selected' : ''}`}
              onClick={() => onSelectMove(move, index)}
              onMouseEnter={() => onHoverMove(move, index)}
              onMouseLeave={onLeaveHover}
              onFocus={() => onFocusMove(move)}
              onBlur={onBlurMove}
              disabled={typeof move.current_pp === 'number' && move.current_pp <= 0}
            >
              <span className="gba-cursor-arrow">{menuCursor === index ? '▶' : ''}</span>
              <span className="gba-move-btn-name">{move.name}</span>
              {typeof move.current_pp === 'number' && (
                <span className="gba-move-btn-pp">
                  {move.current_pp}/{move.max_pp}
                </span>
              )}
            </button>
          ) : (
            <button key={index} className="gba-move-btn blank" disabled></button>
          )
        )}
      </div>
    );
  }

  // part === 'info'
  const shown = hoveredMove || grid[menuCursor];
  return (
    <div className="gba-move-info">
      {shown ? (
        <>
          <p><strong>{shown.name}</strong></p>
          <p>
            Type:{' '}
            {(shown.type || shown.move_type) && (
              <span
                className="move-type"
                style={{
                  background:
                    TYPE_COLORS[String(shown.type || shown.move_type).toLowerCase()] || '#a8a77a',
                }}
              >
                {shown.type || shown.move_type}
              </span>
            )}
          </p>
          <p>
            PP: {typeof shown.current_pp === 'number' ? `${shown.current_pp}/${shown.max_pp}` : '—'}
          </p>
          <p>Description: {shown.description ? shown.description : 'No description available.'}</p>
        </>
      ) : (
        <p>Hover over a move for details</p>
      )}
    </div>
  );
};

export default MoveMenu;
```

- [ ] **Step 2: Wire `MoveMenu` into `BattleSim.jsx`**

Add the import next to Task 5's `HpBox` import:

```js
import MoveMenu from './battle/MoveMenu';
```

Replace the move-grid block inside `.gba-dialog-box` (currently lines 1421-1467, the `session?.mustStruggle ? (...) : (<div className="gba-move-grid">...</div>)` ternary) with:

```jsx
<MoveMenu
  part="grid"
  grid={grid}
  menuCursor={menuCursor}
  mustStruggle={session?.mustStruggle}
  onSelectMove={(move, index) => {
    if (index != null) setMenuCursor(index);
    handleSelectMove(move);
  }}
  onHoverMove={(move, index) => {
    setMenuCursor(index);
    setHoveredMove(move);
  }}
  onLeaveHover={() => setHoveredMove(null)}
  onFocusMove={(move) => setHoveredMove(move)}
  onBlurMove={() => setHoveredMove(null)}
/>
```

Replace the move-info block inside `.gba-menu-box` (currently lines 1482-1523, the `uiPhase === 'moveSelect' ? (<div className="gba-move-info">...</div>)` branch's inner content) with:

```jsx
<MoveMenu part="info" grid={grid} menuCursor={menuCursor} hoveredMove={hoveredMove} />
```

(Keep the surrounding `uiPhase === 'moveSelect' ? (...) : ...` conditional in `BattleSim.jsx` exactly as it is today — only the JSX *inside* that branch is replaced.)

- [ ] **Step 3: Bump font sizes in CSS**

In `frontend/src/pages/Game/BattleGround.css`:
- `.gba-move-btn` (line ~473-484): change `font-size: 12px;` to `font-size: 15px;`
- `.gba-move-info` (line ~522-532): change `font-size: 11px;` to `font-size: 13px;`
- `.gba-move-btn-pp` (line ~951-957): change `font-size: 9px;` to `font-size: 11px;`

- [ ] **Step 4: Manual verification**

Run: `cd frontend && npm run dev`, enter a battle, open FIGHT, confirm: 2x2 move grid on the left reads noticeably larger/denser than before, PP/type/description panel on the right is still legible and unclipped, arrow-key navigation and click/hover still work exactly as before.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Game/battle/MoveMenu.jsx src/pages/Game/BattleSim.jsx src/pages/Game/BattleGround.css
git commit -m "refactor: extract MoveMenu component, increase move-select font size"
```

---

## Task 7: `MessageLog.jsx` + full-width move-resolution view, remove dev-log accordion

**Files:**
- Create: `frontend/src/pages/Game/battle/MessageLog.jsx`
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (state: replace `currentMessage`/`battleLog`/`devLogOpen` with `activeBeatLines`; JSX: dialog-box branch + fullwidth layout + remove dev-log block; `flushNextMessage`)
- Modify: `frontend/src/pages/Game/BattleGround.css` (fullwidth dialog-box modifier, remove now-unused `.gba-battle-log*` rules, `.gba-dialog-text` font bump)

**Interfaces:**
- Produces: `<MessageLog lines={activeBeatLines} />` — self-contained autoscroll (its own `ref`+`useEffect`, not lifted from `BattleSim.jsx`'s existing `logRef`, since `logRef` and its scroll effect are being deleted along with the dev-log accordion).

- [ ] **Step 1: Create `MessageLog.jsx`**

```jsx
// frontend/src/pages/Game/battle/MessageLog.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Renders the accumulating list of lines for the current beat (cleared by
 * BattleSim.jsx whenever a fresh player turn begins). Replaces the old
 * single-line currentMessage plus the separate collapsed "DEVELOPER LOG"
 * accordion -- this is now the one place players see the full event text.
 */
const MessageLog = ({ lines }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="gba-message-log" ref={scrollRef}>
      {lines.map((line, index) => (
        <motion.p
          key={index}
          className="gba-dialog-text"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
};

export default MessageLog;
```

- [ ] **Step 2: Replace `currentMessage`/`battleLog`/`devLogOpen` state with `activeBeatLines`**

In `BattleSim.jsx`:
- Change `const [currentMessage, setCurrentMessage] = useState('');` to `const [activeBeatLines, setActiveBeatLines] = useState([]);`
- Delete `const [devLogOpen, setDevLogOpen] = useState(false);`
- Delete `const [battleLog, setBattleLog] = useState([]);`
- Delete the `logRef` auto-scroll effect (`useEffect(() => { if (logRef.current) {...} }, [battleLog]);`) — `MessageLog` now owns its own scroll effect. If `logRef` (`useRef(null)`) is unused anywhere else after this, delete its declaration too.

Change `addLog` from:

```js
const addLog = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  setBattleLog((prevLog) => [...prevLog, `${timestamp} - ${message}`]);
  messageQueueRef.current.push(message);
  if (!messageTimerRef.current) {
    flushNextMessage();
  }
};
```

to:

```js
const addLog = (message) => {
  messageQueueRef.current.push(message);
  if (!messageTimerRef.current) {
    flushNextMessage();
  }
};
```

Change `flushNextMessage` from:

```js
const flushNextMessage = () => {
  if (messageQueueRef.current.length === 0) {
    messageTimerRef.current = null;
    return;
  }
  const next = messageQueueRef.current.shift();
  setCurrentMessage(next);
  messageTimerRef.current = setTimeout(flushNextMessage, motionMs(600));
  timersRef.current.push(messageTimerRef.current);
};
```

to:

```js
const flushNextMessage = () => {
  if (messageQueueRef.current.length === 0) {
    messageTimerRef.current = null;
    return;
  }
  const next = messageQueueRef.current.shift();
  setActiveBeatLines((prev) => [...prev, next]);
  messageTimerRef.current = setTimeout(flushNextMessage, motionMs(600));
  timersRef.current.push(messageTimerRef.current);
};
```

Find the two places `setCurrentMessage('')` is called to clear the display for a fresh beat (one inside the server-action success path, currently around line 815; one inside `restartBattle`, currently around line 895) and change each to `setActiveBeatLines([]);`. Delete the `setBattleLog([]);` line inside `restartBattle` (currently line 896) — there is no longer a separate `battleLog` to reset.

- [ ] **Step 3: Wire `MessageLog` and the full-width layout rule into the render**

Add the import next to Task 5/6's imports:

```js
import MessageLog from './battle/MessageLog';
```

In the bottom-UI block (`BattleSim.jsx`'s `.gba-bottom-ui` render, currently starting around line 1259), the existing structure is:

```jsx
<div className="gba-bottom-ui">
  {uiPhase === 'finished' && battleOutcome ? (
    ...
  ) : uiPhase === 'bagSelect' ? (
    ...
  ) : uiPhase === 'partySelect' ? (
    ...
  ) : (
    <>
      <div className={`gba-dialog-box ${uiPhase !== 'moveSelect' ? 'gba-dialog-box--message' : ''}`}>
        {uiPhase === 'moveSelect' ? (
          /* MoveMenu part="grid", from Task 6 */
        ) : (
          <div className="gba-dialog-text">
            {uiPhase === 'restartConfirm' ? 'Restart this battle?'
              : uiPhase === 'restarting' ? 'Restarting battle...'
              : currentMessage ? currentMessage
              : `What will ${userPokemon.nickname} do?`}
          </div>
        )}
      </div>
      <div className="gba-menu-box">
        {/* command menu / MoveMenu part="info" / restartConfirm YES-NO */}
      </div>
    </>
  )}
</div>
```

Introduce a `isMessageOnlyPhase` boolean above this render (next to where `grid`/`chosen`-style render-time consts are computed, e.g. right after `const grid = gridMoves();`):

```js
const isMessageOnlyPhase = !['command', 'moveSelect', 'partySelect', 'bagSelect', 'restartConfirm', 'finished'].includes(uiPhase);
```

Change the final `<>...</>` branch's dialog-box `className` and inner content, and make `.gba-menu-box` conditional, so the block becomes:

```jsx
<>
  <div
    className={`gba-dialog-box ${uiPhase !== 'moveSelect' ? 'gba-dialog-box--message' : ''} ${
      isMessageOnlyPhase ? 'gba-dialog-box--fullwidth' : ''
    }`}
  >
    {uiPhase === 'moveSelect' ? (
      <MoveMenu
        part="grid"
        grid={grid}
        menuCursor={menuCursor}
        mustStruggle={session?.mustStruggle}
        onSelectMove={(move, index) => {
          if (index != null) setMenuCursor(index);
          handleSelectMove(move);
        }}
        onHoverMove={(move, index) => {
          setMenuCursor(index);
          setHoveredMove(move);
        }}
        onLeaveHover={() => setHoveredMove(null)}
        onFocusMove={(move) => setHoveredMove(move)}
        onBlurMove={() => setHoveredMove(null)}
      />
    ) : isMessageOnlyPhase ? (
      <MessageLog lines={activeBeatLines} />
    ) : (
      <div className="gba-dialog-text">
        {uiPhase === 'restartConfirm'
          ? 'Restart this battle?'
          : uiPhase === 'restarting'
          ? 'Restarting battle...'
          : `What will ${userPokemon.nickname} do?`}
      </div>
    )}
  </div>
  {!isMessageOnlyPhase && (
    <div className="gba-menu-box">
      {uiPhase === 'moveSelect' ? (
        <MoveMenu part="info" grid={grid} menuCursor={menuCursor} hoveredMove={hoveredMove} />
      ) : uiPhase === 'command' ? (
        /* existing gba-main-menu block, unchanged */
      ) : uiPhase === 'restartConfirm' ? (
        /* existing YES/NO gba-main-menu block, unchanged */
      ) : null}
    </div>
  )}
</>
```

(`uiPhase === 'command'` no longer needs to render `currentMessage` text since that branch — reached only when `uiPhase` is `'command'`, `'restartConfirm'`, or `'restarting'`, none of which are message-only phases — always shows `"What will X do?"` or the restart prompts; every phase that used to show a queued `currentMessage` line, e.g. `'intro'`/`'acting'`, is now `isMessageOnlyPhase` and renders `<MessageLog>` instead.)

- [ ] **Step 4: Delete the developer-log accordion**

Delete the entire block at the end of `BattleSim.jsx`'s render (currently lines 1569-1596):

```jsx
{/* Developer log: ... */}
<div className="gba-battle-log-container">
  <button ...>{devLogOpen ? '▼' : '▶'} DEVELOPER LOG</button>
  {devLogOpen && (<div className="gba-battle-log" ref={logRef}>...</div>)}
</div>
```

- [ ] **Step 5: Update CSS**

In `frontend/src/pages/Game/BattleGround.css`:
- Delete `.gba-battle-log-toggle`, `.gba-battle-log-toggle:hover`, `.gba-battle-log-container`, `.gba-battle-log`, `.gba-battle-log::-webkit-scrollbar`, `.gba-battle-log::-webkit-scrollbar-track`, `.gba-battle-log::-webkit-scrollbar-thumb`, `.gba-battle-log p`, `.gba-battle-log p::before` (the block from line ~604 to ~666 — check exact end by reading the file, this task's accordion is fully removed).
- Add near `.gba-dialog-box--message` (after line ~444):

```css
.gba-dialog-box--fullwidth {
  width: 100%;
  border-right: none;
  box-shadow: none;
  justify-content: flex-start;
  overflow-y: auto;
}

.gba-message-log {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}
```

Change `.gba-dialog-text`'s `font-size: 14px;` (line ~456) to `font-size: 15px;` (matches the density bump from Task 6, per the user's "font size... just right that the menu is filled" direction).

- [ ] **Step 6: Manual verification**

Run: `cd frontend && npm run dev`, enter a battle, use a move, confirm:
- During the attack/damage/effectiveness beat, the message box expands to the full width of the bottom bar (no empty right-hand panel), showing every line of that beat stacked (not just the last one).
- Once control returns to the player, the view automatically reverts to the 60/40 split with the FIGHT/BAG/POKéMON/RESTART menu on the right — no button press needed.
- No "DEVELOPER LOG" toggle appears anywhere below the device.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Game/battle/MessageLog.jsx src/pages/Game/BattleSim.jsx src/pages/Game/BattleGround.css
git commit -m "feat: full-width accumulating message log, remove developer-log accordion"
```

---

## Task 8: Type-based move animations

**Files:**
- Modify: `frontend/src/pages/Game/battleAnimation.js` (add type-category classifier)
- Modify: `frontend/src/pages/Game/BattleSim.jsx:656-730` (gate the attack lunge by category, add ranged-flash and status-sparkle paths)
- Modify: `frontend/src/pages/Game/BattleGround.css` (ranged-flash and sparkle keyframes)
- Test: `frontend/src/pages/Game/battleAnimation.test.js`

**Interfaces:**
- Produces: `getMoveAnimCategory(moveType) => 'physical' | 'ranged'` from `battleAnimation.js`, exported alongside the existing `getAnimState`/`ANIMATION_VARIANTS`.

- [ ] **Step 1: Write the failing tests**

Add to `frontend/src/pages/Game/battleAnimation.test.js`:

```js
import { getMoveAnimCategory } from "./battleAnimation.js";

describe("getMoveAnimCategory", () => {
  it("classifies contact-feel types as physical", () => {
    for (const type of ["Normal", "Fighting", "Rock", "Ground", "Steel", "Bug", "Poison", "Ghost", "Dark", "Dragon"]) {
      assert.equal(getMoveAnimCategory(type), "physical", `${type} should be physical`);
    }
  });

  it("classifies ranged-feel types as ranged", () => {
    for (const type of ["Water", "Electric", "Psychic", "Fire", "Ice", "Fairy", "Flying"]) {
      assert.equal(getMoveAnimCategory(type), "ranged", `${type} should be ranged`);
    }
  });

  it("is case-insensitive", () => {
    assert.equal(getMoveAnimCategory("fire"), "ranged");
    assert.equal(getMoveAnimCategory("NORMAL"), "physical");
  });

  it("defaults unknown types to physical", () => {
    assert.equal(getMoveAnimCategory("???"), "physical");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/pages/Game/battleAnimation.test.js` (from `frontend/`)
Expected: FAIL — `getMoveAnimCategory is not a function`

- [ ] **Step 3: Add the classifier to `battleAnimation.js`**

Append to `frontend/src/pages/Game/battleAnimation.js`:

```js
// Battle UI redesign (type-based move animations): every move's type maps
// to one of two animation "feels" -- physical types lunge into contact,
// ranged/special types stay put and flash a projectile toward the
// defender instead. Checks against the ranged set only, so an
// unrecognized type falls through to "physical" (the safer default: it
// still plays the existing lunge behavior rather than a new code path).
const RANGED_FEEL_TYPES = new Set([
  "water", "electric", "psychic", "fire", "ice", "fairy", "flying",
]);

export function getMoveAnimCategory(moveType) {
  const key = String(moveType || "").toLowerCase();
  return RANGED_FEEL_TYPES.has(key) ? "ranged" : "physical";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/pages/Game/battleAnimation.test.js` (from `frontend/`)
Expected: PASS (all `getAnimState`/`ANIMATION_VARIANTS` tests plus the new `getMoveAnimCategory` tests)

- [ ] **Step 5: Gate the lunge and add ranged/status animation paths in `BattleSim.jsx`**

Add the import next to the existing `import { getAnimState, ANIMATION_VARIANTS } from './battleAnimation';`:

```js
import { getAnimState, ANIMATION_VARIANTS, getMoveAnimCategory } from './battleAnimation';
```

Add two more overlay state hooks next to the existing `hitFlash`/`criticalFlash` state (near line 137-138):

```js
const [rangedFlash, setRangedFlash] = useState(null); // ranged-move projectile flash, tinted by type
const [statusSparkle, setStatusSparkle] = useState(false); // status/heal move accent on the user
```

Add two trigger helpers next to `triggerHitFlash`/`triggerCriticalFlash` (near line 311-325):

```js
const triggerRangedFlash = (moveType) => {
  if (reduceMotion) return;
  const typeKey = String(moveType || '').toLowerCase();
  setRangedFlash(TYPE_COLORS[typeKey] || '#ffffff');
  timersRef.current.push(setTimeout(() => setRangedFlash(null), 350));
};

const triggerStatusSparkle = () => {
  if (reduceMotion) return;
  setStatusSparkle(true);
  timersRef.current.push(setTimeout(() => setStatusSparkle(false), 500));
};
```

In the move-resolution function (currently lines 656-730), the existing flow unconditionally lunges before checking `event.result`:

```js
const setAttacking = isPlayer ? setPlayerAttacking : setEnemyAttacking;
setAttacking(true);
playSound('attack');
await wait(motionMs(500));
setAttacking(false);
if (!isPlayer) {
  timersRef.current.push(setTimeout(() => setOpponentMove(null), 1500));
}

if (event.result === 'miss') {
  ...
}
if (event.result === 'failed') {
  ...
}
if (event.result === 'status') {
  await wait(motionMs(200));
  return;
}
if (event.result === 'heal') {
  await wait(motionMs(200));
  return;
}

triggerHitFlash(event.moveType);
```

Change it to classify first, and only lunge for physical-feel damaging moves (status/heal moves get the sparkle instead of any lunge; ranged damaging moves get the ranged flash instead of the lunge):

```js
const isStatusLike = event.result === 'status' || event.result === 'heal';
const category = getMoveAnimCategory(event.moveType);
const setAttacking = isPlayer ? setPlayerAttacking : setEnemyAttacking;

if (isStatusLike) {
  triggerStatusSparkle();
  playSound('attack');
  await wait(motionMs(400));
} else if (category === 'physical') {
  setAttacking(true);
  playSound('attack');
  await wait(motionMs(500));
  setAttacking(false);
} else {
  playSound('attack');
  await wait(motionMs(200));
  triggerRangedFlash(event.moveType);
  await wait(motionMs(300));
}
if (!isPlayer) {
  timersRef.current.push(setTimeout(() => setOpponentMove(null), 1500));
}

if (event.result === 'miss') {
  ...
}
if (event.result === 'failed') {
  ...
}
if (event.result === 'status') {
  await wait(motionMs(200));
  return;
}
if (event.result === 'heal') {
  await wait(motionMs(200));
  return;
}

triggerHitFlash(event.moveType);
```

(Leave the `miss`/`failed`/`status`/`heal` branches' bodies exactly as they are today — only the block above them changes. The `triggerHitFlash(event.moveType)` call for a landed damaging hit is unchanged; it already tints by type, per the existing comment discovered during planning.)

Render the two new overlays next to the existing `hitFlash`/`criticalFlash` overlay divs (find them via the `{hitFlash && (...)}` / `{criticalFlash && (...)}` blocks, currently around lines 1052-1066) — add:

```jsx
{rangedFlash && (
  <div
    className="ranged-flash"
    style={{ background: rangedFlash }}
    aria-hidden="true"
  />
)}
{statusSparkle && <div className="status-sparkle" aria-hidden="true" />}
```

Add `setRangedFlash(null); setStatusSparkle(false);` to `restartBattle`'s reset block, next to the existing `setHitFlash(null); setCriticalFlash(false);` lines (currently ~909-910).

- [ ] **Step 6: Add CSS for the two new overlays**

In `frontend/src/pages/Game/BattleGround.css`, near the existing `.hit-flash` rule (line ~28-34):

```css
.ranged-flash {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
  animation: rangedFlashSweep 0.35s ease-out;
}

@keyframes rangedFlashSweep {
  0% { opacity: 0; }
  40% { opacity: 0.6; }
  100% { opacity: 0; }
}

.status-sparkle {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%);
  opacity: 0;
  animation: statusSparklePulse 0.5s ease-out;
}

@keyframes statusSparklePulse {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1); }
}
```

- [ ] **Step 7: Manual verification**

Run: `cd frontend && npm run dev`, enter a battle, use a physical move (e.g. Tackle) and confirm the lunge still plays; use a special/ranged move (e.g. Ember, Water Gun) and confirm no lunge, just the flash sweep; use a pure status move (e.g. Growl, Leer) and confirm no lunge, just the sparkle pulse on the user.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Game/battleAnimation.js src/pages/Game/battleAnimation.test.js src/pages/Game/BattleSim.jsx src/pages/Game/BattleGround.css
git commit -m "feat: type-based move animations (physical lunge / ranged flash / status sparkle)"
```

---

## Task 9: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend suite**

Run: `cd backend && npm test`
Expected: all tests pass, including every new test added in Tasks 1, 2, and 4

- [ ] **Step 2: Run every frontend test file individually**

Run (from `frontend/`):
```bash
node --test src/pages/Game/battleAnimation.test.js
node --test src/pages/Game/battleLayout.test.js
node --test src/sprites/pokemonSprites.test.js
```
Expected: all pass

- [ ] **Step 3: Full manual battle playthrough**

Run: `cd frontend && npm run dev` (and `cd backend && npm run dev` for the API), play one full campaign battle from the hub through to a win or loss screen. Confirm every piece from Tasks 5-8 together: gender symbols, live EXP bar filling as XP is gained mid-battle-log (if a level-up happens), the denser move-select UI, the full-width message log appearing and auto-reverting each turn, and the three animation families playing on the right move categories — with no console errors.
