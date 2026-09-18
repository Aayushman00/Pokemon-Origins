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
