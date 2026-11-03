import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCamera } from "./camera.js";

describe("camera", () => {
	it("centres on the player", () => {
		assert.deepEqual(computeCamera({ px: 400, py: 300, mapW: 100, mapH: 100 }), { x: 288, y: 228 });
	});
	it("clamps to map bounds", () => {
		assert.deepEqual(computeCamera({ px: 0, py: 0, mapW: 100, mapH: 100 }), { x: 0, y: 0 });
		assert.deepEqual(computeCamera({ px: 1599, py: 1599, mapW: 100, mapH: 100 }), { x: 1600 - 240, y: 1600 - 160 });
	});
	it("centres a map smaller than the view", () => {
		assert.deepEqual(computeCamera({ px: 40, py: 40, mapW: 10, mapH: 8 }), { x: -40, y: -16 });
	});
	it("scrolls past an edge that has a connection", () => {
		assert.equal(computeCamera({ px: 0, py: 100, mapW: 100, mapH: 100, open: { west: true } }).x, -112);
	});
	it("always returns integers", () => {
		for (let px = 0; px < 300; px += 7) {
			const c = computeCamera({ px, py: px / 3, mapW: 20, mapH: 20 });
			assert.ok(Number.isInteger(c.x) && Number.isInteger(c.y));
		}
	});
});
