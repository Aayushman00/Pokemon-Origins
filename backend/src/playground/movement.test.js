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
		// 1 second elapsed, requesting a jump twice the max allowed distance
		// in the +x direction. The result should move exactly MAX_SPEED_PX_PER_SEC
		// in that direction, not teleport to the target.
		const current = { x: 0, y: 0 };
		const target = { x: MAX_SPEED_PX_PER_SEC * 2, y: 0 };
		const result = resolveMove(current, target, 1000);
		assert.equal(Math.round(result.x), MAX_SPEED_PX_PER_SEC);
		assert.equal(result.y, 0);
	});

	it("caps diagonal displacement proportionally along both axes", () => {
		const current = { x: 0, y: 0 };
		// A 3-4-5 triangle scaled up so the total distance is 2x the max allowed.
		const target = { x: MAX_SPEED_PX_PER_SEC * 1.2, y: MAX_SPEED_PX_PER_SEC * 1.6 };
		const result = resolveMove(current, target, 1000);
		const distTravelled = Math.hypot(result.x - current.x, result.y - current.y);
		assert.ok(Math.abs(distTravelled - MAX_SPEED_PX_PER_SEC) < 0.01);
		// Direction preserved: y/x ratio should match the target's 1.6/1.2 ratio.
		assert.ok(Math.abs(result.y / result.x - 1.6 / 1.2) < 0.01);
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
