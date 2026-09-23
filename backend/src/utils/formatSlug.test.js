const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { slugToTitleCase } = require("./formatSlug");

describe("slugToTitleCase", () => {
  it("title-cases a single word", () => {
    assert.equal(slugToTitleCase("static"), "Static");
  });

  it("title-cases each hyphen-separated word", () => {
    assert.equal(slugToTitleCase("lightning-rod"), "Lightning Rod");
    assert.equal(slugToTitleCase("thunder-stone"), "Thunder Stone");
  });

  it("returns an empty string for null/undefined/empty input", () => {
    assert.equal(slugToTitleCase(null), "");
    assert.equal(slugToTitleCase(undefined), "");
    assert.equal(slugToTitleCase(""), "");
  });
});
