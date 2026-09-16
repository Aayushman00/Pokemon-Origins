/**
 * Trainer inventory (Phase 7).
 *
 * The item catalog is data-driven: backend/data/items.json owns names,
 * categories, heal amounts, and context rules (usableInBattle /
 * usableOverworld). The DB (`trainer.trainer_inventory`) stores quantities
 * only, keyed by catalog itemId — clients can never invent item stats.
 *
 * Usage rules (server-enforced):
 * - Healing items (Potion, Super Potion) work overworld and in battle.
 *   Overworld use persists `trainer_pokemon.current_hp` (clamped to max_hp);
 *   in-battle use goes through the battle session action pipeline and heals
 *   session-local HP (battle HP never writes back — existing policy).
 * - Evolution stones (Phase 9) are overworld-only. Using one requires a
 *   party target; evolutionService resolves the pokedex Evolution mapping
 *   and persists the species change, then the stone is consumed. A stone
 *   with no mapping for the target species is rejected with
 *   NO_EVOLUTION_EFFECT and NOT consumed.
 * - Elixirs (Phase 14, category pp_restore) are overworld-only: they top
 *   every move of one party Pokémon back to its pokedex.Move base PP. Using
 *   one on a mon whose PP is already full is rejected (PP_ALREADY_FULL) and
 *   NOT consumed. They exist so persistent PP can never brick the campaign
 *   (there are no Pokémon Centers).
 * - Items are consumed only after the effect applies; quantity can never
 *   go below zero (atomic decrement guard).
 * - There are no revive items: healing a fainted (0 HP) Pokémon is rejected.
 *
 * `addItem` is internal (seed script + mart) — there is no public grant API.
 */

const fs = require("fs");
const path = require("path");

class InventoryError extends Error {
	constructor(status, message, code = null) {
		super(message);
		this.name = "InventoryError";
		this.status = status;
		if (code) this.code = code;
	}
}

const ITEMS_FILE = path.join(__dirname, "..", "..", "data", "items.json");

let cachedCatalog = null;
/** itemId -> catalog item from backend/data/items.json. */
function loadItemCatalog() {
	if (!cachedCatalog) {
		const parsed = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf-8"));
		cachedCatalog = new Map(
			(parsed.items || []).map((item) => [Number(item.itemId), item])
		);
	}
	return cachedCatalog;
}

/** In-memory store for tests. `initial` maps trainerId -> { itemId: qty }. */
function createMemoryInventoryStore(initial = {}) {
	const byTrainer = new Map();
	for (const [trainerId, items] of Object.entries(initial)) {
		byTrainer.set(
			Number(trainerId),
			new Map(
				Object.entries(items).map(([itemId, qty]) => [
					Number(itemId),
					Number(qty),
				])
			)
		);
	}
	const bag = (trainerId) => {
		const key = Number(trainerId);
		if (!byTrainer.has(key)) byTrainer.set(key, new Map());
		return byTrainer.get(key);
	};
	return {
		async rows(trainerId) {
			return [...bag(trainerId).entries()].map(([item_id, quantity]) => ({
				item_id,
				quantity,
			}));
		},
		async add(trainerId, itemId, quantity) {
			const items = bag(trainerId);
			items.set(Number(itemId), (items.get(Number(itemId)) || 0) + quantity);
			return true;
		},
		async consume(trainerId, itemId) {
			const items = bag(trainerId);
			const current = items.get(Number(itemId)) || 0;
			if (current <= 0) return false;
			items.set(Number(itemId), current - 1);
			return true;
		},
	};
}

