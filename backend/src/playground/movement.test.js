// backend/src/playground/movement.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { validateStep, freshBudget, STEP_BURST, ROOM_WIDTH, ROOM_HEIGHT, spawnPoint, SPAWN_RADIUS_PX, CHAT_RADIUS_PX, TILE_PX } = require("./movement");
const { canStand } = require("../world/maps");

// Real playground.json collision: (12,2) and (13,2) are open, (14,2) is a wall.
const px = (tx, ty) => ({ x: tx * TILE_PX, y: ty * TILE_PX });
const T0 = 1_000_000;

describe("validateStep", () => {
	it("accepts one orthogonal step onto a free tile", () => {
		const r = validateStep(px(12, 2), px(13, 2), freshBudget(T0), T0);
		assert.deepEqual([r.ok, r.stepped, r.x, r.y], [true, true, 13 * TILE_PX, 2 * TILE_PX]);
	});

	it("rejects diagonal steps, multi-tile jumps, off-grid and out-of-room targets", () => {
		const from = px(12, 2);
		for (const target of [px(13, 3), px(12, 5), { x: 12 * TILE_PX + 3, y: 2 * TILE_PX }, { x: -16, y: 0 }, { x: ROOM_WIDTH, y: ROOM_HEIGHT }]) {
			const r = validateStep(from, target, freshBudget(T0), T0);
			assert.equal(r.ok, false, JSON.stringify(target));
			assert.deepEqual([r.x, r.y], [from.x, from.y]);
		}
	});

	it("rejects stepping into a wall", () => {
		const r = validateStep(px(13, 2), px(14, 2), freshBudget(T0), T0);
		assert.equal(r.ok, false);
		assert.deepEqual([r.x, r.y], [13 * TILE_PX, 2 * TILE_PX]);
	});

	it("uses the injected collision check", () => {
		const r = validateStep(px(12, 2), px(13, 2), freshBudget(T0), T0, () => false);
		assert.equal(r.ok, false);
	});

	it("same tile (a turn) is fine, is not a step and costs no budget", () => {
		const budget = { tokens: 0, at: T0 };
		const r = validateStep(px(12, 2), px(12, 2), budget, T0);
		assert.deepEqual([r.ok, r.stepped], [true, false]);
	});

	it("allows a burst of 3, rejects a 4th within 125 ms, refills at 8 tiles/s", () => {
		let at = px(12, 2);
		let budget = freshBudget(T0);
		const path = [px(13, 2), px(12, 2), px(13, 2)];
		for (const target of path) {
			const r = validateStep(at, target, budget, T0 + 10);
			assert.equal(r.ok, true);
			({ budget } = r);
			at = { x: r.x, y: r.y };
		}
		assert.equal(STEP_BURST, 3);
		const fourth = validateStep(at, px(12, 2), budget, T0 + 100);
		assert.equal(fourth.ok, false);
		const later = validateStep(at, px(12, 2), fourth.budget, T0 + 100 + 130);
		assert.equal(later.ok, true);
	});

	it("rejects non-numeric targets", () => {
		assert.equal(validateStep(px(12, 2), { x: "13", y: NaN }, freshBudget(T0), T0).ok, false);
	});
});

describe("spawnPoint", () => {
	it("always lands on a free tile near the room center", () => {
		let seed = 1;
		const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
		for (let i = 0; i < 200; i++) {
			const p = spawnPoint(random);
			assert.equal(p.x % TILE_PX, 0);
			assert.equal(p.y % TILE_PX, 0);
			assert.ok(canStand("playground", p.x / TILE_PX, p.y / TILE_PX), JSON.stringify(p));
			assert.ok(Math.hypot(p.x - ROOM_WIDTH / 2, p.y - ROOM_HEIGHT / 2) <= SPAWN_RADIUS_PX);
		}
	});

	it("spreads players over several tiles, any two within chat range", () => {
		const seen = new Set();
		for (let i = 0; i < 20; i++) seen.add(JSON.stringify(spawnPoint(() => i / 20)));
		assert.ok(seen.size >= 4, `only ${seen.size} spawn tiles`);
		assert.ok(SPAWN_RADIUS_PX * 2 <= CHAT_RADIUS_PX);
	});
});
