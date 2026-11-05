const test = require("node:test");
const assert = require("node:assert/strict");
const { createWorldService, createMemoryWorldStore, storyFlag } = require("./worldService");

const make = () => {
	const store = createMemoryWorldStore();
	return { store, world: createWorldService({ store }) };
};

test("a new trainer has no saved place", async () => {
	const { world } = make();
	assert.deepEqual(await world.getState(1), { position: null, heal: null });
});

test("position is per trainer and the last save wins", async () => {
	const { world } = make();
	await world.savePosition(1, { mapId: "route_1", x: 3, y: 4, facing: "up" });
	await world.savePosition(1, { mapId: "mossgate", x: 5, y: 6, facing: "left" });
	assert.deepEqual((await world.getState(1)).position, { mapId: "mossgate", x: 5, y: 6, facing: "left" });
	assert.equal((await world.getState(2)).position, null);
});

test("healing restores the party and remembers where, for the next whiteout", async () => {
	const { world, store } = make();
	await world.heal(1, { mapId: "mossgate_center", x: 7, y: 4 });
	assert.deepEqual(store.healed, [1]);
	assert.deepEqual((await world.getState(1)).heal, { mapId: "mossgate_center", x: 7, y: 4 });
});

test("saving a position keeps the healing spot", async () => {
	const { world } = make();
	await world.heal(1, { mapId: "mossgate_center", x: 7, y: 4 });
	await world.savePosition(1, { mapId: "route_1", x: 3, y: 4, facing: "up" });
	assert.equal((await world.getState(1)).heal.mapId, "mossgate_center");
});

test("clients may only write story flags, never wins or solves", () => {
	assert.ok(storyFlag("done:mossgate:gate"));
	assert.ok(storyFlag("story:champion"));
	for (const flag of ["trainer:kestrel_vane", "gym:mara_quill:solved", "done", "storyline:x", ""]) assert.equal(storyFlag(flag), false, flag);
});
