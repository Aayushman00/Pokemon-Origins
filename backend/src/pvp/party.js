/**
 * PvP teams: a copy of the trainer's party (first 6) rebuilt at level 50
 * from species base stats, full HP/PP, no status. The copy is never saved.
 */
const { statAtLevel } = require("../campaign/hydrate");

const PVP_LEVEL = 50;
const MAX_PARTY = 6;

function defaultGetBaseStats() {
	return async (pokemonId) => {
		const [rows] = await require("../config/db").query(
			"SELECT hp, attack, defense, special_attack, special_defense, speed FROM Pokemon WHERE pokemon_id = ?",
			[pokemonId]
		);
		if (!rows.length) throw new Error(`Unknown species ${pokemonId}`);
		return rows[0];
	};
}

function createPvpPartyLoader({
	getTrainerData = (id) => require("../services/trainerService").getTrainerData(id),
	getBaseStats = defaultGetBaseStats(),
} = {}) {
	return async (trainerId) => {
		const data = await getTrainerData(trainerId);
		const rows = [...(data?.pokemon || [])].sort((a, b) => a.position - b.position).slice(0, MAX_PARTY);
		return Promise.all(
			rows.map(async (row) => {
				const base = await getBaseStats(row.pokemon_id);
				const stat = (value) => statAtLevel(value, PVP_LEVEL, false);
				const hp = statAtLevel(base.hp, PVP_LEVEL, true);
				return {
					...row,
					level: PVP_LEVEL,
					max_hp: hp,
					current_hp: hp,
					attack: stat(base.attack),
					defense: stat(base.defense),
					special_atk: stat(base.special_attack),
					special_def: stat(base.special_defense),
					speed: stat(base.speed),
					status: null,
					moves: (row.moves || []).map((move) => ({ ...move, current_pp: move.pp })),
				};
			})
		);
	};
}

module.exports = { createPvpPartyLoader, loadPvpParty: createPvpPartyLoader(), PVP_LEVEL };
