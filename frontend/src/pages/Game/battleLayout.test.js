import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BATTLE_SLOTS, slotStyle } from "./battleLayout.js";

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
