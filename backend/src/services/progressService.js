const { CampaignError } = require("../campaign/errors");
const loader = require("../campaign/loader");

const DEFAULT_PROGRESS = {
	current_level: 1,
	current_battle: 1,
	unlocked_level: 1,
	status: "in_progress",
};

function createMemoryStore() {
	const rows = new Map();
	return {
		async get(trainerId) {
			const row = rows.get(Number(trainerId));
			return row ? { ...row } : null;
		},
		async insert(trainerId, data) {
			const id = Number(trainerId);
			if (rows.has(id)) {
				const err = new Error("Duplicate trainer_progress");
				err.code = "ER_DUP_ENTRY";
				throw err;
			}
			const now = new Date().toISOString();
			const row = {
				trainer_id: id,
				current_level: data.current_level,
				current_battle: data.current_battle,
				unlocked_level: data.unlocked_level,
				status: data.status,
				created_at: now,
				updated_at: now,
			};
			rows.set(id, row);
			return { ...row };
		},
		async update(trainerId, data) {
			const id = Number(trainerId);
			const prev = rows.get(id);
			if (!prev) return null;
			const row = {
				...prev,
				current_level: data.current_level,
				current_battle: data.current_battle,
				unlocked_level: data.unlocked_level,
				status: data.status,
				updated_at: new Date().toISOString(),
			};
			rows.set(id, row);
			return { ...row };
		},
	};
}

function createMysqlStore(pool) {
	return {
		async get(trainerId) {
			const [rows] = await pool.query(
				`SELECT trainer_id, current_level, current_battle, unlocked_level, status, created_at, updated_at
				 FROM trainer_progress WHERE trainer_id = ?`,
				[trainerId]
			);
			return rows[0] || null;
		},
		async insert(trainerId, data) {
			await pool.query(
				`INSERT INTO trainer_progress (trainer_id, current_level, current_battle, unlocked_level, status)
				 VALUES (?, ?, ?, ?, ?)`,
				[
					trainerId,
					data.current_level,
					data.current_battle,
					data.unlocked_level,
					data.status,
				]
			);
			return this.get(trainerId);
		},
		async update(trainerId, data) {
			await pool.query(
				`UPDATE trainer_progress
				 SET current_level = ?, current_battle = ?, unlocked_level = ?, status = ?
				 WHERE trainer_id = ?`,
				[
					data.current_level,
					data.current_battle,
					data.unlocked_level,
					data.status,
					trainerId,
				]
			);
			return this.get(trainerId);
		},
	};
}

function toPublic(row) {
	return {
		trainer_id: row.trainer_id,
		current_level: row.current_level,
		current_battle: row.current_battle,
		unlocked_level: row.unlocked_level,
		status: row.status,
		completed: row.current_level > 1,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

function isAlreadyCompleted(progress, level, battleNumber) {
	if (progress.current_level > level) return true;
	if (
		progress.current_level === level &&
		progress.current_battle > battleNumber
	) {
		return true;
	}
	return false;
}

function createProgressService(deps = {}) {
	const getStore = () => {
		if (deps.store) return deps.store;
		const pool = require("../config/trainerdb");
		return createMysqlStore(pool);
	};
	const countBattles =
		deps.countBattles ||
		((levelNumber) => loader.countBattles(levelNumber));

	async function getOrCreate(trainerId) {
		const store = getStore();
		const existing = await store.get(trainerId);
		if (existing) return existing;
		try {
			return await store.insert(trainerId, DEFAULT_PROGRESS);
		} catch (err) {
			if (err.code === "ER_DUP_ENTRY") {
				return store.get(trainerId);
			}
			throw err;
		}
	}

	async function getProgress(trainerId) {
		const row = await getOrCreate(trainerId);
		return toPublic(row);
	}

	async function assertLevelUnlocked(trainerId, levelNumber) {
		const progress = await getProgress(trainerId);
		if (levelNumber > progress.unlocked_level) {
			throw new CampaignError(403, `Level ${levelNumber} is locked`);
		}
		return progress;
	}

	async function completeBattle(trainerId, { level, battleNumber }) {
		const store = getStore();
		const current = await getOrCreate(trainerId);

		if (isAlreadyCompleted(current, level, battleNumber)) {
			return { ...toPublic(current), alreadyCompleted: true };
		}

		if (
			current.current_level !== level ||
			current.current_battle !== battleNumber
		) {
			throw new CampaignError(403, "Not the active battle");
		}

		const battleCount = countBattles(level);
		if (battleNumber < 1 || battleNumber > battleCount) {
			throw new CampaignError(400, "Unknown battle for this level");
		}

		let next;
		if (battleNumber < battleCount) {
			next = await store.update(trainerId, {
				current_level: level,
				current_battle: battleNumber + 1,
				unlocked_level: current.unlocked_level,
				status: "in_progress",
			});
		} else {
			const nextLevel = level + 1;
			next = await store.update(trainerId, {
				current_level: nextLevel,
				current_battle: 1,
				unlocked_level: Math.max(current.unlocked_level, nextLevel),
				status: "in_progress",
			});
		}
		return { ...toPublic(next), alreadyCompleted: false };
	}

	return {
		getProgress,
		completeBattle,
		assertLevelUnlocked,
	};
}

const defaultService = createProgressService();

module.exports = {
	getProgress: defaultService.getProgress,
	completeBattle: defaultService.completeBattle,
	assertLevelUnlocked: defaultService.assertLevelUnlocked,
	createProgressService,
	createMemoryStore,
	createMysqlStore,
	DEFAULT_PROGRESS,
};
