const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	createInventoryService,
	createMemoryInventoryStore,
	InventoryError,
	loadItemCatalog,
} = require("./inventoryService");
const {
	createPartyService,
	createMemoryPartyStore,
} = require("./partyService");
const {
	createEvolutionService,
	createMemoryEvolutionStore,
	NO_EVOLUTION_EFFECT,
} = require("./evolutionService");

// Real catalog ids (backend/data/items.json)
const POTION = 1;
const SUPER_POTION = 2;
const FIRE_STONE = 3;
const WATER_STONE = 4;

// Dump-shaped Evolution fixture: Vulpix + fire-stone → Ninetales
const EVOLUTION_ROWS = [
	{
		base_pokemon_id: 37,
		evolved_pokemon_id: 38,
		evolution_method: "use-item",
		evolution_condition: "Use fire-stone",
	},
];

const SPECIES = {
	4: { name: "charmander", hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 },
	37: { name: "vulpix", hp: 38, attack: 41, defense: 40, special_attack: 50, special_defense: 65, speed: 65 },
	38: { name: "ninetales", hp: 73, attack: 76, defense: 75, special_attack: 81, special_defense: 100, speed: 100 },
};

async function lookupStub(pokemonId) {
	const species = SPECIES[Number(pokemonId)];
	if (!species) throw new Error(`No fixture species ${pokemonId}`);
	return { pokemon_id: Number(pokemonId), ...species };
}

function partyRow(overrides = {}) {
	return {
		pokemon_id: 4,
		nickname: "Charmander",
		level: 5,
		current_hp: 20,
		max_hp: 39,
		attack: 12,
		defense: 11,
		speed: 13,
		special_atk: 12,
		special_def: 11,
		experience: 0,
		status: "Healthy",
		...overrides,
	};
}

function makeFixture({ bag = {}, party = [partyRow({ position: 1 })] } = {}) {
	const partyStore = createMemoryPartyStore({ 5: party });
	const partyService = createPartyService({ store: partyStore });
	const evolution = createEvolutionService({
		store: createMemoryEvolutionStore(EVOLUTION_ROWS),
		lookup: lookupStub,
		party: partyService,
	});
	const store = createMemoryInventoryStore({ 5: bag });
	const inventory = createInventoryService({
		store,
		party: partyService,
		evolution,
	});
	return { inventory, partyService, store };
}

