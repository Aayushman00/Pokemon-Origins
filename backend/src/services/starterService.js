const starterStats = require("../starterStats");
const partyServiceModule = require("./partyService");
const { PartyError } = require("./partyService");
const { statAtLevel } = require("../campaign/hydrate");

const STARTER_POKEMON_IDS = new Set(
	Object.values(starterStats).map((s) => s.pokemon_id)
);

/**
 * starterStats.js stores each species' raw Pokédex base stats (e.g.
 * Charmander attack: 52), not a level-5 battle stat. Enemy Pokémon are
 * always built via campaign/hydrate.js's statAtLevel formula, so an
 * unscaled starter enters battle wildly over-statted relative to every
 * trainer opponent at the same level. Run the same formula here to keep
 * starters symmetric with hydrated enemies.
 */
function scaleStarterStats(starter) {
	const level = starter.level;
	const maxHp = statAtLevel(starter.max_hp, level, true);
	return {
		...starter,
		max_hp: maxHp,
		current_hp: maxHp,
		attack: statAtLevel(starter.attack, level, false),
		defense: statAtLevel(starter.defense, level, false),
		speed: statAtLevel(starter.speed, level, false),
		special_atk: statAtLevel(starter.special_atk, level, false),
		special_def: statAtLevel(starter.special_def, level, false),
	};
}

function createStarterService(deps = {}) {
	const party = deps.party || partyServiceModule;

	async function chooseStarter(trainerId, chosenPokemon) {
		const starter = starterStats[chosenPokemon];
		if (!starter) {
			throw new PartyError(400, "Invalid starter choice");
		}

		const rows = await party.getPartyRows(trainerId);
		if (rows.some((row) => STARTER_POKEMON_IDS.has(row.pokemon_id))) {
			throw new PartyError(400, "Starter already chosen");
		}

		// Party cap (max 3) is enforced by partyService.addPokemon.
		const { moves, ...rawMon } = scaleStarterStats(starter);
		await party.addPokemon(trainerId, rawMon, moves || []);

		return { message: "Starter chosen successfully", chosenPokemon };
	}

	return { chooseStarter, scaleStarterStats };
}

const defaultService = createStarterService();

module.exports = {
	chooseStarter: defaultService.chooseStarter,
	createStarterService,
	scaleStarterStats,
	STARTER_POKEMON_IDS,
};
