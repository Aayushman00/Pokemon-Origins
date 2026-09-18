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
