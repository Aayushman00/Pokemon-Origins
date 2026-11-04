import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMapStore } from "../maps/mapStore.js";
import { fetchFromDisk } from "../maps/diskFetch.js";
import { createMemoryFlags } from "./flags.js";
import { createOverworld } from "./overworld.js";
import AP, { GYM_PUZZLES } from "../logic/puzzles.generated.js";

async function boot(start = { mapId: "test_town", x: 14, y: 12, facing: "up" }) {
	const store = createMapStore({ fetchJson: fetchFromDisk });
	await store.loadAround(start.mapId);
	const events = [];
	const flags = createMemoryFlags();
	const game = createOverworld({ store, flags, start, emit: (e) => events.push(e) });
	const drive = {
		events,
		flags,
		game,
		hold(dir, ticks, run = false) {
			for (let i = 0; i < ticks; i++) game.tick({ dir, run, aHeld: false }, []);
		},
		press() {
			game.tick({ dir: null, aHeld: true }, [{ button: "a", source: "keyboard" }]);
			game.tick({ dir: null, aHeld: false }, []);
		},
		idle(ticks = 1) {
			for (let i = 0; i < ticks; i++) game.tick({ dir: null }, []);
		},
		close() {
			game.closeDialogue();
			drive.idle(4);
		},
		dialogues: () => events.filter((e) => e.type === "dialogue"),
		pos: () => [game.player.mapId, game.player.x, game.player.y],
	};
	return drive;
}

describe("headless overworld on the sample maps", () => {
	it("opens with the enter-trigger greeting, and only once", async () => {
		const d = await boot();
		d.game.enter();
		assert.equal(d.game.mode, "dialogue");
		assert.match(d.dialogues()[0].pages[0], /Welcome to the test map/);
		d.close();
		assert.equal(d.game.mode, "explore");
		assert.ok(d.flags.has("done:test_town:welcome_enter"));
	});

	it("talks to an NPC with A, faces them, sets a flag, and does not instantly re-trigger", async () => {
		const d = await boot();
		d.hold("left", 60); // walk to (13,12) then bump the sage at (12,12)
		assert.deepEqual(d.pos(), ["test_town", 13, 12]);
		d.press();
		assert.equal(d.game.mode, "dialogue");
		assert.equal(d.game.npcs().find((n) => n.name === "sage").facing, "right", "npc turns toward the player");
		d.close();
		assert.ok(d.flags.has("met_sage"));
		assert.equal(d.dialogues().length, 1, "closing the dialogue must not reopen it");
	});

	it("the guard says different things before and after meeting the sage (requireFlag)", async () => {
		const d = await boot({ mapId: "test_town", x: 16, y: 6, facing: "right" });
		d.press();
		assert.match(d.dialogues().at(-1).pages[0], /Go talk to the sage first/);
		d.close();
		d.flags.add("met_sage");
		d.press();
		assert.match(d.dialogues().at(-1).pages[0], /you met the sage/);
	});

	it("reads signs from the facing tile", async () => {
		const d = await boot({ mapId: "test_town", x: 16, y: 10, facing: "up" });
		d.press();
		assert.match(d.dialogues()[0].pages.join(" "), /TEST TOWN/);
	});

	it("walks through a door: warp transition swaps the map, then the mat takes you back out", async () => {
		const d = await boot({ mapId: "test_town", x: 6, y: 8, facing: "up" });
		d.hold("up", 3 * 16 + 4); // (6,7) (6,6) (6,5)=door
		d.idle(80);
		assert.deepEqual(d.pos(), ["test_house", 5, 6]);
		assert.equal(d.game.mode, "explore");
		assert.equal(d.game.transition, null);
		assert.ok(d.events.some((e) => e.type === "sound" && e.cue === "door"));
		d.hold("down", 16 + 2); // onto the mat (5,7)
		d.idle(80);
		assert.deepEqual(d.pos(), ["test_town", 6, 6]);
		assert.equal(d.game.player.facing, "down");
	});

	it("crossing a map edge streams the neighbour with no loading and reports mapChange", async () => {
		const d = await boot({ mapId: "test_town", x: 14, y: 2, facing: "up" });
		d.hold("up", 3 * 16 + 2);
		assert.equal(d.game.player.mapId, "test_route");
		assert.deepEqual([d.game.player.x, d.game.player.y], [9, 29]);
		assert.ok(d.events.some((e) => e.type === "mapChange" && e.mapId === "test_route" && e.reason === "edge"));
		assert.equal(d.game.mode, "explore");
	});

	it("hops down a ledge, step triggers fire once, and flag triggers chain after", async () => {
		const d = await boot({ mapId: "test_town", x: 5, y: 14, facing: "down" });
		d.hold("down", 36);
		assert.deepEqual(d.pos(), ["test_town", 5, 16]);
		assert.ok(d.events.some((e) => e.type === "sound" && e.cue === "ledge"));

		const g = await boot({ mapId: "test_town", x: 19, y: 10, facing: "right" });
		g.hold("right", 36); // onto the glow tile (20,10)
		assert.equal(g.game.mode, "dialogue");
		assert.match(g.dialogues()[0].pages[0], /glowing tile/);
		g.close();
		assert.equal(g.game.mode, "dialogue", "the on-flag trigger speaks next");
		assert.match(g.dialogues()[1].pages[0], /glow fades/);
		g.close();
		g.hold("left", 40);
		g.hold("right", 40);
		assert.equal(g.dialogues().length, 2, "once-trigger does not fire again");
	});

	it("bumping into the sign and walls plays the bump sound", async () => {
		const d = await boot({ mapId: "test_town", x: 16, y: 10, facing: "up" });
		d.hold("up", 20);
		assert.ok(d.events.some((e) => e.type === "sound" && e.cue === "bump"));
	});

	it("stays correct for every tick of a 5000-tick random walk (never inside a wall, integer pixels)", async () => {
		const d = await boot();
		let seed = 12345;
		const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
		const dirs = ["up", "down", "left", "right", null];
		let dir = "up";
		for (let i = 0; i < 5000; i++) {
			if (i % 25 === 0) dir = dirs[Math.floor(rnd() * dirs.length)];
			d.game.tick({ dir, run: rnd() < 0.5, aHeld: false }, []);
			if (d.game.mode === "dialogue") d.close();
			const p = d.game.player;
			const map = d.game.map;
			assert.ok(p.x >= 0 && p.y >= 0 && p.x < map.width && p.y < map.height);
			assert.notEqual(map.collision[p.y * map.width + p.x], 1, `inside a wall at ${p.mapId} ${p.x},${p.y}`);
		}
	});
});

