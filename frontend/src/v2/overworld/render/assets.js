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
 * On-demand image cache. `want(map)` fetches only what that map draws (its
 * tilesets, its NPCs' sheets, legendaries if it has one); each file is
 * fetched once. The map store awaits it, so a map is never shown half-drawn.
 */
export function createAssets({ mapsBase = "/maps/", spriteBase = "/sprites/overworld/" } = {}) {
	const tilesets = new Map();
	const sprites = {};
	const jobs = new Map(); // key -> promise, so each file is fetched once
	const once = (key, job) => {
		if (!jobs.has(key)) jobs.set(key, job().catch((e) => (jobs.delete(key), console.warn(e.message))));
		return jobs.get(key);
	};

	const wantSheets = (names) =>
		Promise.all(names.filter((n) => SHEET_NAMES.includes(n)).map((n) => once(`s:${n}`, () => loadImage(`${spriteBase}${n}.png`).then((img) => (sprites[n] = img)))));

	function want(map) {
		const work = map.tilesets.map((ts) => once(`t:${ts.image}`, () => loadImage(`${mapsBase}${ts.image}`).then((img) => tilesets.set(ts.image, img))));
		const npcs = map.npcs || [];
		work.push(wantSheets(npcs.filter((n) => !n.kind).map((n) => n.sprite || "npc")));
		if (npcs.some((n) => n.kind)) work.push(once("legendaries", () => loadLegendaries(sprites, `${spriteBase}legendary/`)));
		return Promise.all(work);
	}

	return { tilesets, sprites, want, wantSheets };
}

/** Eager form for a fixed set of maps + sheets (the playground). */
export async function loadAssets(maps, { sheets = SHEET_NAMES, ...opts } = {}) {
	const assets = createAssets(opts);
	await Promise.all([...maps.map(assets.want), assets.wantSheets(sheets)]);
	return assets;
}
