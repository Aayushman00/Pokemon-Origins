/**
 * Battle-screen sprite resolver. Points at sheet-extracted, 2-frame battle
 * art under /sprites/battle — separate from the curated set in
 * pokemonSprites.js, which every other screen (Bag, Pokedex, Landing, etc.)
 * keeps using unchanged.
 */
import { padDex } from "./pokemonSprites.js";

export const BATTLE_SPRITE_BASE = "/sprites/battle";

/**
 * @param {object} opts
 * @param {number|string} [opts.pokemonId] National Dex number
 * @param {"front"|"back"} [opts.variant]
 * @param {"a"|"b"} [opts.frame] idle animation frame
 * @returns {string|null} public URL, or null when the dex id is invalid
 */
export function getBattleSprite({ pokemonId, variant = "front", frame = "a" } = {}) {
	const dex = padDex(pokemonId);
	if (!dex) return null;
	const v = variant === "back" ? "back" : "front";
	const suffix = frame === "b" ? "-b" : "";
	return `${BATTLE_SPRITE_BASE}/${dex}/${v}${suffix}.png`;
}