describe("Dawnbrook interiors and Route 1 (headless)", () => {
	const doors = [
		{ map: "dawnbrook_home", door: [7, 5], arrive: [4, 8] },
		{ map: "dawnbrook_lab", door: [22, 5], arrive: [7, 8] },
		{ map: "dawnbrook_house", door: [7, 14], arrive: [4, 8] },
	];
	for (const { map, door, arrive } of doors) {
		it(`walks in through the door at ${door} to ${map} and back out`, async () => {
			const d = await boot({ mapId: "dawnbrook", x: door[0], y: door[1] + 1, facing: "up" });
			// hold a direction until the map changes, then let go and let the transition finish
			const walkUntilMap = (dir, mapId) => {
				for (let i = 0; i < 400 && d.game.player.mapId !== mapId; i++) d.game.tick({ dir }, []);
				d.idle(120);
			};
			walkUntilMap("up", map);
			assert.deepEqual(d.pos(), [map, ...arrive]);
			assert.ok(d.events.some((e) => e.type === "sound" && e.cue === "door"), "door sound");
			walkUntilMap("down", "dawnbrook");
			assert.deepEqual(d.pos(), ["dawnbrook", door[0], door[1] + 1]);
		});
	}
	it("walks east out of Dawnbrook onto Route 1 with no fade, and back", async () => {
		const d = await boot({ mapId: "dawnbrook", x: 27, y: 9, facing: "right" });
		d.hold("right", 60);
		assert.equal(d.game.player.mapId, "route_1");
		assert.equal(d.game.transition, null);
		d.hold("left", 60);
		assert.equal(d.game.player.mapId, "dawnbrook");
	});
	it("enters the Mossgate gym at the puzzle start and leaves by the west door", async () => {
		const d = await boot({ mapId: "mossgate", x: 15, y: 7, facing: "up" });
		const walkUntilMap = (dir, mapId) => {
			for (let i = 0; i < 400 && d.game.player.mapId !== mapId; i++) d.game.tick({ dir }, []);
			d.idle(120);
		};
		walkUntilMap("up", "mossgate_gym");
		assert.deepEqual(d.pos(), ["mossgate_gym", 1, 5]);
		walkUntilMap("left", "mossgate");
		assert.deepEqual(d.pos(), ["mossgate", 15, 7]);
	});
	it("walks east off Route 1 into Mossgate with no fade, and back", async () => {
		const d = await boot({ mapId: "route_1", x: 37, y: 9, facing: "right" });
		d.hold("right", 60);
		assert.equal(d.game.player.mapId, "mossgate");
		assert.equal(d.game.transition, null);
		d.hold("left", 60);
		assert.equal(d.game.player.mapId, "route_1");
	});
	it("the nurse heals across the counter, the clerk opens the shop", async () => {
		const c = await boot({ mapId: "mossgate_center", x: 7, y: 5, facing: "up" });
		c.hold("up", 20);
		assert.deepEqual(c.pos(), ["mossgate_center", 7, 4]);
		c.press();
		assert.match(c.dialogues()[0].pages.join(" "), /Care\s+Centre/);
		for (let i = 0; i < 6; i++) c.close();
		assert.ok(c.events.some((e) => e.type === "effect" && e.effect.type === "heal"), "heal requested");

		const m = await boot({ mapId: "origin_mart", x: 5, y: 3, facing: "left" });
		m.press();
		assert.match(m.dialogues()[0].pages.join(" "), /Mart/);
		for (let i = 0; i < 6; i++) m.close();
		assert.ok(m.events.some((e) => e.type === "effect" && e.effect.type === "shop"), "shop requested");
	});
});

