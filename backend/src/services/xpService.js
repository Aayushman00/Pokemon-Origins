/**
 * XP and leveling (Phase 5; curve rebalanced in Phase 11).
 *
 * - `trainer_pokemon.experience` is a per-level XP buffer (not a lifetime
 *   total). The threshold to advance from level L to L+1 is
 *   XP_CURVE_SLOPE × L (linear).
 * - Each level gained applies fixed stat increments:
 *   hp +5, attack +2, defense +2, speed +1, special_atk +2, special_def +2.
 *
 * Why linear (Phase 11): campaign battles are one-time — there is no wild
 * grinding, so total XP income is fixed (~21k XP = 6 × the sum of every
 * enemy level in levels 1–10). The original cubic curve (L³, ported from
 * the battle-engine's add_experience) needs ~1.5M XP to reach the Lv 50+
 * endgame, which stalled the player at ~Lv 12 against Lv 60+ enemies.
 * With 12·L thresholds the same income carries a starter to ~Lv 55–60 by
 * the Legendary Gauntlet, tracking enemy aces the whole way (see
 * backend/scripts/balance-sim.js for the printed ladder). The engine's
 * Python XP helpers still use the cubic curve but are not called by the
 * campaign win path — the backend owns XP.
 *
 * Rules (documented source of truth):
 * - XP is granted on a server-side battle win only, to the Pokémon active
 *   at the moment of victory. Gain = enemy level × 6 (multi-mon enemy
 *   parties pass the sum of their levels).
 * - HP policy: on level-up, stored current_hp grows by the same amount as
 *   max_hp (+5 per level), clamped to the new max — no full heal. Battle HP
 *   is session-local and never written back, so stored HP is unaffected by
 *   the fight itself.
 * - Levels cap at 100; leftover XP stays in the buffer.
 *
 * Store is injectable so tests can run against an in-memory store.
 */

const XP_PER_ENEMY_LEVEL = 6;
// XP needed to go from level L to L+1 is XP_CURVE_SLOPE × L. Tuned against
// the fixed campaign XP income; change it only together with a
// balance-sim.js pass over the enemy level data.
const XP_CURVE_SLOPE = 12;
const MAX_LEVEL = 100;
const LEVEL_INCREMENTS = {
	max_hp: 5,
	attack: 2,
	defense: 2,
	speed: 1,
	special_atk: 2,
	special_def: 2,
};

/** XP needed to advance from `level` to `level + 1` (linear curve). */
function xpNeededForLevel(level) {
	return XP_CURVE_SLOPE * Math.max(1, Number(level) || 1);
}

/** XP yield for defeating `enemy` (simple linear yield). */
function xpGainForWin(enemy) {
	const level = Math.max(1, Math.round(Number(enemy?.level) || 1));
	return level * XP_PER_ENEMY_LEVEL;
}

/**
 * Pure progression math: pours `gained` XP into the buffer and levels up
 * while the buffer crosses each level's threshold.
 */
function applyExperience({ level, experience }, gained) {
	let newLevel = Math.max(1, Number(level) || 1);
	let buffer = Math.max(0, Number(experience) || 0) + Math.max(0, gained);
	let levelsGained = 0;
	while (newLevel < MAX_LEVEL && buffer >= xpNeededForLevel(newLevel)) {
		buffer -= xpNeededForLevel(newLevel);
		newLevel += 1;
		levelsGained += 1;
	}
	return { level: newLevel, experience: buffer, levelsGained };
}

/** In-memory store for tests. `initialRows` is an array of mon rows. */
function createMemoryXpStore(initialRows = []) {
	const rows = new Map(initialRows.map((row) => [Number(row.id), { ...row }]));
	return {
		async getMon(trainerId, rowId) {
			const row = rows.get(Number(rowId));
			if (!row || Number(row.trainer_id) !== Number(trainerId)) return null;
			return { ...row };
		},
		async saveMon(trainerId, rowId, fields) {
			const row = rows.get(Number(rowId));
			if (!row || Number(row.trainer_id) !== Number(trainerId)) {
				throw new Error(`No trainer_pokemon row ${rowId} for trainer ${trainerId}`);
			}
			Object.assign(row, fields);
		},
	};
}

