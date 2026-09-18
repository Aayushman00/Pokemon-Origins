import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BATTLE_SLOTS, slotStyle, SHADOW_SIZES, shadowStyle } from "./battleLayout.js";

describe("battleLayout", () => {
  it("has the current opponent slot position, unchanged from BattleGround.css", () => {
    assert.deepEqual(BATTLE_SLOTS.opponent, { top: 30, right: 40 });
  });

  it("has the current player slot position, unchanged from BattleGround.css", () => {
    assert.deepEqual(BATTLE_SLOTS.player, { bottom: 40, left: 40 });
  });

  it("slotStyle('opponent') returns an inline-style-ready object", () => {
    assert.deepEqual(slotStyle("opponent"), {
      position: "absolute",
      top: "30px",
      right: "40px",
    });
  });

  it("slotStyle('player') returns an inline-style-ready object", () => {
    assert.deepEqual(slotStyle("player"), {
      position: "absolute",
      bottom: "40px",
      left: "40px",
    });
  });

  it("throws on an unknown role", () => {
    assert.throws(() => slotStyle("bystander"));
  });
});

describe("battleLayout shadows", () => {
  it("has the opponent shadow footprint, unchanged from the old CSS ::after rule", () => {
    assert.deepEqual(SHADOW_SIZES.opponent, { width: 180, height: 20, bottom: -10, left: -30 });
  });

  it("has the player shadow footprint, unchanged from the old CSS ::after rule", () => {
    assert.deepEqual(SHADOW_SIZES.player, { width: 200, height: 30, bottom: -15, right: -30 });
  });

  it("shadowStyle('opponent') returns an inline-style-ready object", () => {
    assert.deepEqual(shadowStyle("opponent"), {
      position: "absolute",
      zIndex: -1,
      width: "180px",
      height: "20px",
      bottom: "-10px",
      left: "-30px",
    });
  });

  it("shadowStyle('player') returns an inline-style-ready object", () => {
    assert.deepEqual(shadowStyle("player"), {
      position: "absolute",
      zIndex: -1,
      width: "200px",
      height: "30px",
      bottom: "-15px",
      right: "-30px",
    });
  });

  it("throws on an unknown role", () => {
    assert.throws(() => shadowStyle("bystander"));
  });
});