describe("route trainers (headless)", () => {
	const joey = (d) => d.game.npcs().find((n) => n.name === "youngster_joey");
	const walkIntoSight = async () => {
		const d = await boot({ mapId: "route_1", x: 1, y: 9, facing: "right" });
		d.hold("right", 60);
		return d;
	};
	it("a trainer stops you, walks over, talks, then asks for the battle", async () => {
		const { ALERT_TICKS } = await import("./overworld.js");
		const d = await walkIntoSight();
		assert.deepEqual(d.pos(), ["route_1", 3, 9], "stopped on the first tile of sight");
		assert.equal(d.game.player.facing, "down");
		assert.ok(d.events.some((e) => e.type === "sound" && e.cue === "spotted"));
		d.idle(ALERT_TICKS + 40);
		assert.equal(d.game.alert, null);
		assert.deepEqual([joey(d).x, joey(d).y], [3, 10], "walked up next to you");
		assert.equal(d.game.mode, "dialogue");
		d.close();
		const asked = d.events.find((e) => e.type === "effect" && e.effect.type === "battle");
		assert.equal(asked.effect.trainer, "youngster_joey");
		assert.equal(d.game.mode, "battle");
		d.hold("right", 30);
		assert.deepEqual(d.pos(), ["route_1", 3, 9], "no walking during a battle");
	});
	it("after a win the trainer is back at its post and lets you pass", async () => {
		const { ALERT_TICKS } = await import("./overworld.js");
		const d = await walkIntoSight();
		d.idle(ALERT_TICKS + 40);
		d.close();
		d.flags.add("trainer:youngster_joey");
		d.game.endBattle();
		assert.equal(d.game.mode, "explore");
		assert.deepEqual([joey(d).x, joey(d).y], [3, 11]);
		d.idle(4);
		d.hold("left", 20);
		d.hold("right", 40);
		assert.equal(d.game.mode, "explore");
		assert.ok(d.game.player.x > 3, "walked on past");
	});
	it("a beaten trainer only chats", async () => {
		const d = await boot({ mapId: "route_1", x: 3, y: 10, facing: "down" });
		d.flags.add("trainer:youngster_joey");
		d.press();
		d.close();
		assert.equal(d.game.mode, "explore");
		assert.ok(!d.events.some((e) => e.type === "effect" && e.effect.type === "battle"));
	});
});

