/**
 * Trainer coin wallet (Phase 8).
 *
 * Coins are server-owned: the client can never set a balance. The only
 * movements are:
 * - lazy init: the first read creates the wallet row with STARTING_COINS,
 * - battle-win awards (battleSessionService win path, first-time
 *   completion only — same idempotency gate as XP), and
 * - mart purchases (martService, transactional debit).
 *
 * Award formula (documented, deliberately minimal): a first-time win pays
 * a flat WIN_COINS; boss-type wins (gym_boss, elite_four, champion,
 * legendary) pay BOSS_WIN_COINS instead. Elite Four members count as
 * bosses for coins since Phase 11 — they are full 3-mon Lv 50+ fights and
 * the endgame needs the income for Hyper Potions — but they still create
 * no reward offers (only the champion draws the level 9 pool).
 */

const STARTING_COINS = 500;
const WIN_COINS = 100;
const BOSS_WIN_COINS = 300;
const BOSS_BATTLE_TYPES = new Set([
	"gym_boss",
	"elite_four",
	"champion",
	"legendary",
]);

/** In-memory store for tests. `initial` maps trainerId -> coins. */
function createMemoryWalletStore(initial = {}) {
	const coins = new Map(
		Object.entries(initial).map(([trainerId, balance]) => [
			Number(trainerId),
			Number(balance),
		])
	);
	return {
		async get(trainerId) {
			const balance = coins.get(Number(trainerId));
			return balance == null ? null : balance;
		},
		async init(trainerId, amount) {
			const key = Number(trainerId);
			if (coins.has(key)) return false;
			coins.set(key, amount);
			return true;
		},
		async credit(trainerId, amount) {
			const key = Number(trainerId);
			coins.set(key, (coins.get(key) || 0) + amount);
			return true;
		},
		async debitIfEnough(trainerId, amount) {
			const key = Number(trainerId);
			const balance = coins.get(key) || 0;
			if (balance < amount) return false;
			coins.set(key, balance - amount);
			return true;
		},
	};
}

function createMysqlWalletStore(pool) {
	return {
		async get(trainerId) {
			const [rows] = await pool.query(
				`SELECT coins FROM trainer_wallet WHERE trainer_id = ?`,
				[trainerId]
			);
			return rows.length ? Number(rows[0].coins) : null;
		},
		async init(trainerId, amount) {
			// INSERT IGNORE: concurrent first reads race safely.
			const [result] = await pool.query(
				`INSERT IGNORE INTO trainer_wallet (trainer_id, coins) VALUES (?, ?)`,
				[trainerId, amount]
			);
			return result.affectedRows > 0;
		},
		async credit(trainerId, amount) {
			await pool.query(
				`UPDATE trainer_wallet SET coins = coins + ? WHERE trainer_id = ?`,
				[amount, trainerId]
			);
			return true;
		},
		async debitIfEnough(trainerId, amount) {
			// Atomic guard: the balance never goes below zero.
			const [result] = await pool.query(
				`UPDATE trainer_wallet SET coins = coins - ?
         WHERE trainer_id = ? AND coins >= ?`,
				[amount, trainerId, amount]
			);
			return result.affectedRows > 0;
		},
	};
}

function createWalletService(deps = {}) {
	let store = deps.store || null;
	function getStore() {
		if (!store) {
			// Lazy so requiring this module never opens a DB connection.
			store = createMysqlWalletStore(require("../config/trainerdb"));
		}
		return store;
	}

	/** Creates the wallet row with the starting balance when missing. */
	async function ensureWallet(trainerId) {
		const existing = await getStore().get(trainerId);
		if (existing != null) return existing;
		await getStore().init(trainerId, STARTING_COINS);
		return getStore().get(trainerId);
	}

	async function getBalance(trainerId) {
		return ensureWallet(trainerId);
	}

	/**
	 * Flat win award; the caller (battle win path) is responsible for the
	 * first-time-completion idempotency gate.
	 */
	async function awardWinCoins({ trainerId, battleType }) {
		const amount = BOSS_BATTLE_TYPES.has(battleType)
			? BOSS_WIN_COINS
			: WIN_COINS;
		await ensureWallet(trainerId);
		await getStore().credit(trainerId, amount);
		const balance = await getStore().get(trainerId);
		return { amount, balance };
	}

	return { getBalance, awardWinCoins, ensureWallet };
}

const defaultService = createWalletService();

module.exports = {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
	createWalletService,
	createMemoryWalletStore,
	createMysqlWalletStore,
	getBalance: defaultService.getBalance,
	awardWinCoins: defaultService.awardWinCoins,
	ensureWallet: defaultService.ensureWallet,
};
