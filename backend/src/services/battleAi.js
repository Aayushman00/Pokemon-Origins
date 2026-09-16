/**
 * Enemy move selection (Gen-ish, Phase 14). Replaces uniform-random picks.
 *
 * Scoring: damaging moves with PP score power x typeEffectiveness x STAB;
 * 0x (immune) moves are skipped. When the defender is healthy (>1/2 HP) and
 * unstatused, there is a ~30% chance to open with a status/utility move
 * (power 0) instead. With no usable PP left the AI Struggles.
 *
 * The type chart is read once from pokedex.type_damage_relations + Type
 * (lazily, cached); if the DB is unreachable the AI falls back to a neutral
 * chart (all 1x) rather than failing the battle. Both the chart and the RNG
 * are injectable for deterministic tests.
 */

const STATUS_MOVE_CHANCE = 0.3;

/** Lazily loads { "attacking>defending": multiplier } from the pokedex DB. */
async function defaultLoadChart() {
	const pool = require("../config/db");
	const [rows] = await pool.query(
		`SELECT ta.name AS attacking, td.name AS defending, r.multiplier
     FROM type_damage_relations r
     JOIN Type ta ON r.attacking_type_id = ta.type_id
     JOIN Type td ON r.defending_type_id = td.type_id`
	);
	const chart = {};
	for (const row of rows) {
		chart[
			`${String(row.attacking).toLowerCase()}>${String(
				row.defending
			).toLowerCase()}`
		] = Number(row.multiplier);
	}
	return chart;
}

function effectiveness(chart, moveType, defenderTypes) {
	const attacking = String(moveType || "normal").toLowerCase();
	let multiplier = 1;
	for (const defending of defenderTypes || []) {
		const key = `${attacking}>${String(defending).toLowerCase()}`;
		multiplier *= chart[key] ?? 1;
	}
	return multiplier;
}

function hasPp(move) {
	// null/undefined PP (legacy fixtures) means "not tracked" -> usable.
	return typeof move.current_pp === "number" ? move.current_pp > 0 : true;
}

function createBattleAi({ chart = null, loadChart = defaultLoadChart, random = Math.random } = {}) {
	let chartPromise = chart ? Promise.resolve(chart) : null;

	async function getChart() {
		if (!chartPromise) {
			chartPromise = loadChart().catch((err) => {
				console.error(
					"battleAi: type chart unavailable, using neutral chart:",
					err.message
				);
				return {};
			});
		}
		return chartPromise;
	}

	/**
	 * Picks the enemy's move for this beat. `attacker`/`defender` are session
	 * mons. Returns a move object from attacker.moves, or null when everything
	 * is out of PP (caller sends Struggle).
	 */
	async function pickMove(attacker, defender) {
		const usable = (attacker.moves || []).filter(hasPp);
		if (!usable.length) return null;

		const typeChart = await getChart();
		const attackerTypes = (attacker.types || []).map((t) =>
			String(t).toLowerCase()
		);

		const damaging = [];
		const statusMoves = [];
		for (const move of usable) {
			if (Number(move.power) > 0) {
				const typeMultiplier = effectiveness(
					typeChart,
					move.move_type,
					defender.types
				);
				if (typeMultiplier === 0) continue; // never throw immune moves
				const stab = attackerTypes.includes(
					String(move.move_type || "").toLowerCase()
				)
					? 1.5
					: 1;
				damaging.push({
					move,
					score: Number(move.power) * typeMultiplier * stab,
				});
			} else {
				statusMoves.push(move);
			}
		}

		const defenderHealthy =
			defender.current_hp > defender.max_hp / 2 && !defender.status;
		if (
			statusMoves.length &&
			(defenderHealthy || !damaging.length) &&
			(!damaging.length || random() < STATUS_MOVE_CHANCE)
		) {
			return statusMoves[Math.floor(random() * statusMoves.length)];
		}

		if (damaging.length) {
			damaging.sort((a, b) => b.score - a.score);
			return damaging[0].move;
		}
		// Only immune damaging moves and no status moves: burn a turn with
		// the first usable move rather than stalling forever.
		return usable[0];
	}

	return { pickMove };
}

module.exports = {
	createBattleAi,
	defaultLoadChart,
	effectiveness,
};
