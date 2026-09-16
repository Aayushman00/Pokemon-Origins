const loader = require("../campaign/loader");
const { hydrateParty } = require("../campaign/hydrate");
const { CampaignError } = require("../campaign/errors");

async function getLevel(levelNumber, { lookup } = {}) {
	const meta = loader.loadLevel(levelNumber);
	const battles = [];
	for (const battle of loader.listBattles(levelNumber)) {
		if (battle.type === "legendary") {
			// A legendary is a one-mon enemy "party" hydrated with the same
			// stat/move math as trainer battles (Pokémon-only presentation).
			const party = await hydrateParty(
				[
					{
						pokemonId: battle.encounter.pokemonId,
						level: battle.encounter.level,
					},
				],
				lookup
			);
			battles.push({
				battleNumber: battle.battleNumber,
				type: battle.type,
				encounterId: battle.encounterId,
				encounter: {
					...battle.encounter,
					party,
				},
			});
			continue;
		}
		const party = await hydrateParty(battle.trainer.party, lookup);
		battles.push({
			battleNumber: battle.battleNumber,
			type: battle.type,
			trainerId: battle.trainerId,
			trainer: {
				...battle.trainer,
				party,
			},
		});
	}
	return {
		level: meta.level,
		name: meta.name,
		battles,
	};
}

function toLegacyLevelPayload(campaignLevel) {
	const trainers = campaignLevel.battles
		.filter((b) => b.trainer)
		.map((b) => ({
			trainer_id: b.battleNumber,
			id: b.trainerId,
			battleNumber: b.battleNumber,
			name: b.trainer.name,
			pokemon: b.trainer.party,
		}));
	return { trainers };
}

async function getLegacyLevel1(lookup) {
	const campaign = await getLevel(1, { lookup });
	return toLegacyLevelPayload(campaign);
}

module.exports = {
	CampaignError,
	getLevel,
	toLegacyLevelPayload,
	getLegacyLevel1,
	listBattles: loader.listBattles,
	loadLevel: loader.loadLevel,
};
