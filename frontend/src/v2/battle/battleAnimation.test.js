import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAnimState,
  ANIMATION_VARIANTS,
  getMoveAnimCategory,
  getImpactTier,
  hitResultLines,
  damageEffectClass,
} from "./battleAnimation.js";

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
  it("has every state getAnimState can return", () => {
    for (const key of ["FAINT", "CRITICAL_HIT", "SUPER_HIT", "DAMAGE", "WEAK_HIT", "IDLE"]) {
      assert.ok(ANIMATION_VARIANTS[key], `missing variant for ${key}`);
    }
  });

  it("SUPER_HIT shakes harder than DAMAGE but softer than CRITICAL_HIT", () => {
    const maxAbs = (arr) => Math.max(...arr.map((n) => Math.abs(n)));
    const superAmp = maxAbs(ANIMATION_VARIANTS.SUPER_HIT.x);
    assert.ok(superAmp > maxAbs(ANIMATION_VARIANTS.DAMAGE.x));
    assert.ok(superAmp < maxAbs(ANIMATION_VARIANTS.CRITICAL_HIT.x));
  });

  it("WEAK_HIT does not move the sprite", () => {
    assert.equal(ANIMATION_VARIANTS.WEAK_HIT.x, undefined);
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

describe("getMoveAnimCategory", () => {
  it("classifies contact-feel types as physical", () => {
    for (const type of ["Normal", "Fighting", "Rock", "Ground", "Steel", "Bug", "Poison", "Ghost", "Dark", "Dragon"]) {
      assert.equal(getMoveAnimCategory(type), "physical", `${type} should be physical`);
    }
  });

  it("classifies ranged-feel types as ranged", () => {
    for (const type of ["Water", "Electric", "Psychic", "Fire", "Ice", "Fairy", "Flying"]) {
      assert.equal(getMoveAnimCategory(type), "ranged", `${type} should be ranged`);
    }
  });

  it("is case-insensitive", () => {
    assert.equal(getMoveAnimCategory("fire"), "ranged");
    assert.equal(getMoveAnimCategory("NORMAL"), "physical");
  });

  it("defaults unknown types to physical", () => {
    assert.equal(getMoveAnimCategory("???"), "physical");
  });
});

describe("getAnimState with impact tiers", () => {
  const base = { fainted: false, critical: false };

  it("maps the super tier to SUPER_HIT", () => {
    assert.equal(getAnimState({ ...base, damageEffect: "super" }), "SUPER_HIT");
  });

  it("maps the weak tier to WEAK_HIT", () => {
    assert.equal(getAnimState({ ...base, damageEffect: "weak" }), "WEAK_HIT");
  });

  it("maps the normal tier and legacy true to DAMAGE", () => {
    assert.equal(getAnimState({ ...base, damageEffect: "normal" }), "DAMAGE");
    assert.equal(getAnimState({ ...base, damageEffect: true }), "DAMAGE");
  });

  it("treats the none tier as IDLE", () => {
    assert.equal(getAnimState({ ...base, damageEffect: "none" }), "IDLE");
  });

  it("crit beats every tier for the shake", () => {
    for (const tier of ["weak", "normal", "super", true]) {
      assert.equal(getAnimState({ fainted: false, critical: true, damageEffect: tier }), "CRITICAL_HIT");
    }
  });

  it("faint beats everything", () => {
    assert.equal(getAnimState({ fainted: true, critical: true, damageEffect: "super" }), "FAINT");
  });
});

describe("getImpactTier", () => {
  it("returns none for immunity", () => {
    assert.equal(getImpactTier(0), "none");
  });

  it("returns weak below 1", () => {
    assert.equal(getImpactTier(0.25), "weak");
    assert.equal(getImpactTier(0.5), "weak");
  });

  it("returns super above 1", () => {
    assert.equal(getImpactTier(2), "super");
    assert.equal(getImpactTier(4), "super");
  });

  it("returns normal for 1 and for missing or non-number input", () => {
    for (const m of [1, undefined, null, NaN, "2"]) {
      assert.equal(getImpactTier(m), "normal", `input ${String(m)}`);
    }
  });
});

describe("hitResultLines", () => {
  it("orders crit, effectiveness, multi-hit, OHKO", () => {
    assert.deepEqual(
      hitResultLines({ critical_hit: true, type_multiplier: 2, hits: 3, ohko: true }),
      ["A critical hit!", "It's super effective!", "Hit 3 time(s)!", "It's a one-hit KO!"]
    );
  });

  it("crit on a resisted hit gives crit then not very effective", () => {
    assert.deepEqual(
      hitResultLines({ critical_hit: true, type_multiplier: 0.5 }),
      ["A critical hit!", "It's not very effective..."]
    );
  });

  it("neutral hit with nothing special gives no lines", () => {
    assert.deepEqual(hitResultLines({ type_multiplier: 1, hits: 1 }), []);
  });

  it("missing multiplier gives no effectiveness line", () => {
    assert.deepEqual(hitResultLines({ critical_hit: true }), ["A critical hit!"]);
  });

  it("immunity gives no hit lines at all, even with crit set", () => {
    assert.deepEqual(hitResultLines({ critical_hit: true, type_multiplier: 0, hits: 2 }), []);
  });
});

describe("damageEffectClass", () => {
  it("maps each effect to its blink class", () => {
    assert.equal(damageEffectClass(false), "");
    assert.equal(damageEffectClass(true), "damage-effect");
    assert.equal(damageEffectClass("normal"), "damage-effect");
    assert.equal(damageEffectClass("weak"), "damage-effect--weak");
    assert.equal(damageEffectClass("super"), "damage-effect--super");
  });
});
