# GBA/FRLG Redesign — Polish Batch Phase 12: Pokédex Stat Bars + Resistance/Immunity Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the Pokédex half of the original design spec's audit (Section 1: "Pokédex stat bars are literal rounded-pill CSS progress bars," Section 7: needs a segmented pixel-block bar and a resistance/immunity panel) — deferred out of the Core batch on purpose (the user's original "Core-first, defer polish" decomposition) and flagged again, unfixed, in the Core batch's final whole-branch review. This phase replaces the smooth rounded-pill stat bars with a segmented pixel-block meter and adds RESISTANCES/IMMUNITIES panels next to the existing WEAKNESSES panel, computed from real PokeAPI type data via the type-effectiveness service that already exists and is already tested — not invented or approximated.

**Architecture:** The backend already has everything needed except the resistance/immunity split: `backend/src/services/typeEffectiveness.js`'s `getCombinedMultipliers(types)` computes a per-type multiplier map by calling the real PokeAPI type-relations endpoint (via `client.getType`) and combining dual-type multipliers multiplicatively — this is real Gen-6+-accurate type math, not a hardcoded table, and it already powers the WEAKNESSES panel currently on screen. This phase adds one new function, `getMatchups(types)`, that partitions the same multiplier map into `{ weaknesses, resistances, immunities }` (mult > 1, 0 < mult < 1, mult === 0) instead of only exposing weaknesses, and wires it into `pokemonDetailService.getPokemonDetail()`'s existing response object. The frontend then renders two more chip panels (matching the existing WEAKNESSES panel's exact markup/style) and replaces `pokemonDetail.jsx`'s rounded-pill stat-bar `<div>` with a small segmented-block meter — a new, additive CSS component, since no segmented-bar pattern exists elsewhere in this codebase to reuse (the closest analog, `.gba-party-row-bar-track` in the battle screen, is a smooth-fill bar, not segmented, and belongs to the battle screen's separate cream/olive visual language, not the Pokédex page's LCD-screen language — see Ruling 1).

**Tech Stack:** No new dependency. Backend: existing `node:test`/`node:assert/strict` convention (`typeEffectiveness.test.js`, `pokemonDetailService.test.js` already use real service instances against a fake PokeAPI client, per Ruling 2). Frontend: plain React + Tailwind utility classes + this page's existing inline-style-driven CSS-variable pattern (`var(--lcd-ink)` etc.) — no new frontend test framework.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 1 (audit), Section 7 ("Pokédex"). Also closes Finding #1 from the Core batch's final whole-branch review (parked at the time, Ruling: "Polish-batch scope, not Core-batch").

## Rulings (made during planning, binding on this plan)

1. **"Preserve GBA visual language" means preserve THIS PAGE's existing LCD-screen retro-handheld look, not the battle screen's cream/olive panel language.** `pokemonDetail.jsx` and `frontend/src/styles/tokens.css`'s `--lcd-*` variables (`--lcd-panel`, `--lcd-ink`, `--lcd-ink-bright`, `--lcd-accent`, `--lcd-shadow`) already establish a distinct, deliberate visual identity for the Pokédex — a dark-screen, bright-ink "real Pokédex device" look — completely separate from `BattleGround.css`'s cream/olive battle-panel language, and the two were never meant to match (they're different in-universe UI surfaces: a battle screen vs. a handheld device screen). This phase's new segmented stat-bar and resistance/immunity panels use the existing `--lcd-*` variables and the existing `.dex-chip` class, not anything from `BattleGround.css`.
2. **Real data, not a hardcoded type chart.** `getMatchups` must be built on the same `getCombinedMultipliers(types)` call the existing (tested, already-shipped) `getWeaknesses` uses — which calls the real PokeAPI type-relations data through `client.getType()`, not a hand-maintained 18×18 type table. This is a correctness requirement per the user's explicit instruction to "verify against actual Pokémon data" — a bug in a hand-copied type chart would silently mislabel real Pokémon's resistances.
3. **`getWeaknesses` is kept, not removed or renamed.** It's independently unit-tested (`typeEffectiveness.test.js`) and could have other future callers. `getMatchups` is a new, additive function built from the same shared `getCombinedMultipliers` helper both already use — no duplicated type-math logic between the two.
4. **Immunity takes priority display-wise over resistance when a type is both** (impossible under multiplicative combination since 0 absorbs any further multiplication, but stated for clarity): a multiplier of exactly `0` is IMMUNITIES only, never also listed under RESISTANCES. The partition in Ruling 2's function must be mutually exclusive by construction (three buckets from one multiplier value, not overlapping checks).
5. **Segmented bar uses a fixed 10-segment scale sized to the real max base stat (255), not a per-Pokémon relative scale.** This matches `MAX_STAT = 255` already defined and used by the current smooth bar (`pokemonDetail.jsx:10`) — each segment represents 25.5 points, rounding down partial segments (a stat of 100 lights 3 of 10 segments, not 4) so the bar never visually overstates a stat, consistent with how real GBA-era stat displays under-round rather than over-round.

## Global Constraints

- Backend changes are additive only: `getWeaknesses` and `getCombinedMultipliers` keep their exact current signatures and behavior; only a new `getMatchups` function is added to `typeEffectiveness.js`, and only a new destructure + 2 new response fields are added to `pokemonDetailService.js` — no existing field in the API response is renamed or removed.
- No hardcoded 18×18 (or any size) type-effectiveness table is introduced anywhere in this diff — all matchup data must trace back to `client.getType()`'s real PokeAPI response, exactly like the existing `getWeaknesses`.
- The new segmented stat bar and the two new chip panels use only this page's existing `--lcd-*` CSS variables, `typeColor()`, and `.dex-chip` — no colors/classes borrowed from `BattleGround.css`.
- `MAX_STAT` stays `255` — the segmented bar's scale must derive from this existing constant, not a new hardcoded value.

---

### Task 1: `getMatchups` in the type-effectiveness service

**Files:**
- Modify: `backend/src/services/typeEffectiveness.js`
- Modify: `backend/src/services/typeEffectiveness.test.js`

**Interfaces:**
- Consumes: nothing new (reuses the module's own existing `getCombinedMultipliers`).
- Produces: `getMatchups(types)` → `Promise<{ weaknesses: string[], resistances: string[], immunities: string[] }>`, returned from `createTypeEffectivenessService({ client })`'s return object alongside the existing `getWeaknesses`/`getCombinedMultipliers`. Task 2 consumes this exact shape.

- [ ] **Step 1: Write the failing tests**

Add to `backend/src/services/typeEffectiveness.test.js`. The file already defines a `fakeClient(typeChart)` helper at the top (returns `{ getType: async (name) => ({ damage_relations: typeChart[name] }) }`) — reuse it exactly, do not duplicate it:

```javascript
describe("typeEffectiveness.getMatchups", () => {
  it("partitions a single type's relations into weaknesses/resistances/immunities", async () => {
    const client = fakeClient({
      electric: {
        double_damage_from: [{ name: "ground" }],
        half_damage_from: [{ name: "flying" }, { name: "steel" }],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const matchups = await svc.getMatchups(["electric"]);
    assert.deepEqual(matchups.weaknesses, ["ground"]);
    assert.deepEqual(matchups.resistances.sort(), ["flying", "steel"]);
    assert.deepEqual(matchups.immunities, []);
  });

  it("puts a type at exactly 0x in immunities, never in resistances", async () => {
    const client = fakeClient({
      ghost: {
        double_damage_from: [],
        half_damage_from: [],
        no_damage_from: [{ name: "normal" }, { name: "fighting" }],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const matchups = await svc.getMatchups(["ghost"]);
    assert.deepEqual(matchups.immunities.sort(), ["fighting", "normal"]);
    assert.equal(matchups.resistances.includes("normal"), false);
    assert.equal(matchups.resistances.includes("fighting"), false);
  });

  it("combines dual-type multipliers multiplicatively before partitioning (ground+flying cancels ground's electric weakness)", async () => {
    const client = fakeClient({
      ground: {
        double_damage_from: [{ name: "electric" }, { name: "water" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      flying: {
        double_damage_from: [],
        half_damage_from: [{ name: "electric" }],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const matchups = await svc.getMatchups(["ground", "flying"]);
    // ground alone is 2x weak to electric; flying alone is 0.5x resistant to
    // electric; combined multiplicatively that's 2 * 0.5 = 1x -- neutral,
    // so electric must appear in neither bucket.
    assert.equal(matchups.weaknesses.includes("electric"), false);
    assert.equal(matchups.resistances.includes("electric"), false);
    assert.deepEqual(matchups.weaknesses.sort(), ["water"]);
  });

  it("getWeaknesses and getMatchups.weaknesses agree for the same types (no duplicated logic drift)", async () => {
    const client = fakeClient({
      "type-a": {
        double_damage_from: [{ name: "type-b" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      "type-b": {
        double_damage_from: [],
        half_damage_from: [],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["type-a", "type-b"]);
    const matchups = await svc.getMatchups(["type-a", "type-b"]);
    assert.deepEqual(weaknesses.sort(), matchups.weaknesses.sort());
  });
});
```

(`fakeClient` here is the module's existing top-level helper — same one the `getWeaknesses` describe block above already uses.)

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && node --test src/services/typeEffectiveness.test.js`

Expected: FAIL — `getMatchups` is not a function.

- [ ] **Step 3: Implement `getMatchups`**

In `backend/src/services/typeEffectiveness.js`, add (immediately after `getWeaknesses`, before the `return` statement):

```javascript
  async function getMatchups(types) {
    const multiplier = await getCombinedMultipliers(types);
    const weaknesses = [];
    const resistances = [];
    const immunities = [];
    for (const [name, value] of multiplier.entries()) {
      if (value === 0) immunities.push(name);
      else if (value < 1) resistances.push(name);
      else if (value > 1) weaknesses.push(name);
    }
    return { weaknesses, resistances, immunities };
  }
```

and change the return statement from:

```javascript
  return { getWeaknesses, getCombinedMultipliers };
```

to:

```javascript
  return { getWeaknesses, getMatchups, getCombinedMultipliers };
```

- [ ] **Step 4: Run the tests again to verify they pass**

Run: `cd backend && node --test src/services/typeEffectiveness.test.js`

Expected: PASS, all prior tests plus the 4 new ones green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/typeEffectiveness.js backend/src/services/typeEffectiveness.test.js
git commit -m "feat: add getMatchups to type-effectiveness service (weaknesses/resistances/immunities)"
```

---

### Task 2: Wire `getMatchups` into `pokemonDetailService` and the API response

**Files:**
- Modify: `backend/src/services/pokemonDetailService.js`
- Modify: `backend/src/services/pokemonDetailService.test.js`

**Interfaces:**
- Consumes: `typeEffectiveness.getMatchups(types)` from Task 1, exact shape `{ weaknesses, resistances, immunities }`.
- Produces: `getPokemonDetail(id)`'s returned object gains 2 new fields, `resistances: string[]` and `immunities: string[]`, alongside the existing `weaknesses: string[]`. Task 3 (frontend) consumes these 3 fields by these exact names.

- [ ] **Step 1: Write the failing test**

Add to `backend/src/services/pokemonDetailService.test.js`, next to the existing `"uses the typeEffectiveness service for weaknesses, not any local table"` test. The file already defines a module-local `fakeClient()` helper (no arguments; its `getType` always returns a fixture where `double_damage_from: [{ name: "ground" }]`, regardless of which type name is queried) — reuse it exactly:

```javascript
it("includes resistances and immunities alongside weaknesses, from the same typeEffectiveness service", async () => {
  const client = fakeClient();
  const svc = createPokemonDetailService({ client, typeEffectiveness: createTypeEffectivenessService({ client }) });
  const detail = await svc.getPokemonDetail(25);
  assert.deepEqual(detail.weaknesses, ["ground"]);
  assert.deepEqual(detail.resistances, []);
  assert.deepEqual(detail.immunities, []);
});
```

(This fixture's `getType` always returns the same ground-weakness-only relation regardless of the queried type name, so `resistances`/`immunities` are empty here by construction — Task 1's own test suite is where the resistance/immunity partitioning logic itself gets exercised with varied fixtures. This test only confirms `pokemonDetailService` correctly plumbs all 3 fields through from `getMatchups` into the API response.)

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && node --test src/services/pokemonDetailService.test.js`

Expected: FAIL — `detail.resistances` is `undefined`, `Array.isArray(undefined)` is `false`.

- [ ] **Step 3: Wire it in**

In `backend/src/services/pokemonDetailService.js`, change:

```javascript
    const weaknesses = await typeEffectiveness.getWeaknesses(types);

    return {
```

to:

```javascript
    const { weaknesses, resistances, immunities } = await typeEffectiveness.getMatchups(types);

    return {
```

and add `resistances,` and `immunities,` to the returned object, immediately after the existing `weaknesses,` line:

```javascript
      weaknesses,
      resistances,
      immunities,
    };
```

- [ ] **Step 4: Run the tests again to verify they pass**

Run: `cd backend && node --test src/services/pokemonDetailService.test.js`

Expected: PASS, all prior tests (including the existing weaknesses-only test, which must still pass unmodified since `weaknesses`' value/shape didn't change) plus the new one green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pokemonDetailService.js backend/src/services/pokemonDetailService.test.js
git commit -m "feat: include resistances and immunities in the Pokemon detail API response"
```

---

### Task 3: Frontend — resistance/immunity panels + segmented stat bar

**Files:**
- Modify: `frontend/src/pages/Pokedex/pokemonDetail.jsx`
- Modify: `frontend/src/styles/tokens.css` (new `.dex-stat-bar*` rules, added near the existing `.dex-chip` rule)

**Interfaces:**
- Consumes: `pokemon.resistances`, `pokemon.immunities` (Task 2's new API fields), `pokemon.weaknesses` (existing), `MAX_STAT` (existing constant, `pokemonDetail.jsx:10`), `typeColor()` (existing util), `.dex-chip` (existing CSS class).
- Produces: nothing new for later tasks — this is the last task in this phase.

- [ ] **Step 1: Add RESISTANCES and IMMUNITIES panels**

Re-verify the current WEAKNESSES panel block with `grep -n "WEAKNESSES" -A40 frontend/src/pages/Pokedex/pokemonDetail.jsx` before editing (line numbers shift; the block is quoted in this plan's Architecture investigation as roughly lines 276-312, but re-confirm).

Immediately after the existing WEAKNESSES `<div>` block's closing tags (i.e., right after the block that renders `pokemon.weaknesses`, still inside the same parent flex/grid container the TYPE and WEAKNESSES panels already share), add two more panels following the exact same structure (copy the WEAKNESSES block twice, changing only the heading text and the data field read):

```jsx
            {/* Resistances */}
            <div>
              <h2
                className="font-pixel text-[0.7rem] mb-4"
                style={{ color: "var(--lcd-ink-bright)" }}
              >
                RESISTANCES
              </h2>
              <div className="flex justify-center gap-3 flex-wrap">
                {pokemon.resistances && pokemon.resistances.length > 0 ? (
                  pokemon.resistances.map((r) => (
                    <span
                      key={r}
                      className="dex-chip"
                      style={{
                        backgroundColor: typeColor(r),
                        fontSize: "0.6rem",
                        padding: "0.4rem 0.7rem",
                      }}
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span
                    className="dex-chip"
                    style={{
                      backgroundColor: typeColor("normal"),
                      fontSize: "0.6rem",
                      padding: "0.4rem 0.7rem",
                    }}
                  >
                    None
                  </span>
                )}
              </div>
            </div>
            {/* Immunities */}
            <div>
              <h2
                className="font-pixel text-[0.7rem] mb-4"
                style={{ color: "var(--lcd-ink-bright)" }}
              >
                IMMUNITIES
              </h2>
              <div className="flex justify-center gap-3 flex-wrap">
                {pokemon.immunities && pokemon.immunities.length > 0 ? (
                  pokemon.immunities.map((i) => (
                    <span
                      key={i}
                      className="dex-chip"
                      style={{
                        backgroundColor: typeColor(i),
                        fontSize: "0.6rem",
                        padding: "0.4rem 0.7rem",
                      }}
                    >
                      {i}
                    </span>
                  ))
                ) : (
                  <span
                    className="dex-chip"
                    style={{
                      backgroundColor: typeColor("normal"),
                      fontSize: "0.6rem",
                      padding: "0.4rem 0.7rem",
                    }}
                  >
                    None
                  </span>
                )}
              </div>
            </div>
```

- [ ] **Step 2: Add the segmented-bar CSS**

In `frontend/src/styles/tokens.css`, immediately after the existing `.dex-chip` rule block (re-verify its current end line with `grep -n "^.dex-chip" -A12 frontend/src/styles/tokens.css`), add:

```css
.dex-stat-bar {
	display: flex;
	gap: 2px;
}

.dex-stat-segment {
	flex: 1 1 0;
	height: 8px;
	background: var(--lcd-shadow);
	border-radius: 1px;
}

.dex-stat-segment.filled {
	background: var(--lcd-accent);
}
```

- [ ] **Step 3: Replace the smooth rounded-pill bar with the segmented bar**

Re-verify the current stat-bar block with `grep -n "rounded-full h-2" -B3 -A15 frontend/src/pages/Pokedex/pokemonDetail.jsx` before editing.

Change:

```jsx
                    {/* Animated horizontal bar */}
                    <div
                      className="w-full rounded-full h-2 overflow-hidden"
                      style={{ background: "var(--lcd-shadow)" }}
                    >
                      <div
                        className="h-2 rounded-full transition-all duration-500 ease-in-out"
                        style={{
                          width: animateBars ? `${statPercent}%` : "0%",
                          background: "var(--lcd-accent)",
                        }}
                      />
                    </div>
```

to:

```jsx
                    {/* Segmented pixel-block bar */}
                    <div className="dex-stat-bar">
                      {Array.from({ length: 10 }, (_, i) => {
                        const filledSegments = Math.floor(statPercent / 10);
                        return (
                          <div
                            key={i}
                            className={`dex-stat-segment${animateBars && i < filledSegments ? " filled" : ""}`}
                          />
                        );
                      })}
                    </div>
```

(`statPercent` is `(stat.base_stat / MAX_STAT) * 100`, already computed one line above this block per the existing code — `Math.floor(statPercent / 10)` turns it into a 0-10 segment count, rounding down per Ruling 5. `animateBars` is the existing boolean this file already sets shortly after mount to trigger the reveal — reusing it keeps the same "bars fill in after mount" behavior the smooth version had, just via a class toggle instead of a width transition.)

- [ ] **Step 4: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 5: Static verification**

```bash
grep -n "RESISTANCES\|IMMUNITIES\|dex-stat-bar\|dex-stat-segment" frontend/src/pages/Pokedex/pokemonDetail.jsx frontend/src/styles/tokens.css
```

Expected: matches for both new panels' headings/data-mapping in `pokemonDetail.jsx`, and the 3 new CSS rules in `tokens.css`.

```bash
grep -n "rounded-full h-2\|rounded-full transition-all" frontend/src/pages/Pokedex/pokemonDetail.jsx
```

Expected: no output — the old smooth-bar markup is fully gone.

- [ ] **Step 6: Visual check**

If a live database happens to be available, open any Pokémon's detail page and confirm: TYPE/WEAKNESSES/RESISTANCES/IMMUNITIES all render as chip rows in the LCD-screen visual language; each stat now shows as a row of up to 10 small square blocks instead of a smooth rounded bar, filling left-to-right after a short mount delay (same timing as before); a dual-type Pokémon with a canceled-out weakness (e.g. Ground/Flying vs. Electric, per Task 1's test) shows Electric in none of the three panels.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Pokedex/pokemonDetail.jsx frontend/src/styles/tokens.css
git commit -m "feat: add resistance/immunity panels and segmented stat bars to Pokedex detail page"
```

---

## Phase Completion

After Task 3's review is clean, Phase 12 (Polish batch, phase 1 of 3) is done. Next: **Phase 13 — Battle animation upgrade (ATTACK/SEND_OUT)**, a separate plan written and reviewed on its own, since it requires first untangling the inner `BattlePokemonSprite` element's shared `x`-transform architecture (Phase 11's Ruling 4) before any new animation can be added there safely.
