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

// Shadow footprint per slot -- same visible size as the outgoing CSS
// ::after blur-ellipse rules, just rendered as a flat asset now (see
// Phase 5 plan Ruling 3: one asset, sized per slot via CSS, not multiple
// asset buckets -- every sprite shares the same on-screen width today).
export const SHADOW_SIZES = {
  opponent: { width: 180, height: 20, bottom: -10, left: -30 },
  player: { width: 200, height: 30, bottom: -15, right: -30 },
};

export function shadowStyle(role) {
  const size = SHADOW_SIZES[role];
  if (!size) {
    throw new Error(`shadowStyle: unknown role "${role}"`);
  }
  const style = { position: "absolute", zIndex: -1, width: `${size.width}px`, height: `${size.height}px` };
  if (size.bottom !== undefined) style.bottom = `${size.bottom}px`;
  if (size.top !== undefined) style.top = `${size.top}px`;
  if (size.left !== undefined) style.left = `${size.left}px`;
  if (size.right !== undefined) style.right = `${size.right}px`;
  return style;
}
