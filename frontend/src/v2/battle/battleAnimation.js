/**
 * Battle sprite animation states (spec Section 6). Phase 11 scope covers
 * FAINT/CRITICAL_HIT/DAMAGE/IDLE on the outer sprite wrapper only -- see
 * the Phase 11 plan's Rulings for why ATTACK/SEND_OUT (inner sprite) and
 * SWITCH/VICTORY (no dedicated trigger) aren't included here.
 */

/**
 * Priority: fainted > critical > super > normal > weak > idle.
 * `damageEffect` is the impact tier ('weak' | 'normal' | 'super'), or the
 * legacy boolean `true` (recoil / burn chip), which means 'normal'.
 */
export function getAnimState({ fainted, critical, damageEffect }) {
  if (fainted) return "FAINT";
  if (!damageEffect || damageEffect === "none") return "IDLE";
  if (critical) return "CRITICAL_HIT";
  if (damageEffect === "super") return "SUPER_HIT";
  if (damageEffect === "weak") return "WEAK_HIT";
  return "DAMAGE";
}

export const ANIMATION_VARIANTS = {
  IDLE: { y: 0, opacity: 1 },
  FAINT: { y: 46, opacity: 0 },
  // Recoil shake -- matches the pre-existing shake amplitude/shape so this
  // is a like-for-like state-machine wrap of the current DAMAGE behavior.
  DAMAGE: { x: [-10, 10, -10, 10, 0], opacity: [1, 0.7, 1, 0.7, 1] },
  // Super-effective: between DAMAGE (±10) and CRITICAL_HIT (±16).
  SUPER_HIT: { x: [-13, 13, -13, 13, 0], opacity: [1, 0.65, 1, 0.65, 1] },
  // Sharper amplitude + one extra oscillation, per spec Section 6:
  // "Same as DAMAGE but sharper shake amplitude."
  CRITICAL_HIT: { x: [-16, 16, -16, 16, -8, 8, 0], opacity: [1, 0.6, 1, 0.6, 1, 0.8, 1] },
  // Resisted: one soft dip, no movement.
  WEAK_HIT: { opacity: [1, 0.8, 1] },
};

// Battle UI redesign (type-based move animations): every move's type maps
// to one of two animation "feels" -- physical types lunge into contact,
// ranged/special types stay put and flash a projectile toward the
// defender instead. Checks against the ranged set only, so an
// unrecognized type falls through to "physical" (the safer default: it
// still plays the existing lunge behavior rather than a new code path).
const RANGED_FEEL_TYPES = new Set([
  "water", "electric", "psychic", "fire", "ice", "fairy", "flying",
]);

export function getMoveAnimCategory(moveType) {
  const key = String(moveType || "").toLowerCase();
  return RANGED_FEEL_TYPES.has(key) ? "ranged" : "physical";
}

// Effectiveness tier for a landed hit (spec §2). Anything that isn't a
// finite number is treated as neutral so older / non-move events never break.
export function getImpactTier(typeMultiplier) {
  if (typeof typeMultiplier !== "number" || Number.isNaN(typeMultiplier)) return "normal";
  if (typeMultiplier === 0) return "none";
  if (typeMultiplier < 1) return "weak";
  if (typeMultiplier > 1) return "super";
  return "normal";
}

// Lines shown after the HP drain, in FireRed order (spec §3 beats 8-11).
// Immunity shows none of these -- its "doesn't affect" line lives on the
// failed branch.
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

// Sprite blink class for a damage effect (CSS in BattleGround.css).
export function damageEffectClass(damageEffect) {
  if (!damageEffect || damageEffect === "none") return "";
  if (damageEffect === "weak") return "damage-effect--weak";
  if (damageEffect === "super") return "damage-effect--super";
  return "damage-effect";
}
