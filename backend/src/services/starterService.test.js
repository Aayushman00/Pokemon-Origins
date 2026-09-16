const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createStarterService } = require("./starterService");
const { statAtLevel } = require("../campaign/hydrate");
const starterStats = require("../starterStats");
const {
	createPartyService,
	createMemoryPartyStore,
} = require("./partyService");

function nonStarter(position, pokemonId = 16) {
	return {
		position,
		pokemon_id: pokemonId,
		nickname: `Mon${position}`,
		level: 5,
		current_hp: 20,
		max_hp: 20,
		attack: 10,
		defense: 10,
		speed: 12,
		special_atk: 8,
		special_def: 8,
		experience: 0,
		status: "Healthy",
		moves: [],
	};
}

function makeStarterService(initialRows = {}) {
	const party = createPartyService({
		store: createMemoryPartyStore(initialRows),
	});
	return { starter: createStarterService({ party }), party };
}

describe("starterService", () => {
	it("allows choosing a starter with an empty party", async () => {
		const { starter, party } = makeStarterService();
		const result = await starter.chooseStarter(1, "charmander");
		assert.equal(result.chosenPokemon, "charmander");
		const rows = await party.getPartyRows(1);
		assert.equal(rows.length, 1);
		assert.equal(rows[0].pokemon_id, 4);
		assert.equal(rows[0].position, 1);
		assert.ok(rows[0].moves.length >= 1);
	});

	it("rejects an invalid starter species", async () => {
		const { starter } = makeStarterService();
		await assert.rejects(
			() => starter.chooseStarter(1, "pikachu"),
			(err) => err.status === 400 && /Invalid starter choice/.test(err.message)
		);
	});

	it("rejects a duplicate starter even with party space left", async () => {
		const { starter } = makeStarterService();
		await starter.chooseStarter(1, "squirtle");
		await assert.rejects(
			() => starter.chooseStarter(1, "charmander"),
			(err) =>
				err.status === 400 && /Starter already chosen/.test(err.message)
		);
	});

	it("allows one starter when the party has only non-starters", async () => {
		const { starter, party } = makeStarterService({
			1: [nonStarter(1, 16), nonStarter(2, 19)],
		});
		await starter.chooseStarter(1, "bulbasaur");
		const rows = await party.getPartyRows(1);
		assert.equal(rows.length, 3);
		assert.equal(rows[2].pokemon_id, 1);
		assert.equal(rows[2].position, 3);
	});

	it("rejects a starter when the party is already full", async () => {
		const { starter } = makeStarterService({
			1: [nonStarter(1, 16), nonStarter(2, 19), nonStarter(3, 10)],
		});
		await assert.rejects(
			() => starter.chooseStarter(1, "bulbasaur"),
			(err) => err.status === 400 && /Party is full/.test(err.message)
		);
	});

	it("scales starter stats with statAtLevel instead of storing raw base stats", async () => {
		const { starter, party } = makeStarterService();
		await starter.chooseStarter(1, "charmander");
		const rows = await party.getPartyRows(1);
		const raw = starterStats.charmander;
		const mon = rows[0];
		assert.equal(mon.level, raw.level);
		assert.equal(mon.attack, statAtLevel(raw.attack, raw.level, false));
		assert.equal(mon.defense, statAtLevel(raw.defense, raw.level, false));
		assert.equal(mon.speed, statAtLevel(raw.speed, raw.level, false));
		assert.equal(
			mon.special_atk,
			statAtLevel(raw.special_atk, raw.level, false)
		);
		assert.equal(
			mon.special_def,
			statAtLevel(raw.special_def, raw.level, false)
		);
		const maxHp = statAtLevel(raw.max_hp, raw.level, true);
		assert.equal(mon.max_hp, maxHp);
		assert.equal(mon.current_hp, maxHp);
		// Sanity: the fix must actually lower stats vs. the unscaled raw values.
		assert.ok(mon.attack < raw.attack);
	});
});
