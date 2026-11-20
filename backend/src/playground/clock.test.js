const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { timeOfDay, createSkyWatch } = require("./clock");

const at = (h, m = 0) => new Date(2026, 10, 20, h, m);

describe("park clock", () => {
	it("day runs 06:00 to 17:59, night the rest", () => {
		assert.equal(timeOfDay(at(5, 59)), "night");
		assert.equal(timeOfDay(at(6, 0)), "day");
		assert.equal(timeOfDay(at(17, 59)), "day");
		assert.equal(timeOfDay(at(18, 0)), "night");
		assert.equal(timeOfDay(at(0, 0)), "night");
	});

	it("the sky watch reports a flip once, and only when it happens", () => {
		let time = "day";
		const flips = [];
		const sky = createSkyWatch({ getTime: () => time, onFlip: (t) => flips.push(t) });
		assert.equal(sky.current(), "day");
		sky.check();
		assert.deepEqual(flips, []);
		time = "night";
		sky.check();
		assert.deepEqual(flips, ["night"]);
		sky.check();
		assert.deepEqual(flips, ["night"]);
		assert.equal(sky.current(), "night");
	});
});
