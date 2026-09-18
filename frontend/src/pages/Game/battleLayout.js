/**
 * Single source of truth for battle-scene slot positions.
 * Values are unchanged from the CSS they replace (BattleGround.css's old
 * .gba-enemy-container / .gba-player-container top/right/bottom/left) --
 * this module only centralizes them, it does not change them.
 */
export const BATTLE_SLOTS = {
  opponent: { top: 30, right: 40 },
  player: { bottom: 40, left: 40 },
};

export function slotStyle(role) {
  const slot = BATTLE_SLOTS[role];
  if (!slot) {
    throw new Error(`slotStyle: unknown role "${role}"`);
  }
  const style = { position: "absolute" };
  for (const [key, value] of Object.entries(slot)) {
    style[key] = `${value}px`;
  }
  return style;
}
