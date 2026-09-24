import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyDrop } from "./partyLayout.js";

const L = (party, pc = []) => ({ party, pc });

describe("applyDrop", () => {
	it("reorders within the party", () => {
		assert.deepEqual(applyDrop(L([1, 2, 3]), { id: 3, from: "party" }, { zone: "party", index: 0 }), L([3, 1, 2]));
		assert.deepEqual(applyDrop(L([1, 2, 3]), { id: 1, from: "party" }, { zone: "party", index: 2 }), L([2, 3, 1]));
	});

	it("deposits to the PC but never the last party member", () => {
		assert.deepEqual(applyDrop(L([1, 2], [9]), { id: 2, from: "party" }, { zone: "pc" }), L([1], [9, 2]));
		assert.equal(applyDrop(L([1], [9]), { id: 1, from: "party" }, { zone: "pc" }), null);
	});

	it("withdraws into a party with room at the dropped slot", () => {
		assert.deepEqual(applyDrop(L([1, 2], [9, 8]), { id: 8, from: "pc" }, { zone: "party", index: 0 }), L([8, 1, 2], [9]));
	});

	it("swaps with the targeted member when the party is full", () => {
		assert.deepEqual(applyDrop(L([1, 2, 3], [9, 8]), { id: 9, from: "pc" }, { zone: "party", index: 1 }), L([1, 9, 3], [2, 8]));
		// dropped past the end of a full party: swap with the last member
		assert.deepEqual(applyDrop(L([1, 2, 3], [9]), { id: 9, from: "pc" }, { zone: "party" }), L([1, 2, 9], [3]));
	});

	it("reorders inside the PC and ignores no-op or unknown drops", () => {
		assert.deepEqual(applyDrop(L([1], [7, 8, 9]), { id: 9, from: "pc" }, { zone: "pc", index: 0 }), L([1], [9, 7, 8]));
		assert.equal(applyDrop(L([1, 2]), { id: 1, from: "party" }, { zone: "party", index: 0 }), null);
		assert.equal(applyDrop(L([1, 2]), { id: 5, from: "party" }, { zone: "pc" }), null);
	});
});
