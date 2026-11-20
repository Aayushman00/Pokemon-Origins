/**
 * Steps walked in the Playground, counted only from moves the server
 * accepted (playground/movement.js validateStep). Buffered in memory and
 * written in batches (on leave and once a minute) so walking is not a DB
 * write per tile. Guests are not counted.
 */
function createStepService({ store }) {
	const buffer = new Map(); // trainerId -> steps not yet written

	function add(trainerId, n = 1) {
		if (!Number.isInteger(trainerId)) return;
		buffer.set(trainerId, (buffer.get(trainerId) || 0) + n);
	}

	/** Writes one trainer's buffered steps, or everyone's. A failed write keeps them for next time. */
	async function flush(trainerId) {
		const ids = trainerId == null ? [...buffer.keys()] : [trainerId];
		for (const id of ids) {
			const n = buffer.get(id);
			if (!n) continue;
			buffer.delete(id);
			try {
				await store.addSteps(id, n);
			} catch (err) {
				add(id, n);
				console.error("Steps not saved:", err.message);
			}
		}
	}

	return { add, flush };
}

function createMemoryStepStore() {
	const totals = new Map();
	const writes = [];
	return {
		writes,
		get: (id) => totals.get(id) || 0,
		async addSteps(id, n) {
			writes.push([id, n]);
			totals.set(id, (totals.get(id) || 0) + n);
		},
	};
}

/** `pool` is the promise pool from config/trainerdb. */
function createMysqlStepStore(pool) {
	return {
		async addSteps(id, n) {
			await pool.query("INSERT INTO trainer_steps (trainer_id, steps) VALUES (?, ?) ON DUPLICATE KEY UPDATE steps = steps + VALUES(steps)", [id, n]);
		},
	};
}

module.exports = { createStepService, createMemoryStepStore, createMysqlStepStore };