describe("inventoryService", () => {
	it("catalog loads the Phase 7 items with context rules", () => {
		const catalog = loadItemCatalog();
		const potion = catalog.get(POTION);
		assert.equal(potion.name, "Potion");
		assert.equal(potion.healAmount, 20);
		assert.equal(potion.usableInBattle, true);
		assert.equal(potion.usableOverworld, true);
		const stone = catalog.get(FIRE_STONE);
		assert.equal(stone.category, "evolution_stone");
		assert.equal(stone.usableInBattle, false);
		assert.equal(stone.usableOverworld, true);
	});

	it("getInventory merges catalog data with owned quantities", async () => {
		const { inventory } = makeFixture({
			bag: { [POTION]: 3, [FIRE_STONE]: 1 },
		});
		const items = await inventory.getInventory(5);
		assert.equal(items.length, 2);
		const [potion, stone] = items;
		assert.deepEqual(
			{ itemId: potion.itemId, name: potion.name, quantity: potion.quantity },
			{ itemId: POTION, name: "Potion", quantity: 3 }
		);
		assert.equal(potion.usableInBattle, true);
		assert.equal(potion.healAmount, 20);
		assert.equal(stone.name, "Fire Stone");
		assert.equal(stone.usableInBattle, false);
	});

	it("addItem rejects unknown items and non-positive quantities", async () => {
		const { inventory } = makeFixture();
		await assert.rejects(
			() => inventory.addItem(5, 999, 1),
			(err) => err instanceof InventoryError && err.status === 400
		);
		await assert.rejects(
			() => inventory.addItem(5, POTION, 0),
			(err) => err.status === 400
		);
		await inventory.addItem(5, POTION, 2);
		assert.equal(await inventory.getQuantity(5, POTION), 2);
	});

	it("overworld potion heals the target and consumes one item", async () => {
		const { inventory, partyService } = makeFixture({
			bag: { [POTION]: 2 },
			party: [partyRow({ position: 1, current_hp: 10, max_hp: 39 })],
		});
		const result = await inventory.useItemOverworld(5, {
			itemId: POTION,
			partyPosition: 1,
		});
		assert.equal(result.amount, 20);
		assert.deepEqual(result.pokemon, {
			position: 1,
			nickname: "Charmander",
			current_hp: 30,
			max_hp: 39,
		});
		assert.equal(result.items[0].quantity, 1);

		const rows = await partyService.getPartyRows(5);
		assert.equal(rows[0].current_hp, 30); // persisted
		assert.equal(await inventory.getQuantity(5, POTION), 1);
	});

	it("overworld heal clamps at max_hp", async () => {
		const { inventory, partyService } = makeFixture({
			bag: { [SUPER_POTION]: 1 },
			party: [partyRow({ position: 1, current_hp: 30, max_hp: 39 })],
		});
		const result = await inventory.useItemOverworld(5, {
			itemId: SUPER_POTION,
			partyPosition: 1,
		});
		assert.equal(result.amount, 9); // 50 available, 9 applied
		assert.equal(result.pokemon.current_hp, 39);
		const rows = await partyService.getPartyRows(5);
		assert.equal(rows[0].current_hp, 39);
	});

	it("cannot use an item with zero quantity or an unknown item", async () => {
		const { inventory } = makeFixture({ bag: {} });
		await assert.rejects(
			() => inventory.useItemOverworld(5, { itemId: POTION, partyPosition: 1 }),
			(err) => err.status === 400 && /don't have/.test(err.message)
		);
		await assert.rejects(
			() => inventory.useItemOverworld(5, { itemId: 999, partyPosition: 1 }),
			(err) => err.status === 400 && /Unknown item/.test(err.message)
		);
	});

	it("healing requires a valid, non-fainted, non-full target", async () => {
		const { inventory } = makeFixture({
			bag: { [POTION]: 5 },
			party: [
				partyRow({ position: 1, current_hp: 39, max_hp: 39 }),
				partyRow({
					position: 2,
					nickname: "Squirtle",
					current_hp: 0,
					max_hp: 40,
				}),
			],
		});
		await assert.rejects(
			() => inventory.useItemOverworld(5, { itemId: POTION }),
			(err) => err.status === 400 && /Choose a Pokémon/.test(err.message)
		);
		await assert.rejects(
			() => inventory.useItemOverworld(5, { itemId: POTION, partyPosition: 3 }),
			(err) => err.status === 400 && /No Pokémon/.test(err.message)
		);
		await assert.rejects(
			() => inventory.useItemOverworld(5, { itemId: POTION, partyPosition: 2 }),
			(err) => err.status === 400 && /fainted/.test(err.message)
		);
		await assert.rejects(
			() => inventory.useItemOverworld(5, { itemId: POTION, partyPosition: 1 }),
			(err) => err.status === 400 && /already at full HP/.test(err.message)
		);
		// None of the rejections consumed anything
		assert.equal(await inventory.getQuantity(5, POTION), 5);
	});

	it("fire stone on Vulpix evolves it and consumes the stone (Phase 9)", async () => {
		const { inventory, partyService } = makeFixture({
			bag: { [FIRE_STONE]: 2 },
			party: [
				partyRow({
					position: 1,
					pokemon_id: 37,
					nickname: "Vulpix",
					level: 12,
				}),
			],
		});
		const result = await inventory.useItemOverworld(5, {
			itemId: FIRE_STONE,
			partyPosition: 1,
		});
		assert.equal(result.evolved.fromPokemonId, 37);
		assert.equal(result.evolved.toPokemonId, 38);
		assert.equal(result.evolved.toName, "Ninetales");
		// Consumed AFTER the evolution persisted
		assert.equal(await inventory.getQuantity(5, FIRE_STONE), 1);
		assert.equal(result.items[0].quantity, 1);
		const [saved] = await partyService.getPartyRows(5);
		assert.equal(saved.pokemon_id, 38);
		assert.equal(saved.nickname, "Ninetales");
	});

	it("a stone the species can't use is rejected and NOT consumed", async () => {
		// Water Stone on Vulpix: mapped item, but no Evolution row
		const { inventory, partyService } = makeFixture({
			bag: { [WATER_STONE]: 1 },
			party: [
				partyRow({
					position: 1,
					pokemon_id: 37,
					nickname: "Vulpix",
					level: 12,
				}),
			],
		});
		await assert.rejects(
			() =>
				inventory.useItemOverworld(5, {
					itemId: WATER_STONE,
					partyPosition: 1,
				}),
			(err) =>
				err.status === 400 &&
				err.code === NO_EVOLUTION_EFFECT &&
				/won't have any effect/.test(err.message)
		);
		assert.equal(await inventory.getQuantity(5, WATER_STONE), 1);
		const [saved] = await partyService.getPartyRows(5);
		assert.equal(saved.pokemon_id, 37); // unchanged
	});

	it("stone use requires a party target and a real position", async () => {
		const { inventory } = makeFixture({ bag: { [FIRE_STONE]: 1 } });
		await assert.rejects(
			() => inventory.useItemOverworld(5, { itemId: FIRE_STONE }),
			(err) =>
				err instanceof InventoryError &&
				err.status === 400 &&
				/Choose a Pokémon/.test(err.message)
		);
		await assert.rejects(
			() =>
				inventory.useItemOverworld(5, { itemId: FIRE_STONE, partyPosition: 3 }),
			(err) => err.status === 400 && /No Pokémon/.test(err.message)
		);
		assert.equal(await inventory.getQuantity(5, FIRE_STONE), 1);
	});

	it("consume is atomic and never goes below zero", async () => {
		const { inventory } = makeFixture({ bag: { [POTION]: 1 } });
		assert.equal(await inventory.consumeItem(5, POTION), true);
		assert.equal(await inventory.consumeItem(5, POTION), false);
		assert.equal(await inventory.getQuantity(5, POTION), 0);
	});

	it("quantities are per trainer", async () => {
		const { inventory } = makeFixture({ bag: { [POTION]: 2 } });
		assert.equal(await inventory.getQuantity(5, POTION), 2);
		assert.equal(await inventory.getQuantity(6, POTION), 0);
		assert.deepEqual(await inventory.getInventory(6), []);
	});
});
