import { COL, TILE } from "../constants.js";
import { parseScript } from "./script.js";

export class MapError extends Error {}

const TILE_LAYERS = ["ground", "decor", "objects", "above"];
const OBJECT_GROUPS = ["encounters", "warps", "triggers", "npcs", "signs"];
const SIDES = ["north", "south", "east", "west"];
const GID_MASK = 0x1fffffff; // strip Tiled flip flags (flips unsupported in Phase 1)

export function propsToObject(list) {
	const out = {};
	for (const p of list || []) out[p.name] = p.value;
	return out;
}

function fail(id, msg) {
	throw new MapError(`map "${id}": ${msg}`);
}

function parseObject(id, group, o) {
	const props = propsToObject(o.properties);
	const x = Math.floor(o.x / TILE);
	const y = Math.floor(o.y / TILE);
	const w = o.point ? 1 : Math.max(1, Math.round((o.width || TILE) / TILE));
	const h = o.point ? 1 : Math.max(1, Math.round((o.height || TILE) / TILE));
	const out = { id: o.id, name: o.name || `${group}#${o.id}`, x, y, w, h, ...props };
	const where = `map "${id}" ${group} "${out.name}"`;
	if (props.script !== undefined) out.script = parseScript(props.script, where);
	if (group === "warps") {
		for (const k of ["targetMap", "targetX", "targetY"]) {
			if (props[k] === undefined) fail(id, `${where} is missing "${k}"`);
		}
	}
	if (group === "triggers" && !["step", "enter", "flag"].includes(props.when)) {
		fail(id, `${where} needs when = step | enter | flag`);
	}
	if (group === "triggers" && props.when === "flag" && !props.flag) fail(id, `${where} needs a "flag" property`);
	if ((group === "triggers" || group === "npcs") && !out.script) fail(id, `${where} needs a "script"`);
	if (group === "signs" && !props.text && !out.script) fail(id, `${where} needs "text" or "script"`);
	return out;
}

/** Tiled JSON (orthogonal, finite, embedded tilesets, uncompressed data) -> map model. */
export function parseTiledMap(json, id) {
	if (!json || json.orientation !== "orthogonal") fail(id, "must be orthogonal");
	if (json.infinite) fail(id, "infinite maps are not supported");
	if (json.tilewidth !== TILE || json.tileheight !== TILE) fail(id, `tiles must be ${TILE}x${TILE}`);
	const { width, height } = json;
	const size = width * height;

	const tilesets = [];
	let collisionFirst = null;
	for (const ts of json.tilesets || []) {
		if (ts.source) fail(id, "external tilesets are not supported; embed them");
		if (ts.name === "collision") {
			collisionFirst = ts.firstgid;
			continue;
		}
		const anim = new Map();
		const cover = new Map(); // localId -> first tile row drawn again over actors standing on it (tall grass)
		for (const t of ts.tiles || []) {
			const tp = propsToObject(t.properties);
			if (Number.isInteger(tp.cover) && tp.cover >= 0 && tp.cover < TILE) cover.set(t.id, tp.cover);
			if (t.animation?.length) {
				const frames = t.animation.map((f) => ({ id: f.tileid, ms: f.duration }));
				anim.set(t.id, { frames, total: frames.reduce((s, f) => s + f.ms, 0) });
			}
		}
		tilesets.push({ firstgid: ts.firstgid, image: ts.image, columns: ts.columns, tilecount: ts.tilecount, anim, cover });
	}
	tilesets.sort((a, b) => b.firstgid - a.firstgid); // highest first for lookup
	if (collisionFirst === null) fail(id, 'needs a tileset named "collision"');

	const layers = {};
	let collision = new Uint8Array(size);
	const groups = Object.fromEntries(OBJECT_GROUPS.map((g) => [g, []]));
	for (const layer of json.layers || []) {
		if (layer.type === "tilelayer") {
			if (!Array.isArray(layer.data) || layer.data.length !== size) fail(id, `layer "${layer.name}" must be uncompressed data of ${size} tiles`);
			if (TILE_LAYERS.includes(layer.name)) layers[layer.name] = Uint32Array.from(layer.data, (g) => g & GID_MASK);
			else if (layer.name === "collision") {
				collision = Uint8Array.from(layer.data, (g) => {
					if (!g) return COL.FREE;
					const v = (g & GID_MASK) - collisionFirst + 1;
					if (v < 1 || v > 5) fail(id, `collision layer has unknown tile ${g}`);
					return v;
				});
			}
		} else if (layer.type === "objectgroup" && OBJECT_GROUPS.includes(layer.name)) {
			groups[layer.name] = (layer.objects || []).map((o) => parseObject(id, layer.name, o));
		}
	}
	if (!layers.ground) fail(id, 'needs a "ground" tile layer');
	for (const name of TILE_LAYERS) layers[name] ||= new Uint32Array(size);

	const properties = propsToObject(json.properties);
	const connections = {};
	for (const side of SIDES) {
		const target = properties[`connect_${side}`];
		if (target) connections[side] = { map: String(target), offset: Number(properties[`connect_${side}_offset`] || 0) };
	}

	// Border: what the GBA games draw outside a map that has no connection on that
	// side. "a" or "a,b,c,d" = local ids of the first tileset, tiled as a 2x2 block.
	let border = null;
	if (properties.border !== undefined && properties.border !== "") {
		const ids = String(properties.border).split(",").map((v) => Number(v.trim()));
		if (!(ids.length === 1 || ids.length === 4) || ids.some((v) => !Number.isInteger(v) || v < 0)) fail(id, 'property "border" must be "id" or "a,b,c,d"');
		const first = Math.min(...tilesets.map((t) => t.firstgid));
		border = (ids.length === 1 ? [ids[0], ids[0], ids[0], ids[0]] : ids).map((v) => first + v);
	}

	const warpIndex = new Map();
	for (const w of groups.warps) for (let dy = 0; dy < w.h; dy++) for (let dx = 0; dx < w.w; dx++) warpIndex.set(`${w.x + dx},${w.y + dy}`, w);

	return { id, width, height, layers, collision, tilesets, connections, properties, border, warpIndex, ...groups };
}

export function collisionAt(map, x, y) {
	if (x < 0 || y < 0 || x >= map.width || y >= map.height) return COL.SOLID;
	return map.collision[y * map.width + x];
}
