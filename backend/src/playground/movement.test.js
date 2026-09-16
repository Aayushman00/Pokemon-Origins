// backend/src/playground/movement.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { resolveMove, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC, clamp } = require("./movement");

describe("clamp", () => {
	it("passes values already in range through unchanged", () => {
		assert.equal(clamp(50, 0, 100), 50);
	});

	it("clamps below the minimum", () => {
		assert.equal(clamp(-10, 0, 100), 0);
	});

	it("clamps above the maximum", () => {
		assert.equal(clamp(150, 0, 100), 100);
	});
});

describe("resolveMove", () => {
	it("moves directly to a target within bounds and within the speed limit", () => {
		const result = resolveMove({ x: 100, y: 100 }, { x: 110, y: 100 }, 1000);
		assert.deepEqual(result, { x: 110, y: 100 });
	});

	it("clamps a target outside the room bounds to the boundary", () => {
		const result = resolveMove({ x: 10, y: 10 }, { x: -50, y: ROOM_HEIGHT + 200 }, 1000);
		assert.deepEqual(result, { x: 0, y: ROOM_HEIGHT });
	});

	it("clamps an out-of-bounds target on the far edge too", () => {
		const result = resolveMove(
			{ x: ROOM_WIDTH - 10, y: ROOM_HEIGHT - 10 },
			{ x: ROOM_WIDTH + 500, y: ROOM_HEIGHT + 500 },
			1000
		);
		assert.deepEqual(result, { x: ROOM_WIDTH, y: ROOM_HEIGHT });
	});

	it("caps displacement exceeding the max speed along the direction of travel", () => {
		const current = { x: 0, y: 0 };
		const target = { x: 700, y: 0 }; // within room bounds, farther than this tick's speed budget
		const result = resolveMove(current, target, 200); // maxDist = 2000 * 0.2 = 400
		assert.equal(Math.round(result.x), 400);
		assert.equal(result.y, 0);
	});

	it("caps diagonal displacement proportionally along both axes", () => {
		const current = { x: 0, y: 0 };
		const target = { x: 300, y: 400 }; // within bounds; 3-4-5 triangle, dist = 500
		const result = resolveMove(current, target, 100); // maxDist = 2000 * 0.1 = 200
		const distTravelled = Math.hypot(result.x - current.x, result.y - current.y);
		assert.ok(Math.abs(distTravelled - 200) < 0.01);
		assert.ok(Math.abs(result.y / result.x - 400 / 300) < 0.01);
	});

	it("does not move (and does not produce NaN) when elapsedMs is 0 and a move was requested", () => {
		const result = resolveMove({ x: 50, y: 50 }, { x: 200, y: 200 }, 0);
		assert.deepEqual(result, { x: 50, y: 50 });
		assert.ok(Number.isFinite(result.x));
		assert.ok(Number.isFinite(result.y));
	});

	it("returns the current position unchanged when the target equals current", () => {
		const result = resolveMove({ x: 42, y: 17 }, { x: 42, y: 17 }, 1000);
		assert.deepEqual(result, { x: 42, y: 17 });
	});
});