describe("gym puzzle room (headless)", () => {
	const spec = GYM_PUZZLES.willow_thornby;
	const solution = AP.solve(AP.seeds(spec.rows));
	const enter = async () => {
		const d = await boot({ mapId: "mossgate_gym", x: 1, y: 5, facing: "right" });
		d.game.enter();
		return d;
	};
	// one tile: hold until the step starts, then let go so it doesn't chain into another
	const step = (d, dir) => {
		for (let i = 0; i < 40 && d.game.player.phase !== "walk"; i++) d.game.tick({ dir }, []);
		for (let i = 0; i < 40 && d.game.player.phase !== "idle"; i++) d.game.tick({ dir: null }, []);
	};
	const solved = (d) => d.events.find((e) => e.type === "effect" && e.effect.type === "solve");

	it("draws the pods and the shut gate from the puzzle", async () => {
		const d = await enter();
		const tiles = d.game.puzzleTiles();
		assert.equal(tiles.length, 3, "two pods and the gate");
		assert.ok(tiles.some((t) => t.x === 7 && t.y === 6), "gate");
		assert.ok(tiles.some((t) => t.x === 1 && t.y === 3) && tiles.some((t) => t.x === 5 && t.y === 3), "pods");
	});
	it("walking the shortest solution pushes the pods, opens the gate and reports the same moves", async () => {
		const d = await enter();
		solution.forEach((dir) => step(d, dir));
		assert.deepEqual(d.pos(), ["mossgate_gym", 8, 6], "on the goal");
		assert.deepEqual(solved(d).effect, { type: "solve", leaderId: "willow_thornby", moves: solution });
		assert.ok(!d.game.puzzleTiles().some((t) => t.x === 7 && t.y === 6), "gate gone");
		assert.ok(d.events.some((e) => e.type === "sound" && e.cue === "push"));
		step(d, "right");
		step(d, "right");
		assert.deepEqual(d.pos(), ["mossgate_gym", 10, 6], "on into the chamber");
	});
	it("held keys chain steps without losing the puzzle, and the shut gate holds", async () => {
		const d = await enter();
		d.hold("right", 200);
		assert.deepEqual(d.pos(), ["mossgate_gym", 5, 5]);
		d.hold("down", 200);
		d.hold("right", 200);
		assert.deepEqual(d.pos(), ["mossgate_gym", 6, 6], "stopped at the vines");
		assert.equal(solved(d), undefined);
	});
	it("bumping a wall costs no move", async () => {
		const d = await enter();
		step(d, "down");
		d.hold("left", 30);
		d.hold("down", 30);
		step(d, "up");
		solution.forEach((dir) => step(d, dir));
		assert.deepEqual(solved(d).effect.moves, ["down", "up", ...solution]);
	});
	it("leaving rolls the seeds back", async () => {
		const d = await enter();
		const start = d.game.puzzleTiles();
		step(d, "up");
		step(d, "up"); // shoves the pod at (1,3) up to (1,2)
		assert.notDeepEqual(d.game.puzzleTiles(), start);
		step(d, "down");
		step(d, "down");
		for (let i = 0; i < 400 && d.pos()[0] !== "mossgate"; i++) d.game.tick({ dir: "left" }, []);
		d.idle(120);
		assert.deepEqual(d.game.puzzleTiles(), [], "nothing to draw outside");
		for (let i = 0; i < 400 && d.pos()[0] !== "mossgate_gym"; i++) d.game.tick({ dir: "up" }, []);
		d.idle(120);
		assert.deepEqual(d.game.puzzleTiles(), start);
	});
	it("a solved gym stays open: no pods, no gate", async () => {
		const d = await boot({ mapId: "mossgate_gym", x: 1, y: 5, facing: "right" });
		d.flags.add("gym:willow_thornby:solved");
		d.game.enter();
		assert.deepEqual(d.game.puzzleTiles(), []);
	});
});

describe("legendary encounters (headless)", () => {
	it("talking to Articuno: cry sound + white flash, then a wild battle request", async () => {
		const { CRY_FLASH_TICKS } = await import("./overworld.js");
		const d = await boot({ mapId: "legend_grove", x: 4, y: 5, facing: "up" });
		const legend = d.game.npcs().find((n) => n.name === "articuno");
		assert.equal(legend.kind, "legendary");
		assert.equal(legend.dex, 144);
		d.game.tick({ dir: null, aHeld: true }, [{ button: "a", source: "keyboard" }]);
		assert.ok(d.events.some((e) => e.type === "sound" && e.cue === "cry"), "cry sound");
		assert.equal(d.game.flash, CRY_FLASH_TICKS, "flash starts");
		d.idle(CRY_FLASH_TICKS);
		assert.equal(d.game.flash, 0, "flash is over after its ticks");
		assert.match(d.dialogues().at(-1).pages.join(" "), /ARTICUNO/);
		d.close();
		const battle = d.events.find((e) => e.type === "effect" && e.effect.type === "battle");
		assert.ok(battle, "battle requested");
		assert.equal(battle.effect.wild, 144);
	});
	it("the shiny Mew carries its shiny flag to the battle request", async () => {
		const d = await boot({ mapId: "legend_grove", x: 15, y: 8, facing: "up" });
		d.press();
		d.close();
		const battle = d.events.find((e) => e.type === "effect" && e.effect.type === "battle");
		assert.deepEqual([battle.effect.wild, battle.effect.shiny], [151, true]);
	});
});
