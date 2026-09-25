import { describe, it, expect } from "vitest";
import { halfPixelate } from "./PixelSprite";

// 4x2 RGBA image -> 2x1. px(r,g,b,a) repeated per pixel, row-major.
const img = (...px) => new Uint8ClampedArray(px.flat());
const CLEAR = [0, 0, 0, 0];
const INK = [20, 20, 20, 255]; // outline
const RED = [200, 40, 40, 255];
const PINK = [240, 120, 120, 255];

describe("halfPixelate", () => {
	it("keeps outline detail, averages fills, drops mostly-empty blocks", () => {
		// block A (left 2x2): 3 fill + 1 outline pixel -> outline wins
		// block B (right 2x2): only 1 solid pixel -> transparent
		const data = img(RED, INK, PINK, CLEAR, RED, PINK, CLEAR, CLEAR);
		const out = halfPixelate(data, 4, 2);
		expect([...out.slice(0, 4)]).toEqual(INK);
		expect(out[7]).toBe(0);
	});

	it("averages a block with no dark pixels", () => {
		const data = img(RED, PINK, RED, PINK);
		const out = halfPixelate(data, 2, 2);
		expect([...out]).toEqual([220, 80, 80, 255]);
	});
});
