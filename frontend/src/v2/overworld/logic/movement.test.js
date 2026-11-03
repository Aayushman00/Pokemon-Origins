import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BUMP_TICKS, HOP_TICKS, RUN_TICKS, TURN_TICKS, WALK_TICKS } from "../constants.js";
import { asciiMap, worldOf } from "./fixtures.js";
import { actorFrame, actorPixel, actorPose, createActor, tickActor } from "./movement.js";
import { createWorld } from "./world.js";

// Timing rules mirror pret/pokefirered: src/field_player_avatar.c (input states,
// turn, collide, ledge) and src/event_object_movement.c (step speeds, jump arc).

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

// `input` is an object, or a function (tickIndex) -> object for scripted sequences.
function run(actor, input, ticks, ctxOver = {}) {
	const events = [];
	const trace = [];
	let a = actor;
	const ctx = { world, isBlocked: () => false, canMove: true, canRun: false, ...ctxOver };
	for (let i = 0; i < ticks; i++) {
		const r = tickActor(a, typeof input === "function" ? input(i) : input, ctx);
		a = r.actor;
		events.push(...r.events.map((e) => ({ ...e, tick: i + 1 })));
		trace.push(a);
	}
	return { a, events, trace };
}

const at = (x, y, facing = "down") => createActor({ mapId: "m", x, y, facing });
const pos = (a) => [a.x, a.y];

describe("step timing (event_object_movement.c step tables)", () => {
	it("walking covers one tile in exactly 16 ticks at 1 px per tick", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, 1 + WALK_TICKS);
		assert.equal(WALK_TICKS, 16);
		assert.equal(r.a.x, 2);
		const xs = r.trace.slice(0, WALK_TICKS).map((a) => actorPixel(a).px);
		assert.deepEqual(xs, Array.from({ length: 16 }, (_, i) => 16 + i)); // 16,17,...,31 then lands at 32
		assert.equal(actorPixel(r.a).px, 32);
	});

	it("running covers one tile in exactly 8 ticks at 2 px per tick", () => {
		const r = run(at(1, 1, "right"), { dir: "right", run: true }, 1 + RUN_TICKS, { canRun: true });
		assert.equal(RUN_TICKS, 8);
		assert.equal(r.a.x, 2);
		const steps = r.trace.slice(1, RUN_TICKS).map((a, i) => actorPixel(a).px - actorPixel(r.trace[i]).px);
		assert.ok(steps.every((d) => d === 2));
	});

	it("B does nothing without running shoes (canRun false)", () => {
		assert.equal(run(at(1, 1, "right"), { dir: "right", run: true }, 1 + RUN_TICKS * 3, { canRun: true }).a.x, 4);
		assert.equal(run(at(1, 1, "right"), { dir: "right", run: true }, 1 + RUN_TICKS * 3, { canRun: false }).a.x, 2);
	});

	it("holding a direction chains steps with no gap tick", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, 1 + WALK_TICKS * 3);
		assert.equal(r.a.x, 4);
		assert.ok(r.trace.every((a) => a.phase === "walk"));
	});

	it("releasing the key finishes the current step, then stops on the grid", () => {
		const r = run(at(1, 1, "right"), (i) => ({ dir: i < 3 ? "right" : null }), 40);
		assert.deepEqual(pos(r.a), [2, 1]);
		assert.equal(r.a.phase, "idle");
		assert.equal(actorPixel(r.a).px % 16, 0);
	});

	it("pixel positions are always whole numbers", () => {
		let a = at(1, 1, "right");
		const ctx = { world, isBlocked: () => false, canMove: true, canRun: true };
		for (let i = 0; i < 300; i++) {
			a = tickActor(a, { dir: ["right", "down", "left", "up"][(i / 70) | 0 % 4], run: i % 50 < 25 }, ctx).actor;
			const p = actorPixel(a);
			assert.ok(Number.isInteger(p.px) && Number.isInteger(p.py) && Number.isInteger(p.lift));
		}
	});
});

