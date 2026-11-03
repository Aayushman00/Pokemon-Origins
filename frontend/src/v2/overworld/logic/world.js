// Resolve tile coordinates that may fall outside a map into the connected
// neighbour map ("edge connections"), so streaming needs no loading screen.

/**
 * Connection convention: `offset` = how far the neighbour's origin is shifted
 * from this map's origin along the shared edge (in tiles). north/south shift
 * on x, east/west on y. The neighbour's coordinate is `coord - offset`.
 * `world.get(id)` returns a loaded map model or undefined.
 */
export function createWorld(get) {
	function resolve(mapId, x, y) {
		const map = get(mapId);
		if (!map) return null;
		if (x >= 0 && y >= 0 && x < map.width && y < map.height) return { mapId, map, x, y };
		let side;
		if (y < 0) side = "north";
		else if (y >= map.height) side = "south";
		else if (x < 0) side = "west";
		else side = "east";
		const link = map.connections[side];
		if (!link) return null;
		const other = get(link.map);
		if (!other) return null;
		let nx;
		let ny;
		if (side === "north") (nx = x - link.offset), (ny = other.height + y);
		else if (side === "south") (nx = x - link.offset), (ny = y - map.height);
		else if (side === "west") (nx = other.width + x), (ny = y - link.offset);
		else (nx = x - map.width), (ny = y - link.offset);
		if (nx < 0 || ny < 0 || nx >= other.width || ny >= other.height) return null;
		return { mapId: link.map, map: other, x: nx, y: ny };
	}
	return { get, resolve };
}

/** Pixel offset of neighbour `side`'s origin relative to this map's origin. */
export function neighbourOrigin(map, side, other) {
	const link = map.connections[side];
	const o = link.offset * 16;
	if (side === "north") return { x: o, y: -other.height * 16 };
	if (side === "south") return { x: o, y: map.height * 16 };
	if (side === "west") return { x: -other.width * 16, y: o };
	return { x: map.width * 16, y: o };
}
