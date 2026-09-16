import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBattleSprite, BATTLE_SPRITE_BASE } from "./battleSprites.js";

describe("getBattleSprite", () => {
  it("resolves #001 front frame a (default)", () => {
    assert.equal(getBattleSprite({ pokemonId: 1, variant: "front" }), "/sprites/battle/001/front.png");
  });

  it("resolves #001 front frame b", () => {
    assert.equal(
      getBattleSprite({ pokemonId: 1, variant: "front", frame: "b" }),
      "/sprites/battle/001/front-b.png"
    );
  });

  it("resolves #025 back frame a and b", () => {
    assert.equal(getBattleSprite({ pokemonId: 25, variant: "back" }), "/sprites/battle/025/back.png");
    assert.equal(
      getBattleSprite({ pokemonId: 25, variant: "back", frame: "b" }),
      "/sprites/battle/025/back-b.png"
    );
  });

  it("pads single-digit dex numbers", () => {
    assert.equal(getBattleSprite({ pokemonId: 7, variant: "front" }), "/sprites/battle/007/front.png");
  });

  it("defaults an invalid variant to front", () => {
    assert.equal(getBattleSprite({ pokemonId: 1, variant: "icon" }), "/sprites/battle/001/front.png");
  });

  it("returns null for an out-of-range dex id", () => {
    assert.equal(getBattleSprite({ pokemonId: 152, variant: "front" }), null);
    assert.equal(getBattleSprite({ pokemonId: 0, variant: "front" }), null);
    assert.equal(getBattleSprite({ pokemonId: null, variant: "front" }), null);
  });

  it("never points outside the battle sprite base", () => {
    const url = getBattleSprite({ pokemonId: 150, variant: "back", frame: "b" });
    assert.equal(url.startsWith(BATTLE_SPRITE_BASE + "/"), true);
    assert.equal(url.startsWith("http"), false);
  });
});
