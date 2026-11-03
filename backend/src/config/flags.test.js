const test = require("node:test");
const assert = require("node:assert/strict");
const { createFlags } = require("./flags");

test("flags default to off", () => {
	assert.deepEqual(createFlags({}).all(), { OVERWORLD: false });
});

test("FLAG_<NAME> accepts 1 and true only", () => {
	assert.equal(createFlags({ FLAG_OVERWORLD: "1" }).isEnabled("OVERWORLD"), true);
	assert.equal(createFlags({ FLAG_OVERWORLD: "true" }).isEnabled("OVERWORLD"), true);
	assert.equal(createFlags({ FLAG_OVERWORLD: "yes" }).isEnabled("OVERWORLD"), false);
	assert.equal(createFlags({ FLAG_OVERWORLD: "0" }).isEnabled("OVERWORLD"), false);
});

test("unknown flags are off", () => {
	assert.equal(createFlags({ FLAG_NOPE: "1" }).isEnabled("NOPE"), false);
});
