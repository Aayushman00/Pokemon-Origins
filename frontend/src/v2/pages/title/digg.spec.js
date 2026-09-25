import { describe, it, expect } from "vitest";
import { pickDiggSpot } from "./TitleScreen";

const stage = { left: 400, right: 620, top: 200, bottom: 390 };
const sign = { left: 330, right: 690, top: 420, bottom: 600 };
const overlaps = (s, r) => s.x < r.right && s.x + 64 > r.left && s.y < r.bottom && s.y + 56 > r.top;

describe("pickDiggSpot", () => {
	it("lands on the grass, inside the screen, clear of stage and sign", () => {
		for (let i = 0; i < 200; i++) {
			const s = pickDiggSpot({ w: 1000, h: 700, groundTop: 338, avoid: [stage, sign] });
			expect(s).not.toBeNull();
			expect(s.y).toBeGreaterThan(338); // never in the sky
			expect(s.y + 56).toBeLessThanOrEqual(700);
			expect(s.x).toBeGreaterThanOrEqual(0);
			expect(s.x + 64).toBeLessThanOrEqual(1000);
			expect(overlaps(s, stage) || overlaps(s, sign)).toBe(false);
		}
	});

	it("gives up when there is no grass to stand on", () => {
		expect(pickDiggSpot({ w: 1000, h: 400, groundTop: 380, avoid: [] })).toBeNull();
	});
});
