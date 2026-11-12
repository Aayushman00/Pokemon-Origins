const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const {
	loadLevel,
	listBattles,
	countBattles,
	getTrainer,
	findTrainerBattle,
	getWildTable,
	resetCache,
} = require("./loader");
const { CampaignError } = require("./errors");

describe("campaign loader", () => {
	before(() => resetCache());

	it("loads Level 1 with ordered battles", () => {
		const level = loadLevel(1);
		assert.equal(level.level, 1);
		assert.equal(level.name, "Mossgate Grove");
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
				"willow_thornby",
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
		const leader = getTrainer("willow_thornby");
		assert.equal(leader.title, "Gym Leader");
		assert.equal(leader.party.length, 2);
		assert.equal(leader.party[0].pokemonId, 69);
		assert.equal(leader.party[1].pokemonId, 102);
	});

	it("listBattles attaches trainer identity without stats", () => {
		const battles = listBattles(1);
		assert.equal(battles[0].trainer.name, "Youngster Joey");
		assert.equal(battles[0].trainer.party[0].pokemonId, 19);
		assert.equal(battles[0].trainer.party[0].max_hp, undefined);
	});

	it("finds a legendary by its encounter id, as the Hollow Lab asks for it", () => {
		assert.deepEqual(findTrainerBattle("zapdos"), { level: 10, battleNumber: 2, type: "legendary" });
	});

	it("has a wild table for every route, opening with that route's stage", () => {
		for (let n = 1; n <= 9; n++) {
			const table = getWildTable(`route_${n}`);
			assert.equal(table.minLevel, n);
			assert.ok(table.slots.length >= 2 && table.levels[0] <= table.levels[1], `route_${n}`);
		}
		assert.equal(getWildTable("nowhere"), null);
		for (const key of ["__proto__", "constructor", "toString"]) assert.equal(getWildTable(key), null, key);
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
