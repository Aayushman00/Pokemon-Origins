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