describe("turn in place (CheckMovementInputNotOnBike / PlayerTurnInPlace)", () => {
	it("a new direction from rest starts an 8-tick turn without moving", () => {
		const r = run(at(2, 1, "down"), { dir: "right" }, 1);
		assert.equal(TURN_TICKS, 8);
		assert.equal(r.a.phase, "turn");
		assert.equal(r.a.facing, "right");
		assert.deepEqual(pos(r.a), [2, 1]);
	});

	it("a tap released before the turn ends only turns", () => {
		const r = run(at(2, 1, "down"), (i) => ({ dir: i < TURN_TICKS ? "right" : null }), 40);
		assert.deepEqual(pos(r.a), [2, 1]);
		assert.equal(r.a.facing, "right");
		assert.equal(r.a.phase, "idle");
	});

	it("still holding when the turn ends walks on the same tick", () => {
		const r = run(at(2, 1, "down"), (i) => ({ dir: i <= TURN_TICKS ? "right" : null }), 1 + TURN_TICKS);
		assert.equal(r.a.phase, "walk");
		const done = run(at(2, 1, "down"), (i) => ({ dir: i <= TURN_TICKS ? "right" : null }), 1 + TURN_TICKS + WALK_TICKS);
		assert.deepEqual(pos(done.a), [3, 1]);
	});

	it("turn then walk takes 8 + 16 ticks to reach the next tile", () => {
		assert.deepEqual(pos(run(at(2, 1, "down"), { dir: "right" }, TURN_TICKS + WALK_TICKS).a), [2, 1]);
		assert.deepEqual(pos(run(at(2, 1, "down"), { dir: "right" }, 1 + TURN_TICKS + WALK_TICKS).a), [3, 1]);
	});

	it("the turn cannot be interrupted by another direction", () => {
		const r = run(at(2, 1, "down"), (i) => ({ dir: i === 0 ? "right" : "left" }), TURN_TICKS);
		assert.equal(r.a.phase, "turn");
		assert.equal(r.a.facing, "right");
	});

	it("changing direction while walking steps straight off with no turn", () => {
		const r = run(at(1, 1, "right"), (i) => ({ dir: i < WALK_TICKS ? "right" : "down" }), 1 + WALK_TICKS * 2);
		assert.ok(!r.trace.some((a) => a.phase === "turn"));
		assert.deepEqual(pos(r.a), [2, 2]);
	});

	it("scripted movers (noTurn) never turn in place", () => {
		const r = run(at(2, 1, "down"), { dir: "right" }, 1 + WALK_TICKS, { noTurn: true });
		assert.deepEqual(pos(r.a), [3, 1]);
	});
});

describe("collision (PlayerNotOnBikeCollide)", () => {
	it("bumping is a 32-tick walk in place with a bump event each cycle", () => {
		const r = run(at(1, 1, "left"), { dir: "left" }, 1 + BUMP_TICKS * 2);
		assert.equal(BUMP_TICKS, 32);
		assert.deepEqual(pos(r.a), [1, 1]);
		assert.deepEqual(r.events.filter((e) => e.type === "bump").map((e) => e.tick), [1, 33, 65]);
	});

	it("releasing the key lets the bump finish its 32 ticks", () => {
		const r = run(at(1, 1, "left"), (i) => ({ dir: i < 2 ? "left" : null }), BUMP_TICKS);
		assert.equal(r.a.phase, "bump");
		assert.equal(run(r.a, { dir: null }, 1).a.phase, "idle");
	});

	it("a different direction cuts the bump short and walks without turning", () => {
		const r = run(at(1, 1, "left"), (i) => ({ dir: i < 5 ? "left" : "right" }), 6);
		assert.equal(r.a.phase, "walk");
		assert.equal(r.a.facing, "right");
	});

	it("bump cycles through foot, stand, other foot, stand", () => {
		const r = run(at(1, 1, "left"), { dir: "left" }, BUMP_TICKS);
		const poses = [0, 8, 16, 24].map((t) => r.trace[t].phase === "bump" && actorPose(r.trace[t]));
		assert.equal(poses[1], "stand");
		assert.equal(poses[3], "stand");
		assert.ok(poses[0].startsWith("walk") && poses[2].startsWith("walk") && poses[0] !== poses[2]);
	});

	it("NPCs / blockers stop the player", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, 1 + WALK_TICKS * 2, { isBlocked: (ref) => ref.x === 3 && ref.y === 1 });
		assert.equal(r.a.x, 2);
		assert.ok(r.events.some((e) => e.type === "bump"));
	});

	it("does nothing while movement is locked (dialogue, cutscene)", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, 40, { canMove: false });
		assert.deepEqual(pos(r.a), [1, 1]);
	});
});

