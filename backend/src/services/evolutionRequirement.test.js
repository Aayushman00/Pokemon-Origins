const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { formatEvolutionRequirement } = require("./evolutionRequirement");

describe("formatEvolutionRequirement", () => {
  it("formats a level-up requirement with a level", () => {
    assert.equal(
      formatEvolutionRequirement({ trigger: { name: "level-up" }, min_level: 16 }),
      "Lv. 16"
    );
  });

  it("formats a friendship level-up requirement (Pichu -> Pikachu style)", () => {
    assert.equal(
      formatEvolutionRequirement({
        trigger: { name: "level-up" },
        min_level: null,
        min_happiness: 220,
      }),
      "Friendship"
    );
  });

  it("formats a use-item requirement from the item slug (Thunder Stone)", () => {
    assert.equal(
      formatEvolutionRequirement({
        trigger: { name: "use-item" },
        item: { name: "thunder-stone" },
      }),
      "Thunder Stone"
    );
  });

  it("formats a trade requirement", () => {
    assert.equal(
      formatEvolutionRequirement({ trigger: { name: "trade" } }),
      "Trade"
    );
  });

  it("falls back to a title-cased trigger name for anything else recognizable", () => {
    assert.equal(
      formatEvolutionRequirement({ trigger: { name: "shed" } }),
      "Shed"
    );
  });

  it("returns null when there is no requirement to show", () => {
    assert.equal(formatEvolutionRequirement(null), null);
    assert.equal(formatEvolutionRequirement(undefined), null);
  });
});
