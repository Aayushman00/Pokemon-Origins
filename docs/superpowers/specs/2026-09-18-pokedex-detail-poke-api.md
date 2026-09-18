# Pokédex Detail Page: PokéAPI-Sourced Types, Weaknesses, Stats, Evolutions

## Problem

`frontend/src/pages/Pokedex/pokemonDetail.jsx` renders `GET /pokemon-detail/:id`
from `backend/src/PokemonDetailRoutes.js`, which reads a locally seeded MySQL
`pokedex` database (`database/pokedex_data.sql`). Two concrete defects were
found in that data path:

1. **Wrong weaknesses.** The route computes weaknesses with:
   ```sql
   SELECT t.name FROM type_damage_relations d
   JOIN Type t ON d.attacking_type_id = t.type_id
   WHERE d.defending_type_id = (SELECT type_id FROM Type WHERE LOWER(name) = LOWER(?))
     AND d.multiplier > 1
   ```
   run once per Pokémon type and unioned. For a dual-type Pokémon this lists an
   attacking type as a weakness if *either* of its types is weak to it, even
   when the other type resists or nullifies that same attacking type (e.g. a
   Grass/Poison mon should NOT show Poison-immune... concretely: multipliers
   from each of a mon's types must be *multiplied together* per attacking
   type, not unioned). It never considers `half_damage_from`/`no_damage_from`
   at all, so resistances and immunities never cancel a weakness.

2. **Corrupted "Pokémon" text.** `database/pokedex_data.sql` has the string
   `Pokémon` byte-mangled at the source — e.g. row 144 has
   `category = 'Mouse Pok├⌐mon'` and `flavor_text` containing `POK├⌐MON`
   (UTF-8 bytes for "é" round-tripped through a non-UTF-8 codepage, most
   likely CP437/OEM, before being committed). This is **not** a font/glyph
   problem — `frontend/index.html` already has `<meta charset="UTF-8">` and
   `frontend/src/styles/tokens.css` already declares
   `--font-pixel: "Press Start 2P", "Courier New", monospace;` with a comment
   explaining the accented-glyph fallback. The mojibake is baked into the
   `pokemon_species`/`Ability` data itself and is served verbatim to the
   client.

Per product direction, the fix is not to patch the DB data or the union
query — it's to stop treating the local MySQL dump as the source of truth for
types, weaknesses, stats, and evolutions, and instead derive them from the
official PokéAPI (https://pokeapi.co/api/v2/) at request time, the way a
production Pokédex would. PokéAPI JSON is correctly encoded UTF-8, so this
also eliminates the mojibake at its root instead of patching display text.

## What stays as-is (do not touch)

- `frontend/src/utils/typeColors.js` — already has correct colors for all 18
  types (electric gold, grass green, poison purple, ground tan, psychic
  pink) and a `typeColor()` helper already used for both type and weakness
  badges. No changes needed.
- `frontend/src/components/PokemonSprite/PokemonSprite.jsx` — sprites are
  always served from the local sprite sheet system
  (`frontend/src/sprites/pokemonSprites.js`), never from PokéAPI. Do not
  point sprites at PokéAPI images.
- `GET /pokemon` (the Pokédex grid list) and `frontend/src/pages/Pokedex/pokedex.jsx`
  — out of scope; only the detail page (`/pokemon-detail/:id` and
  `pokemonDetail.jsx`) is affected.
- Frontend MAX_STAT scaling (255), the stats grid alignment
  (`gridTemplateColumns: "4.5rem 2.5rem 1fr"`), and the overall retro Pokédex
  visual language — already correct/acceptable, keep as-is.

## Required behavior

### Data flow

```
Pokémon (GET /api/v2/pokemon/{id})
  -> types[]
  -> for each type: GET /api/v2/type/{type} -> damage_relations
  -> combine multipliers per attacking type across all of the mon's types
     (multiply, don't union) -> weaknesses = types with combined multiplier > 1
Species (GET /api/v2/pokemon-species/{id})
  -> flavor_text, genus ("category"), gender_rate, evolution_chain.url
Evolution chain (GET the species' evolution_chain.url)
  -> flattened previous/next evolution stages with per-edge requirement
     text derived from evolution_details (level, item, trade, friendship, ...)
```

### Type effectiveness

For a Pokémon with types `T = [t1, t2, ...]`, and for every one of the 18
official types `A` as a potential attacker:

```
multiplier(A) = product over t in T of relation(A -> t)
```

where `relation(A -> t)` is `2` if `A` is in `t`'s `double_damage_from`,
`0.5` if in `half_damage_from`, `0` if in `no_damage_from`, else `1`.
Classification: `multiplier > 1` -> weakness (displayed), `== 1` -> neutral,
`< 1` -> resistance, `0` -> immunity. Only weaknesses are displayed, matching
the current UI.

This logic must live in exactly one reusable module and be used by the one
place that needs it (the detail route/service) — no duplicate weakness math
anywhere else.

### Stats

PokéAPI stat slugs (`hp`, `attack`, `defense`, `special-attack`,
`special-defense`, `speed`) must map to display labels (`HP`, `Attack`,
`Defense`, `Sp. Atk`, `Sp. Def`, `Speed`) through one reusable
formatter/lookup, never inline special-casing in JSX.

### Height/weight/category/gender/abilities

- height: PokéAPI decimetres -> metres (`/10`).
- weight: PokéAPI hectograms -> kilograms (`/10`).
- category: species `genera` entry where `language.name === "en"`.
- gender: derived from species `gender_rate` (-1 = genderless, 0 = always
  male, 8 = always female, else both).
- abilities: Pokémon endpoint `abilities[]` where `is_hidden === false`,
  slug formatted to Title Case with spaces (`lightning-rod` -> "Lightning
  Rod").

### Evolutions

Flatten the evolution chain relative to the requested Pokémon into
`previous_evolutions` (oldest first) and `next_evolutions` (each branch's
full subtree, siblings concatenated — this already matches how the frontend
special-cases Eevee by checking `chain[0].id === 133`). Each entry's
`requirement` is the human-readable label for the edge *leading into that
entry* (level, item, friendship, trade, or `null` when nothing meaningful
applies) — derived from `evolution_details`, never hardcoded per-species.

### Errors

A PokéAPI request failure must not crash the page — surface a retryable
error state (the frontend's existing loading/error UI already supports
this via `fetchData`/`error` — reuse it, don't add a new error path).

## Verification

Manually check via the running app: Pikachu (Electric, weak to Ground
only), Bulbasaur (Grass/Poison, weaknesses computed from the combined
chart, not the current DB list), Charmander (Fire), Squirtle (Water), and
one dual-type mon whose multipliers actually cancel (e.g. Bulbasaur is
Grass/Poison: Grass is weak to Poison ×2 while Poison resists... concretely
just confirm the printed weakness list matches
https://pokeapi.co/api/v2/type/grass and .../poison combined, not the old
DB list). Confirm "Pokémon"/genus/flavor text render cleanly with no
`├`, `⌐`, `Ã©` artifacts anywhere on the page.
