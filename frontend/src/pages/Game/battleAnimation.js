/**
 * Battle sprite animation states (spec Section 6). Phase 11 scope covers
 * FAINT/CRITICAL_HIT/DAMAGE/IDLE on the outer sprite wrapper only -- see
 * the Phase 11 plan's Rulings for why ATTACK/SEND_OUT (inner sprite) and
 * SWITCH/VICTORY (no dedicated trigger) aren't included here.
 */

/** Priority order: fainted beats critical beats plain damage beats idle. */
export function getAnimState({ fainted, critical, damageEffect }) {
  if (fainted) return "FAINT";
  if (damageEffect && critical) return "CRITICAL_HIT";
  if (damageEffect) return "DAMAGE";
  return "IDLE";
}

export const ANIMATION_VARIANTS = {
  IDLE: { y: 0, opacity: 1 },
  FAINT: { y: 46, opacity: 0 },
  // Recoil shake -- matches the pre-existing shake amplitude/shape so this
  // is a like-for-like state-machine wrap of the current DAMAGE behavior.
  DAMAGE: { x: [-10, 10, -10, 10, 0], opacity: [1, 0.7, 1, 0.7, 1] },
  // Sharper amplitude + one extra oscillation, per spec Section 6:
  // "Same as DAMAGE but sharper shake amplitude."
  CRITICAL_HIT: { x: [-16, 16, -16, 16, -8, 8, 0], opacity: [1, 0.6, 1, 0.6, 1, 0.8, 1] },
};
