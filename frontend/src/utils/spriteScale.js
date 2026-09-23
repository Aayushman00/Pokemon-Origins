/**
 * Pokémon sprite pixel size from in-game height (meters).
 * Calibrated so 0.5m -> 180px, linear from there, clamped so
 * legendaries/tiny mons never break the battle stage layout.
 */
const BASE_HEIGHT_M = 0.5;
const BASE_PX = 180;
const PX_PER_0_1M = 10;
const PX_PER_METER = PX_PER_0_1M * 10; // 100

export const MIN_SPRITE_PX = 90;
export const MAX_SPRITE_PX = 260;

export function spriteSizeForHeight(heightMeters, { min = MIN_SPRITE_PX, max = MAX_SPRITE_PX } = {}) {
  const h = Number(heightMeters);
  if (!Number.isFinite(h) || h <= 0) return BASE_PX;
  const px = BASE_PX + (h - BASE_HEIGHT_M) * PX_PER_METER;
  return Math.round(Math.min(max, Math.max(min, px)));
}
