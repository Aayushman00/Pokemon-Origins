const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createPvpPartyLoader } = require("./party");

const BASE = { hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 };
const row = (position, extra = {}) => ({
	id: 100 + position, pokemon_id: 4, nickname: `Mon${position}`, level: 12, current_hp: 3, max_hp: 30,
	attack: 9, defense: 9, speed: 9, special_atk: 9, special_def: 9, status: "brn", position,
	types: ["Fire"], ability: "blaze", gender: "male",
	moves: [{ move_id: 1, name: "Scratch", pp: 35, current_pp: 2 }], ...extra,
});
const loader = (rows) => createPvpPartyLoader({ getTrainerData: async () => ({ pokemon: rows }), getBaseStats: async () => BASE });

describe("pvp party loader", () => {
	it("scales every mon to level 50 from base stats, full HP/PP, no status", async () => {
		const [m] = await loader([row(1)])(7);
		assert.equal(m.level, 50);
		assert.equal(m.max_hp, 99); // floor(2*39*50/100)+50+10
		assert.equal(m.current_hp, 99);
		assert.equal(m.attack, 57); // floor(2*52*50/100)+5
		assert.equal(m.special_atk, 65);
		assert.equal(m.special_def, 55);
		assert.equal(m.speed, 70);
		assert.equal(m.status, null);
		assert.equal(m.moves[0].current_pp, 35);
		assert.deepEqual([m.nickname, m.types, m.ability, m.gender], ["Mon1", ["Fire"], "blaze", "male"]);
	});
	it("does not mutate the source rows", async () => {
		const src = row(1);
		await loader([src])(7);
		assert.equal(src.moves[0].current_pp, 2);
		assert.equal(src.level, 12);
	});
	it("caps at 6, lowest positions first", async () => {
		const party = await loader([7, 3, 1, 2, 6, 5, 4].map((p) => row(p)))(7);
		assert.deepEqual(party.map((m) => m.position), [1, 2, 3, 4, 5, 6]);
	});
	it("returns [] for an empty party", async () => {
		assert.deepEqual(await loader([])(7), []);
	});
});
