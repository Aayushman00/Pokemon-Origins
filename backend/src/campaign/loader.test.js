const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const {
	loadLevel,
	listBattles,
	countBattles,
	getTrainer,
	resetCache,
} = require("./loader");
const { CampaignError } = require("./errors");

describe("campaign loader", () => {
	before(() => resetCache());

	it("loads Level 1 with ordered battles", () => {
		const level = loadLevel(1);
		assert.equal(level.level, 1);
		assert.equal(level.name, "Pewter City");
		assert.equal(level.battles.length, 5);
		assert.deepEqual(
			level.battles.map((b) => b.battleNumber),
			[1, 2, 3, 4, 5]
		);
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
		assert.equal(level.battles[0].type, "trainer");
		assert.equal(level.battles[4].type, "gym_boss");
	});

	it("countBattles returns Level 1 length", () => {
		assert.equal(countBattles(1), 5);
	});

	it("resolves Level 1 trainer catalogs", () => {
		const joey = getTrainer("youngster_joey");
		assert.equal(joey.party[0].pokemonId, 19);
		assert.equal(joey.party[0].level, 4);
		const brock = getTrainer("brock");
		assert.equal(brock.title, "Gym Leader");
		assert.equal(brock.party.length, 2);
		assert.equal(brock.party[0].pokemonId, 74);
		assert.equal(brock.party[1].pokemonId, 95);
	});

	it("listBattles attaches trainer identity without stats", () => {
		const battles = listBattles(1);
		assert.equal(battles[0].trainer.name, "Youngster Joey");
		assert.equal(battles[0].trainer.party[0].pokemonId, 19);
		assert.equal(battles[0].trainer.party[0].max_hp, undefined);
	});

	it("fails clearly for a missing level", () => {
		assert.throws(() => loadLevel(99), (err) => {
			assert.equal(err instanceof CampaignError, true);
			assert.equal(err.status, 404);
			assert.match(err.message, /not configured/);
			return true;
		});
	});

	it("fails clearly for an unknown trainer id", () => {
		assert.throws(() => getTrainer("missing_npc"), (err) => {
			assert.equal(err.status, 500);
			assert.match(err.message, /Unknown trainerId/);
			return true;
		});
	});
});
