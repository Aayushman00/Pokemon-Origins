import { test } from "node:test";
import assert from "node:assert/strict";
import { asciiMap } from "../../overworld/logic/fixtures.js";
import { RUN_TICKS, WALK_TICKS } from "../../overworld/constants.js";
import { createPlaygroundGame } from "./playgroundGame.js";

const MAP = asciiMap("playground", ["......", "..#...", "......", "......"]);
const still = { dir: null, run: false };

function setup(players) {
	const sent = [];
	const ref = new Map(Object.entries(players));
	const game = createPlaygroundGame({ map: MAP, selfId: "me", players: ref, emitMove: (m) => sent.push(m) });
	return { game, sent, ref };
}

const run = (game, input, n) => {
	for (let i = 0; i < n; i++) game.tick(input);
};

test("snaps a spawn on a wall to the nearest open tile and tells the server", () => {
	const { game, sent } = setup({ me: { x: 32, y: 16 } });
	game.tick(still);
	assert.notDeepEqual([game.player.x, game.player.y], [2, 1]);
	assert.equal(MAP.collision[game.player.y * MAP.width + game.player.x], 0);
	assert.deepEqual(sent[0], { x: game.player.x * 16, y: game.player.y * 16, facing: "down", run: false });
});

test("a held direction walks one tile per step and sends the destination at the step start", () => {
	const { game, sent } = setup({ me: { x: 0, y: 0 } });
	game.tick({ dir: "right", run: false }); // turn
	run(game, { dir: "right", run: false }, 8);
	const step = sent.find((m) => m.x === 16);
	assert.deepEqual(step, { x: 16, y: 0, facing: "right", run: false });
	run(game, still, WALK_TICKS);
	assert.deepEqual([game.player.x, game.player.y], [1, 0]);
});

test("walls stop the walker", () => {
	const { game } = setup({ me: { x: 16, y: 16 } });
	run(game, { dir: "right", run: false }, 60);
	assert.deepEqual([game.player.x, game.player.y], [1, 1]);
});

test("other trainers walk tile by tile toward where the server says they are, at run speed when running", () => {
	const { game, ref } = setup({ me: { x: 0, y: 48 }, them: { x: 0, y: 0, gender: "Female" } });
	game.tick(still);
	ref.get("them").x = 32;
	ref.get("them").run = true;
	game.tick(still);
	const them = game.npcs().find((n) => n.id === "them");
	assert.equal(them.phase, "walk");
	assert.equal(them.dur, RUN_TICKS);
	assert.equal(them.sprite, "player_f");
	run(game, still, RUN_TICKS * 2 + 2);
	const done = game.npcs().find((n) => n.id === "them");
	assert.deepEqual([done.x, done.y, done.phase], [2, 0, "idle"]);
});

test("a far jump teleports instead of walking across the map, and facing follows the server", () => {
	const { game, ref } = setup({ me: { x: 0, y: 48 }, them: { x: 0, y: 0 } });
	game.tick(still);
	Object.assign(ref.get("them"), { x: 80, y: 48, facing: "left" });
	game.tick(still);
	const them = game.npcs().find((n) => n.id === "them");
	assert.deepEqual([them.x, them.y, them.facing], [5, 3, "left"]);
});

test("trainers who leave disappear", () => {
	const { game, ref } = setup({ me: { x: 0, y: 0 }, them: { x: 16, y: 0 } });
	game.tick(still);
	ref.delete("them");
	game.tick(still);
	assert.equal(game.npcs().length, 0);
});

test("a frozen tick keeps you standing while others still walk", () => {
	const { game } = setup({ me: { x: 0, y: 0 }, them: { x: 0, y: 48 } });
	game.tick(still);
	run(game, { dir: "right", run: false }, 40);
	assert.equal(game.player.x, 1); // sanity: unfrozen you walk
	const { game: g2, ref } = setup({ me: { x: 0, y: 0 }, them: { x: 0, y: 48 } });
	g2.tick(still);
	ref.get("them").x = 16;
	for (let i = 0; i < 40; i++) g2.tick({ dir: "right", run: false }, true);
	assert.deepEqual([g2.player.x, g2.player.y], [0, 0]);
	assert.equal(g2.npcs()[0].x, 1);
});

test("night mode swaps in the night-time map and back", () => {
	const { game } = setup({ me: { x: 0, y: 0 } });
	game.setNight(true);
	assert.equal(game.map.properties.time, "night");
	assert.equal(game.map.layers, MAP.layers);
	game.setNight(false);
	assert.equal(game.map, MAP);
});

test("facing a plaza spot finds it; every spot is solid on the real park map", async () => {
	const { readFile } = await import("node:fs/promises");
	const { SPOTS, spotAt } = await import("./playgroundGame.js");
	const park = JSON.parse(await readFile(new URL("../../../../public/maps/playground.json", import.meta.url), "utf8"));
	const col = park.layers.find((l) => l.name === "collision").data;
	for (const s of SPOTS) for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) assert.ok(col[y * park.width + x], `${s.kind} at ${x},${y} should block`);
	assert.equal(spotAt(19, 13).kind, "fountain");
	assert.equal(spotAt(0, 0), null);
});
