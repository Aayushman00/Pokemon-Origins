const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	statAtLevel,
	pickMoves,
	hydrateFromSpecies,
	hydrateParty,
} = require("./hydrate");

const rattata = {
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
		{
			move_id: 98,
			move_name: "Quick-attack",
			power: 40,
			accuracy: 100,
			move_type: "Normal",
			level_learned: 4,
		},
		{
			move_id: 99,
			move_name: "Rage",
			power: 20,
			accuracy: 100,
			move_type: "Normal",
			level_learned: 7,
		},
	],
};

describe("campaign hydrate", () => {
	it("scales HP and other stats by level", () => {
		assert.equal(statAtLevel(30, 4, true), 16);
		assert.equal(statAtLevel(56, 4, false), 9);
	});

	it("picks the last four learnset moves at or below level", () => {
		const moves = pickMoves(rattata.learnset, 4);
		assert.equal(moves.length, 2);
		assert.equal(moves[0].name, "Tackle");
		assert.equal(moves[1].accuracy, 1);
		assert.equal(moves[1].move_id, 98);
	});

	it("builds a BattleSim-shaped pokemon", () => {
		const mon = hydrateFromSpecies({ pokemonId: 19, level: 4 }, rattata);
		assert.equal(mon.pokemon_id, 19);
		assert.equal(mon.nickname, "Rattata");
		assert.equal(mon.current_hp, mon.max_hp);
		assert.ok(mon.moves.length >= 1);
		assert.deepEqual(mon.types, ["Normal"]);
	});

	it("hydrates a party via injected lookup", async () => {
		const lookup = async (id) => {
			assert.equal(id, 19);
			return rattata;
		};
		const party = await hydrateParty([{ pokemonId: 19, level: 4 }], lookup);
		assert.equal(party.length, 1);
		assert.equal(party[0].pokemon_id, 19);
	});
});
