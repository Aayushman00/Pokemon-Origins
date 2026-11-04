import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createFx, stepFx } from "./fieldfx.js";
import { clouds, particles, smoke, tintFor } from "./ambient.js";
import { parseTiledMap } from "../logic/mapModel.js";
import { VIEW_H, VIEW_W } from "../constants.js";

const walk = (x, y, to) => ({ mapId: "a", phase: "walk", x, y, to: { mapId: "a", ...to } });
const idle = (x, y) => ({ mapId: "a", phase: "idle", x, y, to: null });
const never = () => false;

describe("field effects", () => {
	it("rustles once when a step enters tall grass", () => {
		const fx = createFx();
		const grass = (x, y) => x === 2 && y === 1;
		stepFx(fx, { tick: 1, player: walk(1, 1, { x: 2, y: 1 }), isGrass: grass });
		stepFx(fx, { tick: 2, player: walk(1, 1, { x: 2, y: 1 }), isGrass: grass });
		assert.deepEqual(fx.effects.map((e) => [e.kind, e.x, e.y]), [["rustle", 2, 1]]);
	});

	it("stays quiet on plain ground", () => {
		const fx = createFx();
		stepFx(fx, { tick: 1, player: walk(1, 1, { x: 2, y: 1 }), isGrass: never });
		assert.equal(fx.effects.length, 0);
	});

	it("puffs dust where a ledge hop lands", () => {
		const fx = createFx();
		stepFx(fx, { tick: 1, player: { ...idle(1, 1), phase: "hop" }, isGrass: never });
		stepFx(fx, { tick: 2, player: idle(1, 3), isGrass: never });
		assert.deepEqual(fx.effects.map((e) => [e.kind, e.x, e.y]), [["dust", 1, 3]]);
	});

	it("drops effects when they run out", () => {
		const fx = createFx();
		const grass = () => true;
		stepFx(fx, { tick: 1, player: walk(1, 1, { x: 2, y: 1 }), isGrass: grass });
		stepFx(fx, { tick: 200, player: idle(2, 1), isGrass: grass });
		assert.equal(fx.effects.length, 0);
	});

	it("clears effects from the previous map", () => {
		const fx = createFx();
		stepFx(fx, { tick: 1, player: walk(1, 1, { x: 2, y: 1 }), isGrass: () => true });
		stepFx(fx, { tick: 2, player: { ...idle(5, 5), mapId: "b" }, isGrass: never });
		assert.equal(fx.effects.length, 0);
	});
});

describe("ambient", () => {
	for (const kind of ["butterflies", "leaves", "fireflies", "rain", "snow"]) {
		it(`${kind} stay on screen and move`, () => {
			const a = particles(kind, 100);
			const b = particles(kind, 160);
			assert.ok(a.length > 0);
			assert.notDeepEqual(a, b);
			for (const p of a) assert.ok(p.x >= 0 && p.x < VIEW_W && p.y >= 0 && p.y < VIEW_H, kind);
		});
	}

	it("is deterministic and empty for unknown kinds", () => {
		assert.deepEqual(particles("leaves", 50), particles("leaves", 50));
		assert.deepEqual(particles(undefined, 50), []);
	});
	it("stay put in the world when the camera moves", () => {
		for (const kind of ["butterflies", "leaves", "fireflies", "rain", "snow"]) {
			const still = particles(kind, 100, { x: 0, y: 0 });
			const panned = particles(kind, 100, { x: 30, y: 20 });
			still.forEach((p, i) => {
				assert.equal(panned[i].x, (p.x - 30 + VIEW_W) % VIEW_W, kind);
				assert.equal(panned[i].y, (p.y - 20 + VIEW_H) % VIEW_H, kind);
			});
		}
	});

	it("tints dusk and night but not day", () => {
		assert.equal(tintFor("day"), null);
		assert.equal(tintFor(undefined), null);
		assert.ok(tintFor("dusk"));
		assert.ok(tintFor("night"));
	});
});

describe("sky", () => {
	it("smoke rises and fades", () => {
		const [first] = smoke(0);
		const [later] = smoke(100);
		assert.ok(later.dy < first.dy);
		assert.ok(later.alpha < first.alpha);
	});

	it("neighbouring chimneys are out of step", () => {
		assert.notDeepEqual(smoke(40, 0), smoke(40, 1));
	});

	it("clouds drift, and stay put in the world as the camera moves", () => {
		const a = clouds(0, 0, 0);
		assert.notDeepEqual(a, clouds(300, 0, 0));
		assert.equal(clouds(0, 16, 0)[0].x, a[0].x - 16);
	});
});

describe("tile flags in the map model", () => {
	it("reads glow", () => {
		const layer = (name) => ({ name, type: "tilelayer", width: 1, height: 1, data: [0] });
		const map = parseTiledMap(
			{
				orientation: "orthogonal",
				infinite: false,
				tilewidth: 16,
				tileheight: 16,
				width: 1,
				height: 1,
				layers: ["ground", "decor", "objects", "above", "collision"].map(layer),
				tilesets: [
					{
						firstgid: 1,
						name: "t",
						image: "t.png",
						columns: 1,
						tilecount: 2,
						tiles: [
							{ id: 0, properties: [{ name: "glow", type: "int", value: 18 }] },
						],
					},
					{ firstgid: 100, name: "collision", tilecount: 1 },
				],
			},
			"t",
		);
		const ts = map.tilesets[0];
		assert.equal(ts.glow.get(0), 18);
	});
});
