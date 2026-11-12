/**
 * Per-trainer world flags (migration 012). Set only by server code (resolved
 * events, battle wins). Clients read the list and may add story flags only, see
 * storyFlag in worldService.
 */
const FLAG_RE = /^[A-Za-z0-9_:.-]{1,64}$/;

function createMemoryFlagStore() {
	const rows = new Map(); // trainerId -> Set
	return {
		async list(trainerId) {
			return [...(rows.get(Number(trainerId)) || [])].sort();
		},
		async add(trainerId, flag) {
			const id = Number(trainerId);
			if (!rows.has(id)) rows.set(id, new Set());
			rows.get(id).add(flag);
		},
	};
}

function createMysqlFlagStore(pool) {
	return {
		async list(trainerId) {
			const [rows] = await pool.query("SELECT flag FROM trainer_flags WHERE trainer_id = ? ORDER BY flag", [trainerId]);
			return rows.map((r) => r.flag);
		},
		async add(trainerId, flag) {
			await pool.query("INSERT IGNORE INTO trainer_flags (trainer_id, flag) VALUES (?, ?)", [trainerId, flag]);
		},
	};
}

async function mysqlHasStarter(trainerId) {
	const [rows] = await require("../config/trainerdb").query("SELECT 1 FROM trainer_pokemon WHERE trainer_id = ? LIMIT 1", [trainerId]);
	return rows.length > 0;
}

function createFlagService(deps = {}) {
	const store = () => deps.store || createMysqlFlagStore(require("../config/trainerdb"));
	// story:starter is derived, not stored: anyone who owns a Pokemon has picked one, so accounts
	// from before the lab pick get it and a reset (which empties the party) takes it away.
	const hasStarter = deps.hasStarter || (deps.store ? async () => false : mysqlHasStarter);
	return {
		async listFlags(trainerId) {
			const [stored, owns] = await Promise.all([store().list(trainerId), hasStarter(trainerId)]);
			return owns && !stored.includes("story:starter") ? [...stored, "story:starter"].sort() : stored;
		},
		async setFlag(trainerId, flag) {
			if (typeof flag !== "string" || !FLAG_RE.test(flag)) {
				const err = new Error("Invalid flag name");
				err.status = 400;
				throw err;
			}
			await store().add(trainerId, flag);
			return flag;
		},
	};
}

module.exports = { createFlagService, createMemoryFlagStore, createMysqlFlagStore, FLAG_RE, ...createFlagService() };
