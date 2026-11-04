import { createActor, tickActor } from "../logic/movement.js";
import { createWorld } from "../logic/world.js";
import { dueTriggers, facingToward, interactionAt, spotter, triggerScript, warpFor } from "../logic/events.js";
import { resolveScript } from "../logic/script.js";
import { paginate } from "../logic/dialogue.js";
import AP, { GYM_PUZZLES } from "../logic/puzzles.generated.js";
import { DOOR_PAUSE_TICKS, startTransition, tickTransition } from "../logic/transition.js";

/**
 * Headless overworld session: owns player + NPC state and the mode machine
 * (explore | dialogue | script | warp | alert | battle). No canvas, no DOM: the host calls
 * tick(input) at 60 Hz and listens to emit() for sound/dialogue/effect requests.
 *
 * emit events: { type: 'sound', cue } | { type: 'dialogue', pages } |
 *   { type: 'effect', effect } (give/heal/battle/shop requests) |
 *   { type: 'flag', flag } | { type: 'mapChange', mapId, reason }
 * A puzzle room also emits { type: 'effect', effect: { type: 'solve', leaderId, moves } }.
 */
// A legendary's cry whites out the screen for a couple of frames.
export const CRY_FLASH_TICKS = 2;
// How long the "!" hangs over a trainer who has spotted you.
export const ALERT_TICKS = 40;

