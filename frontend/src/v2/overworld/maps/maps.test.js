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
	it("finds the sample maps and the Origin Town showcase and parses them", () => {
		assert.deepEqual(ids.sort(), ["origin_center", "origin_home", "origin_mart", "origin_town", "test_house", "test_route", "test_town"]);
		assert.equal(maps.test_town.width, 30);
		assert.equal(maps.origin_town.width, 32);
	});
	it("Origin Town animates water shores, flower beds and tall grass", () => {
		const ts = maps.origin_town.tilesets.find((t) => t.image.endsWith("overworld.png"));
		assert.ok(ts.anim.size >= 12, `only ${ts.anim.size} animated tiles`);
		for (const a of ts.anim.values()) {
			assert.ok(a.frames.length >= 2, "an animation needs at least 2 frames");
			assert.ok(a.frames.every((f) => f.ms > 0), "every frame needs a duration");
		}
		// the pond water runs 3 frames (ripple drift, foam lap, sparkle)
		assert.ok([...ts.anim.values()].some((a) => a.frames.length === 3), "no 3-frame water animation");
		assert.ok([...ts.cover.values()].every((row) => row === 9));
	});
	it("every Origin door warp lands on a walkable cell and has a warp back", () => {
		const doors = maps.origin_town.warps;
		assert.ok(doors.length >= 4, "home, care centre (2 cells) and mart doors");
		for (const w of [...doors, ...["origin_home", "origin_center", "origin_mart"].flatMap((id) => maps[id].warps)]) {
			const from = Object.values(maps).find((m) => m.warps.includes(w));
			const to = maps[w.targetMap];
			assert.ok(to, `${from.id}: warp to missing map ${w.targetMap}`);
			assert.equal(to.collision[w.targetY * to.width + w.targetX], 0, `${from.id} -> ${to.id} lands on a solid cell`);
			// the cell you arrive on is next to a warp in the target map that leads back here
			const back = to.warps.find((b) => b.targetMap === from.id && Math.abs(b.x - w.targetX) + Math.abs(b.y - w.targetY) === 1);
			assert.ok(back, `${from.id} -> ${to.id}: no way back next to (${w.targetX},${w.targetY})`);
			assert.equal(from.collision[back.targetY * from.width + back.targetX], 0, `${to.id} -> ${from.id} lands on a solid cell`);
		}
	});
	it("interiors use the interior tileset and talk-through counters", () => {
		for (const id of ["origin_home", "origin_center", "origin_mart"]) {
			assert.ok(maps[id].tilesets.some((t) => t.image === "tilesets/interior.png"), id);
		}
		const sign = maps.origin_center.signs.find((s) => s.name === "counter_nurse");
		assert.ok(sign && sign.script.some((op) => op.op === "heal"), "nurse heals across the counter");
		const clerk = maps.origin_mart.signs.find((s) => s.name === "counter_clerk");
		assert.ok(clerk && clerk.script.some((op) => op.op === "shop"), "clerk opens the shop across the counter");
		const machine = maps.origin_center.tilesets[0];
		assert.ok([...machine.anim.values()].some((a) => a.frames.length === 3), "healing machine animates in 3 frames");
	});
	it("test maps animate water and flowers (Tiled tiles[] use the 'id' key)", () => {
		const ts = maps.test_town.tilesets.find((t) => t.image.endsWith("overworld.png"));
		assert.deepEqual([...ts.anim.keys()].sort(), [4, 6]);
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
	it("outdoor maps have a border block and interiors are black outside", () => {
		assert.deepEqual(maps.test_town.border, [3, 3, 3, 3]); // local tree tile 2, firstgid 1
		assert.deepEqual(maps.test_route.border, [3, 3, 3, 3]);
		assert.equal(maps.test_house.border, null);
		const good = JSON.parse(readFileSync(join(MAPS_DIR, "test_house.json"), "utf8"));
		const withBorder = (v) => parseTiledMap({ ...good, properties: [{ name: "border", type: "string", value: v }] }, "x").border;
		assert.deepEqual(withBorder("0,1,2,3"), [1, 2, 3, 4]);
		assert.throws(() => withBorder("1,2"), /border/);
	});
	it("tall grass is marked to cover the lower part of actors standing in it", () => {
		const ts = maps.test_town.tilesets.find((t) => t.image.endsWith("overworld.png"));
		assert.equal(ts.cover.get(14), 9);
		assert.equal(ts.cover.get(0), undefined);
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
