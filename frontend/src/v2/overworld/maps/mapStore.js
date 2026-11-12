import { parseTiledMap } from "../logic/mapModel.js";

/**
 * Loads + caches parsed maps. `fetchJson(url)` is injectable for tests/node.
 * Streaming: `loadAround(id)` loads a map plus its edge neighbours and warp
 * targets, so crossing an edge or walking through a door never waits.
 * `onLoad(map)` (e.g. fetch its images) is awaited before the map is visible.
 * `prune(id)` drops every map outside id's neighbourhood: one area in memory.
 */
export function createMapStore({ fetchJson, base = "/maps/", onLoad = () => {} }) {
	const maps = new Map();
	const pending = new Map();

	async function load(id) {
		if (maps.has(id)) return maps.get(id);
		if (!pending.has(id)) {
			pending.set(
				id,
				fetchJson(`${base}${id}.json`)
					.then(async (json) => {
						const map = parseTiledMap(json, id);
						await onLoad(map);
						maps.set(id, map);
						return map;
					})
					.finally(() => pending.delete(id))
			);
		}
		return pending.get(id);
	}

	function neighbours(map) {
		const ids = new Set(Object.values(map.connections).map((c) => c.map));
		for (const w of map.warps) ids.add(w.targetMap);
		ids.delete(map.id);
		return [...ids];
	}

	async function loadAround(id) {
		const map = await load(id);
		await Promise.all(neighbours(map).map((n) => load(n).catch((e) => console.warn(`preload ${n} failed:`, e.message))));
		return map;
	}

	function prune(id) {
		const map = maps.get(id);
		if (!map) return;
		const keep = new Set([id, ...neighbours(map)]);
		for (const k of maps.keys()) if (!keep.has(k)) maps.delete(k);
	}

	return { get: (id) => maps.get(id), load, loadAround, neighbours, prune };
}
