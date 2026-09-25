import { describe, it, expect } from "vitest";
import { BADGES } from "./GymBadge";
import { PIDGEY_UP, PIDGEY_DOWN } from "./SkyFlock";

// A typo in a hand-drawn map shifts every pixel after it; catch that here.
const checkMap = (map, pal, label) => {
	const w = map[0].length;
	map.forEach((row, y) => {
		expect(row.length, `${label} row ${y} width`).toBe(w);
		for (const ch of row) if (ch !== ".") expect(pal, `${label} row ${y} uses "${ch}"`).toHaveProperty(ch);
	});
};

describe("pixel art maps", () => {
	it("has a 16x16 badge for each of the ten campaign stops", () => {
		expect(BADGES).toHaveLength(10);
		for (const b of BADGES) {
			expect(b.map, b.name).toHaveLength(16);
			checkMap(b.map, b.pal, b.name);
		}
	});

	it("keeps both Pidgey frames the same size", () => {
		const pal = { K: 1, B: 1, b: 1, C: 1, E: 1, Y: 1 };
		checkMap(PIDGEY_UP, pal, "up");
		checkMap(PIDGEY_DOWN, pal, "down");
		expect(PIDGEY_UP).toHaveLength(PIDGEY_DOWN.length);
	});
});
