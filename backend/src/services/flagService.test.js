const test = require("node:test");
const assert = require("node:assert/strict");
const { createFlagService, createMemoryFlagStore } = require("./flagService");

const make = () => createFlagService({ store: createMemoryFlagStore() });

test("flags are per trainer, idempotent, and sorted", async () => {
	const s = make();
	await s.setFlag(1, "met_sage");
	await s.setFlag(1, "met_sage");
	await s.setFlag(1, "done:test_town:glow");
	await s.setFlag(2, "other");
	assert.deepEqual(await s.listFlags(1), ["done:test_town:glow", "met_sage"]);
	assert.deepEqual(await s.listFlags(2), ["other"]);
	assert.deepEqual(await s.listFlags(3), []);
});

test("story:starter is derived from owning a Pokemon, never stored", async () => {
	const owners = new Set([1]);
	const s = createFlagService({ store: createMemoryFlagStore(), hasStarter: async (id) => owners.has(id) });
	await s.setFlag(1, "met_sage");
	assert.deepEqual(await s.listFlags(1), ["met_sage", "story:starter"]);
	assert.deepEqual(await s.listFlags(2), []);
	owners.delete(1); // a reset empties the party
	assert.deepEqual(await s.listFlags(1), ["met_sage"]);
});

test("rejects malformed flag names", async () => {
	const s = make();
	for (const bad of ["", "a b", "x".repeat(65), "drop;table", null, 5]) {
		await assert.rejects(() => s.setFlag(1, bad), (e) => e.status === 400);
	}
});
