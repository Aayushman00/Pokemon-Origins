// The whole game on foot: every campaign battle in the server's order, from Dawnbrook to
// Mewtwo. Battles are won by setting the flag the server would set, and a battle met out
// of order fails the run, because the real server would refuse it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { COL, DIRS, LEDGE_DIR } from "../constants.js";
import { dueTriggers, warpFor } from "../logic/events.js";
import { collisionAt } from "../logic/mapModel.js";
import { createWorld } from "../logic/world.js";
import AP, { GYM_PUZZLES } from "../logic/puzzles.generated.js";
import { fetchFromDisk } from "../maps/diskFetch.js";
import { createMapStore } from "../maps/mapStore.js";
import { createMemoryFlags } from "./flags.js";
import { createOverworld } from "./overworld.js";

const DATA = new URL("../../../../../backend/data/", import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, DATA), "utf8"));
const GAUNTLET = Array.from({ length: 10 }, (_, i) => json(`campaign/level${i + 1}.json`).battles.map((b) => b.trainerId || b.encounterId)).flat();

async function start() {
	const store = createMapStore({ fetchJson: fetchFromDisk });
	const ids = Object.keys(json("world/maps.index.json"));
	await Promise.all(ids.map((id) => store.loadAround(id)));
	const maps = ids.map((id) => store.get(id));
	const world = createWorld((id) => store.get(id));
	const flags = createMemoryFlags();
	const played = [];
	let cursor = 0;
	let due = null;
	let offered = 0; // starter picks the Professor opened
	const game = createOverworld({
		store,
		flags,
		start: { mapId: "dawnbrook", x: 7, y: 7, facing: "down" },
		emit: (e) => {
			if (e.type !== "effect") return;
			if (e.effect.type === "solve") flags.add(`gym:${e.effect.leaderId}:solved`);
			if (e.effect.type === "battle") due = e.effect.trainer;
			if (e.effect.type === "starter") {
				offered += 1;
				flags.add("story:starter"); // the host does this once the server takes the pick
			}
		},
	});
	game.enter();

	// Run the world until it hands control back: dialogue closed, battles won, fades finished.
	const settle = () => {
		for (let i = 0; i < 4000; i++) {
			if (game.mode === "dialogue") game.closeDialogue();
			else if (game.mode === "battle") {
				assert.equal(due, GAUNTLET[cursor], `met ${due} at ${game.player.mapId} before ${GAUNTLET[cursor]}`);
				flags.add(`trainer:${due}`);
				played.push(due);
				cursor += 1;
				game.endBattle();
			} else if (game.mode === "explore" && game.player.phase === "idle") return;
			game.tick({ dir: null }, []);
		}
		assert.fail(`stuck in ${game.mode} at ${game.player.mapId}`);
	};
	const pos = () => `${game.player.mapId} ${game.player.x},${game.player.y}`;
	const key = (c) => `${c.mapId}:${c.x},${c.y}`;

	const sealed = (map, x, y) =>
		dueTriggers(map, "step", flags, { x, y }).some((t) => t.script[0]?.op === "requireFlag" && !t.script[0].not && !flags.has(t.script[0].flag));
	const standing = (map, x, y) => map.npcs.some((n) => n.x === x && n.y === y && !(n.hideFlag && flags.has(n.hideFlag)));
	const unsolved = (map) => map.properties.puzzle && !flags.has(`gym:${map.properties.puzzle}:solved`);

	function next(c, dir) {
		const { dx, dy } = DIRS[dir];
		const t = world.resolve(c.mapId, c.x + dx, c.y + dy);
		if (!t) return null;
		const col = collisionAt(t.map, t.x, t.y);
		if (LEDGE_DIR[col] === dir) {
			const land = world.resolve(c.mapId, c.x + dx * 2, c.y + dy * 2);
			return land && collisionAt(land.map, land.x, land.y) === COL.FREE ? { mapId: land.mapId, x: land.x, y: land.y } : null;
		}
		if (col !== COL.FREE || standing(t.map, t.x, t.y) || sealed(t.map, t.x, t.y)) return null;
		const w = warpFor(t.map, t.x, t.y, dir);
		if (w) return { mapId: w.targetMap, x: w.targetX, y: w.targetY };
		return { mapId: t.mapId, x: t.x, y: t.y };
	}

	function route(goal) {
		const from = { mapId: game.player.mapId, x: game.player.x, y: game.player.y };
		const seen = new Map([[key(from), null]]);
		const queue = [from];
		for (const c of queue) {
			if (goal(c)) {
				const dirs = [];
				for (let k = key(c); seen.get(k); k = seen.get(k).from) dirs.unshift(seen.get(k).dir);
				return dirs;
			}
			if (unsolved(store.get(c.mapId)) && key(c) !== key(from)) continue; // a puzzle is walked by its solution
			for (const dir of Object.keys(DIRS)) {
				const n = next(c, dir);
				if (!n || seen.has(key(n))) continue;
				seen.set(key(n), { from: key(c), dir });
				queue.push(n);
			}
		}
		return null;
	}

	function step(dir) {
		const before = pos();
		// Let go once the step starts: a held key would chain into a second one.
		for (let i = 0; i < 60 && game.mode === "explore" && !["walk", "hop", "bump"].includes(game.player.phase); i++) game.tick({ dir }, []);
		settle();
		return pos() !== before;
	}

	function travel(goal, what) {
		for (let tries = 0; tries < 400 && !goal(game.player); tries++) {
			const dirs = route(goal);
			assert.ok(dirs, `no way from ${pos()} to ${what}`);
			const met = cursor;
			for (const dir of dirs) {
				const landed = step(dir);
				if (!landed || cursor !== met) break; // pushed back or stopped by a trainer: plan again
			}
		}
		assert.ok(goal(game.player), `never reached ${what}, stopped at ${pos()}`);
	}

	const solve = (leaderId) => {
		const spec = GYM_PUZZLES[leaderId];
		for (const dir of AP.solve(AP[spec.mechanic](spec.rows, spec.config), 9000000)) {
			const before = JSON.stringify([pos(), game.puzzleTiles()]);
			for (let i = 0; i < 80; i++) {
				game.tick({ dir }, []);
				if (game.player.phase === "walk" || game.mode !== "explore") break;
				if (game.player.phase === "bump" && JSON.stringify([pos(), game.puzzleTiles()]) !== before) break; // the mirror twin moved alone
			}
			settle();
		}
		assert.ok(flags.has(`gym:${leaderId}:solved`), `${leaderId}'s puzzle was not solved`);
	};

	/** Walk beside tile (x, y) of mapId, face it and press A: an NPC, or a sign such as a counter. */
	function interact(mapId, x, y) {
		const beside = (c) => c.mapId === mapId && Math.abs(c.x - x) + Math.abs(c.y - y) === 1;
		travel(beside, `${mapId} ${x},${y}`);
		const facing = Object.keys(DIRS).find((d) => game.player.x + DIRS[d].dx === x && game.player.y + DIRS[d].dy === y);
		for (let i = 0; i < 12; i++) game.tick({ dir: facing }, []);
		game.tick({ dir: null }, []);
		game.tick({ dir: null, aHeld: true }, [{ button: "a", source: "keyboard" }]);
		game.tick({ dir: null, aHeld: false }, []);
		settle();
	}

	function meet(id) {
		const map = maps.find((m) => m.npcs.some((n) => n.trainer === id || n.name === id));
		assert.ok(map, `${id} is nowhere in the world`);
		const npc = map.npcs.find((n) => n.trainer === id || n.name === id);
		if (unsolved(map)) {
			travel((c) => c.mapId === map.id, map.id);
			solve(map.properties.puzzle);
		}
		const beside = (c) => c.mapId === map.id && Math.abs(c.x - npc.x) + Math.abs(c.y - npc.y) === 1;
		const beaten = () => flags.has(`trainer:${id}`);
		for (let tries = 0; tries < 200 && !beaten(); tries++) {
			const dirs = route(beside);
			assert.ok(dirs, `no way from ${pos()} to ${id}`);
			const met = cursor;
			for (const dir of dirs) if (!step(dir) || cursor !== met) break;
			if (beaten() || !beside(game.player)) continue;
			const facing = Object.keys(DIRS).find((d) => game.player.x + DIRS[d].dx === npc.x && game.player.y + DIRS[d].dy === npc.y);
			for (let i = 0; i < 12; i++) game.tick({ dir: facing }, []);
			game.tick({ dir: null }, []);
			game.tick({ dir: null, aHeld: true }, [{ button: "a", source: "keyboard" }]);
			game.tick({ dir: null, aHeld: false }, []);
			settle();
		}
		assert.ok(beaten(), `could not beat ${id}, stopped at ${pos()}`);
	}

	return { game, flags, played, meet, settle, interact, route, offered: () => offered };
}

describe("the whole game on foot", () => {
	it("walks Dawnbrook to the Champion to Mewtwo, every battle in order", async () => {
		const run = await start();
		run.settle();
		assert.equal(run.route((c) => c.mapId === "route_1"), null, "Route 1 is shut until a starter is picked");
		run.interact("dawnbrook_lab", 7, 3); // across the bench from the Professor
		assert.equal(run.offered(), 1);
		assert.ok(run.flags.has("story:starter"));
		run.interact("dawnbrook_lab", 7, 3);
		assert.equal(run.offered(), 1, "after the pick the Professor only talks");
		for (const id of GAUNTLET) if (!run.flags.has(`trainer:${id}`)) run.meet(id);
		assert.deepEqual(run.played, GAUNTLET);
		assert.ok(run.flags.has("story:champion"));
		assert.equal(run.game.player.mapId, "hollow_lab");
	});
});
