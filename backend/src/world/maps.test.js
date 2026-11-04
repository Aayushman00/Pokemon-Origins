const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { canStand, getMap } = require("./maps");

describe("world map index", () => {
	it("loads a map by id and returns null for an unknown one", () => {
		assert.equal(getMap("mossgate_center").width, 15);
		assert.equal(getMap("nowhere"), null);
		assert.equal(getMap("constructor"), null);
	});
	it("canStand allows free tiles only", () => {
		const map = getMap("mossgate_center");
		const free = map.collision.findIndex((row) => row.includes("0"));
		const x = map.collision[free].indexOf("0");
		assert.equal(canStand("mossgate_center", x, free), true);
		const solidRow = map.collision.findIndex((row) => row.includes("1"));
		assert.equal(canStand("mossgate_center", map.collision[solidRow].indexOf("1"), solidRow), false);
	});
	it("canStand rejects anything off the map, non-integers and unknown maps", () => {
		assert.equal(canStand("mossgate_center", -1, 0), false);
		assert.equal(canStand("mossgate_center", 0, 999), false);
		assert.equal(canStand("mossgate_center", 1.5, 1), false);
		assert.equal(canStand("mossgate_center", "1", 1), false);
		assert.equal(canStand("nowhere", 1, 1), false);
	});
});