function createMysqlXpStore(pool) {
	return {
		async getMon(trainerId, rowId) {
			const [rows] = await pool.query(
				`SELECT id, trainer_id, pokemon_id, nickname, level, experience,
                current_hp, max_hp, attack, defense, speed, special_atk, special_def
         FROM trainer_pokemon WHERE id = ? AND trainer_id = ?`,
				[rowId, trainerId]
			);
			return rows[0] || null;
		},
		async saveMon(trainerId, rowId, fields) {
			await pool.query(
				`UPDATE trainer_pokemon
         SET level = ?, experience = ?, max_hp = ?, current_hp = ?,
             attack = ?, defense = ?, speed = ?, special_atk = ?, special_def = ?
         WHERE id = ? AND trainer_id = ?`,
				[
					fields.level,
					fields.experience,
					fields.max_hp,
					fields.current_hp,
					fields.attack,
					fields.defense,
					fields.speed,
					fields.special_atk,
					fields.special_def,
					rowId,
					trainerId,
				]
			);
		},
	};
}

function createXpService(deps = {}) {
	let store = deps.store || null;
	function getStore() {
		if (!store) {
			// Lazy so requiring this module never opens a DB connection.
			store = createMysqlXpStore(require("../config/trainerdb"));
		}
		return store;
	}

	/**
	 * Awards win XP to the trainer's Pokémon stored at `pokemonRowId` and
	 * persists level/stat changes. Returns an award summary, or null when
	 * the row cannot be found (e.g. stale session snapshot).
	 *
	 * `gained` overrides the computed enemy-level yield — battles split XP
	 * across every participant, so the caller passes each mon's share
	 * directly instead of the whole-battle amount `enemy` would produce.
	 */
	async function awardWinXp({ trainerId, pokemonRowId, enemy, gained: gainedOverride }) {
		if (pokemonRowId == null) return null;
		const row = await getStore().getMon(trainerId, pokemonRowId);
		if (!row) return null;

		const gained = gainedOverride != null ? gainedOverride : xpGainForWin(enemy);
		const progression = applyExperience(row, gained);
		const inc = LEVEL_INCREMENTS;
		const n = progression.levelsGained;
		const statIncreases = {
			max_hp: n * inc.max_hp,
			attack: n * inc.attack,
			defense: n * inc.defense,
			speed: n * inc.speed,
			special_atk: n * inc.special_atk,
			special_def: n * inc.special_def,
		};

		const maxHp = Number(row.max_hp) + statIncreases.max_hp;
		const after = {
			level: progression.level,
			experience: progression.experience,
			max_hp: maxHp,
			// current_hp grows by the max_hp delta (no full heal), clamped
			current_hp: Math.min(
				Number(row.current_hp) + statIncreases.max_hp,
				maxHp
			),
			attack: Number(row.attack) + statIncreases.attack,
			defense: Number(row.defense) + statIncreases.defense,
			speed: Number(row.speed) + statIncreases.speed,
			special_atk: Number(row.special_atk) + statIncreases.special_atk,
			special_def: Number(row.special_def) + statIncreases.special_def,
		};

		await getStore().saveMon(trainerId, pokemonRowId, after);

		return {
			gained,
			levelsGained: n,
			before: { level: Number(row.level), experience: Number(row.experience) },
			after,
			xpToNext: xpNeededForLevel(after.level),
			statIncreases,
		};
	}

	return { awardWinXp };
}

const defaultService = createXpService();

module.exports = {
	XP_PER_ENEMY_LEVEL,
	XP_CURVE_SLOPE,
	MAX_LEVEL,
	LEVEL_INCREMENTS,
	xpNeededForLevel,
	xpGainForWin,
	applyExperience,
	createXpService,
	createMemoryXpStore,
	createMysqlXpStore,
	awardWinXp: defaultService.awardWinXp,
};
