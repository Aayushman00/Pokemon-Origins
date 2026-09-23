const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { rollGenderForSpecies } = require("./genderService");

describe("rollGenderForSpecies", () => {
  it("returns genderless for a genderless species (Ditto, id 132)", () => {
    assert.equal(rollGenderForSpecies(132), "genderless");
  });

  it("returns male for a male-only species (Hitmonlee, id 106)", () => {
    assert.equal(rollGenderForSpecies(106), "male");
  });

  it("returns female for a female-only species (Kangaskhan, id 115)", () => {
    assert.equal(rollGenderForSpecies(115), "female");
  });

  it("rolls male when random() < 0.5 for a standard species", () => {
    assert.equal(rollGenderForSpecies(4, () => 0.1), "male");
  });

  it("rolls female when random() >= 0.5 for a standard species", () => {
    assert.equal(rollGenderForSpecies(4, () => 0.9), "female");
  });
});
