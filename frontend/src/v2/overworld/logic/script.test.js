import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { paginate } from "./dialogue.js";
import { ScriptError, parseScript, resolveScript } from "./script.js";

const flags = (...f) => ({ has: (x) => f.includes(x) });

describe("scripts", () => {
	it("resolves say / give / heal / battle / warp / shop / cutsceneMove into ordered effects", () => {
		const s = parseScript([
			{ op: "say", text: "hi" },
			{ op: "give", item: "potion", qty: 2 },
			{ op: "heal" },
			{ op: "battle", trainer: "joey" },
			{ op: "warp", map: "m", x: 1, y: 2 },
			{ op: "shop", shop: "mart1" },
			{ op: "cutsceneMove", actor: "player", path: ["up", "left"] },
		]);
		assert.deepEqual(resolveScript(s, flags()).effects.map((e) => e.type), ["say", "give", "heal", "battle", "warp", "shop", "cutsceneMove"]);
	});
	it("requireFlag stops the script and runs its else branch", () => {
		const s = parseScript([{ op: "requireFlag", flag: "a", else: [{ op: "say", text: "no" }] }, { op: "say", text: "yes" }]);
		assert.deepEqual(resolveScript(s, flags()).effects, [{ type: "say", pages: ["no"] }]);
		assert.deepEqual(resolveScript(s, flags("a")).effects, [{ type: "say", pages: ["yes"] }]);
	});
	it("requireFlag with not:true inverts", () => {
		const s = parseScript([{ op: "requireFlag", flag: "a", not: true }, { op: "say", text: "once" }]);
		assert.equal(resolveScript(s, flags()).effects.length, 1);
		assert.equal(resolveScript(s, flags("a")).effects.length, 0);
	});
	it("a flag set earlier in the script is visible to later requireFlag", () => {
		const s = parseScript([{ op: "setFlag", flag: "x" }, { op: "requireFlag", flag: "x" }, { op: "say", text: "ok" }]);
		assert.deepEqual(resolveScript(s, flags()).effects.map((e) => e.type), ["setFlag", "say"]);
	});
	it("rejects unknown ops and malformed ops with a located message", () => {
		assert.throws(() => parseScript([{ op: "teleportEverything" }], "npc Bob"), (e) => e instanceof ScriptError && /npc Bob.*unknown op/.test(e.message));
		assert.throws(() => parseScript([{ op: "give", item: "potion", qty: 0 }]), ScriptError);
		assert.throws(() => parseScript("{not json"), ScriptError);
		assert.throws(() => parseScript({ op: "say" }), ScriptError);
	});
});

describe("paginate", () => {
	it("wraps words into 2-line pages of at most 30 chars", () => {
		const pages = paginate("The quick brown fox jumps over the lazy dog and keeps running far away from here today");
		assert.ok(pages.length >= 2);
		for (const p of pages) {
			const lines = p.split("\n");
			assert.ok(lines.length <= 2);
			assert.ok(lines.every((l) => l.length <= 30));
		}
	});
	it("never returns zero pages", () => assert.deepEqual(paginate("   "), [""]));
});
