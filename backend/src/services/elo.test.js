const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { rate, expected, dayKey, RATED_PER_PAIR_PER_DAY } = require("./elo");

describe("elo", () => {
	it("even players swap K/2", () => {
		assert.equal(expected(1000, 1000), 0.5);
		assert.deepEqual(rate(1000, 1000, 1), { a: 1016, b: 984, delta: 16, rated: true });
	});
	it("upset earns far more than beating a weak alt", () => {
		const upset = rate(1000, 1400, 1).delta;
		const farm = rate(1400, 1000, 1).delta;
		assert.ok(upset >= 29 && farm <= 3, `${upset} vs ${farm}`);
	});
	it("zero-sum, draws pull toward each other", () => {
		const r = rate(1200, 1000, 0.5);
		assert.equal(r.a + r.b, 2200);
		assert.ok(r.a < 1200);
	});
	it("same pair stops rating after the daily cap", () => {
		assert.equal(rate(1000, 1000, 1, RATED_PER_PAIR_PER_DAY - 1).rated, true);
		assert.deepEqual(rate(1000, 1000, 1, RATED_PER_PAIR_PER_DAY), { a: 1000, b: 1000, delta: 0, rated: false });
	});
	it("day key is UTC date", () => {
		assert.equal(dayKey(Date.UTC(2026, 10, 20, 23, 59)), "2026-11-20");
	});
});
