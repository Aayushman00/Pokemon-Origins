const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	createMartService,
	createMemoryMartStore,
	MartError,
	MART_LOCKED,
	INSUFFICIENT_FUNDS,
	loadMartConfig,
} = require("./martService");
const {
	createWalletService,
	createMemoryWalletStore,
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
} = require("./walletService");
const {
	createInventoryService,
	createMemoryInventoryStore,
} = require("./inventoryService");
const {
	createPartyService,
	createMemoryPartyStore,
} = require("./partyService");
const {
	createEvolutionService,
	createMemoryEvolutionStore,
} = require("./evolutionService");

// Real catalog/mart ids (backend/data/items.json + mart.json)
const POTION = 1; // 100 coins
const FIRE_STONE = 3; // 800 coins
const LEAF_STONE = 6; // in items.json but NOT sold by the mart

const TRAINER = 7;

/**
 * Real wallet/inventory/mart services on memory stores. `unlockedLevel`
 * stubs progress (2 = boss completed → mart open). `breakInventory`
 * makes the inventory credit fail to exercise the purchase rollback.
 * A one-Vulpix party + fixture Evolution rows back the mart→stone→evolve
 * end-to-end test.
 */
function makeMart({
	unlockedLevel = 2,
	coins,
	bag = {},
	breakInventory = false,
} = {}) {
	const walletStore = createMemoryWalletStore(
		coins != null ? { [TRAINER]: coins } : {}
	);
	const wallet = createWalletService({ store: walletStore });
	const partyService = createPartyService({
		store: createMemoryPartyStore({
			[TRAINER]: [
				{
					position: 1,
					pokemon_id: 37,
					nickname: "Vulpix",
					level: 12,
					experience: 0,
					current_hp: 30,
					max_hp: 34,
					attack: 14,
					defense: 14,
					speed: 18,
					special_atk: 16,
					special_def: 19,
					status: "Healthy",
				},
			],
		}),
	});
	const evolution = createEvolutionService({
		store: createMemoryEvolutionStore([
			{
				base_pokemon_id: 37,
				evolved_pokemon_id: 38,
				evolution_method: "use-item",
				evolution_condition: "Use fire-stone",
			},
		]),
		lookup: async (pokemonId) => {
			const species = {
				37: { name: "vulpix", hp: 38, attack: 41, defense: 40, special_attack: 50, special_defense: 65, speed: 65 },
				38: { name: "ninetales", hp: 73, attack: 76, defense: 75, special_attack: 81, special_defense: 100, speed: 100 },
			}[Number(pokemonId)];
			if (!species) throw new Error(`No fixture species ${pokemonId}`);
			return { pokemon_id: Number(pokemonId), ...species };
		},
		party: partyService,
	});
	const inventoryStore = createMemoryInventoryStore({ [TRAINER]: bag });
	const inventory = createInventoryService({
		store: inventoryStore,
		party: partyService,
		evolution,
	});
	const purchaseInventoryStore = breakInventory
		? {
				...inventoryStore,
				add: async () => {
					throw new Error("simulated inventory failure");
				},
		  }
		: inventoryStore;
	const mart = createMartService({
		progress: {
			getProgress: async () => ({ unlocked_level: unlockedLevel }),
		},
		wallet,
		inventory,
		store: createMemoryMartStore({
			wallet: walletStore,
			inventory: purchaseInventoryStore,
		}),
	});
	return { mart, wallet, inventory, partyService };
}

describe("walletService", () => {
	it("lazy-inits the wallet with the starting balance", async () => {
		const wallet = createWalletService({
			store: createMemoryWalletStore(),
		});
		assert.equal(await wallet.getBalance(TRAINER), STARTING_COINS);
		// Second read does not re-init
		assert.equal(await wallet.getBalance(TRAINER), STARTING_COINS);
	});

	it("awards flat win coins; boss-type wins pay more", async () => {
		const wallet = createWalletService({
			store: createMemoryWalletStore(),
		});
		const win = await wallet.awardWinCoins({
			trainerId: TRAINER,
			battleType: "trainer",
		});
		assert.equal(win.amount, WIN_COINS);
		assert.equal(win.balance, STARTING_COINS + WIN_COINS);
		// Phase 11: gym_boss, elite_four, champion and legendary all pay
		// the boss rate.
		for (const battleType of [
			"gym_boss",
			"elite_four",
			"champion",
			"legendary",
		]) {
			const boss = await wallet.awardWinCoins({
				trainerId: TRAINER,
				battleType,
			});
			assert.equal(boss.amount, BOSS_WIN_COINS, battleType);
		}
		assert.equal(
			await wallet.getBalance(TRAINER),
			STARTING_COINS + WIN_COINS + 4 * BOSS_WIN_COINS
		);
	});
});