export function createOverworld({ store, flags, start, canRun = true, reducedMotion = false, emit = () => {} }) {
	const world = createWorld((id) => store.get(id));
	let player = createActor(start);
	const npcs = new Map(); // `${mapId}:${name}` -> actor + script/sprite
	let mode = "explore";
	let queue = [];
	let walks = []; // active cutscene walks: { id, path, i }
	let warp = null;
	let transition = null;
	let aBlock = false;
	let edgeGuard = 0; // ignore A edges queued around a dialogue close (they belong to the dialogue)
	let tickCount = 0;
	let flash = 0; // cry flash ticks (see CRY_FLASH_TICKS)
	let alert = null; // { id, ticks }: the trainer showing "!"
	let foe = null; // trainer id of the battle the host is running
	let room = null; // the puzzle in play: { map, leaderId, puz, state, moves, done }
	let pendingStep = null;

	function npcsOf(mapId) {
		const map = store.get(mapId);
		if (!map) return [];
		for (const n of map.npcs) {
			const id = `${mapId}:${n.name}`;
			if (!npcs.has(id)) {
				npcs.set(id, {
					...createActor({ mapId, x: n.x, y: n.y, facing: n.facing || "down" }),
					id,
					name: n.name,
					sprite: n.sprite || "npc",
					script: n.script,
					// legendary encounters: drawn 32x32, shiny = palette swap of the same sheet
					...(n.kind ? { kind: n.kind, dex: n.dex, shiny: !!n.shiny } : {}),
					...(n.trainer ? { trainer: n.trainer, order: n.order, sight: n.sight } : {}),
				});
			}
		}
		return [...npcs.values()].filter((n) => n.mapId === mapId);
	}

	const currentMap = () => store.get(player.mapId);
	const allNpcs = () => {
		const ids = new Set([player.mapId, ...Object.values(currentMap()?.connections || {}).map((c) => c.map)]);
		return [...ids].flatMap(npcsOf);
	};
	const roomStep = (ref) => room.puz.step(room.state, [ref.x - room.state.p[0], ref.y - room.state.p[1]]);
	const isExit = (ref) => room.map.warpIndex.has(`${ref.x},${ref.y}`);

	// While a puzzle is unsolved it decides every step, as replay() will. After that only the pods are in the way.
	function roomBlocks(ref) {
		if (!room || ref.mapId !== room.map.id || isExit(ref)) return false;
		if (room.done) return room.state.pods.some(([x, y]) => x === ref.x && y === ref.y);
		return !roomStep(ref);
	}

	function enterRoom(map) {
		room = null;
		const leaderId = map?.properties.puzzle;
		if (!leaderId || flags.has(`gym:${leaderId}:solved`)) return;
		const spec = GYM_PUZZLES[leaderId];
		const puz = AP[spec.mechanic](spec.rows, spec.config);
		room = { map, leaderId, puz, state: puz.init(), moves: [], done: false };
	}

	/** The player just set off for `to`, so the puzzle takes the same step. */
	function advanceRoom(to, dir) {
		if (!room || room.done || isExit(to)) return;
		const next = roomStep(to);
		if (next.pods !== room.state.pods) emit({ type: "sound", cue: "push" });
		room.state = next;
		room.moves.push(dir);
		if (!room.puz.won(next)) return;
		room.done = true;
		emit({ type: "effect", effect: { type: "solve", leaderId: room.leaderId, moves: room.moves } });
	}

	const isBlocked = (ref) =>
		roomBlocks(ref) ||
		allNpcs().some((n) => n.mapId === ref.mapId && ((n.x === ref.x && n.y === ref.y) || (n.to && n.to.mapId === ref.mapId && n.to.x === ref.x && n.to.y === ref.y)));

	function runScript(script) {
		queue.push(...resolveScript(script, flags).effects);
		pump();
	}

	function pump() {
		while (queue.length) {
			const fx = queue.shift();
			if (fx.type === "say") {
				mode = "dialogue";
				emit({ type: "dialogue", pages: fx.pages.flatMap((t) => paginate(t)) });
				return;
			}
			if (fx.type === "setFlag") {
				flags.add(fx.flag);
				emit({ type: "flag", flag: fx.flag });
			} else if (fx.type === "warp") {
				beginWarp({ targetMap: fx.map, targetX: fx.x, targetY: fx.y, facing: fx.facing || player.facing, transition: fx.transition || "fade", kind: "pad" });
				return;
			} else if (fx.type === "cry") {
				flash = CRY_FLASH_TICKS;
				emit({ type: "sound", cue: "cry" });
			} else if (fx.type === "cutsceneMove") {
				walks.push({ id: fx.actor === "player" ? "player" : `${player.mapId}:${fx.actor}`, path: fx.path, i: 0 });
				mode = "script";
				return;
			} else if (fx.type === "battle" && fx.trainer) {
				mode = "battle";
				foe = fx.trainer;
				emit({ type: "effect", effect: fx });
				return;
			} else {
				emit({ type: "effect", effect: fx });
			}
		}
		mode = "explore";
		const map = currentMap();
		if (map) {
			const due = dueTriggers(map, "flag", flags, player);
			if (due.length) runScript(triggerScript(map, due[0]));
		}
	}

	function onMapEnter(mapId, reason) {
		emit({ type: "mapChange", mapId, reason });
		store.loadAround(mapId).catch(() => {});
		const map = store.get(mapId);
		enterRoom(map);
		if (!map) return;
		const due = dueTriggers(map, "enter", flags, player);
		if (due.length) runScript(triggerScript(map, due[0]));
	}

	function beginWarp(w) {
		mode = "warp";
		warp = { w, delay: w.kind === "door" && !reducedMotion ? DOOR_PAUSE_TICKS : 0, ready: !!store.get(w.targetMap), loading: false };
		if (w.kind === "door") emit({ type: "sound", cue: "door" });
	}

	function tickWarp() {
		if (!warp.ready) {
			if (!warp.loading) {
				warp.loading = true;
				store.loadAround(warp.w.targetMap).then(() => (warp.ready = true));
			}
			return;
		}
		if (warp.delay > 0) {
			warp.delay -= 1;
			return;
		}
		if (!transition) transition = startTransition(reducedMotion ? "none" : warp.w.transition);
		const r = tickTransition(transition);
		transition = r.tr;
		if (r.swap && warp.w) {
			const w = warp.w;
			player = createActor({ mapId: w.targetMap, x: w.targetX, y: w.targetY, facing: w.facing || "down" });
			warp.w = null;
			onMapEnter(w.targetMap, "warp");
		}
		if (r.done) {
			transition = null;
			warp = null;
			mode = "explore";
			pump();
		}
	}

	function tickWalks() {
		for (const walk of walks) {
			const isPlayer = walk.id === "player";
			const actor = isPlayer ? player : npcs.get(walk.id);
			if (!actor) {
				walk.i = walk.path.length;
				continue;
			}
			const ctx = { world, isBlocked, canMove: true, canRun: false, noTurn: true, halt: () => true };
			const dir = walk.i < walk.path.length ? walk.path[walk.i] : null;
			const r = tickActor(actor, { dir, run: false }, ctx);
			if (r.events.some((e) => e.type === "stepEnd")) walk.i += 1;
			for (const e of r.events) handleActorEvent(e, isPlayer);
			if (isPlayer) player = r.actor;
			else npcs.set(walk.id, { ...actor, ...r.actor });
		}
		walks = walks.filter((w) => {
			if (w.i < w.path.length) return true;
			const actor = w.id === "player" ? player : npcs.get(w.id);
			return actor && actor.phase !== "idle";
		});
		if (!walks.length && mode === "script") {
			mode = "explore";
			pump();
		}
	}

	function handleActorEvent(e, isPlayer) {
		if (!isPlayer) return;
		if (e.type === "bump") emit({ type: "sound", cue: "bump" });
		else if (e.type === "hop") emit({ type: "sound", cue: "ledge" });
		else if (e.type === "mapChange") onMapEnter(e.mapId, "edge");
	}

	function spotted({ npc, steps }) {
		mode = "alert";
		alert = { id: npc.id, ticks: reducedMotion ? 0 : ALERT_TICKS };
		player = { ...player, facing: facingToward(player, npc) };
		emit({ type: "sound", cue: "spotted" });
		const walk = steps ? [{ op: "cutsceneMove", actor: npc.name, path: Array(steps).fill(npc.facing) }] : [];
		queue.push(...resolveScript([...walk, ...npc.script], flags).effects);
	}

	function tickAlert() {
		alert.ticks -= 1;
		if (alert.ticks > 0) return;
		alert = null;
		mode = "explore";
		pump();
	}

	function tickExplore(input, edges) {
		const map = currentMap();
		if (aBlock && !input.aHeld) aBlock = false;
		if (!aBlock && tickCount >= edgeGuard && player.phase !== "walk" && player.phase !== "hop" && edges.some((e) => e.button === "a")) {
			const hit = interactionAt(map, player, allNpcs());
			if (hit) {
				if (hit.npc) {
					const n = npcs.get(hit.npc.id);
					npcs.set(n.id, { ...n, facing: facingToward(n, player) });
				}
				runScript(hit.script);
				return;
			}
		}
		pendingStep = null;
		const ctx = {
			world,
			isBlocked,
			canMove: true,
			canRun,
			halt: (a) => {
				const m = store.get(a.mapId);
				const w = m && warpFor(m, a.x, a.y, a.facing);
				if (w) return (pendingStep = { warp: w }), true;
				const due = m ? dueTriggers(m, "step", flags, a) : [];
				if (due.length) return (pendingStep = { trigger: due[0], map: m }), true;
				const seen = m ? spotter(m, a, npcsOf(a.mapId), flags) : null;
				if (seen) return (pendingStep = { seen }), true;
				return false;
			},
		};
		const before = player.to;
		const r = tickActor(player, { dir: input.dir, run: input.run }, ctx);
		player = r.actor;
		if (player.to && player.to !== before) advanceRoom(player.to, player.facing);
		for (const e of r.events) handleActorEvent(e, true);
		if (pendingStep) {
			const p = pendingStep;
			pendingStep = null;
			if (p.warp) beginWarp(p.warp);
			else if (p.seen) spotted(p.seen);
			else runScript(triggerScript(p.map, p.trigger));
		}
	}

	return {
		tick(input = {}, edges = []) {
			tickCount += 1;
			if (flash > 0) flash -= 1;
			if (mode === "warp") tickWarp();
			else if (mode === "script") tickWalks();
			else if (mode === "alert") tickAlert();
			else if (mode === "explore") tickExplore(input, edges);
			// idle NPCs animate through their own tickActor only during cutscenes
		},
		/** Host calls when the player dismisses the last dialogue page. */
		closeDialogue() {
			if (mode !== "dialogue") return;
			aBlock = true;
			edgeGuard = tickCount + 2;
			mode = "explore";
			pump();
		},
		/** Host calls when a trainer battle is over, after refreshing flags. The trainer goes back to its post. */
		endBattle() {
			if (mode !== "battle") return;
			for (const [id, n] of npcs) if (n.trainer === foe) npcs.delete(id);
			foe = null;
			aBlock = true;
			edgeGuard = tickCount + 2;
			mode = "explore";
			pump();
		},
		/** Enter the start map's triggers once the first map is loaded. */
		enter() {
			onMapEnter(player.mapId, "start");
		},
		get mode() {
			return mode;
		},
		get player() {
			return player;
		},
		get tickCount() {
			return tickCount;
		},
		get transition() {
			return transition;
		},
		/** True while the player is going in through a building door, so it can be drawn open. */
		get doorOpening() {
			return Boolean(warp?.w?.kind === "door" && warp.w.enterDir === "up");
		},
		/** Ticks left on the white "cry" flash (a legendary calls out). */
		get flash() {
			return flash;
		},
		/** Moving parts of the puzzle in this room, to draw over the map: [{ x, y, gid }]. */
		puzzleTiles() {
			if (!room || room.map.id !== player.mapId) return [];
			const cells = room.puz.cells(room.state);
			const gids = { pod: room.map.properties.puzzle_pod, "socket-full": room.map.properties.puzzle_pod, gate: room.map.properties.puzzle_gate };
			const tiles = [];
			for (let y = 0; y < cells.h; y++) {
				for (let x = 0; x < cells.w; x++) {
					const gid = gids[cells.at(x, y)];
					if (gid) tiles.push({ x, y, gid });
				}
			}
			return tiles;
		},
		/** Id of the NPC showing "!", or null. */
		get alert() {
			return alert?.id ?? null;
		},
		get map() {
			return currentMap();
		},
		npcs: allNpcs,
		neighbourMap: (id) => store.get(id),
		flags,
	};
}
