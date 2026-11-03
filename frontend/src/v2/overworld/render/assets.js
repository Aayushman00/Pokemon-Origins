function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`failed to load ${src}`));
		img.src = src;
	});
}

/** Loads every tileset image used by `maps` plus the actor sprite sheets. */
export async function loadAssets(maps, { mapsBase = "/maps/", spriteBase = "/sprites/overworld/", sheets = ["player", "npc"] } = {}) {
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
	await Promise.all(jobs);
	return { tilesets, sprites };
}
