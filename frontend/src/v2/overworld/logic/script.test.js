import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PAGE, paginate } from "./dialogue.js";
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
	it("the professor's starter op: offered before the pick, a post-pick line after", () => {
		const s = parseScript([
			{ op: "requireFlag", flag: "story:starter", not: true, else: [{ op: "say", text: "How is your partner?" }] },
			{ op: "say", text: "Choose one." },
			{ op: "starter" },
		]);
		assert.deepEqual(resolveScript(s, flags()).effects, [{ type: "say", pages: ["Choose one."] }, { type: "starter" }]);
		assert.deepEqual(resolveScript(s, flags("story:starter")).effects, [{ type: "say", pages: ["How is your partner?"] }]);
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
	it("pages default to PAGE, the size the talk box is drawn for", () => {
		assert.deepEqual(PAGE, { lineChars: 30, lines: 2 });
		const text = "Three Pokemon are waiting on the bench. Take your time, and choose the one for you.";
		assert.deepEqual(paginate(text), paginate(text, PAGE));
	});
});

describe("legendary script steps", () => {
	it("battle takes a trainer or a wild dex number; cry needs a dex", () => {
		assert.doesNotThrow(() => parseScript(JSON.stringify([{ op: "cry", dex: 150 }, { op: "battle", wild: 150 }]), "t"));
		assert.doesNotThrow(() => parseScript(JSON.stringify([{ op: "battle", trainer: "marina" }]), "t"));
		assert.throws(() => parseScript(JSON.stringify([{ op: "battle" }]), "t"), ScriptError);
		assert.throws(() => parseScript(JSON.stringify([{ op: "battle", wild: 0 }]), "t"), ScriptError);
		assert.throws(() => parseScript(JSON.stringify([{ op: "cry" }]), "t"), ScriptError);
	});
	it("resolves to cry and battle effects in order", () => {
		const { effects } = resolveScript([{ op: "cry", dex: 144 }, { op: "battle", wild: 144, shiny: true }], new Set());
		assert.deepEqual(effects, [{ type: "cry", dex: 144 }, { type: "battle", wild: 144, shiny: true }]);
	});
});
