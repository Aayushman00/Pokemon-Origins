// Map pipeline checks, shared by `npm run validate:maps` and the tests. Pure: the
// caller passes parsed JSON in, so nothing here touches the disk.
import { COL, DIRS } from "../constants.js";
import { collisionAt, parseTiledMap } from "../logic/mapModel.js";
import { TRANSITION_TICKS } from "../logic/transition.js";
import { createWorld } from "../logic/world.js";
import { SHEET_NAMES } from "../render/sheets.generated.js";

const SIDE_STEP = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPPOSITE_SIDE = { north: "south", south: "north", east: "west", west: "east" };
const OBJECT_GROUPS = ["encounters", "warps", "triggers", "npcs", "signs"];
const isDir = (v) => v === undefined || v in DIRS;

function checkTiles(map, err, imageExists) {
	for (const ts of map.tilesets) if (!imageExists(ts.image)) err(`tileset image ${ts.image} not found`);
	for (const [name, data] of Object.entries(map.layers)) {
		for (const gid of new Set(data)) {
			if (!gid) continue;
			const ts = map.tilesets.find((t) => gid >= t.firstgid); // sorted highest first
			if (!ts || gid - ts.firstgid >= ts.tilecount) err(`layer "${name}" has gid ${gid}, outside its tileset`);
		}
	}
}

function checkObjects(map, err) {
	for (const group of OBJECT_GROUPS) {
		for (const o of map[group]) {
			if (o.x < 0 || o.y < 0 || o.x + o.w > map.width || o.y + o.h > map.height) err(`${group} "${o.name}" is outside the map`);
		}
	}
	for (const e of map.encounters) if (!e.table) err(`encounters "${e.name}" needs a table`);
	for (const n of map.npcs) {
		if (n.kind === "legendary") {
			if (!Number.isInteger(n.dex)) err(`npcs "${n.name}" is legendary and needs a dex number`);
		} else if (n.sprite !== undefined && !SHEET_NAMES.includes(n.sprite)) {
			err(`npcs "${n.name}" uses unknown sprite "${n.sprite}"`);
		}
		if (!isDir(n.facing)) err(`npcs "${n.name}" has bad facing "${n.facing}"`);
		if (collisionAt(map, n.x, n.y) === COL.FREE) err(`npcs "${n.name}" stands on a walkable tile`);
	}
}

function checkWarps(map, err, maps) {
	for (const w of map.warps) {
		const where = `warp "${w.name}"`;
		if (!isDir(w.facing)) err(`${where} has bad facing "${w.facing}"`);
		if (!isDir(w.enterDir)) err(`${where} has bad enterDir "${w.enterDir}"`);
		if (w.transition !== undefined && !(w.transition in TRANSITION_TICKS)) err(`${where} has bad transition "${w.transition}"`);
		const to = maps[w.targetMap];
		if (!to) err(`${where} goes to missing map "${w.targetMap}"`);
		else if (w.targetX < 0 || w.targetY < 0 || w.targetX >= to.width || w.targetY >= to.height) err(`${where} lands off the map ${to.id}`);
		else if (collisionAt(to, w.targetX, w.targetY) !== COL.FREE) err(`${where} lands on a tile of ${to.id} that is not free`);
	}
}

/** Cells along `side`, from the map's own edge, that a player could step off. */
function edgeCells(map, side) {
	const cells = [];
	const horizontal = side === "north" || side === "south";
	for (let i = 0; i < (horizontal ? map.width : map.height); i++) {
		const x = horizontal ? i : side === "west" ? 0 : map.width - 1;
		const y = horizontal ? (side === "north" ? 0 : map.height - 1) : i;
		if (collisionAt(map, x, y) !== COL.SOLID) cells.push([x, y]);
	}
	return cells;
}

function checkConnections(map, err, maps, world) {
	for (const [side, link] of Object.entries(map.connections)) {
		const other = maps[link.map];
		const where = `${map.id} ${side}`;
		if (!other) {
			err(`${where} connects to missing map "${link.map}"`);
			continue;
		}
		const back = other.connections[OPPOSITE_SIDE[side]];
		if (back?.map !== map.id) {
			err(`${where} -> ${link.map} has no way back`);
			continue;
		}
		if (back.offset !== -link.offset) err(`${where} offset ${link.offset} must be the negative of ${link.map} offset ${back.offset}`);
		const [dx, dy] = SIDE_STEP[side];
		const cells = edgeCells(map, side);
		if (!cells.length) err(`${where} has no open edge tile`);
		for (const [x, y] of cells) {
			const hit = world.resolve(map.id, x + dx, y + dy);
			if (!hit || collisionAt(hit.map, hit.x, hit.y) === COL.SOLID) err(`${where} exit at (${x},${y}) is blocked on ${link.map}`);
		}
	}
}

/**
 * Every problem in a set of maps, as readable strings ([] = valid).
 * `raw` = { mapId: tiledJson }. `imageExists(path)` checks a tileset image.
 */
export function validateMaps(raw, { imageExists }) {
	const errors = [];
	const maps = {};
	for (const [id, json] of Object.entries(raw)) {
		try {
			maps[id] = parseTiledMap(json, id);
		} catch (e) {
			errors.push(e.message);
		}
	}
	const world = createWorld((id) => maps[id]);
	for (const map of Object.values(maps)) {
		const err = (msg) => errors.push(`map "${map.id}": ${msg}`);
		checkTiles(map, err, imageExists);
		checkObjects(map, err);
		checkWarps(map, err, maps);
		checkConnections(map, err, maps, world);
	}
	return errors;
}

/**
 * The slice of each map the server needs, so `backend/` (its own Docker context)
 * validates against the same data the client renders. Collision is one digit per
 * tile, one string per row (see COL).
 */
export function serverIndex(raw) {
	const index = {};
	for (const id of Object.keys(raw).sort()) {
		const m = parseTiledMap(raw[id], id);
		const collision = [];
		for (let y = 0; y < m.height; y++) collision.push(m.collision.subarray(y * m.width, (y + 1) * m.width).join(""));
		index[id] = {
			width: m.width,
			height: m.height,
			collision,
			connections: m.connections,
			warps: m.warps.map(({ x, y, w, h, targetMap, targetX, targetY, enterDir }) => ({ x, y, w, h, targetMap, targetX, targetY, enterDir })),
		};
	}
	return index;
}
