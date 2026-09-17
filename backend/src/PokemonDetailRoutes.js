// PokemonDetailRoutes.js
const express = require("express");
const router = express.Router();
const db = require("./config/db"); // Ensure this is a promise-based connection/pool

// Utility: Wrap db.query using async/await
const queryAsync = async (query, params = []) => {
  const [rows] = await db.query(query, params);
  return rows;
};

// Recursive function to get all previous evolutions
async function getPreviousEvolutions(pokemonId) {
  const rows = await queryAsync(
    "SELECT base_pokemon_id AS id FROM Evolution WHERE evolved_pokemon_id = ?",
    [pokemonId]
  );
  let results = [];
  for (const row of rows) {
    // Get basic details for the previous evolution
    const details = await queryAsync(
      "SELECT name, img_src FROM Pokemon WHERE pokemon_id = ?",
      [row.id]
    );
    if (details.length === 0) continue;
    const typeRows = await queryAsync(
      "SELECT t.name FROM Pokemon_Type pt JOIN Type t ON pt.type_id = t.type_id WHERE pt.pokemon_id = ?",
      [row.id]
    );
    const types = typeRows.map((r) => r.name);
    // Recursively fetch any previous evolutions of this earlier stage
    const prevChain = await getPreviousEvolutions(row.id);
    // Push the entire chain in order (earliest first)
    results = [...prevChain, { id: row.id, name: details[0].name, img_src: details[0].img_src, types }, ...results];
  }
  return results;
}

// Recursive function to get all next evolutions
async function getNextEvolutions(pokemonId) {
  const rows = await queryAsync(
    "SELECT evolved_pokemon_id AS id FROM Evolution WHERE base_pokemon_id = ?",
    [pokemonId]
  );
  let results = [];
  for (const row of rows) {
    const details = await queryAsync(
      "SELECT name, img_src FROM Pokemon WHERE pokemon_id = ?",
      [row.id]
    );
    if (details.length === 0) continue;
    const typeRows = await queryAsync(
      "SELECT t.name FROM Pokemon_Type pt JOIN Type t ON pt.type_id = t.type_id WHERE pt.pokemon_id = ?",
      [row.id]
    );
    const types = typeRows.map((r) => r.name);
    // Get next evolutions for this stage
    const nextChain = await getNextEvolutions(row.id);
    // Include this evolution first, then its next evolutions
    results.push({ id: row.id, name: details[0].name, img_src: details[0].img_src, types });
    results = results.concat(nextChain);
  }
  return results;
}

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // 1. Get main Pokémon data from the Pokemon table
    const pokemonRows = await queryAsync(
      "SELECT * FROM Pokemon WHERE pokemon_id = ?",
      [id]
    );
    if (pokemonRows.length === 0) {
      return res.status(404).json({ error: "Pokémon not found" });
    }
    const pokemon = pokemonRows[0];

    // 2. Get extra details (category, flavor_text) from pokemon_species table
    const detailRows = await queryAsync(
      "SELECT category, flavor_text FROM pokemon_species WHERE pokemon_id = ?",
      [id]
    );
    const details =
      detailRows.length > 0
        ? detailRows[0]
        : { category: "", flavor_text: "" };

    // 3. Get genders from pokemon_genders table
    const genderRows = await queryAsync(
      "SELECT gender FROM pokemon_genders WHERE pokemon_id = ?",
      [id]
    );
    const genders = genderRows.map((row) => row.gender);

    // 4. Get Pokémon types by joining Pokemon_Type and Type tables
    const typeRows = await queryAsync(
      "SELECT t.name FROM Pokemon_Type pt JOIN Type t ON pt.type_id = t.type_id WHERE pt.pokemon_id = ?",
      [id]
    );
    const types = typeRows.map((row) => row.name);

    // 5. Get abilities by joining Pokemon_Ability and Ability tables
    const abilityRows = await queryAsync(
      "SELECT a.name, pa.is_hidden FROM Pokemon_Ability pa JOIN Ability a ON pa.ability_id = a.ability_id WHERE pa.pokemon_id = ?",
      [id]
    );
    
    const abilities = abilityRows
      .filter((row) => !row.is_hidden)         // Only keep rows where is_hidden is false
      .map((row) => capitalize(row.name));     // Then capitalize the ability name
      
    // 6. Get evolutions recursively:
    const previous_evolutions = await getPreviousEvolutions(id);
    const next_evolutions = await getNextEvolutions(id);

    // 7. Compute weaknesses from the type_damage_relations table.
    let weaknessSet = new Set();
    for (const typeName of types) {
      const weakRows = await queryAsync(
        `SELECT t.name FROM type_damage_relations d
         JOIN Type t ON d.attacking_type_id = t.type_id
         WHERE d.defending_type_id = (SELECT type_id FROM Type WHERE LOWER(name) = LOWER(?))
           AND d.multiplier > 1`,
        [typeName]
      );
      weakRows.forEach((row) => weaknessSet.add(row.name));
    }
    const weaknesses = Array.from(weaknessSet);

    // Build the final JSON object with all required details.
    const result = {
      id: pokemon.pokemon_id,
      name: pokemon.name,
      img_src: pokemon.img_src,
      height: pokemon.height,
      weight: pokemon.weight,
      base_experience: pokemon.base_experience,
      stats: {
        hp: pokemon.hp,
        attack: pokemon.attack,
        defense: pokemon.defense,
        special_attack: pokemon.special_attack,
        special_defense: pokemon.special_defense,
        speed: pokemon.speed,
      },
      types,
      abilities,
      details,     // { category, flavor_text }
      genders,     // array of genders (e.g., ["Male", "Female"] or ["Genderless"])
      previous_evolutions, // array of previous evolutions (if any)
      next_evolutions,     // array of next evolutions (if any)
      weaknesses,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching Pokémon detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = router;
