// Map pipeline checks, shared by `npm run validate:maps` and the tests. Pure: the
// caller passes parsed JSON in, so nothing here touches the disk.
import { COL, DIRS, LEDGE_DIR } from "../constants.js";
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
		if (!n.hideFlag && collisionAt(map, n.x, n.y) === COL.FREE) err(`npcs "${n.name}" stands on a walkable tile`);
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

/** Cells one move from (x, y), by planStep's rules: a walk, or a hop that lands two on. */
function moves(map, x, y) {
	const out = [];
	for (const [dir, { dx, dy }] of Object.entries(DIRS)) {
		const col = collisionAt(map, x + dx, y + dy);
		if (col === COL.FREE) out.push([x + dx, y + dy]);
		else if (LEDGE_DIR[col] === dir && collisionAt(map, x + dx * 2, y + dy * 2) === COL.FREE) out.push([x + dx * 2, y + dy * 2]);
	}
	return out;
}

/** Tiles reachable from `seeds` on foot, never entering `blocked` ("x,y" keys). */
function flood(map, seeds, blocked = new Set()) {
	const key = ([x, y]) => `${x},${y}`;
	const seen = new Set();
	const queue = seeds.filter((c) => !blocked.has(key(c)));
	queue.forEach((c) => seen.add(key(c)));
	while (queue.length) {
		for (const next of moves(map, ...queue.pop())) {
			if (seen.has(key(next)) || blocked.has(key(next))) continue;
			seen.add(key(next));
			queue.push(next);
		}
	}
	return seen;
}

/** Everywhere the player arrives or leaves: doors, landings and open map edges. */
function keyPoints(map, maps) {
	const points = [];
	for (const other of Object.values(maps)) for (const w of other.warps) if (w.targetMap === map.id) points.push([w.targetX, w.targetY]);
	for (const w of map.warps) points.push([w.x, w.y]);
	for (const side of Object.keys(map.connections)) points.push(...edgeCells(map, side));
	return points;
}

/** Where a walk can start. A gym's puzzle and chamber share no floor: solving fades you across, so both count. */
const roots = (map, from, points) => (map.properties.puzzleChamber ? points : [from]);

/** First key point `from` cannot get to, with `blocked` closed. Ledges make this one-way, so ask from each end. */
const cutOff = (map, points, from, blocked) => {
	const seen = flood(map, roots(map, from, points), blocked);
	return points.find(([x, y]) => !seen.has(`${x},${y}`) && !blocked?.has(`${x},${y}`));
};

function checkReachable(map, err, maps) {
	const points = keyPoints(map, maps);
	if (!points.length) return;
	for (const from of points) {
		const lost = cutOff(map, points, from);
		if (lost) err(`(${lost}) cannot be reached from (${from})`);
	}
	const open = flood(map, roots(map, points[0], points));
	// Walking is reversible, so the only way into a trap is a hop: check where hops land.
	const landings = [...open].flatMap((cell) => {
		const [x, y] = cell.split(",").map(Number);
		return moves(map, x, y).filter(([a, b]) => Math.abs(a - x) + Math.abs(b - y) === 2);
	});
	for (const cell of landings) {
		const seen = flood(map, [cell]);
		if (!points.some(([x, y]) => seen.has(`${x},${y}`))) err(`(${cell}) is a trap: hop in and there is no way out`);
	}
	const signs = new Set(map.signs.map((s) => `${s.x},${s.y}`));
	for (const o of [...map.npcs, ...map.signs]) {
		const near = Object.values(DIRS).map(({ dx, dy }) => `${o.x + dx},${o.y + dy}`);
		// staff behind a counter are talked to through the sign on it
		if (!near.some((c) => open.has(c) || (map.npcs.includes(o) && signs.has(c)))) err(`"${o.name}" cannot be talked to`);
	}
}

/** Trainers must stop the player, in order. `entry` names the edge the player arrives on. */
function checkTrainers(map, err, maps) {
	const trainers = map.npcs.filter((n) => n.trainer).sort((a, b) => a.order - b.order);
	if (!trainers.length) return;
	const entry = map.properties.entry;
	if (!(entry in SIDE_STEP)) return err(`has trainers and needs an "entry" edge`);
	if (trainers.some((t, i) => t.order !== i + 1)) return err("trainer order must run 1, 2, 3...");
	const sights = trainers.map((t) => {
		const cells = new Set();
		const { dx, dy } = DIRS[t.facing] || { dx: 0, dy: 0 };
		for (let i = 1; i <= t.sight && collisionAt(map, t.x + dx * i, t.y + dy * i) !== COL.SOLID; i++) cells.add(`${t.x + dx * i},${t.y + dy * i}`);
		if (!cells.size) err(`trainer "${t.name}" sees nothing`);
		return cells;
	});
	const start = edgeCells(map, entry);
	const exits = Object.keys(SIDE_STEP).filter((s) => s !== entry).flatMap((s) => edgeCells(map, s));
	trainers.forEach((t, k) => {
		const seen = flood(map, start, sights[k]);
		if (exits.some(([x, y]) => seen.has(`${x},${y}`))) err(`trainer "${t.name}" can be walked around`);
		const next = trainers[k + 1];
		if (next && [...sights[k + 1]].some((c) => seen.has(c))) err(`trainer "${next.name}" can be met before "${t.name}"`);
		// Beaten, they stay where they stopped: any sight cell short of the last, one step from the player.
		const points = keyPoints(map, maps);
		for (const stop of [...sights[k]].slice(0, -1)) {
			const blocked = new Set([stop]);
			const sealed = points.find((from) => `${from}` !== stop && cutOff(map, points, from, blocked));
			if (sealed) err(`trainer "${t.name}" seals the way at (${stop}), stranding (${sealed})`);
		}
	});
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
 * `raw` = { mapId: tiledJson }. `imageExists(path)` checks a tileset image,
 * `names` is backend/data/world/names.json.
 */
export function validateMaps(raw, { imageExists, names }) {
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
		checkReachable(map, err, maps);
		checkTrainers(map, err, maps);
		const { nameKey } = map.properties;
		if (nameKey !== undefined && !names.places[nameKey]) err(`nameKey "${nameKey}" is not in names.json`);
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
