import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAnimState, ANIMATION_VARIANTS } from "./battleAnimation.js";

describe("getAnimState", () => {
  it("returns FAINT when fainted, regardless of other flags", () => {
    assert.equal(getAnimState({ fainted: true, critical: true, damageEffect: true, reduceMotion: false }), "FAINT");
  });

  it("returns CRITICAL_HIT when critical and damageEffect, not fainted", () => {
    assert.equal(getAnimState({ fainted: false, critical: true, damageEffect: true, reduceMotion: false }), "CRITICAL_HIT");
  });

  it("returns DAMAGE when damageEffect but not critical", () => {
    assert.equal(getAnimState({ fainted: false, critical: false, damageEffect: true, reduceMotion: false }), "DAMAGE");
  });

  it("returns IDLE when nothing else applies", () => {
    assert.equal(getAnimState({ fainted: false, critical: false, damageEffect: false, reduceMotion: false }), "IDLE");
  });

  it("critical alone (no damageEffect) is not enough to trigger CRITICAL_HIT", () => {
    // damageEffect gates the whole shake beat; critical only changes which
    // shake variant plays while damageEffect is true. This guards against a
    // stale critical flag (e.g. from a race) triggering a visual beat on
    // its own.
    assert.equal(getAnimState({ fainted: false, critical: true, damageEffect: false, reduceMotion: false }), "IDLE");
  });
});

describe("ANIMATION_VARIANTS", () => {
  it("has all 4 states getAnimState can return", () => {
    for (const key of ["FAINT", "CRITICAL_HIT", "DAMAGE", "IDLE"]) {
      assert.ok(ANIMATION_VARIANTS[key], `missing variant for ${key}`);
    }
  });

  it("CRITICAL_HIT has a larger shake amplitude than DAMAGE", () => {
    const maxAbs = (arr) => Math.max(...arr.map((n) => Math.abs(n)));
    assert.ok(
      maxAbs(ANIMATION_VARIANTS.CRITICAL_HIT.x) > maxAbs(ANIMATION_VARIANTS.DAMAGE.x),
      "CRITICAL_HIT should shake with greater amplitude than plain DAMAGE"
    );
  });

  it("IDLE is a no-op transform (y:0, opacity:1)", () => {
    assert.deepEqual(ANIMATION_VARIANTS.IDLE, { y: 0, opacity: 1 });
  });

  it("FAINT sinks and fades, matching the pre-existing faint behavior", () => {
    assert.deepEqual(ANIMATION_VARIANTS.FAINT, { y: 46, opacity: 0 });
  });
});
