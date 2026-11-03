/**
 * "Start over" — wipes everything that makes a save feel stuck (wrong
 * starter, dead-end party, no coins) back to a fresh trainer. Runs as one
 * transaction so a mid-reset failure can't leave a trainer half-wiped.
 *
 * Deliberately NOT touched: `battles` (public battle history — other
 * trainers can view it in the Playground) and the trainer's card
 * (theme/motto/avatar — cosmetic identity, not campaign progress).
 *
 * Delete order matters: `forgotten_moves` has no ON DELETE CASCADE from
 * trainer_pokemon, so it must go first or the trainer_pokemon delete hits
 * a foreign key violation. trainer_pokemon_moves is the same story.
 */

const { STARTING_COINS } = require("./walletService");

const DEFAULT_PROGRESS = {
	current_level: 1,
	current_battle: 1,
	unlocked_level: 1,
	status: "in_progress",
};

function createResetService(deps = {}) {
	let pool = deps.pool || null;
	function getPool() {
		// Lazy so requiring this module never opens a DB connection.
		if (!pool) pool = require("../config/trainerdb");
		return pool;
	}

	async function resetTrainer(trainerId) {
		const connection = await getPool().getConnection();
		try {
			await connection.beginTransaction();

			await connection.query(
				`DELETE fm FROM forgotten_moves fm
				 JOIN trainer_pokemon tp ON tp.id = fm.trainer_pokemon_id
				 WHERE tp.trainer_id = ?`,
				[trainerId]
			);
			await connection.query(
				`DELETE tpm FROM trainer_pokemon_moves tpm
				 JOIN trainer_pokemon tp ON tp.id = tpm.trainer_pokemon_id
				 WHERE tp.trainer_id = ?`,
				[trainerId]
			);
			await connection.query(`DELETE FROM trainer_pending_move_learns WHERE trainer_id = ?`, [trainerId]);
			await connection.query(`DELETE FROM trainer_pokemon WHERE trainer_id = ?`, [trainerId]);
			await connection.query(`DELETE FROM trainer_inventory WHERE trainer_id = ?`, [trainerId]);
			await connection.query(`DELETE FROM badges WHERE trainer_id = ?`, [trainerId]);
			await connection.query(`DELETE FROM reward_offers WHERE trainer_id = ?`, [trainerId]);

			await connection.query(
				`INSERT INTO trainer_progress (trainer_id, current_level, current_battle, unlocked_level, status)
				 VALUES (?, ?, ?, ?, ?)
				 ON DUPLICATE KEY UPDATE
				   current_level = VALUES(current_level),
				   current_battle = VALUES(current_battle),
				   unlocked_level = VALUES(unlocked_level),
				   status = VALUES(status)`,
				[
					trainerId,
					DEFAULT_PROGRESS.current_level,
					DEFAULT_PROGRESS.current_battle,
					DEFAULT_PROGRESS.unlocked_level,
					DEFAULT_PROGRESS.status,
				]
			);
			await connection.query(
				`INSERT INTO trainer_wallet (trainer_id, coins)
				 VALUES (?, ?)
				 ON DUPLICATE KEY UPDATE coins = VALUES(coins)`,
				[trainerId, STARTING_COINS]
			);

			await connection.commit();
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	}

	return { resetTrainer };
}

const defaultService = createResetService();

module.exports = {
	createResetService,
	resetTrainer: defaultService.resetTrainer,
	DEFAULT_PROGRESS,
};
