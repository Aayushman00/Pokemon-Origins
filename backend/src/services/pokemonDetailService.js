const { slugToTitleCase } = require("../utils/formatSlug");

/**
 * Evolution chain data lives in the SQL pokedex (Evolution/Pokemon/Pokemon_Type),
 * which only has the 151 project Pokémon — unlike PokeAPI's chain endpoint,
 * this can never surface a later-gen species.
 */
function createMysqlEvolutionGraphStore(pool) {
  return {
    async getAllEvolutions() {
      const [rows] = await pool.query(
        `SELECT base_pokemon_id, evolved_pokemon_id, evolution_method, evolution_condition FROM Evolution`
      );
      return rows;
    },
    async getPokemon(pokemonId) {
      const [rows] = await pool.query(
        `SELECT pokemon_id, name FROM Pokemon WHERE pokemon_id = ?`,
        [pokemonId]
      );
      return rows[0] || null;
    },
    async getTypesFor(pokemonId) {
      const [rows] = await pool.query(
        `SELECT t.name FROM Pokemon_Type pt
         JOIN Type t ON pt.type_id = t.type_id
         WHERE pt.pokemon_id = ?`,
        [pokemonId]
      );
      return rows.map((r) => String(r.name).toLowerCase());
    },
  };
}

/** DB evolution_condition is already human text ("Level 16", "Use fire-stone"). */
function formatDbEvolutionRequirement(row) {
  if (!row) return null;
  const method = String(row.evolution_method || "");
  const condition = String(row.evolution_condition || "").trim();

  if (method === "level-up") {
    const match = /level\s*(\d+)/i.exec(condition);
    return match ? `Lv. ${match[1]}` : condition ? slugToTitleCase(condition) : "Level Up";
  }
  if (method === "use-item") {
    const match = /use\s+([a-z-]+)/i.exec(condition);
    return match ? slugToTitleCase(match[1]) : "Use Item";
  }
  if (method === "trade") return "Trade";
  return condition ? slugToTitleCase(condition) : method ? slugToTitleCase(method) : null;
}

/** Walks the Evolution table to the chain's root, then rebuilds it forward. */
async function buildEvolutionGraph(evolutionStore, rootPokemonId) {
  const rows = await evolutionStore.getAllEvolutions();
  const byEvolved = new Map();
  const byBase = new Map();
  for (const row of rows) {
    byEvolved.set(Number(row.evolved_pokemon_id), row);
    const siblings = byBase.get(Number(row.base_pokemon_id)) || [];
    siblings.push(row);
    byBase.set(Number(row.base_pokemon_id), siblings);
  }

  let rootId = Number(rootPokemonId);
  while (byEvolved.has(rootId)) {
    rootId = Number(byEvolved.get(rootId).base_pokemon_id);
  }

  async function nodeFor(id, requirement) {
    const [pokemon, types] = await Promise.all([
      evolutionStore.getPokemon(id),
      evolutionStore.getTypesFor(id),
    ]);
    const children = await Promise.all(
      (byBase.get(id) || []).map((row) =>
        nodeFor(Number(row.evolved_pokemon_id), formatDbEvolutionRequirement(row))
      )
    );
    return { id, name: pokemon?.name, types, requirement, children };
  }

  return nodeFor(rootId, null);
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

function createPokemonDetailService({ client, typeEffectiveness, evolutionStore = null }) {
  function getEvolutionStore() {
    if (!evolutionStore) {
      // Lazy so requiring this module never opens a DB connection.
      evolutionStore = createMysqlEvolutionGraphStore(require("../config/db"));
    }
    return evolutionStore;
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

    const rootNode = await buildEvolutionGraph(getEvolutionStore(), pokemon.id);
    const path = findPathToId(rootNode, Number(pokemon.id)) || [rootNode];
    const currentNode = path[path.length - 1];
    const previous_evolutions = path.slice(0, -1).map((n) => ({
      id: n.id, name: n.name, types: n.types, requirement: n.requirement,
    }));
    const next_evolutions = flattenNext(currentNode);

    const { weaknesses, resistances, immunities } = await typeEffectiveness.getMatchups(types);

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
      resistances,
      immunities,
    };
  }

  return { getPokemonDetail };
}

module.exports = { createPokemonDetailService };