describe("ledges (PlayerJumpLedge, JUMP_2 high arc)", () => {
	it("jumps two tiles in 32 ticks, 1 px per tick", () => {
		const r = run(at(3, 2, "down"), { dir: "down" }, 1 + HOP_TICKS);
		assert.equal(HOP_TICKS, 32);
		assert.deepEqual(pos(r.a), [3, 4]);
		assert.deepEqual(r.events.filter((e) => e.type === "hop").map((e) => e.tick), [1]);
		assert.ok(r.events.some((e) => e.type === "stepEnd" && e.hop));
		const ys = r.trace.slice(0, HOP_TICKS).map((a) => actorPixel(a).py);
		assert.ok(ys.every((y, i) => i === 0 || y - ys[i - 1] === 1));
	});

	it("the arc rises to 12 px and lands at 0", () => {
		const r = run(at(3, 2, "down"), { dir: "down" }, HOP_TICKS);
		const lifts = r.trace.map((a) => actorPixel(a).lift);
		assert.equal(Math.max(...lifts), 12);
		assert.equal(lifts[1], 4);
		assert.equal(lifts[lifts.length - 1], 0);
		assert.equal(actorPixel(run(at(3, 2, "down"), { dir: "down" }, 1 + HOP_TICKS).a).lift, 0);
	});

	it("cannot climb a ledge from the wrong side", () => {
		const r = run(at(3, 4, "up"), { dir: "up" }, 40);
		assert.deepEqual(pos(r.a), [3, 4]);
		assert.ok(r.events.some((e) => e.type === "bump"));
	});

	it("is refused when the landing tile is blocked", () => {
		const r = run(at(3, 2, "down"), { dir: "down" }, 40, { isBlocked: (ref) => ref.y === 4 });
		assert.deepEqual(pos(r.a), [3, 2]);
	});
});

describe("walk animation (object_event_anims.h)", () => {
	it("a walk step shows a foot for 8 ticks, then stands for 8", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, WALK_TICKS);
		const poses = r.trace.map(actorPose);
		assert.ok(poses.slice(0, 8).every((p) => p === poses[0] && p.startsWith("walk")));
		assert.ok(poses.slice(8, 16).every((p) => p === "stand"));
	});

	it("feet alternate between consecutive steps", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, 1 + WALK_TICKS);
		assert.notEqual(actorPose(r.trace[0]), actorPose(r.trace[WALK_TICKS]));
		assert.notEqual(actorFrame(r.trace[0]), 0);
	});

	it("running uses run poses: run-stand 5 ticks, run-foot 3", () => {
		const r = run(at(1, 1, "right"), { dir: "right", run: true }, RUN_TICKS * 2, { canRun: true });
		const poses = r.trace.map(actorPose);
		assert.deepEqual(poses.slice(0, 8).map((p) => p.replace(/[AB]$/, "")), ["runStand", "runStand", "runStand", "runStand", "runStand", "run", "run", "run"]);
		assert.notEqual(poses[5], poses[13]);
	});

	it("stands when idle", () => {
		assert.equal(actorPose(at(1, 1)), "stand");
		assert.equal(actorFrame(at(1, 1)), 0);
	});
});

describe("step landing hooks", () => {
	it("halt callback stops step chaining at a landing tile", () => {
		const r = run(at(1, 1, "right"), { dir: "right" }, 1 + WALK_TICKS * 2, { halt: (a) => a.x === 3 });
		assert.equal(r.a.x, 3);
		assert.equal(r.a.phase, "idle");
	});
});
