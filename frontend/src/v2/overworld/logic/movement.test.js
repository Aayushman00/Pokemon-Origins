import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BUMP_TICKS, RUN_TICKS, TURN_TICKS, WALK_TICKS } from "../constants.js";
import { asciiMap, worldOf } from "./fixtures.js";
import { actorFrame, actorPixel, createActor, tickActor } from "./movement.js";
import { createWorld } from "./world.js";

const map = asciiMap("m", [
	"##########",
	"#........#",
	"#...#....#",
	"#..v.....#",
	"#........#",
	"#........#",
	"##########",
]);
const world = createWorld(worldOf(map).get);

function run(actor, input, ticks, ctxOver = {}) {
	const events = [];
	let a = actor;
	const ctx = { world, isBlocked: () => false, canMove: true, canRun: false, ...ctxOver };
	for (let i = 0; i < ticks; i++) {
		const r = tickActor(a, input, ctx);
		a = r.actor;
		events.push(...r.events);
	}
	return { a, events };
}

const at = (x, y, facing = "down") => createActor({ mapId: "m", x, y, facing });

describe("tile movement", () => {
	it("a short tap turns in place without moving", () => {
		const t1 = run(at(2, 1, "down"), { dir: "right" }, 1);
		assert.equal(t1.a.facing, "right");
		assert.equal(t1.a.phase, "turn");
		const done = run(t1.a, { dir: null }, TURN_TICKS + 2);
		assert.deepEqual([done.a.x, done.a.y], [2, 1]);
		assert.equal(done.a.phase, "idle");
	});

	it("holding a new direction turns, then walks after the turn delay", () => {
		const r = run(at(2, 1, "down"), { dir: "right" }, TURN_TICKS + WALK_TICKS + 2); // +1 tick to start the turn, +1 to start the step
		assert.deepEqual([r.a.x, r.a.y], [3, 1]);
	});

	it("walks exactly one tile per WALK_TICKS when holding the facing direction", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, WALK_TICKS * 3 + 1); // the first step needs one starting tick
		assert.equal(r.a.x, 4);
	});

	it("runs at twice the speed only when running shoes are allowed", () => {
		assert.equal(run(at(1, 1, "right"), { dir: "right", run: true }, RUN_TICKS * 3 + 1, { canRun: true }).a.x, 4);
		assert.equal(run(at(1, 1, "right"), { dir: "right", run: true }, RUN_TICKS * 3 + 1, { canRun: false }).a.x, 2 + 0);
	});

	it("bumps on a wall, emits a bump event, and repeats while held", () => {
		const r = run(at(1, 1, "left"), { dir: "left" }, BUMP_TICKS * 2 + 1);
		assert.deepEqual([r.a.x, r.a.y], [1, 1]);
		assert.ok(r.events.filter((e) => e.type === "bump").length >= 2);
	});

	it("releasing the key stops the bump immediately", () => {
		const bumped = run(at(1, 1, "left"), { dir: "left" }, 3).a;
		assert.equal(bumped.phase, "bump");
		assert.equal(run(bumped, { dir: null }, 1).a.phase, "idle");
	});

	it("NPCs / blockers stop the player", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, WALK_TICKS * 2, { isBlocked: (ref) => ref.x === 3 && ref.y === 1 });
		assert.equal(r.a.x, 2);
		assert.ok(r.events.some((e) => e.type === "bump"));
	});

	it("hops a one-way ledge two tiles in its direction", () => {
		const r = run(at(3, 2, "down"), { dir: "down" }, 33);
		assert.deepEqual([r.a.x, r.a.y], [3, 4]);
		assert.ok(r.events.some((e) => e.type === "hop"));
	});

	it("cannot climb a ledge from the wrong side", () => {
		const r = run(at(3, 4, "up"), { dir: "up" }, 40);
		assert.deepEqual([r.a.x, r.a.y], [3, 4]);
	});

	it("a ledge hop is refused when the landing tile is blocked", () => {
		const r = run(at(3, 2, "down"), { dir: "down" }, 40, { isBlocked: (ref) => ref.y === 4 });
		assert.deepEqual([r.a.x, r.a.y], [3, 2]);
	});

	it("does nothing while movement is locked (dialogue, cutscene)", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, 40, { canMove: false });
		assert.deepEqual([r.a.x, r.a.y], [1, 1]);
	});

	it("halt callback stops step chaining at a landing tile", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, WALK_TICKS * 2 + 1, { halt: (a) => a.x === 3 });
		assert.equal(r.a.x, 3);
		assert.equal(r.a.phase, "idle");
	});

	it("pixel positions are always whole numbers (no sub-pixel camera)", () => {
		let a = at(1, 1, "right");
		const ctx = { world, isBlocked: () => false, canMove: true, canRun: true };
		for (let i = 0; i < 200; i++) {
			a = tickActor(a, { dir: i % 90 < 60 ? "right" : "down", run: i % 50 < 25 }, ctx).actor;
			const p = actorPixel(a);
			assert.ok(Number.isInteger(p.px) && Number.isInteger(p.py) && Number.isInteger(p.lift));
		}
	});

	it("a full tile of walking moves exactly 16 pixels", () => {
		let a = at(1, 1, "right");
		const ctx = { world, isBlocked: () => false, canMove: true, canRun: false };
		const start = actorPixel(a).px;
		for (let i = 0; i < WALK_TICKS + 1; i++) a = tickActor(a, { dir: "right" }, ctx).actor;
		assert.equal(actorPixel(a).px - start, 16);
	});

	it("walk frames alternate feet between steps", () => {
		const ctx = { world, isBlocked: () => false, canMove: true, canRun: false };
		let a = tickActor(at(1, 1, "right"), { dir: "right" }, ctx).actor;
		a = tickActor(a, { dir: "right" }, ctx).actor;
		const f1 = actorFrame(a);
		for (let i = 0; i < WALK_TICKS; i++) a = tickActor(a, { dir: "right" }, ctx).actor;
		const f2 = actorFrame(a);
		assert.notEqual(f1, 0);
		assert.notEqual(f1, f2);
	});
});
