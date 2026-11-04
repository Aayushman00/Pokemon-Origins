import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRowsBelow, getMoveAnimCategory, getImpactTier, hitResultLines, fxFamily } from "./battleAnimation.js";

describe("emptyRowsBelow", () => {
  const sprite = (rows) => Uint8ClampedArray.from(rows.flatMap((r) => [...r].flatMap((c) => [0, 0, 0, c === "#" ? 255 : 0])));
  it("counts fully transparent rows under the lowest pixel", () => {
    assert.equal(emptyRowsBelow(sprite(["..", ".#", "..", ".."]), 2, 4), 2);
    assert.equal(emptyRowsBelow(sprite(["..", "#."]), 2, 2), 0);
  });
  it("treats an empty image as no padding", () => {
    assert.equal(emptyRowsBelow(sprite(["..", ".."]), 2, 2), 0);
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

describe("fxFamily", () => {
  it("maps types to an effect family and defaults to a strike", () => {
    assert.equal(fxFamily("Fire"), "flame");
    assert.equal(fxFamily("electric"), "bolt");
    assert.equal(fxFamily("Normal"), "strike");
    assert.equal(fxFamily(undefined), "strike");
  });
});
