import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { playerSpriteFor } from "./assets.js";
import { SHEETS, SHEET_NAMES } from "./sheets.generated.js";

const SPRITES = join(import.meta.dirname, "../../../../public/sprites/overworld");

describe("overworld sprite sheets", () => {
	it("player sprite follows the trainer's gender", () => {
		assert.equal(playerSpriteFor("Female"), "player_f");
		assert.equal(playerSpriteFor("Male"), "player");
		assert.equal(playerSpriteFor("Other"), "player");
		assert.equal(playerSpriteFor(undefined), "player");
	});
	it("manifest keeps the engine's names and every sheet file exists", () => {
		for (const name of ["player", "player_f", "npc"]) assert.ok(SHEET_NAMES.includes(name), name);
		for (const name of SHEET_NAMES) assert.ok(existsSync(join(SPRITES, `${name}.png`)), name);
	});
	it("cast is 24 boys (incl. the Mart clerk) and 18 girls (plus the generic townsperson)", () => {
		const cast = SHEETS.filter((s) => s.id !== "npc");
		assert.equal(cast.filter((s) => s.gender === "male").length, 24);
		assert.equal(cast.filter((s) => s.gender === "female").length, 18);
	});
});

describe("shiny palette swap", () => {
	it("recolours mapped colours only and leaves transparent pixels alone", async () => {
		const { swapPalette } = await import("./assets.js");
		const px = new Uint8ClampedArray([0x7c, 0xc4, 0xf0, 255, 0x12, 0x34, 0x56, 255, 0x7c, 0xc4, 0xf0, 0]);
		swapPalette(px, { "#7cc4f0": "#a4e4f0" });
		assert.deepEqual([...px], [0xa4, 0xe4, 0xf0, 255, 0x12, 0x34, 0x56, 255, 0x7c, 0xc4, 0xf0, 0]);
	});
});
