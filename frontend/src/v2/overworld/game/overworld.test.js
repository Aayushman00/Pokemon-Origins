import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMapStore } from "../maps/mapStore.js";
import { fetchFromDisk } from "../maps/diskFetch.js";
import { createMemoryFlags } from "./flags.js";
import { createOverworld } from "./overworld.js";
import AP, { GYM_PUZZLES } from "../logic/puzzles.generated.js";

async function boot(start = { mapId: "test_town", x: 14, y: 12, facing: "up" }, opts = {}) {
	const store = createMapStore({ fetchJson: fetchFromDisk });
	await store.loadAround(start.mapId);
	const events = [];
	const flags = createMemoryFlags();
	const game = createOverworld({ store, flags, start, emit: (e) => events.push(e), ...opts });
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
		{ map: "dawnbrook_home", door: [7, 6], arrive: [4, 8] },
		{ map: "dawnbrook_lab", door: [22, 6], arrive: [7, 8] },
		{ map: "dawnbrook_house", door: [7, 16], arrive: [4, 8] },
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
		assert.match(d.dialogues()[0].pages[0], /Seed pods/);
		d.close();
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
	it("a trainer passed by sends you back, so the server is never asked out of order", async () => {
		const d = await boot({ mapId: "route_1", x: 12, y: 7, facing: "left" });
		d.press();
		assert.match(d.dialogues().at(-1).pages.join(" "), /further\s+back/);
		d.close();
		assert.ok(!d.events.some((e) => e.type === "effect" && e.effect.type === "battle"));
		assert.equal(d.game.mode, "explore");
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

describe("Route 1 (headless)", () => {
	const step = (d, dir) => {
		for (let i = 0; i < 40 && d.game.player.phase !== "walk"; i++) d.game.tick({ dir }, []);
		for (let i = 0; i < 40 && d.game.player.phase !== "idle"; i++) d.game.tick({ dir: null }, []);
	};
	it("leaves a way past the Lass, who stands in the trail", async () => {
		const d = await boot({ mapId: "route_1", x: 10, y: 7, facing: "up" });
		d.game.enter();
		for (const dir of ["up", "right", "right"]) step(d, dir);
		assert.deepEqual(d.pos(), ["route_1", 12, 6]);
	});
});

describe("gym puzzle room (headless)", () => {
	const spec = GYM_PUZZLES.willow_thornby;
	const solution = AP.solve(AP.seeds(spec.rows));
	const enter = async () => {
		const d = await boot({ mapId: "mossgate_gym", x: 1, y: 5, facing: "right" });
		d.game.enter();
		d.close();
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
		assert.equal(d.dialogues().length, 1, "the rule is said once");
	});
	it("a solved gym stays open: no pods, no gate", async () => {
		const d = await boot({ mapId: "mossgate_gym", x: 1, y: 5, facing: "right" });
		d.flags.add("gym:willow_thornby:solved");
		d.game.enter();
		assert.deepEqual(d.game.puzzleTiles(), []);
	});
});

describe("all eight gyms on foot (headless)", () => {
	const GYM_MAPS = {
		mara_quill: "hearthfield_gym", tavish_rook: "ironbrook_gym", coral_marlowe: "saltmere_gym", volt_dray: "dynamo_gym",
		skye_corvin: "gale_gym", sage_ilmara: "starfall_gym", cinder_valko: "emberhold_gym",
	};
	const startOf = (leaderId) => {
		const spec = GYM_PUZZLES[leaderId];
		const [x, y] = AP[spec.mechanic](spec.rows, spec.config).init().p;
		return { mapId: GYM_MAPS[leaderId], x, y, facing: "up" };
	};
	const enter = async (leaderId) => {
		const d = await boot(startOf(leaderId));
		d.game.enter();
		while (d.game.mode === "dialogue") d.close();
		return d;
	};
	const settled = (d) => d.game.mode === "explore" && d.game.player.phase === "idle";
	// One move: push until something happens, then wait out any glide, fall or fade.
	const move = (d, dir) => {
		const before = JSON.stringify([d.game.player.x, d.game.player.y, d.game.puzzleTiles()]);
		for (let i = 0; i < 80; i++) {
			d.game.tick({ dir }, []);
			if (d.game.player.phase === "walk" || d.game.mode !== "explore") break;
			if (d.game.player.phase === "bump" && JSON.stringify([d.game.player.x, d.game.player.y, d.game.puzzleTiles()]) !== before) break;
		}
		for (let i = 0; i < 600 && !settled(d); i++) {
			d.game.tick({ dir: null }, []);
			while (d.game.mode === "dialogue") d.close();
		}
	};
	const solved = (d) => d.events.find((e) => e.type === "effect" && e.effect.type === "solve");

	for (const leaderId of Object.keys(GYM_MAPS)) {
		it(`${leaderId}: the shortest solution reaches the Leader's chamber`, async () => {
			const spec = GYM_PUZZLES[leaderId];
			const solution = AP.solve(AP[spec.mechanic](spec.rows, spec.config), 9000000);
			const d = await enter(leaderId);
			for (const dir of solution) move(d, dir);
			assert.deepEqual(solved(d)?.effect, { type: "solve", leaderId, moves: solution });
			const [x, y] = d.game.map.properties.puzzleChamber.split(",").map(Number);
			assert.deepEqual(d.pos(), [GYM_MAPS[leaderId], x, y]);
		});
	}

	it("a belt carries the player along it, and no input is taken on the way", async () => {
		const d = await enter("mara_quill");
		move(d, "left"); // onto the belt-free cell at (2,1)
		move(d, "down"); // (2,2) is a belt running right
		assert.equal(d.game.player.y, 2);
		assert.ok(d.game.player.x > 2, "carried east");
	});
	it("a gale glide stops at a wall, and the whole slide is one move", async () => {
		const d = await enter("skye_corvin");
		move(d, "right");
		assert.deepEqual(d.pos().slice(1), [11, 7]);
	});
	it("falling down a gap puts the player back at the start with a fresh count", async () => {
		const d = await enter("skye_corvin");
		const home = d.pos();
		move(d, "right"); // slides to the wall at (11,7)
		move(d, "down"); // through (11,8) to (11,9)... the gap sits west of it
		move(d, "left"); // (10,9) is a drop
		assert.deepEqual(d.pos(), home);
		const solution = AP.solve(AP.gale(GYM_PUZZLES.skye_corvin.rows));
		for (const dir of solution) move(d, dir);
		assert.deepEqual(solved(d).effect.moves, solution, "the fall is not in the moves");
	});
	it("lava resets the pulse room", async () => {
		const d = await enter("cinder_valko");
		const home = d.pos();
		move(d, "left"); // (9,6) is lava
		assert.deepEqual(d.pos(), home);
	});
	it("a blocked hero still moves the twin, and that counts as a move", async () => {
		const d = await enter("sage_ilmara");
		const twin = () => d.game.puzzleTiles().find((t) => t.gid === d.game.map.properties.puzzle_twin);
		move(d, "up"); // both step: hero (2,1), twin (9,2)
		move(d, "up"); // hero is at the wall, twin carries on
		assert.deepEqual(d.pos().slice(1), [2, 1]);
		assert.deepEqual([twin().x, twin().y], [9, 1]);
	});
	it("the piece under the player stays drawn", async () => {
		const d = await enter("volt_dray");
		move(d, "right");
		move(d, "right"); // onto the first panel at (3,1), which lights it
		const { x, y } = d.game.player;
		assert.ok(d.game.puzzleTiles().some((t) => t.x === x && t.y === y));
	});
	it("every room with moving pieces draws them", async () => {
		for (const leaderId of ["tavish_rook", "coral_marlowe", "volt_dray", "sage_ilmara", "cinder_valko"]) {
			const d = await enter(leaderId);
			assert.ok(d.game.puzzleTiles().length > 0, `${leaderId} draws nothing`);
		}
	});
	it("the Start menu's way out leaves a stuck puzzle through its door", async () => {
		const d = await enter("tavish_rook");
		assert.ok(d.game.puzzleActive);
		move(d, "up");
		d.game.leaveRoom();
		for (let i = 0; i < 300 && d.game.mode !== "explore"; i++) d.game.tick({ dir: null }, []);
		assert.equal(d.pos()[0], "ironbrook");
		assert.equal(d.game.puzzleActive, false);
	});
	it("a solved gym sends the door straight to the Leader's chamber", async () => {
		const d = await boot({ mapId: "hearthfield", x: 15, y: 7, facing: "up" });
		d.flags.add("gym:mara_quill:solved");
		d.flags.add("trainer:willow_thornby");
		for (let i = 0; i < 400 && d.pos()[0] !== "hearthfield_gym"; i++) d.game.tick({ dir: "up" }, []);
		d.idle(120);
		const [x, y] = d.game.map.properties.puzzleChamber.split(",").map(Number);
		assert.deepEqual(d.pos(), ["hearthfield_gym", x, y]);
	});
});

describe("wild grass and whiting out (headless)", () => {
	const grass = { mapId: "route_1", x: 14, y: 13, facing: "right" }; // inside grass_2
	const wild = (d) => d.events.find((e) => e.type === "effect" && e.effect.type === "battle");

	it("a step that ends in grass can meet that route's table", async () => {
		const d = await boot(grass, { encounterRoll: () => 0 });
		d.hold("right", 30);
		assert.equal(d.game.mode, "battle");
		assert.equal(wild(d).effect.table, "route_1");
		d.game.endBattle();
		assert.equal(d.game.mode, "explore");
	});
	it("most steps meet nothing", async () => {
		const d = await boot(grass, { encounterRoll: () => 0.5 });
		d.hold("right", 30);
		assert.equal(wild(d), undefined);
	});
	it("nothing lives outside the grass", async () => {
		const d = await boot({ mapId: "route_1", x: 12, y: 18, facing: "left" }, { encounterRoll: () => 0 });
		assert.ok(!d.game.map.encounters.some((e) => e.x <= 11 && 11 < e.x + e.w && e.y <= 18 && 18 < e.y + e.h));
		d.hold("left", 30);
		assert.equal(wild(d), undefined);
	});
	it("losing sends the player to the last place they healed", async () => {
		const d = await boot(grass, { encounterRoll: () => 0 });
		d.hold("right", 30);
		d.game.whiteout({ mapId: "route_1", x: 13, y: 12 });
		assert.match(d.dialogues().at(-1).pages.join(" "), /hurried/);
		d.close();
		for (let i = 0; i < 300 && d.game.mode !== "explore"; i++) d.game.tick({ dir: null }, []);
		assert.deepEqual(d.pos(), ["route_1", 13, 12]);
	});
});

describe("the League and the Hollow Lab (headless)", () => {
	const walk = (d, dir, until, limit = 400) => {
		for (let i = 0; i < limit && !until(); i++) {
			d.game.tick({ dir }, []);
			if (d.game.mode === "dialogue") return;
		}
	};
	const settle = (d) => {
		for (let i = 0; i < 300 && d.game.mode !== "explore"; i++) d.game.tick({ dir: null }, []);
		d.idle(30);
	};
	const on = (d, map) => () => d.pos()[0] === map;

	it("Zenith's great door opens on the League lobby", async () => {
		const d = await boot({ mapId: "zenith", x: 14, y: 6, facing: "up" });
		walk(d, "up", on(d, "zenith_league"));
		settle(d);
		assert.equal(d.pos()[0], "zenith_league");
	});
	it("a League door stays shut until that room's trainer is beaten", async () => {
		const d = await boot({ mapId: "league_1", x: 4, y: 3, facing: "up" });
		d.hold("right", 16); // onto the rug, one below the door's step
		walk(d, "up", () => d.game.mode === "dialogue");
		assert.match(d.dialogues().at(-1).pages.join(" "), /won't open/);
		d.close();
		settle(d);
		assert.equal(d.game.player.y, 3, "walked back from the door");
		d.flags.add("trainer:hollis_rime");
		walk(d, "up", on(d, "league_2"));
		settle(d);
		assert.equal(d.pos()[0], "league_2");
	});
	it("beating the Champion plays the ending and lands back at Zenith", async () => {
		const d = await boot({ mapId: "league_5", x: 5, y: 5, facing: "up" });
		d.press();
		assert.equal(d.game.mode, "battle");
		d.flags.add("trainer:kestrel_vane");
		d.game.endBattle();
		while (d.game.mode === "dialogue") d.close();
		for (let i = 0; i < 50 && d.game.mode !== "explore"; i++) {
			d.idle(30);
			await new Promise((r) => setTimeout(r, 5)); // a script warp loads its map on the way
		}
		assert.equal(d.pos()[0], "zenith");
		assert.ok(d.flags.has("story:champion"));
		assert.ok(d.dialogues().some((e) => /Thank\s+you\s+for\s+playing/.test(e.pages.join(" "))));
	});
	it("the Hollow Lab is sealed to anyone but the Champion", async () => {
		const d = await boot({ mapId: "zenith", x: 3, y: 3, facing: "left" });
		walk(d, "left", () => d.game.mode === "dialogue");
		assert.match(d.dialogues().at(-1).pages.join(" "), /sealed/);
		d.close();
		settle(d);
		assert.equal(d.game.player.x, 3, "walked back from the door");
		d.flags.add("trainer:kestrel_vane");
		walk(d, "left", on(d, "hollow_lab"));
		settle(d);
		assert.equal(d.pos()[0], "hollow_lab");
	});
	it("each legendary bars the way to the next, then leaves once met", async () => {
		const d = await boot({ mapId: "hollow_lab", x: 21, y: 4, facing: "left" });
		const names = () => d.game.npcs().map((n) => n.name);
		assert.deepEqual(names(), ["articuno", "zapdos", "moltres", "mew", "mewtwo"]);
		d.hold("left", 40);
		assert.equal(d.game.player.x, 21, "Articuno fills the doorway");
		d.press();
		d.close();
		const battle = d.events.find((e) => e.type === "effect" && e.effect.type === "battle");
		assert.equal(battle.effect.trainer, "articuno");
		d.flags.add("trainer:articuno");
		d.game.endBattle();
		assert.ok(!names().includes("articuno"));
		d.idle(4);
		d.hold("left", 60);
		assert.ok(d.game.player.x < 20, "the doorway is clear");
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
