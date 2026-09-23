# Pokédex Detail Page: PokéAPI-Sourced Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `GET /pokemon-detail/:id` and the Pokédex detail page derive
types, weaknesses, stats, abilities, evolution chain, and description text
live from PokéAPI instead of the locally seeded (and partly mojibake-corrupted)
MySQL `pokedex` database, with correct multi-type weakness math.

**Architecture:** A new backend service layer
(`pokeApiClient` → `typeEffectiveness` → `pokemonDetailService`) replaces the
DB-query body of the existing `GET /pokemon-detail/:id` route. The route
keeps its URL, method, and JSON response shape (field names) so
`frontend/src/pages/Pokedex/pokemonDetail.jsx` needs only two small,
targeted fixes (stat-label lookup keyed to PokéAPI's real stat slugs, and a
pre-existing `pokemon_id`/`id` typo in the sprite `layoutId`). Everything
else in the frontend component (type-color badges, MAX_STAT scaling, stats
grid alignment, evolution card layout, Eevee branch handling) is already
correct and untouched.

**Tech Stack:** Node/Express backend (`mysql2` pool replaced for this route
only), `axios` (already a backend dependency — no new packages), React 18
frontend (unchanged dependency set), Node's built-in `node:test` runner for
backend unit tests (matches the existing `backend/src/services/*.test.js`
convention).

**Spec:** `docs/superpowers/specs/2026-09-18-pokedex-detail-poke-api.md`

## Global Constraints

- No new npm dependencies — `axios` is already present in
  `backend/package.json` and `frontend/package.json`.
- Do not touch `GET /pokemon` / `frontend/src/pages/Pokedex/pokedex.jsx`
  (the grid list) — only the detail endpoint/page.
- Do not touch `frontend/src/components/PokemonSprite/PokemonSprite.jsx` or
  anything under `frontend/src/sprites/` — sprites stay local, never
  PokéAPI.
- Do not touch `frontend/src/utils/typeColors.js` — already correct.
- No hardcoded type-effectiveness table, weakness list, or evolution
  requirement anywhere in the diff — every weakness/requirement must trace
  to a PokéAPI response field at request time.
- Backend response field names for `GET /pokemon-detail/:id` stay
  compatible with the current shape (`id`, `name`, `height`, `weight`,
  `types`, `abilities`, `details.category`, `details.flavor_text`,
  `genders`, `previous_evolutions`, `next_evolutions`, `weaknesses`) except
  `stats`, which now uses PokéAPI's own stat slugs (`hp`, `attack`,
  `defense`, `special-attack`, `special-defense`, `speed`) as keys instead
  of underscored ones — Task 6 updates the one frontend consumer of that
  shape.
- Follow the existing backend service convention: a `create<Name>Service({ deps })`
  factory that accepts its dependencies (see
  `backend/src/services/evolutionService.js`,
  `backend/src/services/starterService.js`) so tests can inject fakes
  instead of hitting the network.
- New backend test files must be added to the `test` script in
  `backend/package.json` (it lists test files explicitly; there is no glob).

---

## File Structure

