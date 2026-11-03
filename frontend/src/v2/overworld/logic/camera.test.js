import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCamera } from "./camera.js";

describe("camera", () => {
	it("centres on the player", () => {
		assert.deepEqual(computeCamera({ px: 400, py: 300 }), { x: 288, y: 228 });
	});
	it("keeps the player centred at a map edge instead of clamping", () => {
		assert.deepEqual(computeCamera({ px: 0, py: 0 }), { x: -112, y: -72 });
		assert.deepEqual(computeCamera({ px: 1584, py: 1584 }), { x: 1584 - 112, y: 1584 - 72 });
	});
	it("follows the player inside a map smaller than the view", () => {
		const a = computeCamera({ px: 32, py: 48 });
		const b = computeCamera({ px: 48, py: 48 });
		assert.equal(b.x - a.x, 16);
	});
	it("always returns integers", () => {
		for (let px = 0; px < 300; px += 7) {
			const c = computeCamera({ px, py: px / 3 });
			assert.ok(Number.isInteger(c.x) && Number.isInteger(c.y));
		}
	});
});
