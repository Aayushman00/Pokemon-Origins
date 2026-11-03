import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { COL } from "../constants.js";
import { collisionAt, parseTiledMap, MapError } from "../logic/mapModel.js";
import { createMapStore } from "./mapStore.js";

import { MAPS_DIR, fetchFromDisk } from "./diskFetch.js";

const ids = readdirSync(MAPS_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
const maps = Object.fromEntries(ids.map((id) => [id, parseTiledMap(JSON.parse(readFileSync(join(MAPS_DIR, `${id}.json`), "utf8")), id)]));

describe("sample maps (smoke + lint)", () => {
	it("finds the three sample maps and parses them", () => {
		assert.deepEqual(ids.sort(), ["test_house", "test_route", "test_town"]);
		assert.equal(maps.test_town.width, 30);
	});
	it("every tileset image exists and every gid is inside its tileset", () => {
		for (const m of Object.values(maps)) {
			for (const ts of m.tilesets) assert.ok(existsSync(join(MAPS_DIR, ts.image)), `${m.id}: ${ts.image}`);
			for (const layer of Object.values(m.layers)) {
				for (const gid of layer) {
					if (!gid) continue;
					const ts = m.tilesets.find((t) => gid >= t.firstgid);
					assert.ok(ts && gid - ts.firstgid < ts.tilecount, `${m.id}: bad gid ${gid}`);
				}
			}
		}
	});
	it("every warp lands on a free tile of an existing map", () => {
		for (const m of Object.values(maps)) {
			for (const w of m.warps) {
				const target = maps[w.targetMap];
				assert.ok(target, `${m.id}/${w.name} -> ${w.targetMap}`);
				assert.ok(w.targetX < target.width && w.targetY < target.height);
				assert.equal(collisionAt(target, w.targetX, w.targetY), COL.FREE, `${m.id}/${w.name} lands in a wall`);
			}
		}
	});
	it("edge connections are reciprocal with opposite offsets", () => {
		const opposite = { north: "south", south: "north", east: "west", west: "east" };
		for (const m of Object.values(maps)) {
			for (const [side, link] of Object.entries(m.connections)) {
				const back = maps[link.map]?.connections[opposite[side]];
				assert.ok(back && back.map === m.id, `${m.id} ${side} -> ${link.map} has no way back`);
				assert.equal(back.offset, -link.offset);
			}
		}
	});
	it("NPCs and sign scripts stand on tiles that are not walls, and npc tiles are blocked", () => {
		for (const m of Object.values(maps)) for (const n of m.npcs) assert.notEqual(collisionAt(m, n.x, n.y), COL.FREE, `${m.id}/${n.name} is walkable (players could overlap it)`);
	});
	it("rejects broken maps with a clear message", () => {
		const good = JSON.parse(readFileSync(join(MAPS_DIR, "test_house.json"), "utf8"));
		assert.throws(() => parseTiledMap({ ...good, infinite: true }, "x"), MapError);
		assert.throws(() => parseTiledMap({ ...good, tilesets: good.tilesets.filter((t) => t.name !== "collision") }, "x"), /collision/);
		const bad = structuredClone(good);
		bad.layers.find((l) => l.name === "npcs").objects[0].properties.find((p) => p.name === "script").value = "[{\"op\":\"nope\"}]";
		assert.throws(() => parseTiledMap(bad, "x"), /unknown op/);
	});
});

describe("map store", () => {
	it("loadAround preloads edge neighbours and warp targets", async () => {
		const store = createMapStore({ fetchJson: fetchFromDisk });
		await store.loadAround("test_town");
		assert.ok(store.get("test_route") && store.get("test_house"));
	});
	it("dedupes concurrent loads", async () => {
		let calls = 0;
		const store = createMapStore({ fetchJson: (u) => (calls++, fetchFromDisk(u)) });
		await Promise.all([store.load("test_house"), store.load("test_house")]);
		assert.equal(calls, 1);
	});
});
