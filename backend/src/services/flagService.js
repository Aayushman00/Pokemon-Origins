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

function createFlagService(deps = {}) {
	const store = () => deps.store || createMysqlFlagStore(require("../config/trainerdb"));
	return {
		listFlags: (trainerId) => store().list(trainerId),
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
