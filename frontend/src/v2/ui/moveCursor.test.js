import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { moveCursor } from "./moveCursor.js";

describe("moveCursor", () => {
	it("wraps a vertical list", () => {
		assert.equal(moveCursor(0, "ArrowUp", 4), 3);
		assert.equal(moveCursor(3, "ArrowDown", 4), 0);
	});

	it("moves across a 2x2 grid and toggles columns within a row", () => {
		assert.equal(moveCursor(0, "ArrowDown", 4, 2), 2);
		assert.equal(moveCursor(2, "ArrowUp", 4, 2), 0);
		assert.equal(moveCursor(0, "ArrowRight", 4, 2), 1);
		assert.equal(moveCursor(1, "ArrowRight", 4, 2), 0);
	});

	it("stays put at grid edges and on holes in a ragged last row", () => {
		assert.equal(moveCursor(2, "ArrowDown", 4, 2), 2);
		assert.equal(moveCursor(2, "ArrowRight", 3, 2), 2);
		assert.equal(moveCursor(1, "ArrowDown", 3, 2), 1);
	});

	it("ignores non-arrow keys and empty lists", () => {
		assert.equal(moveCursor(1, "Enter", 4), 1);
		assert.equal(moveCursor(0, "ArrowDown", 0), 0);
	});
});
