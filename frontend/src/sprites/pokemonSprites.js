/**
 * Pokémon sprite resolver.
 * Paths are derived from National Dex number (pokemon_id) + variant.
 * Isolated from battles, campaign, XP, and trainers.
 */

export const DEX_MIN = 1;
export const DEX_MAX = 151;
export const SPRITE_VARIANTS = ["front", "back", "icon"];
export const SPRITE_BASE = "/sprites/pokemon";
export const SPRITE_FALLBACK_BASE = `${SPRITE_BASE}/_fallback`;

function isValidDex(pokemonId) {
	const id = Number(pokemonId);
	return Number.isInteger(id) && id >= DEX_MIN && id <= DEX_MAX;
}

export function padDex(pokemonId) {
	if (!isValidDex(pokemonId)) return null;
	return String(Number(pokemonId)).padStart(3, "0");
}

function normalizeVariant(variant) {
	const v = String(variant || "front").toLowerCase();
	return SPRITE_VARIANTS.includes(v) ? v : "front";
}

/**
 * Filename inside a dex folder.
 * front.png, front-b.png, back.png, icon.png, front-female.png, …
 */
export function variantFilename({
	variant = "front",
	frame,
	gender,
	shiny = false,
} = {}) {
	const v = normalizeVariant(variant);
	const parts = [v];
	if (gender && String(gender).toLowerCase() === "female") {
		parts.push("female");
	}
	if (frame === "b" || frame === 2 || frame === "2") {
		parts.push("b");
	}
	const file = `${parts.join("-")}.png`;
	return shiny ? `shiny/${file}` : file;
}

export function getPokemonSpriteFallback(variant = "front") {
	return `${SPRITE_FALLBACK_BASE}/${normalizeVariant(variant)}.png`;
}

/**
 * @param {object} opts
 * @param {number|string} [opts.pokemonId] National Dex number
 * @param {"front"|"back"|"icon"} [opts.variant]
 * @param {"a"|"b"|1|2} [opts.frame]
 * @param {"default"|"female"} [opts.gender]
 * @param {boolean} [opts.shiny]
 * @returns {string} public URL, never an external host
 */
export function getPokemonSprite({
	pokemonId,
	variant = "front",
	frame,
	gender,
	shiny = false,
} = {}) {
	const dex = padDex(pokemonId);
	if (!dex) return getPokemonSpriteFallback(variant);
	const file = variantFilename({ variant, frame, gender, shiny });
	return `${SPRITE_BASE}/${dex}/${file}`;
}

export function isLocalSpriteUrl(url) {
	return typeof url === "string" && url.startsWith(`${SPRITE_BASE}/`);
}
