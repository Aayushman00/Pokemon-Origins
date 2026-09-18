const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy",
];

function createTypeEffectivenessService({ client }) {
  async function getCombinedMultipliers(types) {
    const multiplier = new Map(ALL_TYPES.map((t) => [t, 1]));
    const relations = await Promise.all(
      types.map((t) => client.getType(String(t).toLowerCase()))
    );
    for (const { damage_relations } of relations) {
      for (const { name } of damage_relations.double_damage_from) {
        multiplier.set(name, (multiplier.get(name) ?? 1) * 2);
      }
      for (const { name } of damage_relations.half_damage_from) {
        multiplier.set(name, (multiplier.get(name) ?? 1) * 0.5);
      }
      for (const { name } of damage_relations.no_damage_from) {
        multiplier.set(name, (multiplier.get(name) ?? 1) * 0);
      }
    }
    return multiplier;
  }

  async function getWeaknesses(types) {
    const multiplier = await getCombinedMultipliers(types);
    return Array.from(multiplier.entries())
      .filter(([, value]) => value > 1)
      .map(([name]) => name);
  }

  return { getWeaknesses, getCombinedMultipliers };
}

module.exports = { createTypeEffectivenessService, ALL_TYPES };
