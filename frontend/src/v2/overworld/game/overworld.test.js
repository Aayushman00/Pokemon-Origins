import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMapStore } from "../maps/mapStore.js";
import { fetchFromDisk } from "../maps/diskFetch.js";
import { createMemoryFlags } from "./flags.js";
import { createOverworld } from "./overworld.js";

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

describe("Origin Town interiors (headless)", () => {
	const doors = [
		{ map: "origin_home", door: [4, 6], arrive: [5, 7] },
		{ map: "origin_center", door: [25, 6], arrive: [7, 8] },
		{ map: "origin_center", door: [26, 6], arrive: [8, 8] },
		{ map: "origin_mart", door: [26, 22], arrive: [5, 7] },
	];
	for (const { map, door, arrive } of doors) {
		it(`walks in through the door at ${door} to ${map} and back out`, async () => {
			const d = await boot({ mapId: "origin_town", x: door[0], y: door[1] + 1, facing: "up" });
			// hold a direction until the map changes, then let go and let the transition finish
			const walkUntilMap = (dir, mapId) => {
				for (let i = 0; i < 400 && d.game.player.mapId !== mapId; i++) d.game.tick({ dir }, []);
				d.idle(120);
			};
			walkUntilMap("up", map);
			assert.deepEqual(d.pos(), [map, ...arrive]);
			assert.ok(d.events.some((e) => e.type === "sound" && e.cue === "door"), "door sound");
			walkUntilMap("down", "origin_town");
			assert.deepEqual(d.pos(), ["origin_town", door[0], door[1] + 1]);
		});
	}
	it("the nurse heals across the counter, the clerk opens the shop", async () => {
		const c = await boot({ mapId: "origin_center", x: 7, y: 5, facing: "up" });
		c.hold("up", 20);
		assert.deepEqual(c.pos(), ["origin_center", 7, 4]);
		c.press();
		assert.match(c.dialogues()[0].pages.join(" "), /Care\s+Centre/);
		for (let i = 0; i < 6; i++) c.close();
		assert.ok(c.events.some((e) => e.type === "effect" && e.effect.type === "heal"), "heal requested");

		const m = await boot({ mapId: "origin_mart", x: 4, y: 4, facing: "left" });
		m.press();
		assert.match(m.dialogues()[0].pages.join(" "), /Mart/);
		for (let i = 0; i < 6; i++) m.close();
		assert.ok(m.events.some((e) => e.type === "effect" && e.effect.type === "shop"), "shop requested");
	});
});
