import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defeatedFlag, doneFlag, dueTriggers, facingToward, interactionAt, spotter, triggerScript, warpFor } from "./events.js";
import { asciiMap } from "./fixtures.js";

const S = JSON.stringify([{ op: "say", text: "x" }]);

describe("trainer sight", () => {
	const field = asciiMap("f", ["......", "..#...", "......"]);
	const foe = { name: "t", trainer: "t", order: 1, sight: 4, x: 0, y: 0, facing: "right" };
	const none = new Set();
	it("sees along its facing, up to its sight, and counts the walk", () => {
		assert.deepEqual(spotter(field, { x: 3, y: 0 }, [foe], none), { npc: foe, steps: 2 });
		assert.equal(spotter(field, { x: 5, y: 0 }, [foe], none), null);
		assert.equal(spotter(field, { x: 0, y: 1 }, [foe], none), null);
	});
	it("is blocked by walls and by other people", () => {
		assert.equal(spotter(field, { x: 3, y: 1 }, [{ ...foe, y: 1 }], none), null);
		assert.equal(spotter(field, { x: 3, y: 0 }, [foe, { name: "o", x: 2, y: 0 }], none), null);
	});
	it("ignores beaten trainers and plain NPCs, and earlier trainers go first", () => {
		assert.equal(spotter(field, { x: 3, y: 0 }, [foe], new Set([defeatedFlag("t")])), null);
		assert.equal(spotter(field, { x: 3, y: 0 }, [{ name: "n", x: 0, y: 0, facing: "right" }], none), null);
		const second = { ...foe, name: "u", trainer: "u", order: 2, x: 5, facing: "left" };
		assert.equal(spotter(field, { x: 3, y: 0 }, [second, foe], none).npc, foe);
	});
});
const map = asciiMap("m", ["......", "......", "......"], {
	npcs: [{ name: "bob", x: 3, y: 1, props: { script: S } }],
	signs: [{ name: "sign", x: 1, y: 0, props: { text: "HELLO" } }],
	warps: [{ name: "door", x: 5, y: 2, props: { targetMap: "n", targetX: 1, targetY: 1, enterDir: "down" } }],
	triggers: [
		{ name: "step", x: 2, y: 2, w: 2, props: { when: "step", once: true, script: S } },
		{ name: "enter", x: 0, y: 0, props: { when: "enter", script: S } },
		{ name: "fl", x: 0, y: 0, props: { when: "flag", flag: "f", script: S } },
	],
});
const flags = (...f) => ({ has: (x) => f.includes(x) });

describe("events", () => {
	it("step triggers cover their whole rect and only fire once when flagged once", () => {
		assert.equal(dueTriggers(map, "step", flags(), { x: 3, y: 2 }).length, 1);
		assert.equal(dueTriggers(map, "step", flags(), { x: 4, y: 2 }).length, 0);
		assert.equal(dueTriggers(map, "step", flags(doneFlag("m", map.triggers[0])), { x: 2, y: 2 }).length, 0);
	});
	it("a once-trigger's script ends by setting its done flag", () => {
		const s = triggerScript(map, map.triggers[0]);
		assert.deepEqual(s[s.length - 1], { op: "setFlag", flag: "done:m:step" });
	});
	it("flag triggers fire only when their flag is set", () => {
		assert.equal(dueTriggers(map, "flag", flags(), {}).length, 0);
		assert.equal(dueTriggers(map, "flag", flags("f"), {}).length, 1);
	});
	it("warps honour enterDir", () => {
		assert.ok(warpFor(map, 5, 2, "down"));
		assert.equal(warpFor(map, 5, 2, "left"), null);
		assert.equal(warpFor(map, 0, 0, "down"), null);
	});
	it("interaction targets the facing tile: npc first, then sign", () => {
		const npcs = [{ id: "m:bob", mapId: "m", x: 3, y: 1, script: map.npcs[0].script }];
		assert.equal(interactionAt(map, { x: 2, y: 1, facing: "right" }, npcs).kind, "npc");
		assert.equal(interactionAt(map, { x: 2, y: 1, facing: "left" }, npcs), null);
		const sign = interactionAt(map, { x: 1, y: 1, facing: "up" }, npcs);
		assert.equal(sign.kind, "sign");
		assert.equal(sign.script[0].text, "HELLO");
	});
	it("npcs turn toward the speaker", () => {
		assert.equal(facingToward({ x: 3, y: 1 }, { x: 2, y: 1 }), "left");
		assert.equal(facingToward({ x: 3, y: 1 }, { x: 3, y: 4 }), "down");
	});
});
