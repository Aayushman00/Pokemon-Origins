const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	createEvolutionService,
	createMemoryEvolutionStore,
	parseLevelRequirement,
	parseStoneToken,
	EvolutionError,
	NO_EVOLUTION_EFFECT,
	STONE_TOKEN_BY_ITEM_ID,
} = require("./evolutionService");
const {
	createPartyService,
	createMemoryPartyStore,
} = require("./partyService");
const { statAtLevel } = require("../campaign/hydrate");

// Real catalog ids (backend/data/items.json)
const FIRE_STONE = { itemId: 3, name: "Fire Stone" };
const WATER_STONE = { itemId: 4, name: "Water Stone" };
const LEAF_STONE = { itemId: 6, name: "Leaf Stone" };

// Dump-shaped Evolution rows (mirrors database/pokedex_data.sql)
const EVOLUTION_ROWS = [
	{ base_pokemon_id: 4, evolved_pokemon_id: 5, evolution_method: "level-up", evolution_condition: "Level 16" },
	{ base_pokemon_id: 5, evolved_pokemon_id: 6, evolution_method: "level-up", evolution_condition: "Level 36" },
	{ base_pokemon_id: 37, evolved_pokemon_id: 38, evolution_method: "use-item", evolution_condition: "Use fire-stone" },
	{ base_pokemon_id: 133, evolved_pokemon_id: 134, evolution_method: "use-item", evolution_condition: "Use water-stone" },
	{ base_pokemon_id: 133, evolved_pokemon_id: 135, evolution_method: "use-item", evolution_condition: "Use thunder-stone" },
	{ base_pokemon_id: 133, evolved_pokemon_id: 136, evolution_method: "use-item", evolution_condition: "Use fire-stone" },
	// Unsupported method — must be skipped, never offered or applied
	{ base_pokemon_id: 64, evolved_pokemon_id: 65, evolution_method: "trade", evolution_condition: "Trade" },
];

// Minimal species table for the lookup stub (real Gen 1 base stats)
const SPECIES = {
	4: { name: "charmander", hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 },
	5: { name: "charmeleon", hp: 58, attack: 64, defense: 58, special_attack: 80, special_defense: 65, speed: 80 },
	37: { name: "vulpix", hp: 38, attack: 41, defense: 40, special_attack: 50, special_defense: 65, speed: 65 },
	38: { name: "ninetales", hp: 73, attack: 76, defense: 75, special_attack: 81, special_defense: 100, speed: 100 },
	64: { name: "kadabra", hp: 40, attack: 35, defense: 30, special_attack: 120, special_defense: 70, speed: 105 },
	133: { name: "eevee", hp: 55, attack: 55, defense: 50, special_attack: 45, special_defense: 65, speed: 55 },
	134: { name: "vaporeon", hp: 130, attack: 65, defense: 60, special_attack: 110, special_defense: 95, speed: 65 },
};

async function lookupStub(pokemonId) {
	const species = SPECIES[Number(pokemonId)];
	if (!species) throw new Error(`No fixture species ${pokemonId}`);
	return { pokemon_id: Number(pokemonId), ...species };
}

function monRow(overrides = {}) {
	return {
		pokemon_id: 4,
		nickname: "Charmander",
		level: 16,
		experience: 40,
		current_hp: 30,
		max_hp: 60,
		attack: 30,
		defense: 25,
		speed: 28,
		special_atk: 27,
		special_def: 24,
		status: "Healthy",
		...overrides,
	};
}

function makeFixture({ party = [monRow({ position: 1 })] } = {}) {
	const partyStore = createMemoryPartyStore({ 5: party });
	const partyService = createPartyService({ store: partyStore });
	const evolution = createEvolutionService({
		store: createMemoryEvolutionStore(EVOLUTION_ROWS),
		lookup: lookupStub,
		party: partyService,
	});
	return { evolution, partyService };
}

