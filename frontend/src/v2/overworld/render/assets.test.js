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
	it("cast is 18 boys and 12 girls (plus the generic townsperson)", () => {
		const cast = SHEETS.filter((s) => s.id !== "npc");
		assert.equal(cast.filter((s) => s.gender === "male").length, 18);
		assert.equal(cast.filter((s) => s.gender === "female").length, 12);
	});
});
