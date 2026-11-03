import { createActor, tickActor } from "../logic/movement.js";
import { createWorld } from "../logic/world.js";
import { dueTriggers, facingToward, interactionAt, triggerScript, warpFor } from "../logic/events.js";
import { resolveScript } from "../logic/script.js";
import { paginate } from "../logic/dialogue.js";
import { DOOR_PAUSE_TICKS, startTransition, tickTransition } from "../logic/transition.js";

/**
 * Headless overworld session: owns player + NPC state and the mode machine
 * (explore | dialogue | script | warp). No canvas, no DOM: the host calls
 * tick(input) at 60 Hz and listens to emit() for sound/dialogue/effect requests.
 *
 * emit events: { type: 'sound', cue } | { type: 'dialogue', pages } |
 *   { type: 'effect', effect } (give/heal/battle/shop requests) |
 *   { type: 'flag', flag } | { type: 'mapChange', mapId, reason }
 */
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
	let pendingStep = null;

	function npcsOf(mapId) {
		const map = store.get(mapId);
		if (!map) return [];
		for (const n of map.npcs) {
			const id = `${mapId}:${n.name}`;
			if (!npcs.has(id)) {
				npcs.set(id, { ...createActor({ mapId, x: n.x, y: n.y, facing: n.facing || "down" }), id, name: n.name, sprite: n.sprite || "npc", script: n.script });
			}
		}
		return [...npcs.values()].filter((n) => n.mapId === mapId);
	}

	const currentMap = () => store.get(player.mapId);
	const allNpcs = () => {
		const ids = new Set([player.mapId, ...Object.values(currentMap()?.connections || {}).map((c) => c.map)]);
		return [...ids].flatMap(npcsOf);
	};
	const isBlocked = (ref) =>
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
			} else if (fx.type === "cutsceneMove") {
				walks.push({ id: fx.actor === "player" ? "player" : `${player.mapId}:${fx.actor}`, path: fx.path, i: 0 });
				mode = "script";
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
				return false;
			},
		};
		const r = tickActor(player, { dir: input.dir, run: input.run }, ctx);
		player = r.actor;
		for (const e of r.events) handleActorEvent(e, true);
		if (pendingStep) {
			const p = pendingStep;
			pendingStep = null;
			if (p.warp) beginWarp(p.warp);
			else runScript(triggerScript(p.map, p.trigger));
		}
	}

	return {
		tick(input = {}, edges = []) {
			tickCount += 1;
			if (mode === "warp") tickWarp();
			else if (mode === "script") tickWalks();
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
		get map() {
			return currentMap();
		},
		npcs: allNpcs,
		neighbourMap: (id) => store.get(id),
		flags,
	};
}
