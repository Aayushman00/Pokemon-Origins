// backend/src/playground/roomState.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createRoomState, colorFor } = require("./roomState");

describe("colorFor", () => {
	it("is deterministic for the same trainerId", () => {
		assert.equal(colorFor(7), colorFor(7));
	});

	it("returns a hex color string", () => {
		assert.match(colorFor(3), /^#[0-9A-Fa-f]{6}$/);
	});

	it("handles a guest string trainerId deterministically", () => {
		assert.match(colorFor("guest-abc123"), /^#[0-9A-Fa-f]{6}$/);
		assert.equal(colorFor("guest-abc123"), colorFor("guest-abc123"));
	});
});

describe("createRoomState", () => {
	it("addPlayer stores a player with the derived initial and color", () => {
		const room = createRoomState();
		const state = room.addPlayer(1, "Ash", { x: 400, y: 300 });
		assert.equal(state.trainerId, 1);
		assert.equal(state.name, "Ash");
		assert.equal(state.initial, "A");
		assert.equal(state.color, colorFor(1));
		assert.equal(state.x, 400);
		assert.equal(state.y, 300);
	});

	it("getPlayer returns the stored player", () => {
		const room = createRoomState();
		room.addPlayer(2, "Misty", { x: 0, y: 0 });
		const found = room.getPlayer(2);
		assert.equal(found.name, "Misty");
	});

	it("getPlayer returns null for an unknown trainerId", () => {
		const room = createRoomState();
		assert.equal(room.getPlayer(999), null);
	});

	it("updatePosition mutates x/y for an existing player", () => {
		const room = createRoomState();
		room.addPlayer(3, "Brock", { x: 0, y: 0 });
		const updated = room.updatePosition(3, 55, 66);
		assert.equal(updated.x, 55);
		assert.equal(updated.y, 66);
		assert.equal(room.getPlayer(3).x, 55);
	});

	it("updatePosition returns null for an unknown trainerId", () => {
		const room = createRoomState();
		assert.equal(room.updatePosition(999, 1, 1), null);
	});

	it("removePlayer removes the player from listPlayers", () => {
		const room = createRoomState();
		room.addPlayer(4, "Gary", { x: 0, y: 0 });
		room.removePlayer(4);
		assert.equal(room.getPlayer(4), null);
		assert.deepEqual(room.listPlayers(), []);
	});

	it("listPlayers reflects all currently-added players", () => {
		const room = createRoomState();
		room.addPlayer(5, "May", { x: 1, y: 1 });
		room.addPlayer(6, "Max", { x: 2, y: 2 });
		const ids = room.listPlayers().map((p) => p.trainerId).sort();
		assert.deepEqual(ids, [5, 6]);
	});

	it("two separate createRoomState() instances do not share state", () => {
		const roomA = createRoomState();
		const roomB = createRoomState();
		roomA.addPlayer(1, "Ash", { x: 0, y: 0 });
		assert.equal(roomB.getPlayer(1), null);
	});
});