describe("martService", () => {
	it("mart config sells Potion, Super Potion and at least one stone", () => {
		const config = loadMartConfig();
		const ids = config.stock.map((entry) => entry.itemId);
		assert.ok(ids.includes(1));
		assert.ok(ids.includes(2));
		assert.ok(ids.includes(FIRE_STONE));
		assert.ok(!ids.includes(LEAF_STONE)); // "not sold" test hook
	});

	it("is locked before the boss is completed: no stock, purchase 403", async () => {
		const { mart, wallet } = makeMart({ unlockedLevel: 1 });
		const view = await mart.getMart(TRAINER);
		assert.equal(view.available, false);
		assert.deepEqual(view.stock, []);
		assert.equal(view.coins, STARTING_COINS); // wallet still lazily created
		assert.ok(view.unlockHint.length > 0);

		await assert.rejects(
			() => mart.purchase(TRAINER, { itemId: POTION }),
			(err) =>
				err instanceof MartError &&
				err.status === 403 &&
				err.code === MART_LOCKED
		);
		assert.equal(await wallet.getBalance(TRAINER), STARTING_COINS);
	});

	it("opens after the unlock rule with catalog-merged prices", async () => {
		const { mart } = makeMart({ unlockedLevel: 2 });
		const view = await mart.getMart(TRAINER);
		assert.equal(view.available, true);
		assert.equal(view.coins, STARTING_COINS);
		const potion = view.stock.find((row) => row.itemId === POTION);
		assert.equal(potion.name, "Potion");
		assert.equal(potion.price, 100);
		assert.equal(potion.healAmount, 20);
		const stone = view.stock.find((row) => row.itemId === FIRE_STONE);
		assert.equal(stone.name, "Fire Stone");
		assert.equal(stone.price, 800);
	});

	it("a purchase debits coins and credits inventory together", async () => {
		const { mart, wallet, inventory } = makeMart();
		const result = await mart.purchase(TRAINER, { itemId: POTION });
		assert.deepEqual(result.purchased, {
			itemId: POTION,
			name: "Potion",
			quantity: 1,
			unitPrice: 100,
			totalPrice: 100,
		});
		assert.equal(result.coins, STARTING_COINS - 100);
		assert.equal(result.items[0].quantity, 1);
		assert.equal(await wallet.getBalance(TRAINER), STARTING_COINS - 100);
		assert.equal(await inventory.getQuantity(TRAINER, POTION), 1);
	});

	it("quantity multiplies the price and stacks inventory", async () => {
		const { mart, wallet, inventory } = makeMart({ bag: { [POTION]: 2 } });
		const result = await mart.purchase(TRAINER, {
			itemId: POTION,
			quantity: 3,
		});
		assert.equal(result.purchased.totalPrice, 300);
		assert.equal(result.coins, STARTING_COINS - 300);
		assert.equal(await wallet.getBalance(TRAINER), STARTING_COINS - 300);
		assert.equal(await inventory.getQuantity(TRAINER, POTION), 5); // 2 + 3
	});

	it("insufficient funds fails with no coin or inventory change", async () => {
		const { mart, wallet, inventory } = makeMart({ coins: 50 });
		await assert.rejects(
			() => mart.purchase(TRAINER, { itemId: POTION }),
			(err) =>
				err.status === 400 && err.code === INSUFFICIENT_FUNDS
		);
		assert.equal(await wallet.getBalance(TRAINER), 50);
		assert.equal(await inventory.getQuantity(TRAINER, POTION), 0);
	});

	it("rejects unknown items, unsold items, and bad quantities", async () => {
		const { mart, wallet } = makeMart();
		await assert.rejects(
			() => mart.purchase(TRAINER, { itemId: 999 }),
			(err) => err.status === 400 && /isn't sold/.test(err.message)
		);
		await assert.rejects(
			() => mart.purchase(TRAINER, { itemId: LEAF_STONE }),
			(err) => err.status === 400 && /isn't sold/.test(err.message)
		);
		await assert.rejects(
			() => mart.purchase(TRAINER, { itemId: POTION, quantity: 0 }),
			(err) => err.status === 400 && /Quantity/.test(err.message)
		);
		await assert.rejects(
			() => mart.purchase(TRAINER, { itemId: POTION, quantity: 11 }),
			(err) => err.status === 400 && /Quantity/.test(err.message)
		);
		assert.equal(await wallet.getBalance(TRAINER), STARTING_COINS);
	});

	it("rolls the debit back when the inventory credit fails", async () => {
		const { mart, wallet, inventory } = makeMart({ breakInventory: true });
		await assert.rejects(
			() => mart.purchase(TRAINER, { itemId: POTION }),
			/simulated inventory failure/
		);
		// Coins refunded, nothing credited — atomic from the outside
		assert.equal(await wallet.getBalance(TRAINER), STARTING_COINS);
		assert.equal(await inventory.getQuantity(TRAINER, POTION), 0);
	});

	it("a mart-bought stone evolves a party member end-to-end (Phase 9)", async () => {
		const { mart, wallet, inventory, partyService } = makeMart({
			coins: 1000,
		});
		await mart.purchase(TRAINER, { itemId: FIRE_STONE });
		assert.equal(await wallet.getBalance(TRAINER), 200); // 1000 - 800
		assert.equal(await inventory.getQuantity(TRAINER, FIRE_STONE), 1);

		const result = await inventory.useItemOverworld(TRAINER, {
			itemId: FIRE_STONE,
			partyPosition: 1,
		});
		assert.equal(result.evolved.toPokemonId, 38);
		assert.equal(result.evolved.toName, "Ninetales");
		assert.equal(await inventory.getQuantity(TRAINER, FIRE_STONE), 0);
		const [saved] = await partyService.getPartyRows(TRAINER);
		assert.equal(saved.pokemon_id, 38);
		assert.equal(saved.level, 12); // level untouched by stone evolution
	});
});