describe("evolutionService", () => {
	it("parses dump-format conditions and skips garbage", () => {
		assert.equal(parseLevelRequirement("Level 16"), 16);
		assert.equal(parseLevelRequirement("level 7"), 7);
		assert.equal(parseLevelRequirement("Trade"), null);
		assert.equal(parseStoneToken("Use fire-stone"), "fire-stone");
		assert.equal(parseStoneToken("Use moon-stone"), "moon-stone");
		assert.equal(parseStoneToken("Level 16"), null);
		// items.json stones all map to a condition token
		assert.deepEqual(Object.values(STONE_TOKEN_BY_ITEM_ID).sort(), [
			"fire-stone",
			"leaf-stone",
			"thunder-stone",
			"water-stone",
		]);
	});

	it("findLevelEvolution honors the threshold and skips unsupported methods", async () => {
		const { evolution } = makeFixture();
		assert.equal(await evolution.findLevelEvolution(4, 15), null);
		assert.deepEqual(await evolution.findLevelEvolution(4, 16), {
			evolvedPokemonId: 5,
			requiredLevel: 16,
		});
		assert.deepEqual(await evolution.findLevelEvolution(4, 40), {
			evolvedPokemonId: 5,
			requiredLevel: 16,
		});
		// Kadabra only has a trade row — never offered
		assert.equal(await evolution.findLevelEvolution(64, 99), null);
		// Eevee has no level-up rule at all
		assert.equal(await evolution.findLevelEvolution(133, 99), null);
	});

	it("lists pending evolutions only for party members at threshold", async () => {
		const { evolution } = makeFixture({
			party: [
				monRow({ position: 1, level: 16 }),
				monRow({
					position: 2,
					pokemon_id: 133,
					nickname: "Eevee",
					level: 30,
				}),
				monRow({ position: 3, level: 10, nickname: "Char2" }),
			],
		});
		const pending = await evolution.getPendingEvolutions(5);
		assert.equal(pending.length, 1);
		assert.deepEqual(pending[0], {
			position: 1,
			nickname: "Charmander",
			level: 16,
			fromPokemonId: 4,
			toPokemonId: 5,
			toName: "Charmeleon",
			requiredLevel: 16,
		});
	});

	it("confirm applies species change with hydrate-delta stats and persists", async () => {
		const row = monRow({ position: 1, level: 16 });
		const { evolution, partyService } = makeFixture({ party: [row] });
		const result = await evolution.confirmLevelEvolution(5, 1);

		const delta = (key, isHp = false) =>
			statAtLevel(SPECIES[5][key], 16, isHp) -
			statAtLevel(SPECIES[4][key], 16, isHp);

		assert.equal(result.fromPokemonId, 4);
		assert.equal(result.toPokemonId, 5);
		assert.equal(result.toName, "Charmeleon");
		assert.equal(result.level, 16);
		assert.equal(result.stats.max_hp, row.max_hp + delta("hp", true));
		assert.equal(result.stats.attack, row.attack + delta("attack"));
		assert.equal(result.stats.defense, row.defense + delta("defense"));
		assert.equal(result.stats.speed, row.speed + delta("speed"));
		assert.equal(
			result.stats.special_atk,
			row.special_atk + delta("special_attack")
		);
		assert.equal(
			result.stats.special_def,
			row.special_def + delta("special_defense")
		);
		// current_hp grows by the max_hp delta only (no free heal)
		assert.equal(result.stats.current_hp, row.current_hp + delta("hp", true));

		// Persisted for the next battle start snapshot
		const [saved] = await partyService.getPartyRows(5);
		assert.equal(saved.pokemon_id, 5);
		assert.equal(saved.nickname, "Charmeleon"); // default name follows species
		assert.equal(saved.max_hp, result.stats.max_hp);
		assert.equal(saved.attack, result.stats.attack);
		assert.equal(saved.level, 16); // untouched
		assert.equal(saved.experience, 40); // XP buffer untouched
	});

	it("keeps a custom nickname and never revives a fainted mon", async () => {
		const { evolution, partyService } = makeFixture({
			party: [
				monRow({ position: 1, level: 20, nickname: "Blaze", current_hp: 0 }),
			],
		});
		const result = await evolution.confirmLevelEvolution(5, 1);
		assert.equal(result.nickname, "Blaze");
		assert.equal(result.stats.current_hp, 0);
		const [saved] = await partyService.getPartyRows(5);
		assert.equal(saved.nickname, "Blaze");
		assert.equal(saved.current_hp, 0);
	});

	it("confirm below threshold or at an empty position is a 400", async () => {
		const { evolution } = makeFixture({
			party: [monRow({ position: 1, level: 15 })],
		});
		await assert.rejects(
			() => evolution.confirmLevelEvolution(5, 1),
			(err) =>
				err instanceof EvolutionError &&
				err.status === 400 &&
				/can't evolve right now/.test(err.message)
		);
		await assert.rejects(
			() => evolution.confirmLevelEvolution(5, 3),
			(err) => err.status === 400 && /No Pokémon/.test(err.message)
		);
	});

	it("stone evolution picks the branch matching the stone", async () => {
		const { evolution, partyService } = makeFixture({
			party: [
				monRow({
					position: 1,
					pokemon_id: 133,
					nickname: "Eevee",
					level: 12,
				}),
			],
		});
		const result = await evolution.evolveWithStone(5, 1, WATER_STONE);
		assert.equal(result.toPokemonId, 134); // Vaporeon, not Jolteon/Flareon
		assert.equal(result.toName, "Vaporeon");
		const [saved] = await partyService.getPartyRows(5);
		assert.equal(saved.pokemon_id, 134);
		assert.equal(saved.nickname, "Vaporeon");
	});

	it("a stone with no Evolution row for the species is NO_EVOLUTION_EFFECT", async () => {
		const { evolution, partyService } = makeFixture({
			party: [monRow({ position: 1 })], // Charmander
		});
		await assert.rejects(
			() => evolution.evolveWithStone(5, 1, FIRE_STONE),
			(err) =>
				err instanceof EvolutionError &&
				err.status === 400 &&
				err.code === NO_EVOLUTION_EFFECT
		);
		// Eevee has stone rows, but not for Leaf Stone
		const eevee = makeFixture({
			party: [monRow({ position: 1, pokemon_id: 133, nickname: "Eevee" })],
		});
		await assert.rejects(
			() => eevee.evolution.evolveWithStone(5, 1, LEAF_STONE),
			(err) => err.status === 400 && err.code === NO_EVOLUTION_EFFECT
		);
		// Nothing was persisted
		const [saved] = await partyService.getPartyRows(5);
		assert.equal(saved.pokemon_id, 4);
	});
});
