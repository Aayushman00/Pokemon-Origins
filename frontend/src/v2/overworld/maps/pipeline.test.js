import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { MAPS_DIR } from "./diskFetch.js";
import { serverIndex, validateMaps } from "./pipeline.js";

const INDEX_FILE = join(MAPS_DIR, "../../../backend/data/world/maps.index.json");
const load = () =>
	Object.fromEntries(
		readdirSync(MAPS_DIR)
			.filter((f) => f.endsWith(".json"))
			.map((f) => [f.replace(/\.json$/, ""), JSON.parse(readFileSync(join(MAPS_DIR, f), "utf8"))])
	);
const imageExists = (image) => existsSync(join(MAPS_DIR, image));
const names = JSON.parse(readFileSync(join(MAPS_DIR, "../../../backend/data/world/names.json"), "utf8"));
const check = (raw, opts = {}) => validateMaps(raw, { imageExists, names, ...opts });
const layer = (map, name) => map.layers.find((l) => l.name === name);
const prop = (obj, name) => obj.properties.find((p) => p.name === name);
const expectError = (raw, pattern) => {
	const errors = check(raw);
	assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern}, got ${JSON.stringify(errors)}`);
};

describe("validateMaps", () => {
	it("passes every shipped map", () => {
		assert.deepEqual(check(load()), []);
	});
	it("reports a map that does not parse, and keeps checking the others", () => {
		const raw = load();
		raw.test_house.infinite = true;
		raw.test_town.tilewidth = 8;
		const errors = check(raw);
		assert.ok(errors.some((e) => /test_house.*infinite/.test(e)));
		assert.ok(errors.some((e) => /test_town.*tiles must be/.test(e)));
	});
	it("rejects a wrong layer size", () => {
		const raw = load();
		layer(raw.test_house, "ground").data.pop();
		expectError(raw, /test_house.*layer "ground"/);
	});
	it("rejects a missing tileset image", () => {
		const raw = load();
		raw.test_house.tilesets[0].image = "tilesets/nope.png";
		expectError(raw, /test_house.*nope\.png/);
	});
	it("rejects a gid outside its tileset", () => {
		const raw = load();
		layer(raw.dawnbrook_home, "ground").data[0] = 999;
		expectError(raw, /dawnbrook_home.*gid 999/);
	});
	it("rejects an object outside the map", () => {
		const raw = load();
		layer(raw.dawnbrook, "signs").objects[0].x = 16 * 500;
		expectError(raw, /dawnbrook.*signs.*outside/);
	});
	it("rejects a warp to a missing map, off the map, or into a wall", () => {
		let raw = load();
		const warp = () => layer(raw.dawnbrook, "warps").objects[0];
		prop(warp(), "targetMap").value = "nowhere";
		expectError(raw, /warp.*missing map "nowhere"/);
		raw = load();
		prop(warp(), "targetX").value = 500;
		expectError(raw, /warp.*off the map/);
		raw = load();
		prop(warp(), "targetX").value = 0;
		prop(warp(), "targetY").value = 0;
		expectError(raw, /warp.*not free/);
	});
	it("rejects a bad warp facing, enterDir or transition", () => {
		for (const [name, value] of [["facing", "sideways"], ["enterDir", "sideways"], ["transition", "spiral"]]) {
			const raw = load();
			prop(layer(raw.dawnbrook, "warps").objects[0], name).value = value;
			expectError(raw, new RegExp(`warp.*${name}`));
		}
	});
	it("rejects a connection with no way back or the wrong offset", () => {
		let raw = load();
		prop(raw.test_route, "connect_south").value = "test_house";
		expectError(raw, /test_route south.*no way back/);
		raw = load();
		prop(raw.test_town, "connect_north_offset").value = 3;
		expectError(raw, /offset/);
	});
	it("rejects an edge exit that walks into a wall on the other map", () => {
		const raw = load();
		const town = raw.test_town;
		const col = layer(town, "collision");
		const solid = raw.test_town.tilesets.find((t) => t.name === "collision").firstgid;
		const open = col.data.slice(0, town.width).findIndex((g) => g === 0);
		assert.ok(open >= 0, "fixture: test_town has an open north edge");
		const other = layer(raw.test_route, "collision");
		const offset = prop(town, "connect_north_offset")?.value ?? 0;
		other.data[(raw.test_route.height - 1) * raw.test_route.width + open - offset] = solid;
		expectError(raw, /test_town north.*blocked/);
	});
	it("rejects an NPC with a bad schema or a walkable tile", () => {
		const npc = (raw) => layer(raw.dawnbrook, "npcs").objects[0];
		let raw = load();
		prop(npc(raw), "sprite").value = "not_a_sheet";
		expectError(raw, /npcs.*sprite "not_a_sheet"/);
		raw = load();
		prop(npc(raw), "facing").value = "sideways";
		expectError(raw, /npcs.*facing/);
		raw = load();
		const n = npc(raw);
		layer(raw.dawnbrook, "collision").data[(n.y / 16) * raw.dawnbrook.width + n.x / 16] = 0;
		expectError(raw, /npcs.*walkable/);
	});
	it("a legendary needs a dex number instead of a sheet", () => {
		const raw = load();
		const mon = layer(raw.legend_grove, "npcs").objects.find((o) => o.properties.some((p) => p.value === "legendary"));
		mon.properties = mon.properties.filter((p) => p.name !== "dex");
		expectError(raw, /legend_grove.*dex/);
	});
	it("rejects a nameKey missing from names.json", () => {
		const raw = load();
		prop(raw.dawnbrook, "nameKey").value = "nowhere";
		expectError(raw, /dawnbrook.*nameKey "nowhere"/);
	});
	it("rejects a door or exit that cannot be walked to", () => {
		const raw = load();
		const map = raw.dawnbrook;
		const solid = map.tilesets.find((t) => t.name === "collision").firstgid;
		for (let y = 0; y < map.height; y++) layer(map, "collision").data[y * map.width + 14] = solid;
		expectError(raw, /dawnbrook.*cannot be reached/);
	});
	it("rejects a trainer who can be walked around", () => {
		const raw = load();
		prop(layer(raw.route_1, "npcs").objects[1], "sight").value = 1;
		expectError(raw, /route_1.*can be walked around/);
	});
	it("rejects trainers who can be met out of order", () => {
		const raw = load();
		const [a, b] = layer(raw.route_1, "npcs").objects;
		prop(a, "order").value = 2;
		prop(b, "order").value = 1;
		expectError(raw, /route_1.*met before/);
	});
	it("rejects a broken trainer schema", () => {
		let raw = load();
		prop(layer(raw.route_1, "npcs").objects[1], "order").value = 1;
		expectError(raw, /route_1.*order/);
		raw = load();
		raw.route_1.properties = raw.route_1.properties.filter((p) => p.name !== "entry");
		expectError(raw, /route_1.*entry/);
	});
	it("rejects an encounter zone without a table", () => {
		const raw = load();
		layer(raw.route_1, "encounters").objects[0].properties = [];
		expectError(raw, /encounters.*table/);
	});
});

describe("serverIndex", () => {
	it("keeps collision, warps and connections, and nothing the client alone needs", () => {
		const route = serverIndex(load()).test_route;
		assert.deepEqual(Object.keys(route).sort(), ["collision", "connections", "height", "warps", "width"]);
		assert.equal(route.collision.length, route.height);
		assert.ok(route.collision.every((row) => row.length === route.width && /^[0-5]+$/.test(row)));
		assert.equal(route.connections.south.map, "test_town");
	});
	it("keeps what a warp needs to be checked server side", () => {
		const warp = serverIndex(load()).dawnbrook.warps[0];
		assert.deepEqual(Object.keys(warp).sort(), ["enterDir", "h", "targetMap", "targetX", "targetY", "w", "x", "y"]);
	});
	it("the committed index matches the maps (run npm run maps:index if this fails)", () => {
		assert.deepEqual(JSON.parse(readFileSync(INDEX_FILE, "utf8")), JSON.parse(JSON.stringify(serverIndex(load()))));
	});
});
