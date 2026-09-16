const starterStats = require("../starterStats");
const partyServiceModule = require("./partyService");
const { PartyError } = require("./partyService");

const STARTER_POKEMON_IDS = new Set(
	Object.values(starterStats).map((s) => s.pokemon_id)
);

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
		const { moves, ...mon } = starter;
		await party.addPokemon(trainerId, mon, moves || []);

		return { message: "Starter chosen successfully", chosenPokemon };
	}

	return { chooseStarter };
}

const defaultService = createStarterService();

module.exports = {
	chooseStarter: defaultService.chooseStarter,
	createStarterService,
	STARTER_POKEMON_IDS,
};
