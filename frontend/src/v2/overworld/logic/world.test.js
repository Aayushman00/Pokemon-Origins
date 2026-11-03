import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { asciiMap, worldOf } from "./fixtures.js";
import { createActor, tickActor } from "./movement.js";
import { createWorld, neighbourOrigin } from "./world.js";

const a = asciiMap("a", ["....", "....", "...."], { props: { connect_north: "b", connect_north_offset: 2, connect_east: "c", connect_east_offset: 1 } });
const b = asciiMap("b", ["......", "......"], { props: { connect_south: "a", connect_south_offset: -2 } });
const c = asciiMap("c", ["..", "..", "..", ".."]);
const w = createWorld(worldOf(a, b, c).get);

describe("edge connections", () => {
	it("resolves inside the map to itself", () => {
		assert.equal(w.resolve("a", 1, 1).mapId, "a");
	});
	it("maps north edge into the neighbour with the offset applied", () => {
		const r = w.resolve("a", 2, -1);
		assert.deepEqual([r.mapId, r.x, r.y], ["b", 0, 1]);
	});
	it("maps east edge into the neighbour using the y offset", () => {
		const r = w.resolve("a", 4, 2);
		assert.deepEqual([r.mapId, r.x, r.y], ["c", 0, 1]);
	});
	it("is the inverse from the other side", () => {
		const r = w.resolve("b", 0, 2);
		assert.deepEqual([r.mapId, r.x, r.y], ["a", 2, 0]);
	});
	it("returns null with no connection, outside the overlap, or when the neighbour is not loaded", () => {
		assert.equal(w.resolve("a", -1, 1), null);
		assert.equal(w.resolve("a", 0, -1), null); // x - offset = -2: outside b
		assert.equal(createWorld(worldOf(a).get).resolve("a", 2, -1), null);
	});
	it("places neighbours in pixel space", () => {
		assert.deepEqual(neighbourOrigin(a, "north", b), { x: 32, y: -32 });
		assert.deepEqual(neighbourOrigin(a, "east", c), { x: 64, y: 16 });
	});
	it("walking across an edge rebases the actor onto the neighbour and reports a mapChange", () => {
		let actor = createActor({ mapId: "a", x: 2, y: 0, facing: "up" });
		const ctx = { world: w, isBlocked: () => false, canMove: true, canRun: false };
		const events = [];
		for (let i = 0; i < 40; i++) {
			const r = tickActor(actor, { dir: "up" }, ctx);
			actor = r.actor;
			events.push(...r.events);
		}
		assert.equal(events.filter((e) => e.type === "mapChange").length, 1);
		assert.equal(actor.mapId, "b");
	});
});