- **Create** `backend/src/utils/formatSlug.js` — one function,
  `slugToTitleCase`, used for ability names and evolution item names (the
  spec's "reusable formatter" requirement extends beyond just stats).
- **Create** `backend/src/services/pokeApiClient.js` — thin PokéAPI HTTP
  client with an in-memory cache (type charts and evolution chains are
  static reference data for the process lifetime).
- **Create** `backend/src/services/typeEffectiveness.js` — the single
  weakness-calculation utility (multiply-combine, not union).
- **Create** `backend/src/services/pokemonDetailService.js` — aggregates
  pokemon + species + evolution-chain + weaknesses into the response the
  route returns.
- **Modify** `backend/src/PokemonDetailRoutes.js` — route body becomes a
  thin call into `pokemonDetailService`; all DB-query/evolution-recursion
  code is deleted.
- **Modify** `backend/package.json` — register the two new test files.
- **Create** `backend/src/services/typeEffectiveness.test.js` and
  `backend/src/services/pokemonDetailService.test.js` — unit tests against
  a fake `pokeApiClient`, no network calls.
- **Create** `frontend/src/utils/statLabels.js` — `STAT_LABELS` keyed by
  PokéAPI's hyphenated stat slugs + `formatStatLabel(name)` fallback.
- **Modify** `frontend/src/pages/Pokedex/pokemonDetail.jsx` — swap the
  inline `STAT_LABELS` const for the new util, fix the sprite `layoutId`
  typo, and thread the evolution-into-current-mon requirement onto the
  chain array so the Arrow between the last previous-evolution and the
  current mon shows its label (currently silently blank — see Task 7).
- **Modify** `database/pokedex_data.sql` — repo hygiene: repair the
  mojibake in the `pokemon_species` and `Ability` INSERT statements so the
  checked-in dump itself is clean UTF-8 (the detail page no longer reads
  these columns after this plan, but a corrupted committed SQL dump is a
  latent bug for anything else that queries them).

---

## Task 1: `slugToTitleCase` formatter utility

**Files:**
- Create: `backend/src/utils/formatSlug.js`
- Test: `backend/src/utils/formatSlug.test.js`

**Interfaces:**
- Produces: `slugToTitleCase(slug: string): string` — used by Task 3
  (evolution item names) and Task 4 (ability names).

- [ ] **Step 1: Write the failing test**

```javascript
// backend/src/utils/formatSlug.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { slugToTitleCase } = require("./formatSlug");

describe("slugToTitleCase", () => {
  it("title-cases a single word", () => {
    assert.equal(slugToTitleCase("static"), "Static");
  });

  it("title-cases each hyphen-separated word", () => {
    assert.equal(slugToTitleCase("lightning-rod"), "Lightning Rod");
    assert.equal(slugToTitleCase("thunder-stone"), "Thunder Stone");
  });

  it("returns an empty string for null/undefined/empty input", () => {
    assert.equal(slugToTitleCase(null), "");
    assert.equal(slugToTitleCase(undefined), "");
    assert.equal(slugToTitleCase(""), "");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/src/utils/formatSlug.test.js`
Expected: FAIL with `Cannot find module './formatSlug'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// backend/src/utils/formatSlug.js
function slugToTitleCase(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

module.exports = { slugToTitleCase };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/src/utils/formatSlug.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/formatSlug.js backend/src/utils/formatSlug.test.js
git commit -m "feat: add slugToTitleCase formatter for PokeAPI slugs"
```

---

## Task 2: PokéAPI HTTP client with in-memory cache

**Files:**
- Create: `backend/src/services/pokeApiClient.js`
- Test: `backend/src/services/pokeApiClient.test.js`

**Interfaces:**
- Consumes: `axios` (already installed).
- Produces: `createPokeApiClient({ http, baseUrl } = {})` returning
  `{ getPokemon(idOrName), getSpecies(idOrName), getType(name), getEvolutionChain(url) }`,
  each an `async` function returning the parsed JSON body. Also exports a
  default singleton `pokeApiClient` for the route/service to use in
  production. Tasks 3 and 4 depend on this exact shape.

The cache exists because a single detail-page load fans out to ~1 (pokemon)
+ 1 (species) + 1 (evolution chain) + N (one `/pokemon/{id}` per evolution
stage, for their types) + up to 2 (`/type/{name}` per the requested mon's
own types) requests, and the 18 types plus any given evolution chain never
change during the process's lifetime — caching avoids re-fetching them on
every page view/Prev/Next click.

- [ ] **Step 1: Write the failing test**

```javascript
// backend/src/services/pokeApiClient.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createPokeApiClient } = require("./pokeApiClient");

function fakeHttp(responses) {
  const calls = [];
  return {
    calls,
    get: async (url) => {
      calls.push(url);
      if (!(url in responses)) {
        const err = new Error(`no fake response for ${url}`);
        err.response = { status: 404 };
        throw err;
      }
      return { data: responses[url] };
    },
  };
}

describe("pokeApiClient", () => {
  it("fetches a pokemon by id from the configured base URL", async () => {
    const http = fakeHttp({
      "https://pokeapi.co/api/v2/pokemon/25": { name: "pikachu" },
    });
    const client = createPokeApiClient({ http, baseUrl: "https://pokeapi.co/api/v2" });
    const result = await client.getPokemon(25);
    assert.equal(result.name, "pikachu");
    assert.deepEqual(http.calls, ["https://pokeapi.co/api/v2/pokemon/25"]);
  });

  it("caches repeated getType calls instead of refetching", async () => {
    const http = fakeHttp({
      "https://pokeapi.co/api/v2/type/electric": { name: "electric" },
    });
    const client = createPokeApiClient({ http, baseUrl: "https://pokeapi.co/api/v2" });
    await client.getType("electric");
    await client.getType("electric");
    assert.equal(http.calls.length, 1);
  });

  it("fetches an evolution chain by its full URL, not baseUrl-joined", async () => {
    const http = fakeHttp({
      "https://pokeapi.co/api/v2/evolution-chain/10/": { id: 10 },
    });
    const client = createPokeApiClient({ http, baseUrl: "https://pokeapi.co/api/v2" });
    const result = await client.getEvolutionChain(
      "https://pokeapi.co/api/v2/evolution-chain/10/"
    );
    assert.equal(result.id, 10);
  });

  it("propagates errors from the underlying http client", async () => {
    const http = fakeHttp({});
    const client = createPokeApiClient({ http, baseUrl: "https://pokeapi.co/api/v2" });
    await assert.rejects(() => client.getPokemon(999999));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/src/services/pokeApiClient.test.js`
Expected: FAIL with `Cannot find module './pokeApiClient'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// backend/src/services/pokeApiClient.js
const axios = require("axios");

const DEFAULT_BASE_URL = "https://pokeapi.co/api/v2";

function createPokeApiClient({ http = axios, baseUrl = DEFAULT_BASE_URL } = {}) {
  const cache = new Map();

  async function cachedGet(url) {
    if (cache.has(url)) return cache.get(url);
    const { data } = await http.get(url);
    cache.set(url, data);
    return data;
  }

  return {
    getPokemon: (idOrName) => cachedGet(`${baseUrl}/pokemon/${idOrName}`),
    getSpecies: (idOrName) => cachedGet(`${baseUrl}/pokemon-species/${idOrName}`),
    getType: (name) => cachedGet(`${baseUrl}/type/${name}`),
    getEvolutionChain: (url) => cachedGet(url),
  };
}

module.exports = { createPokeApiClient, pokeApiClient: createPokeApiClient() };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/src/services/pokeApiClient.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pokeApiClient.js backend/src/services/pokeApiClient.test.js
git commit -m "feat: add cached PokeAPI HTTP client"
```

---

## Task 3: Type-effectiveness utility (the actual weakness fix)

**Files:**
- Create: `backend/src/services/typeEffectiveness.js`
- Test: `backend/src/services/typeEffectiveness.test.js`

**Interfaces:**
- Consumes: a client shaped like Task 2's `{ getType(name) }`.
- Produces: `createTypeEffectivenessService({ client }).getWeaknesses(types: string[]): Promise<string[]>`
  — lowercase attacking-type names whose combined multiplier against `types`
  is `> 1`. This is the ONLY place weakness math happens; Task 5 calls it,
  nothing else duplicates it.

This directly replaces the buggy SQL in
`backend/src/PokemonDetailRoutes.js:161-173` (per-type union of
`multiplier > 1` rows, no combination across a dual-type mon's two types,
no accounting for `half_damage_from`/`no_damage_from`). The fix: initialize
every one of the 18 types at multiplier `1`, then for each of the mon's own
types, multiply in `2` for everything in that type's `double_damage_from`,
`0.5` for `half_damage_from`, and `0` for `no_damage_from` — across *all* of
the mon's types before filtering.

- [ ] **Step 1: Write the failing test**

```javascript
// backend/src/services/typeEffectiveness.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createTypeEffectivenessService } = require("./typeEffectiveness");

function fakeClient(typeChart) {
  return {
    getType: async (name) => ({
      damage_relations: typeChart[name],
    }),
  };
}

describe("typeEffectiveness.getWeaknesses", () => {
  it("returns a single-type mon's straightforward weaknesses (Pikachu: Electric)", async () => {
    const client = fakeClient({
      electric: {
        double_damage_from: [{ name: "ground" }],
        half_damage_from: [{ name: "electric" }, { name: "flying" }, { name: "steel" }],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["electric"]);
    assert.deepEqual(weaknesses.sort(), ["ground"]);
  });

  it("combines dual-type multipliers instead of unioning them", async () => {
    // Type A is weak to Fire (2x); Type B resists Fire (0.5x) -> combined 1x, NOT a weakness.
    const client = fakeClient({
      "type-a": {
        double_damage_from: [{ name: "fire" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      "type-b": {
        double_damage_from: [],
        half_damage_from: [{ name: "fire" }],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["type-a", "type-b"]);
    assert.deepEqual(weaknesses, []);
  });

  it("keeps an attacking type as a weakness only when the combined multiplier exceeds 1", async () => {
    // Both types double-weak to Water -> 2 * 2 = 4x, still just "a weakness" (present once).
    const client = fakeClient({
      "type-a": {
        double_damage_from: [{ name: "water" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      "type-b": {
        double_damage_from: [{ name: "water" }],
        half_damage_from: [],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["type-a", "type-b"]);
    assert.deepEqual(weaknesses, ["water"]);
  });

  it("treats no_damage_from as cancelling out any weakness from the other type", async () => {
    const client = fakeClient({
      "type-a": {
        double_damage_from: [{ name: "psychic" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      "type-b": {
        double_damage_from: [],
        half_damage_from: [],
        no_damage_from: [{ name: "psychic" }],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["type-a", "type-b"]);
    assert.deepEqual(weaknesses, []);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/src/services/typeEffectiveness.test.js`
Expected: FAIL with `Cannot find module './typeEffectiveness'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// backend/src/services/typeEffectiveness.js
const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy",
];

function createTypeEffectivenessService({ client }) {
  async function getCombinedMultipliers(types) {
    const multiplier = new Map(ALL_TYPES.map((t) => [t, 1]));
    const relations = await Promise.all(
      types.map((t) => client.getType(String(t).toLowerCase()))
    );
    for (const { damage_relations } of relations) {
      for (const { name } of damage_relations.double_damage_from) {
        multiplier.set(name, (multiplier.get(name) ?? 1) * 2);
      }
      for (const { name } of damage_relations.half_damage_from) {
        multiplier.set(name, (multiplier.get(name) ?? 1) * 0.5);
      }
      for (const { name } of damage_relations.no_damage_from) {
        multiplier.set(name, (multiplier.get(name) ?? 1) * 0);
      }
    }
    return multiplier;
  }

  async function getWeaknesses(types) {
    const multiplier = await getCombinedMultipliers(types);
    return Array.from(multiplier.entries())
      .filter(([, value]) => value > 1)
      .map(([name]) => name);
  }

  return { getWeaknesses, getCombinedMultipliers };
}

module.exports = { createTypeEffectivenessService, ALL_TYPES };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/src/services/typeEffectiveness.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/typeEffectiveness.js backend/src/services/typeEffectiveness.test.js
git commit -m "feat: add multiply-combined type-effectiveness weakness calculator"
```

---

## Task 4: Evolution-requirement formatter (PokéAPI `evolution_details` shape)

**Files:**
- Modify: `backend/src/utils/formatSlug.js` — no code change, just consumed here.
- Create: `backend/src/services/evolutionRequirement.js`
- Test: `backend/src/services/evolutionRequirement.test.js`

**Interfaces:**
- Consumes: `slugToTitleCase` from Task 1.
- Produces: `formatEvolutionRequirement(details: EvolutionDetail | null | undefined): string | null`
  where `EvolutionDetail` is one entry of PokéAPI's `evolution_details[]`
  (`{ trigger: { name }, min_level, item, min_happiness, ... }`). Task 5
  calls this once per evolution-chain edge.

This replaces `backend/src/PokemonDetailRoutes.js:14-30`
(`formatEvolutionRequirement(method, condition)`, which parsed the local
`Evolution` table's `evolution_method`/`evolution_condition` strings). The
PokéAPI shape is an object, not two DB strings, so this is a rewrite against
the new input shape — same intent (level, item, trade, friendship), driven
entirely by whatever `evolution_details` PokéAPI actually returns, never a
per-species hardcode.

- [ ] **Step 1: Write the failing test**

```javascript
// backend/src/services/evolutionRequirement.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { formatEvolutionRequirement } = require("./evolutionRequirement");

describe("formatEvolutionRequirement", () => {
  it("formats a level-up requirement with a level", () => {
    assert.equal(
      formatEvolutionRequirement({ trigger: { name: "level-up" }, min_level: 16 }),
      "Lv. 16"
    );
  });

  it("formats a friendship level-up requirement (Pichu -> Pikachu style)", () => {
    assert.equal(
      formatEvolutionRequirement({
        trigger: { name: "level-up" },
        min_level: null,
        min_happiness: 220,
      }),
      "Friendship"
    );
  });

  it("formats a use-item requirement from the item slug (Thunder Stone)", () => {
    assert.equal(
      formatEvolutionRequirement({
        trigger: { name: "use-item" },
        item: { name: "thunder-stone" },
      }),
      "Thunder Stone"
    );
  });

  it("formats a trade requirement", () => {
    assert.equal(
      formatEvolutionRequirement({ trigger: { name: "trade" } }),
      "Trade"
    );
  });

  it("falls back to a title-cased trigger name for anything else recognizable", () => {
    assert.equal(
      formatEvolutionRequirement({ trigger: { name: "shed" } }),
      "Shed"
    );
  });

  it("returns null when there is no requirement to show", () => {
    assert.equal(formatEvolutionRequirement(null), null);
    assert.equal(formatEvolutionRequirement(undefined), null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/src/services/evolutionRequirement.test.js`
Expected: FAIL with `Cannot find module './evolutionRequirement'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// backend/src/services/evolutionRequirement.js
const { slugToTitleCase } = require("../utils/formatSlug");

function formatEvolutionRequirement(details) {
  if (!details) return null;
  const trigger = details.trigger?.name;

  if (trigger === "level-up") {
    if (details.min_level != null) return `Lv. ${details.min_level}`;
    if (details.min_happiness != null) return "Friendship";
    if (details.min_beauty != null) return "Beauty";
    if (details.known_move_type) return `Knows ${slugToTitleCase(details.known_move_type.name)} move`;
    return "Level Up";
  }

  if (trigger === "use-item") {
    return details.item ? slugToTitleCase(details.item.name) : "Use Item";
  }

  if (trigger === "trade") return "Trade";

  return trigger ? slugToTitleCase(trigger) : null;
}

module.exports = { formatEvolutionRequirement };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/src/services/evolutionRequirement.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/evolutionRequirement.js backend/src/services/evolutionRequirement.test.js
git commit -m "feat: derive evolution requirement labels from PokeAPI evolution_details"
```

---

## Task 5: `pokemonDetailService` — the PokéAPI aggregator

**Files:**
- Create: `backend/src/services/pokemonDetailService.js`
- Test: `backend/src/services/pokemonDetailService.test.js`

**Interfaces:**
- Consumes: `createPokeApiClient` shape (Task 2), `createTypeEffectivenessService`
  (Task 3), `formatEvolutionRequirement` (Task 4), `slugToTitleCase` (Task 1).
- Produces: `createPokemonDetailService({ client, typeEffectiveness }).getPokemonDetail(id)`
  returning:
  ```
  {
    id, name, height, weight,
    types: string[],
    abilities: string[],
    stats: { hp, attack, defense, "special-attack", "special-defense", speed },
    details: { category, flavor_text },
    genders: string[],
    requirement: string | null,             // how THIS mon evolved from its immediate previous stage
    previous_evolutions: [{ id, name, types, requirement }],
    next_evolutions: [{ id, name, types, requirement }],
    weaknesses: string[],
  }
  ```
  Task 6 wires this into the route. Task 7 consumes `requirement` on the
  frontend to fix the currently-blank arrow label between the last previous
  evolution and the mon itself.

**Gender derivation** (species `gender_rate`, eighths female; `-1` means
genderless):
- `-1` → `["Genderless"]`
- `0` → `["Male"]`
- `8` → `["Female"]`
- else → `["Male", "Female"]`

**Evolution chain flattening**: walk the chain tree from its root. For each
node, resolve its PokéAPI id from the species URL
(`.../pokemon-species/{id}/`), fetch that id's `/pokemon/{id}` for its
`types`, and record the requirement for the edge *into* that node (i.e. the
node's own `evolution_details[0]`, formatted). Then:
- `previous_evolutions` = the path from the chain root down to (but
  excluding) the requested id, oldest first.
- `next_evolutions` = every descendant of the requested id's node, using the
  same push-then-recurse-per-child order the old DB code used (so branching
  chains like Eevee list one branch's full subtree before the next
  sibling's, matching `pokemonDetail.jsx`'s existing `chain[0].id === 133`
  special case).
- `requirement` (top-level) = the requested id's own node requirement (i.e.
  how it evolved from its immediate parent, `null` for a first-stage mon).

- [ ] **Step 1: Write the failing test**

```javascript
// backend/src/services/pokemonDetailService.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createPokemonDetailService } = require("./pokemonDetailService");
const { createTypeEffectivenessService } = require("./typeEffectiveness");

// Minimal 3-stage linear chain: Pichu(172) -> Pikachu(25) -> Raichu(26)
const POKEMON = {
  172: {
    id: 172, name: "pichu", height: 3, weight: 20,
    types: [{ type: { name: "electric" } }],
    abilities: [{ ability: { name: "static" }, is_hidden: false }],
    stats: [
      { stat: { name: "hp" }, base_stat: 20 },
      { stat: { name: "attack" }, base_stat: 40 },
      { stat: { name: "defense" }, base_stat: 15 },
      { stat: { name: "special-attack" }, base_stat: 35 },
      { stat: { name: "special-defense" }, base_stat: 35 },
      { stat: { name: "speed" }, base_stat: 60 },
    ],
  },
  25: {
    id: 25, name: "pikachu", height: 4, weight: 60,
    types: [{ type: { name: "electric" } }],
    abilities: [
      { ability: { name: "static" }, is_hidden: false },
      { ability: { name: "lightning-rod" }, is_hidden: true },
    ],
    stats: [
      { stat: { name: "hp" }, base_stat: 35 },
      { stat: { name: "attack" }, base_stat: 55 },
      { stat: { name: "defense" }, base_stat: 40 },
      { stat: { name: "special-attack" }, base_stat: 50 },
      { stat: { name: "special-defense" }, base_stat: 50 },
      { stat: { name: "speed" }, base_stat: 90 },
    ],
  },
  26: {
    id: 26, name: "raichu", height: 8, weight: 300,
    types: [{ type: { name: "electric" } }],
    abilities: [{ ability: { name: "static" }, is_hidden: false }],
    stats: [
      { stat: { name: "hp" }, base_stat: 60 },
      { stat: { name: "attack" }, base_stat: 90 },
      { stat: { name: "defense" }, base_stat: 55 },
      { stat: { name: "special-attack" }, base_stat: 90 },
      { stat: { name: "special-defense" }, base_stat: 80 },
      { stat: { name: "speed" }, base_stat: 110 },
    ],
  },
};

const SPECIES_25 = {
  flavor_text_entries: [
    { language: { name: "en" }, flavor_text: "When several of these Pokémon gather, their electricity could\fbuild and cause lightning storms." },
    { language: { name: "fr" }, flavor_text: "ignore me" },
  ],
  genera: [
    { language: { name: "en" }, genus: "Mouse Pokémon" },
    { language: { name: "fr" }, genus: "ignore me" },
  ],
  gender_rate: 4,
  evolution_chain: { url: "https://pokeapi.co/api/v2/evolution-chain/10/" },
};

const EVOLUTION_CHAIN_10 = {
  chain: {
    species: { name: "pichu", url: "https://pokeapi.co/api/v2/pokemon-species/172/" },
    evolution_details: [],
    evolves_to: [
      {
        species: { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon-species/25/" },
        evolution_details: [{ trigger: { name: "level-up" }, min_happiness: 220, min_level: null }],
        evolves_to: [
          {
            species: { name: "raichu", url: "https://pokeapi.co/api/v2/pokemon-species/26/" },
            evolution_details: [{ trigger: { name: "use-item" }, item: { name: "thunder-stone" } }],
            evolves_to: [],
          },
        ],
      },
    ],
  },
};

function fakeClient() {
  return {
    getPokemon: async (id) => POKEMON[id],
    getSpecies: async (id) => (Number(id) === 25 ? SPECIES_25 : { flavor_text_entries: [], genera: [], gender_rate: -1, evolution_chain: { url: "" } }),
    getType: async () => ({ damage_relations: { double_damage_from: [{ name: "ground" }], half_damage_from: [], no_damage_from: [] } }),
    getEvolutionChain: async () => EVOLUTION_CHAIN_10,
  };
}

describe("pokemonDetailService.getPokemonDetail", () => {
  it("returns height in meters, weight in kilograms", async () => {
    const client = fakeClient();
    const svc = createPokemonDetailService({ client, typeEffectiveness: createTypeEffectivenessService({ client }) });
    const detail = await svc.getPokemonDetail(25);
    assert.equal(detail.height, 0.4);
    assert.equal(detail.weight, 6);
  });

  it("cleans flavor text (removes form-feed line breaks) and picks the English genus", async () => {
    const client = fakeClient();
    const svc = createPokemonDetailService({ client, typeEffectiveness: createTypeEffectivenessService({ client }) });
    const detail = await svc.getPokemonDetail(25);
    assert.equal(detail.details.category, "Mouse Pokémon");
    assert.ok(!detail.details.flavor_text.includes("\f"));
    assert.ok(detail.details.flavor_text.includes("Pokémon"));
  });

  it("derives both genders for a mid gender_rate", async () => {
    const client = fakeClient();
    const svc = createPokemonDetailService({ client, typeEffectiveness: createTypeEffectivenessService({ client }) });
    const detail = await svc.getPokemonDetail(25);
    assert.deepEqual(detail.genders.sort(), ["Female", "Male"]);
  });

  it("filters out hidden abilities and title-cases the slug", async () => {
    const client = fakeClient();
    const svc = createPokemonDetailService({ client, typeEffectiveness: createTypeEffectivenessService({ client }) });
    const detail = await svc.getPokemonDetail(25);
    assert.deepEqual(detail.abilities, ["Static"]);
  });

  it("builds previous/next evolutions with requirements on the correct edges", async () => {
    const client = fakeClient();
    const svc = createPokemonDetailService({ client, typeEffectiveness: createTypeEffectivenessService({ client }) });
    const detail = await svc.getPokemonDetail(25);
    assert.deepEqual(detail.previous_evolutions, [
      { id: 172, name: "pichu", types: ["electric"], requirement: null },
    ]);
    assert.equal(detail.requirement, "Friendship");
    assert.deepEqual(detail.next_evolutions, [
      { id: 26, name: "raichu", types: ["electric"], requirement: "Thunder Stone" },
    ]);
  });

  it("uses the typeEffectiveness service for weaknesses, not any local table", async () => {
    const client = fakeClient();
    const svc = createPokemonDetailService({ client, typeEffectiveness: createTypeEffectivenessService({ client }) });
    const detail = await svc.getPokemonDetail(25);
    assert.deepEqual(detail.weaknesses, ["ground"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/src/services/pokemonDetailService.test.js`
Expected: FAIL with `Cannot find module './pokemonDetailService'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// backend/src/services/pokemonDetailService.js
const { slugToTitleCase } = require("../utils/formatSlug");
const { formatEvolutionRequirement } = require("./evolutionRequirement");

function extractIdFromUrl(url) {
  const match = String(url || "").match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function pickEnglish(entries, field) {
  const entry = (entries || []).find((e) => e.language?.name === "en");
  return entry ? entry[field] : "";
}

function cleanFlavorText(text) {
  return String(text || "").replace(/[\f\n\r]+/g, " ").replace(/\s+/g, " ").trim();
}

function gendersFromRate(genderRate) {
  if (genderRate === -1) return ["Genderless"];
  if (genderRate === 0) return ["Male"];
  if (genderRate === 8) return ["Female"];
  return ["Male", "Female"];
}

function statsFromPokemon(pokemon) {
  const stats = {};
  for (const entry of pokemon.stats) {
    stats[entry.stat.name] = entry.base_stat;
  }
  return stats;
}

function createPokemonDetailService({ client, typeEffectiveness }) {
  async function buildEvolutionNode(chainNode, requirement) {
    const id = extractIdFromUrl(chainNode.species.url);
    const pokemon = await client.getPokemon(id);
    const types = pokemon.types.map((t) => t.type.name);
    const children = await Promise.all(
      chainNode.evolves_to.map((child) =>
        buildEvolutionNode(child, formatEvolutionRequirement(child.evolution_details[0]))
      )
    );
    return { id, name: chainNode.species.name, types, requirement, children };
  }

  function findPathToId(node, targetId, path = []) {
    const nextPath = [...path, node];
    if (node.id === targetId) return nextPath;
    for (const child of node.children) {
      const found = findPathToId(child, targetId, nextPath);
      if (found) return found;
    }
    return null;
  }

  function flattenNext(node) {
    let results = [];
    for (const child of node.children) {
      results.push({ id: child.id, name: child.name, types: child.types, requirement: child.requirement });
      results = results.concat(flattenNext(child));
    }
    return results;
  }

  async function getPokemonDetail(id) {
    const pokemon = await client.getPokemon(id);
    const species = await client.getSpecies(id);

    const types = pokemon.types.map((t) => t.type.name);
    const abilities = pokemon.abilities
      .filter((a) => !a.is_hidden)
      .map((a) => slugToTitleCase(a.ability.name));

    const evolutionChain = await client.getEvolutionChain(species.evolution_chain.url);
    const rootNode = await buildEvolutionNode(evolutionChain.chain, null);
    const path = findPathToId(rootNode, Number(pokemon.id)) || [rootNode];
    const currentNode = path[path.length - 1];
    const previous_evolutions = path.slice(0, -1).map((n) => ({
      id: n.id, name: n.name, types: n.types, requirement: n.requirement,
    }));
    const next_evolutions = flattenNext(currentNode);

    const weaknesses = await typeEffectiveness.getWeaknesses(types);

    return {
      id: pokemon.id,
      name: pokemon.name,
      height: pokemon.height / 10,
      weight: pokemon.weight / 10,
      types,
      abilities,
      stats: statsFromPokemon(pokemon),
      details: {
        category: pickEnglish(species.genera, "genus"),
        flavor_text: cleanFlavorText(pickEnglish(species.flavor_text_entries, "flavor_text")),
      },
      genders: gendersFromRate(species.gender_rate),
      requirement: currentNode.requirement,
      previous_evolutions,
      next_evolutions,
      weaknesses,
    };
  }

  return { getPokemonDetail };
}

module.exports = { createPokemonDetailService };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test backend/src/services/pokemonDetailService.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pokemonDetailService.js backend/src/services/pokemonDetailService.test.js
git commit -m "feat: aggregate PokeAPI pokemon/species/evolution-chain into detail response"
```

---

## Task 6: Wire the route to the new service; delete the DB path

**Files:**
- Modify: `backend/src/PokemonDetailRoutes.js`
- Modify: `backend/package.json:` `scripts.test`

**Interfaces:**
- Consumes: `pokeApiClient` (Task 2 singleton), `createTypeEffectivenessService`
  (Task 3), `createPokemonDetailService` (Task 5).

This deletes `queryAsync`, `formatEvolutionRequirement`,
`getPreviousEvolutions`, `getNextEvolutions`, `capitalize`, and the entire
DB-query body of `router.get("/:id", ...)` from
`backend/src/PokemonDetailRoutes.js` — none of it is reachable from any
other file (`getNextEvolutions`/`getPreviousEvolutions`'s only callers are
each other and this route, per the codebase's own call graph).

- [ ] **Step 1: Replace the route file**

```javascript
// backend/src/PokemonDetailRoutes.js
const express = require("express");
const router = express.Router();
const { pokeApiClient } = require("./services/pokeApiClient");
const { createTypeEffectivenessService } = require("./services/typeEffectiveness");
const { createPokemonDetailService } = require("./services/pokemonDetailService");

const pokemonDetailService = createPokemonDetailService({
  client: pokeApiClient,
  typeEffectiveness: createTypeEffectivenessService({ client: pokeApiClient }),
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pokemonDetailService.getPokemonDetail(id);
    res.status(200).json(result);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Pokémon not found" });
    }
    console.error("Error fetching Pokémon detail:", error);
    res.status(502).json({ error: "Could not reach PokeAPI" });
  }
});

module.exports = router;
```

- [ ] **Step 2: Register the new test files in the backend test script**

In `backend/package.json`, add the four new test files to the existing
space-separated `test` script (append after
`src/services/evolutionService.test.js`, keeping the rest unchanged):

```
src/services/evolutionService.test.js src/utils/formatSlug.test.js src/services/pokeApiClient.test.js src/services/typeEffectiveness.test.js src/services/evolutionRequirement.test.js src/services/pokemonDetailService.test.js src/services/moveLearnService.test.js ...
```

- [ ] **Step 3: Run the full backend test suite**

Run (from `backend/`): `npm test`
Expected: all suites PASS, including the four new ones from Tasks 1–5.

- [ ] **Step 4: Manual smoke test against the real PokeAPI**

Run (from `backend/`): `npm run dev`, then in another shell:
`curl http://localhost:<PORT>/pokemon-detail/25` (check `backend/.env` /
`backend/src/config/env.js` for the actual port).
Expected: JSON with `"weaknesses":["ground"]`, `"types":["electric"]`,
`"details":{"category":"Mouse Pokémon","flavor_text":"..."}` with no
mojibake, `"genders":["Male","Female"]`, `previous_evolutions` containing
`pichu`, `next_evolutions` containing `raichu` with
`"requirement":"Thunder Stone"`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/PokemonDetailRoutes.js backend/package.json
git commit -m "feat: source /pokemon-detail/:id from PokeAPI instead of local MySQL data"
```

---

## Task 7: Frontend — stat-label util, sprite-key fix, evolution arrow fix

**Files:**
- Create: `frontend/src/utils/statLabels.js`
- Modify: `frontend/src/pages/Pokedex/pokemonDetail.jsx`

**Interfaces:**
- Consumes: backend's new `stats` shape (Task 5/6), keyed
  `hp`/`attack`/`defense`/`special-attack`/`special-defense`/`speed`.
- Produces: `formatStatLabel(name: string): string`, replacing the inline
  `STAT_LABELS` object currently in `pokemonDetail.jsx:13-20`.

Three changes to `pokemonDetail.jsx`, each small and independently visible:

1. `STAT_LABELS` moves to a shared util keyed by the *real* PokéAPI stat
   slugs (`special-attack`, not `special_attack` — the old keys never
   matched anything meaningful once the DB's underscored column names go
   away).
2. `layoutId={`shared-image-${pokemon.pokemon_id}`}` at line 197 reads a
   field the API response never had (`pokemon_id`) — it's always been
   `undefined`, silently breaking the Framer Motion shared-layout animation
   from the grid tile into the detail page's sprite. Fix it to
   `pokemon.id`, the field that actually exists.
3. The inline current-stage object built at line 396-399
   (`{ id: pokemon.id, name: pokemon.name, types: pokemon.types || [] }`)
   never set `requirement`, so `<Arrow requirement={chain[idx + 1]?.requirement} />`
   between the last previous-evolution and the current mon always rendered
   blank — the requirement for that edge exists (as `pokemon.requirement`,
   Task 5) but was never threaded through. Add it.

- [ ] **Step 1: Create the stat-label util**

```javascript
// frontend/src/utils/statLabels.js
const STAT_LABELS = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

export function formatStatLabel(name) {
  return STAT_LABELS[name] || name;
}
```

- [ ] **Step 2: Swap the inline STAT_LABELS for the util**

In `frontend/src/pages/Pokedex/pokemonDetail.jsx`:

```diff
 import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
+import { formatStatLabel } from "../../utils/statLabels";

 const MAX_STAT = 255;
 const legendaryIds = [144, 145, 146, 150, 151];

-// DB stat keys -> Pokédex-standard display labels (HP, Sp. Atk, Sp. Def, ...).
-const STAT_LABELS = {
-  hp: "HP",
-  attack: "Attack",
-  defense: "Defense",
-  special_attack: "Sp. Atk",
-  special_defense: "Sp. Def",
-  speed: "Speed",
-};
-
```

```diff
                     <span
                       className="font-pixel text-[0.55rem] tracking-wide"
                       style={{ color: "var(--lcd-ink)" }}
                     >
-                      {STAT_LABELS[stat.name] || stat.name}
+                      {formatStatLabel(stat.name)}
                     </span>
```

- [ ] **Step 3: Fix the sprite layoutId key**

```diff
             <PokemonSprite
               as={motion.img}
               pokemon={pokemon}
               variant="front"
-              layoutId={`shared-image-${pokemon.pokemon_id}`}
+              layoutId={`shared-image-${pokemon.id}`}
               loading="lazy"
               className="w-64 h-64 object-contain pixelated"
             />
```

- [ ] **Step 4: Thread the requirement onto the current-stage chain entry**

```diff
             const chain = [
               ...prevEvos,
               {
                 id: pokemon.id,
                 name: pokemon.name,
                 types: pokemon.types || [],
+                requirement: pokemon.requirement,
               },
               ...nextEvos,
             ];
```

- [ ] **Step 5: Run the frontend build/lint to catch typos**

Run (from `frontend/`): `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/utils/statLabels.js frontend/src/pages/Pokedex/pokemonDetail.jsx
git commit -m "fix: use real PokeAPI stat slugs, fix sprite layoutId and evolution arrow label"
```

---

## Task 8: Repair the mojibake in the committed SQL dump (repo hygiene)

**Files:**
- Modify: `database/pokedex_data.sql`

The detail page no longer reads `pokemon_species.category`/`flavor_text` or
`Ability.description` after Task 6, so this task does not fix a live bug —
it fixes a corrupted file sitting in the repo (`Mouse Pok├⌐mon`,
`POK├⌐MON`, `1.25├ù` inside the `pokemon_species` and `Ability` INSERT
statements — confirmed at `database/pokedex_data.sql` around the `(25, ...)`
row). Left as-is, anything that ever re-seeds a dev DB from this dump (or
any other reader of these two columns, e.g. an admin tool) inherits the
corruption.

- [ ] **Step 1: Identify every corrupted byte sequence**

Run: `grep -oE '[├⌐┨ù]' database/pokedex_data.sql | sort | uniq -c`
Expected: nonzero counts for each of `├`, `⌐` (and any other CP437
box-drawing artifacts the grep turns up) — this confirms the corruption is
CP437-bytes-shown-as-UTF-8, consistent across the file rather than a one-off
typo.

- [ ] **Step 2: Decode and re-encode the affected columns**

Write a one-off Node script (run once, not committed) that reads the file,
finds each mangled run, and reverses the CP437→UTF-8 misinterpretation:

```javascript
// scratch script, run with: node fix-mojibake.js
const fs = require("fs");
const path = "database/pokedex_data.sql";
let text = fs.readFileSync(path, "utf8");

// The mangled bytes are the UTF-8 encoding of "é" (0xC3 0xA9) after being
// misread as CP437 and re-saved as UTF-8. Reversing: take each mangled
// 2-character run, encode it back to CP437 byte values, then decode those
// bytes as UTF-8.
const CP437_TO_BYTE = { "├": 0xc3, "⌐": 0xa9, "┨": 0xb9, "ù": 0xa5 }; // extend if grep in Step 1 finds more

text = text.replace(/[├⌐┨ù]{2}/g, (match) => {
  const bytes = Buffer.from([...match].map((ch) => CP437_TO_BYTE[ch]));
  return bytes.toString("utf8");
});

fs.writeFileSync(path, text, "utf8");
console.log("done");
```

Adjust the `CP437_TO_BYTE` map and the matched run length based on what
Step 1's `grep` actually turns up (the task's own audit found `├⌐` for "é"
in `category`/`flavor_text`/`Ability.description`, and a separately garbled
`├ù` for "×" in an `Ability` description — confirm both before running).

- [ ] **Step 3: Verify the fix**

Run: `grep -c 'Pok[eé]mon' database/pokedex_data.sql` and manually inspect
a few rows, e.g.:
`grep -o "(25,'[^)]*" database/pokedex_data.sql | head -3`
Expected: `Mouse Pokémon` and `POKÉMON`/`Pokémon` render correctly, no
`├`, `⌐`, `┨`, `ù`-as-multiplication-sign remain anywhere in the file.

- [ ] **Step 4: Commit**

```bash
git add database/pokedex_data.sql
git commit -m "fix: repair CP437/UTF-8 mojibake in pokemon_species and Ability seed data"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (refetch from PokéAPI) → Tasks 2, 5, 6. §2 (correct
  multi-type weakness math) → Task 3. §3 (type badges) → confirmed already
  correct in `typeColors.js`, no task needed (documented in the spec's
  "What stays as-is" section). §4 (font/glyph fix) → root-caused to DB data
  encoding, not font/CSS, in the spec; fixed at the source by Task 6 (stop
  reading the corrupted columns) and Task 8 (repair the dump itself). §5
  (stat formatting) → Task 7. §6 (height/weight/category/abilities/gender)
  → Task 5. §7 (evolution chain + requirements) → Tasks 4, 5, 7. §8/§9
  (visual polish/responsiveness) → no code changes needed; the existing
  component already implements the grid/flex layout the spec describes,
  confirmed by reading `pokemonDetail.jsx` in full during planning. §10
  (architecture audit) → captured in the spec's "Problem" section. §11
  (verification) → Task 6 Step 4 manual smoke test plus each task's own
  unit tests. §12 (don't cheat) → every weakness/requirement/stat in this
  plan traces to a live PokéAPI field, never a hardcoded per-species value.
- **Placeholder scan:** no task contains "TBD", "handle appropriately", or
  unshown code; Task 8's script is explicitly scoped to a one-off local
  script (not part of the runtime) because it edits a static SQL dump file,
  not application logic.
- **Type consistency:** `pokemonDetailService.getPokemonDetail` return
  shape (Task 5) matches exactly what the route returns (Task 6) and what
  `pokemonDetail.jsx` (Task 7) reads (`stats` keyed by PokéAPI slugs,
  `requirement` on both the top-level response and each evolution entry).
  `createTypeEffectivenessService({ client }).getWeaknesses` (Task 3) is the
  exact call made in Task 5 — no renamed/duplicate function anywhere.
