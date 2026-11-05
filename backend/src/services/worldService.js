/**
 * Where a trainer stands in the overworld and where they last healed (migration 013),
 * plus the Pokémon Center's full heal. The client reports positions: nothing here
 * earns progress, since wins and solves stay server-side in flagService.
 */
const STORY_FLAG = /^(done|story):/;

/** The only flags a client may write: one-shot story beats, never `trainer:` or `gym:`. */
const storyFlag = (flag) => STORY_FLAG.test(flag);

function createMemoryWorldStore() {
	const rows = new Map();
	const row = (id) => rows.get(Number(id)) || { position: null, heal: null };
	return {
		healed: [],
		async get(trainerId) {
			return row(trainerId);
		},
		async savePosition(trainerId, position) {
			rows.set(Number(trainerId), { ...row(trainerId), position });
		},
		async saveHeal(trainerId, heal) {
			rows.set(Number(trainerId), { ...row(trainerId), heal });
		},
		async healParty(trainerId) {
			this.healed.push(Number(trainerId));
		},
	};
}

function createMysqlWorldStore(pool) {
	return {
		async get(trainerId) {
			const [rows] = await pool.query("SELECT * FROM trainer_world_state WHERE trainer_id = ?", [trainerId]);
			const r = rows[0];
			return {
				position: r?.map_id ? { mapId: r.map_id, x: r.x, y: r.y, facing: r.facing } : null,
				heal: r?.heal_map_id ? { mapId: r.heal_map_id, x: r.heal_x, y: r.heal_y } : null,
			};
		},
		async savePosition(trainerId, { mapId, x, y, facing }) {
			await pool.query(
				`INSERT INTO trainer_world_state (trainer_id, map_id, x, y, facing) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE map_id = VALUES(map_id), x = VALUES(x), y = VALUES(y), facing = VALUES(facing)`,
				[trainerId, mapId, x, y, facing]
			);
		},
		async saveHeal(trainerId, { mapId, x, y }) {
			await pool.query(
				`INSERT INTO trainer_world_state (trainer_id, heal_map_id, heal_x, heal_y) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE heal_map_id = VALUES(heal_map_id), heal_x = VALUES(heal_x), heal_y = VALUES(heal_y)`,
				[trainerId, mapId, x, y]
			);
		},
		async healParty(trainerId) {
			await pool.query("UPDATE trainer_pokemon SET current_hp = max_hp WHERE trainer_id = ? AND in_pc = 0", [trainerId]);
			await pool.query(
				`UPDATE trainer_pokemon_moves tpm
         JOIN trainer_pokemon tp ON tp.id = tpm.trainer_pokemon_id
         JOIN \`pokedex\`.\`Move\` m ON m.move_id = tpm.move_id
         SET tpm.current_pp = m.pp
         WHERE tp.trainer_id = ? AND tp.in_pc = 0`,
				[trainerId]
			);
		},
	};
}

function createWorldService(deps = {}) {
	const store = () => deps.store || createMysqlWorldStore(require("../config/trainerdb"));
	return {
		getState: (trainerId) => store().get(trainerId),
		savePosition: (trainerId, position) => store().savePosition(trainerId, position),
		async heal(trainerId, spot) {
			await store().healParty(trainerId);
			await store().saveHeal(trainerId, spot);
		},
	};
}

module.exports = { createWorldService, createMemoryWorldStore, createMysqlWorldStore, storyFlag, ...createWorldService() };
