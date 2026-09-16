const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const campaignService = require("./campaignService");
const { resetCache } = require("../campaign/loader");

const catalog = {
	10: {
		pokemon_id: 10,
		name: "caterpie",
		hp: 45,
		attack: 30,
		defense: 35,
		special_attack: 20,
		special_defense: 20,
		speed: 45,
		types: ["Bug"],
		learnset: [
			{
				move_id: 33,
				move_name: "Tackle",
				power: 40,
				accuracy: 100,
				move_type: "Normal",
				level_learned: 1,
			},
		],
	},
	16: {
		pokemon_id: 16,
		name: "pidgey",
		hp: 40,
		attack: 45,
		defense: 40,
		special_attack: 35,
		special_defense: 35,
		speed: 56,
		types: ["Normal", "Flying"],
		learnset: [
			{
				move_id: 16,
				move_name: "Gust",
				power: 40,
				accuracy: 100,
				move_type: "Flying",
				level_learned: 1,
			},
		],
	},
	19: {
		pokemon_id: 19,
		name: "rattata",
		hp: 30,
		attack: 56,
		defense: 35,
		special_attack: 25,
		special_defense: 35,
		speed: 72,
		types: ["Normal"],
		learnset: [
			{
				move_id: 33,
				move_name: "Tackle",
				power: 40,
				accuracy: 100,
				move_type: "Normal",
				level_learned: 1,
			},
		],
	},
	74: {
		pokemon_id: 74,
		name: "geodude",
		hp: 40,
		attack: 80,
		defense: 100,
		special_attack: 30,
		special_defense: 30,
		speed: 20,
		types: ["Rock"],
		learnset: [
			{
				move_id: 33,
				move_name: "Tackle",
				power: 40,
				accuracy: 100,
				move_type: "Normal",
				level_learned: 1,
			},
		],
	},
	95: {
		pokemon_id: 95,
		name: "onix",
		hp: 35,
		attack: 45,
		defense: 160,
		special_attack: 30,
		special_defense: 45,
		speed: 70,
		types: ["Rock"],
		learnset: [
			{
				move_id: 20,
				move_name: "Bind",
				power: 15,
				accuracy: 85,
				move_type: "Normal",
				level_learned: 1,
			},
		],
	},
};

async function lookup(pokemonId) {
	const species = catalog[pokemonId];
	if (!species) throw new Error(`fixture missing ${pokemonId}`);
	return species;
}

describe("campaignService", () => {
	before(() => resetCache());

	it("hydrates Level 1 battles in order with stable trainerIds", async () => {
		const level = await campaignService.getLevel(1, { lookup });
		assert.equal(level.level, 1);
		assert.equal(level.battles.length, 5);
		assert.deepEqual(
			level.battles.map((b) => b.trainerId),
			[
				"youngster_joey",
				"lass_annie",
				"bug_catcher_tim",
				"hiker_jack",
				"brock",
			]
		);
		const first = level.battles[0];
		assert.equal(first.battleNumber, 1);
		assert.equal(first.type, "trainer");
		assert.equal(first.trainer.party[0].pokemon_id, 19);
		assert.ok(first.trainer.party[0].max_hp > 0);
		assert.ok(first.trainer.party[0].moves.length >= 1);
		assert.equal(level.battles[4].type, "gym_boss");
		assert.equal(level.battles[4].trainer.party.length, 2);
	});

	it("builds a BattleSim-compatible legacy payload", async () => {
		const level = await campaignService.getLevel(1, { lookup });
		const legacy = campaignService.toLegacyLevelPayload(level);
		assert.ok(legacy.trainers[0].pokemon[0].pokemon_id);
		assert.equal(legacy.trainers[0].battleNumber, 1);
		assert.equal(legacy.trainers[0].name, "Youngster Joey");
		assert.equal(legacy.trainers[4].name, "Brock");
		assert.equal(legacy.trainers[4].battleNumber, 5);
	});
});
