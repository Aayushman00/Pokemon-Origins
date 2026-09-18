const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createTypeEffectivenessService } = require("./typeEffectiveness");

function fakeClient(typeChart) {
  return {
    getType: async (name) => ({
      damage_relations: typeChart[name],
    }),
  };
}

describe("typeEffectiveness.getWeaknesses", () => {
  it("returns a single-type mon's straightforward weaknesses (Pikachu: Electric)", async () => {
    const client = fakeClient({
      electric: {
        double_damage_from: [{ name: "ground" }],
        half_damage_from: [{ name: "electric" }, { name: "flying" }, { name: "steel" }],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["electric"]);
    assert.deepEqual(weaknesses.sort(), ["ground"]);
  });

  it("combines dual-type multipliers instead of unioning them", async () => {
    const client = fakeClient({
      "type-a": {
        double_damage_from: [{ name: "fire" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      "type-b": {
        double_damage_from: [],
        half_damage_from: [{ name: "fire" }],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["type-a", "type-b"]);
    assert.deepEqual(weaknesses, []);
  });

  it("keeps an attacking type as a weakness only when the combined multiplier exceeds 1", async () => {
    const client = fakeClient({
      "type-a": {
        double_damage_from: [{ name: "water" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      "type-b": {
        double_damage_from: [{ name: "water" }],
        half_damage_from: [],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["type-a", "type-b"]);
    assert.deepEqual(weaknesses, ["water"]);
  });

  it("treats no_damage_from as cancelling out any weakness from the other type", async () => {
    const client = fakeClient({
      "type-a": {
        double_damage_from: [{ name: "psychic" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      "type-b": {
        double_damage_from: [],
        half_damage_from: [],
        no_damage_from: [{ name: "psychic" }],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["type-a", "type-b"]);
    assert.deepEqual(weaknesses, []);
  });
});

describe("typeEffectiveness.getMatchups", () => {
  it("partitions a single type's relations into weaknesses/resistances/immunities", async () => {
    const client = fakeClient({
      electric: {
        double_damage_from: [{ name: "ground" }],
        half_damage_from: [{ name: "flying" }, { name: "steel" }],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const matchups = await svc.getMatchups(["electric"]);
    assert.deepEqual(matchups.weaknesses, ["ground"]);
    assert.deepEqual(matchups.resistances.sort(), ["flying", "steel"]);
    assert.deepEqual(matchups.immunities, []);
  });

  it("puts a type at exactly 0x in immunities, never in resistances", async () => {
    const client = fakeClient({
      ghost: {
        double_damage_from: [],
        half_damage_from: [],
        no_damage_from: [{ name: "normal" }, { name: "fighting" }],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const matchups = await svc.getMatchups(["ghost"]);
    assert.deepEqual(matchups.immunities.sort(), ["fighting", "normal"]);
    assert.equal(matchups.resistances.includes("normal"), false);
    assert.equal(matchups.resistances.includes("fighting"), false);
  });

  it("combines dual-type multipliers multiplicatively before partitioning (ground+flying cancels ground's electric weakness)", async () => {
    const client = fakeClient({
      ground: {
        double_damage_from: [{ name: "electric" }, { name: "water" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      flying: {
        double_damage_from: [],
        half_damage_from: [{ name: "electric" }],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const matchups = await svc.getMatchups(["ground", "flying"]);
    // ground alone is 2x weak to electric; flying alone is 0.5x resistant to
    // electric; combined multiplicatively that's 2 * 0.5 = 1x -- neutral,
    // so electric must appear in neither bucket.
    assert.equal(matchups.weaknesses.includes("electric"), false);
    assert.equal(matchups.resistances.includes("electric"), false);
    assert.deepEqual(matchups.weaknesses.sort(), ["water"]);
  });

  it("getWeaknesses and getMatchups.weaknesses agree for the same types (no duplicated logic drift)", async () => {
    const client = fakeClient({
      "type-a": {
        double_damage_from: [{ name: "type-b" }],
        half_damage_from: [],
        no_damage_from: [],
      },
      "type-b": {
        double_damage_from: [],
        half_damage_from: [],
        no_damage_from: [],
      },
    });
    const svc = createTypeEffectivenessService({ client });
    const weaknesses = await svc.getWeaknesses(["type-a", "type-b"]);
    const matchups = await svc.getMatchups(["type-a", "type-b"]);
    assert.deepEqual(weaknesses.sort(), matchups.weaknesses.sort());
  });
});
