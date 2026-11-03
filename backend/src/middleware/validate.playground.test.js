const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { playgroundExchangeSchema } = require("./validate");

function validMon(overrides = {}) {
	return {
		pokemonId: 4,
		level: 50,
		moveId: 52,
		status: "Healthy",
		hpPercent: 100,
		stages: {},
		...overrides,
	};
}

describe("playgroundExchangeSchema", () => {
	it("accepts a minimal valid payload", () => {
		const result = playgroundExchangeSchema.safeParse({
			monA: validMon(),
			monB: validMon({ pokemonId: 7, moveId: 33 }),
		});
		assert.equal(result.success, true);
	});

	it("rejects a stat stage outside -6..6", () => {
		const result = playgroundExchangeSchema.safeParse({
			monA: validMon({ stages: { atk: 7 } }),
			monB: validMon({ pokemonId: 7, moveId: 33 }),
		});
		assert.equal(result.success, false);
	});

	it("rejects an invalid status value", () => {
		const result = playgroundExchangeSchema.safeParse({
			monA: validMon({ status: "confused" }),
			monB: validMon({ pokemonId: 7, moveId: 33 }),
		});
		assert.equal(result.success, false);
	});

	it("defaults status to Healthy and hpPercent to 100 when omitted", () => {
		const result = playgroundExchangeSchema.safeParse({
			monA: { pokemonId: 4, level: 50, moveId: 52 },
			monB: { pokemonId: 7, level: 5, moveId: 33 },
		});
		assert.equal(result.success, true);
		assert.equal(result.data.monA.status, "Healthy");
		assert.equal(result.data.monA.hpPercent, 100);
	});

	it("rejects hpPercent above 100 or below 0", () => {
		const result = playgroundExchangeSchema.safeParse({
			monA: validMon({ hpPercent: 150 }),
			monB: validMon({ pokemonId: 7, moveId: 33 }),
		});
		assert.equal(result.success, false);
	});

	it("accepts explicit null for an RNG override (the frontend's 'Normal RNG' state)", () => {
		const result = playgroundExchangeSchema.safeParse({
			monA: validMon({ forceHit: null, forceCrit: null, forceSecondary: null }),
			monB: validMon({ pokemonId: 7, moveId: 33 }),
		});
		assert.equal(result.success, true);
	});

	it("accepts tri-state RNG overrides (true/false/omitted)", () => {
		const result = playgroundExchangeSchema.safeParse({
			monA: validMon({ forceHit: true, forceCrit: false }),
			monB: validMon({ pokemonId: 7, moveId: 33 }),
		});
		assert.equal(result.success, true);
		assert.equal(result.data.monA.forceHit, true);
		assert.equal(result.data.monA.forceCrit, false);
		assert.equal(result.data.monA.forceSecondary, undefined);
	});
});
