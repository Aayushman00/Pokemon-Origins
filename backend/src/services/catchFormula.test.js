const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { catchValue, rollCatch, catchRateOf, DEFAULT_CATCH_RATE } = require("./catchFormula");

describe("catch rates", () => {
	it("cover the Gen 1 dex with known anchors", () => {
		const rates = require("../../data/catch_rates.json");
		assert.equal(Object.keys(rates).length, 151);
		for (const r of Object.values(rates)) assert.ok(r >= 3 && r <= 255);
		assert.deepEqual([rates[16], rates[150], rates[143]], [255, 3, 25]); // Pidgey, Mewtwo, Snorlax
		assert.equal(catchRateOf(16), 255);
	});

	it("unknown species fall back to 45", () => {
		assert.equal(DEFAULT_CATCH_RATE, 45);
		assert.equal(catchRateOf(9999), 45);
	});
});

describe("Gen 3 catch formula", () => {
	it("a = floor((3M-2H)*rate*ball/(3M)) * status", () => {
		assert.equal(catchValue({ maxHp: 100, hp: 100, rate: 45, ballBonus: 1, status: null }), 15);
		assert.equal(catchValue({ maxHp: 100, hp: 100, rate: 45, ballBonus: 1, status: "slp" }), 30);
		assert.equal(catchValue({ maxHp: 100, hp: 100, rate: 45, ballBonus: 1, status: "frz" }), 30);
		assert.equal(catchValue({ maxHp: 100, hp: 100, rate: 45, ballBonus: 1, status: "par" }), 22);
		assert.equal(catchValue({ maxHp: 100, hp: 1, rate: 45, ballBonus: 2, status: null }), 89);
	});

	it("a >= 255 catches without rolling", () => {
		const r = rollCatch({ maxHp: 40, hp: 1, rate: 255, ballBonus: 2, status: null, random: () => { throw new Error("rolled"); } });
		assert.deepEqual(r, { shakes: 3, caught: true });
	});

	it("four passed checks catch; shakes count passed checks, capped at 3", () => {
		const seq = (...xs) => () => xs.shift();
		const base = { maxHp: 100, hp: 50, rate: 45, ballBonus: 1, status: null };
		assert.deepEqual(rollCatch({ ...base, random: seq(0, 0, 0, 0) }), { shakes: 3, caught: true });
		assert.deepEqual(rollCatch({ ...base, random: seq(0, 0, 0.999) }), { shakes: 2, caught: false });
		assert.deepEqual(rollCatch({ ...base, random: seq(0.999) }), { shakes: 0, caught: false });
	});
});
