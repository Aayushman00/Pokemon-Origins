const test = require("node:test");
const assert = require("node:assert/strict");
const { createFlags } = require("./flags");

test("flags default to off", () => {
	assert.deepEqual(createFlags({}).all(), { OVERWORLD: false, EXTRA_TRAINERS: false, CATCH: false });
});

test("FLAG_<NAME> accepts 1 and true only", () => {
	assert.equal(createFlags({ FLAG_OVERWORLD: "1" }).isEnabled("OVERWORLD"), true);
	assert.equal(createFlags({ FLAG_OVERWORLD: "true" }).isEnabled("OVERWORLD"), true);
	assert.equal(createFlags({ FLAG_OVERWORLD: "yes" }).isEnabled("OVERWORLD"), false);
	assert.equal(createFlags({ FLAG_OVERWORLD: "0" }).isEnabled("OVERWORLD"), false);
});

test("CATCH is a known flag, off by default", () => {
	assert.equal(createFlags({}).isEnabled("CATCH"), false);
	assert.equal(createFlags({ FLAG_CATCH: "1" }).isEnabled("CATCH"), true);
});

test("unknown flags are off", () => {
	assert.equal(createFlags({ FLAG_NOPE: "1" }).isEnabled("NOPE"), false);
});