function createMysqlInventoryStore(pool) {
	return {
		async rows(trainerId) {
			const [rows] = await pool.query(
				`SELECT item_id, quantity FROM trainer_inventory
         WHERE trainer_id = ? AND quantity > 0`,
				[trainerId]
			);
			return rows;
		},
		async add(trainerId, itemId, quantity) {
			await pool.query(
				`INSERT INTO trainer_inventory (trainer_id, item_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
				[trainerId, itemId, quantity]
			);
			return true;
		},
		async consume(trainerId, itemId) {
			// Atomic guard: quantity never goes below zero.
			const [result] = await pool.query(
				`UPDATE trainer_inventory SET quantity = quantity - 1
         WHERE trainer_id = ? AND item_id = ? AND quantity > 0`,
				[trainerId, itemId]
			);
			return result.affectedRows > 0;
		},
	};
}

function toPublicItem(catalogItem, quantity) {
	return {
		itemId: catalogItem.itemId,
		name: catalogItem.name,
		category: catalogItem.category,
		quantity,
		usableInBattle: !!catalogItem.usableInBattle,
		usableOverworld: !!catalogItem.usableOverworld,
		...(catalogItem.healAmount != null
			? { healAmount: catalogItem.healAmount }
			: {}),
		description: catalogItem.description || "",
	};
}

/**
 * Default Elixir effect: tops all of one mon's moves back to base PP.
 * Returns the number of updated rows (0 = everything already full).
 */
async function defaultRestorePp(trainerPokemonId) {
	const pool = require("../config/trainerdb");
	const [result] = await pool.query(
		`UPDATE trainer_pokemon_moves tpm
     JOIN \`pokedex\`.\`Move\` m ON m.move_id = tpm.move_id
     SET tpm.current_pp = m.pp
     WHERE tpm.trainer_pokemon_id = ?
       AND (tpm.current_pp IS NULL OR tpm.current_pp < m.pp)`,
		[trainerPokemonId]
	);
	return result.affectedRows;
}

function createInventoryService(deps = {}) {
	let store = deps.store || null;
	function getStore() {
		if (!store) {
			// Lazy so requiring this module never opens a DB connection.
			store = createMysqlInventoryStore(require("../config/trainerdb"));
		}
		return store;
	}
	const getParty = () => deps.party || require("./partyService");
	const getEvolution = () => deps.evolution || require("./evolutionService");
	const getCatalog = () => deps.catalog || loadItemCatalog();
	const restorePp = deps.restorePp || defaultRestorePp;

	/** Catalog lookup; returns the raw catalog item or null. */
	function getItem(itemId) {
		return getCatalog().get(Number(itemId)) || null;
	}

	/** Owned items (quantity > 0) merged with catalog data, by itemId. */
	async function getInventory(trainerId) {
		const rows = await getStore().rows(trainerId);
		return rows
			.filter((row) => row.quantity > 0)
			.map((row) => {
				const item = getItem(row.item_id);
				return item ? toPublicItem(item, row.quantity) : null;
			})
			.filter(Boolean)
			.sort((a, b) => a.itemId - b.itemId);
	}

	async function getQuantity(trainerId, itemId) {
		const rows = await getStore().rows(trainerId);
		const row = rows.find((r) => Number(r.item_id) === Number(itemId));
		return row ? Number(row.quantity) : 0;
	}

	/** Internal grant (seed script now, mart in Phase 8). */
	async function addItem(trainerId, itemId, quantity = 1) {
		const item = getItem(itemId);
		if (!item) {
			throw new InventoryError(400, `Unknown item id ${itemId}`);
		}
		if (!Number.isInteger(quantity) || quantity <= 0) {
			throw new InventoryError(400, "Quantity must be a positive integer");
		}
		await getStore().add(trainerId, item.itemId, quantity);
		return { itemId: item.itemId, name: item.name };
	}

	/** Atomic single-item decrement; false when there is no stock. */
	async function consumeItem(trainerId, itemId) {
		return getStore().consume(trainerId, itemId);
	}

	/**
	 * Overworld item use (no battle session). Healing items persist HP to
	 * trainer_pokemon; evolution stones evolve the targeted party member via
	 * the pokedex Evolution table (Phase 9). The item is consumed only after
	 * the effect persisted, so a rejected use never costs the item.
	 */
	async function useItemOverworld(trainerId, { itemId, partyPosition }) {
		const item = getItem(itemId);
		if (!item) {
			throw new InventoryError(400, "Unknown item");
		}
		if (!item.usableOverworld) {
			throw new InventoryError(
				400,
				`${item.name} can't be used outside battle`
			);
		}
		const quantity = await getQuantity(trainerId, item.itemId);
		if (quantity <= 0) {
			throw new InventoryError(400, `You don't have a ${item.name}`);
		}

		if (item.category === "evolution_stone") {
			if (partyPosition == null) {
				throw new InventoryError(
					400,
					"Choose a Pokémon to use the stone on"
				);
			}
			// Throws 400 (NO_EVOLUTION_EFFECT when the Evolution table has
			// no row for species + stone) BEFORE anything is consumed.
			const evolved = await getEvolution().evolveWithStone(
				trainerId,
				partyPosition,
				item
			);
			// Consume only after the evolution persisted (same crash policy
			// as healing: a failure between writes favors the player).
			const consumed = await consumeItem(trainerId, item.itemId);
			if (!consumed) {
				throw new InventoryError(400, `You don't have a ${item.name}`);
			}
			return {
				item: { itemId: item.itemId, name: item.name },
				evolved,
				items: await getInventory(trainerId),
			};
		}
		if (item.category === "pp_restore") {
			if (partyPosition == null) {
				throw new InventoryError(
					400,
					"Choose a Pokémon to use the item on"
				);
			}
			const rows = await getParty().getPartyRows(trainerId);
			const target = rows.find(
				(row) => Number(row.position) === Number(partyPosition)
			);
			if (!target) {
				throw new InventoryError(400, "No Pokémon at that party position");
			}
			const restored = await restorePp(target.id);
			if (!restored) {
				throw new InventoryError(
					400,
					`${target.nickname}'s moves already have full PP`,
					"PP_ALREADY_FULL"
				);
			}
			// Consume only after the restore persisted (same crash policy as
			// healing: a failure between writes favors the player).
			const consumed = await consumeItem(trainerId, item.itemId);
			if (!consumed) {
				throw new InventoryError(400, `You don't have a ${item.name}`);
			}
			return {
				item: { itemId: item.itemId, name: item.name },
				restoredMoves: restored,
				pokemon: {
					position: Number(target.position),
					nickname: target.nickname,
				},
				items: await getInventory(trainerId),
			};
		}
		if (item.category !== "healing") {
			throw new InventoryError(400, `${item.name} can't be used right now`);
		}

		if (partyPosition == null) {
			throw new InventoryError(400, "Choose a Pokémon to use the item on");
		}
		const party = getParty();
		const rows = await party.getPartyRows(trainerId);
		const target = rows.find(
			(row) => Number(row.position) === Number(partyPosition)
		);
		if (!target) {
			throw new InventoryError(400, "No Pokémon at that party position");
		}
		const currentHp = Number(target.current_hp);
		const maxHp = Number(target.max_hp);
		if (currentHp <= 0) {
			throw new InventoryError(
				400,
				`${target.nickname} has fainted — it needs a revive, not a potion`
			);
		}
		if (currentHp >= maxHp) {
			throw new InventoryError(
				400,
				`${target.nickname} is already at full HP`
			);
		}

		const healedTo = Math.min(maxHp, currentHp + Number(item.healAmount));
		await party.setCurrentHpByPosition(trainerId, target.position, healedTo);
		// Consume only after the heal persisted (spec). A crash between the
		// two writes leaves the item unconsumed — favors the player.
		const consumed = await consumeItem(trainerId, item.itemId);
		if (!consumed) {
			throw new InventoryError(400, `You don't have a ${item.name}`);
		}

		return {
			item: { itemId: item.itemId, name: item.name },
			amount: healedTo - currentHp,
			pokemon: {
				position: Number(target.position),
				nickname: target.nickname,
				current_hp: healedTo,
				max_hp: maxHp,
			},
			items: await getInventory(trainerId),
		};
	}

	return {
		getItem,
		getInventory,
		getQuantity,
		addItem,
		consumeItem,
		useItemOverworld,
	};
}

const defaultService = createInventoryService();

module.exports = {
	InventoryError,
	loadItemCatalog,
	createInventoryService,
	createMemoryInventoryStore,
	createMysqlInventoryStore,
	getItem: defaultService.getItem,
	getInventory: defaultService.getInventory,
	getQuantity: defaultService.getQuantity,
	addItem: defaultService.addItem,
	consumeItem: defaultService.consumeItem,
	useItemOverworld: defaultService.useItemOverworld,
};
