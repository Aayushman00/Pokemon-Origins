/**
 * Pure battle-feedback rules shared by the V2 battle controller.
 * (V1's framer-motion variant tables were dropped: V2 animates with CSS
 * classes driven by these tiers.)
 */

// Physical-feel types lunge into contact; ranged/special-feel types stay
// put and fire a projectile. Unknown types fall through to "physical".
const RANGED_FEEL_TYPES = new Set(["water", "electric", "psychic", "fire", "ice", "fairy", "flying"]);

export function getMoveAnimCategory(moveType) {
  const key = String(moveType || "").toLowerCase();
  return RANGED_FEEL_TYPES.has(key) ? "ranged" : "physical";
}

// Effectiveness tier for a landed hit. Non-numbers are neutral so older /
// non-move events never break.
export function getImpactTier(typeMultiplier) {
  if (typeof typeMultiplier !== "number" || Number.isNaN(typeMultiplier)) return "normal";
  if (typeMultiplier === 0) return "none";
  if (typeMultiplier < 1) return "weak";
  if (typeMultiplier > 1) return "super";
  return "normal";
}

// Lines shown after the HP drain, in FireRed order. Immunity shows none
// of these -- its "doesn't affect" line lives on the failed branch.
export function hitResultLines({ critical_hit, type_multiplier, hits, ohko }) {
  const tier = getImpactTier(type_multiplier);
  if (tier === "none") return [];
  const lines = [];
  if (critical_hit) lines.push("A critical hit!");
  if (tier === "super") lines.push("It's super effective!");
  if (tier === "weak") lines.push("It's not very effective...");
  if (hits > 1) lines.push(`Hit ${hits} time(s)!`);
  if (ohko) lines.push("It's a one-hit KO!");
  return lines;
}
