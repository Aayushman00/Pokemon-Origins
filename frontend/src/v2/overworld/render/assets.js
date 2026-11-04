import { SHEET_NAMES } from "./sheets.generated.js";

function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`failed to load ${src}`));
		img.src = src;
	});
}

/** Overworld sheet for the signed-in trainer: the girl for "Female", else the boy. */
export function playerSpriteFor(gender) {
	return gender === "Female" ? "player_f" : "player";
}

/**
 * Recolour RGBA pixels in place with a {"#rrggbb": "#rrggbb"} map (shiny =
 * palette swap of the normal sheet). Pure, so it is unit-tested in node.
 */
export function swapPalette(pixels, map) {
	const lut = new Map(Object.entries(map).map(([from, to]) => [from.toLowerCase(), to]));
	const hex = (v) => v.toString(16).padStart(2, "0");
	for (let i = 0; i < pixels.length; i += 4) {
		if (pixels[i + 3] === 0) continue;
		const to = lut.get(`#${hex(pixels[i])}${hex(pixels[i + 1])}${hex(pixels[i + 2])}`);
		if (!to) continue;
		pixels[i] = parseInt(to.slice(1, 3), 16);
		pixels[i + 1] = parseInt(to.slice(3, 5), 16);
		pixels[i + 2] = parseInt(to.slice(5, 7), 16);
	}
	return pixels;
}

function shinyCanvas(img, map) {
	const c = document.createElement("canvas");
	c.width = img.width;
	c.height = img.height;
	const ctx = c.getContext("2d");
	ctx.drawImage(img, 0, 0);
	const data = ctx.getImageData(0, 0, c.width, c.height);
	swapPalette(data.data, map);
	ctx.putImageData(data, 0, 0);
	return c;
}

/** Legendary sheets (normal + palette-swapped shiny) from their manifest. Optional. */
async function loadLegendaries(sprites, base) {
	try {
		const r = await fetch(`${base}manifest.json`);
		if (!r.ok) return;
		const { legendaries } = await r.json();
		await Promise.all(
			legendaries.map(async (l) => {
				const img = await loadImage(`${base}${l.dex}.png`);
				sprites[l.sprite] = img;
				sprites[`${l.sprite}_shiny`] = shinyCanvas(img, l.shiny);
			})
		);
	} catch (e) {
		console.warn("legendary sprites unavailable:", e.message);
	}
}

/**
 * Loads every tileset image used by `maps` plus the actor sprite sheets
 * (the whole cast by default: sheets are tiny and NPCs on streamed-in
 * neighbour maps can use any of them).
 */
export async function loadAssets(maps, { mapsBase = "/maps/", spriteBase = "/sprites/overworld/", sheets = SHEET_NAMES } = {}) {
	const tilesets = new Map();
	const jobs = [];
	for (const map of maps) {
		for (const ts of map.tilesets) {
			if (!tilesets.has(ts.image)) {
				tilesets.set(ts.image, null);
				jobs.push(loadImage(`${mapsBase}${ts.image}`).then((img) => tilesets.set(ts.image, img)));
			}
		}
	}
	const sprites = {};
	for (const name of sheets) jobs.push(loadImage(`${spriteBase}${name}.png`).then((img) => (sprites[name] = img)));
	jobs.push(loadLegendaries(sprites, `${spriteBase}legendary/`));
	await Promise.all(jobs);
	return { tilesets, sprites };
}
