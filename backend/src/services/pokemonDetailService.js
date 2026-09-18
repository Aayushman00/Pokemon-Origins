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
