/**
 * Mart (Phase 8).
 *
 * Stock and prices are data-driven: backend/data/mart.json lists itemIds
 * (resolved against the items.json catalog) with prices, plus the unlock
 * rule. The mart opens once the trainer's `unlocked_level` reaches
 * `unlock.requiredUnlockedLevel` (1 — every trainer starts unlocked, so
 * the Mart is open from the very first town). A locked mart (if the
 * config ever raises the threshold) rejects purchases with 403 (code
 * MART_LOCKED); GET still answers so the client can render the locked
 * state.
 *
 * Purchases are transactional: coin debit and inventory credit succeed
 * together or not at all. The MySQL store runs both writes in one DB
 * transaction (the debit's `coins >= total` guard doubles as the
 * insufficient-funds check); the in-memory store compensates by refunding
 * the debit when the credit fails. Selling back to the mart is not
 * supported.
 */

const fs = require("fs");
const path = require("path");

class MartError extends Error {
	constructor(status, message, code = null) {
		super(message);
		this.name = "MartError";
		this.status = status;
		if (code) this.code = code;
	}
}

const MART_LOCKED = "MART_LOCKED";
const INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS";
const MAX_PURCHASE_QTY = 10;
const MART_FILE = path.join(__dirname, "..", "..", "data", "mart.json");

let cachedConfig = null;
function loadMartConfig() {
	if (!cachedConfig) {
		cachedConfig = JSON.parse(fs.readFileSync(MART_FILE, "utf-8"));
	}
	return cachedConfig;
}

/**
 * In-memory purchase store for tests, composed over the wallet and
 * inventory memory stores. Refunds the debit when the credit fails —
 * mirroring the MySQL ROLLBACK.
 */
function createMemoryMartStore({ wallet, inventory }) {
	return {
		async purchase(trainerId, itemId, quantity, totalPrice) {
			const debited = await wallet.debitIfEnough(trainerId, totalPrice);
			if (!debited) return { ok: false, reason: "insufficient" };
			try {
				await inventory.add(trainerId, itemId, quantity);
			} catch (err) {
				await wallet.credit(trainerId, totalPrice);
				throw err;
			}
			return { ok: true, coins: await wallet.get(trainerId) };
		},
	};
}

function createMysqlMartStore(pool) {
	return {
		async purchase(trainerId, itemId, quantity, totalPrice) {
			const connection = await pool.getConnection();
			try {
				await connection.beginTransaction();
				const [debit] = await connection.query(
					`UPDATE trainer_wallet SET coins = coins - ?
           WHERE trainer_id = ? AND coins >= ?`,
					[totalPrice, trainerId, totalPrice]
				);
				if (!debit.affectedRows) {
					await connection.rollback();
					return { ok: false, reason: "insufficient" };
				}
				// Same upsert as the inventory store's add(), kept inline so
				// both writes share this transaction.
				await connection.query(
					`INSERT INTO trainer_inventory (trainer_id, item_id, quantity)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
					[trainerId, itemId, quantity]
				);
				const [rows] = await connection.query(
					`SELECT coins FROM trainer_wallet WHERE trainer_id = ?`,
					[trainerId]
				);
				await connection.commit();
				return { ok: true, coins: Number(rows[0].coins) };
			} catch (txError) {
				await connection.rollback();
				throw txError;
			} finally {
				connection.release();
			}
		},
	};
}

function createMartService(deps = {}) {
	let store = deps.store || null;
	function getStore() {
		if (!store) {
			// Lazy so requiring this module never opens a DB connection.
			store = createMysqlMartStore(require("../config/trainerdb"));
		}
		return store;
	}
	const getProgress = () => deps.progress || require("./progressService");
	const getWallet = () => deps.wallet || require("./walletService");
	const getInventory = () => deps.inventory || require("./inventoryService");
	const getConfig = () => deps.config || loadMartConfig();

	function requiredUnlockedLevel() {
		return getConfig().unlock?.requiredUnlockedLevel ?? 2;
	}

	/** Catalog-merged stock rows: { itemId, name, category, price, ... }. */
	function getStock() {
		const inventory = getInventory();
		return (getConfig().stock || [])
			.map((entry) => {
				const item = inventory.getItem(entry.itemId);
				if (!item) return null;
				return {
					itemId: item.itemId,
					name: item.name,
					category: item.category,
					price: Number(entry.price),
					usableInBattle: !!item.usableInBattle,
					usableOverworld: !!item.usableOverworld,
					...(item.healAmount != null
						? { healAmount: item.healAmount }
						: {}),
					description: item.description || "",
				};
			})
			.filter(Boolean);
	}

	async function isAvailable(trainerId) {
		const progress = await getProgress().getProgress(trainerId);
		return progress.unlocked_level >= requiredUnlockedLevel();
	}

	/** GET payload: locked marts answer with available:false and no stock. */
	async function getMart(trainerId) {
		const [available, coins] = await Promise.all([
			isAvailable(trainerId),
			getWallet().getBalance(trainerId),
		]);
		return {
			available,
			coins,
			stock: available ? getStock() : [],
			...(available ? {} : { unlockHint: getConfig().unlock?.hint || "" }),
		};
	}

	async function purchase(trainerId, { itemId, quantity = 1 }) {
		if (!(await isAvailable(trainerId))) {
			throw new MartError(
				403,
				getConfig().unlock?.hint || "The Mart is still locked",
				MART_LOCKED
			);
		}
		if (
			!Number.isInteger(quantity) ||
			quantity < 1 ||
			quantity > MAX_PURCHASE_QTY
		) {
			throw new MartError(
				400,
				`Quantity must be between 1 and ${MAX_PURCHASE_QTY}`
			);
		}
		const entry = getStock().find(
			(row) => row.itemId === Number(itemId)
		);
		if (!entry) {
			throw new MartError(400, "That item isn't sold here");
		}
		const totalPrice = entry.price * quantity;

		// Ensure the wallet row exists so the conditional debit can't
		// mistake a missing row for insufficient funds.
		await getWallet().getBalance(trainerId);
		const result = await getStore().purchase(
			trainerId,
			entry.itemId,
			quantity,
			totalPrice
		);
		if (!result.ok) {
			throw new MartError(
				400,
				`Not enough coins (need ${totalPrice})`,
				INSUFFICIENT_FUNDS
			);
		}

		return {
			purchased: {
				itemId: entry.itemId,
				name: entry.name,
				quantity,
				unitPrice: entry.price,
				totalPrice,
			},
			coins: result.coins,
			items: await getInventory().getInventory(trainerId),
		};
	}

	return { getMart, purchase, isAvailable, getStock };
}

const defaultService = createMartService();

module.exports = {
	MartError,
	MART_LOCKED,
	INSUFFICIENT_FUNDS,
	MAX_PURCHASE_QTY,
	loadMartConfig,
	createMartService,
	createMemoryMartStore,
	createMysqlMartStore,
	getMart: defaultService.getMart,
	purchase: defaultService.purchase,
	isAvailable: defaultService.isAvailable,
	getStock: defaultService.getStock,
};
