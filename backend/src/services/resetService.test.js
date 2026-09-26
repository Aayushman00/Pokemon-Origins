const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createResetService, DEFAULT_PROGRESS } = require("./resetService");
const { STARTING_COINS } = require("./walletService");

function fakePool() {
	const calls = [];
	let committed = false;
	let rolledBack = false;
	const connection = {
		async query(sql, params) {
			calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
			return [{ affectedRows: 1 }];
		},
		async beginTransaction() {
			calls.push({ sql: "BEGIN" });
		},
		async commit() {
			committed = true;
		},
		async rollback() {
			rolledBack = true;
		},
		release() {},
	};
	return {
		calls,
		get committed() {
			return committed;
		},
		get rolledBack() {
			return rolledBack;
		},
		async getConnection() {
			return connection;
		},
	};
}

describe("resetService", () => {
	it("deletes forgotten_moves and trainer_pokemon_moves before trainer_pokemon", async () => {
		const pool = fakePool();
		const service = createResetService({ pool });
		await service.resetTrainer(7);

		const tables = pool.calls.map((c) => c.sql);
		const idx = (needle) => tables.findIndex((sql) => sql.includes(needle));

		assert.ok(idx("FROM forgotten_moves fm") < idx("FROM trainer_pokemon WHERE"));
		assert.ok(idx("FROM trainer_pokemon_moves tpm") < idx("FROM trainer_pokemon WHERE"));
		assert.ok(idx("FROM trainer_pending_move_learns") < idx("FROM trainer_pokemon WHERE"));
	});

	it("resets progress to defaults and wallet to STARTING_COINS, and commits", async () => {
		const pool = fakePool();
		const service = createResetService({ pool });
		await service.resetTrainer(7);

		const progressCall = pool.calls.find((c) => c.sql.includes("INTO trainer_progress"));
		assert.deepEqual(progressCall.params, [
			7,
			DEFAULT_PROGRESS.current_level,
			DEFAULT_PROGRESS.current_battle,
			DEFAULT_PROGRESS.unlocked_level,
			DEFAULT_PROGRESS.status,
		]);

		const walletCall = pool.calls.find((c) => c.sql.includes("INTO trainer_wallet"));
		assert.deepEqual(walletCall.params, [7, STARTING_COINS]);

		assert.ok(pool.committed);
		assert.ok(!pool.rolledBack);
	});

	it("leaves battles and trainer card untouched", async () => {
		const pool = fakePool();
		const service = createResetService({ pool });
		await service.resetTrainer(7);

		const touched = pool.calls.some((c) => /\bbattles\b/i.test(c.sql) || /trainer_card/i.test(c.sql));
		assert.ok(!touched);
	});

	it("rolls back and rethrows if a query fails mid-transaction", async () => {
		const pool = fakePool();
		const connection = await pool.getConnection();
		connection.query = async () => {
			throw new Error("db exploded");
		};
		const service = createResetService({ pool });

		await assert.rejects(() => service.resetTrainer(7), /db exploded/);
		assert.ok(pool.rolledBack);
		assert.ok(!pool.committed);
	});
});
