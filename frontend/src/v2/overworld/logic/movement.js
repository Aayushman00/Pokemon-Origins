import { BUMP_TICKS, COL, DIRS, HOP_TICKS, LEDGE_DIR, RUN_TICKS, TILE, TURN_TICKS, WALK_TICKS } from "../constants.js";
import { collisionAt } from "./mapModel.js";

// Pure tile-step state machine shared by the player and walking NPCs.
// phase: idle | turn | walk | hop | bump. `t` counts ticks inside a phase.

export function createActor({ mapId, x, y, facing = "down" }) {
	return { mapId, x, y, facing, phase: "idle", t: 0, dur: 0, dist: 0, to: null, running: false, parity: 0 };
}

/**
 * Decide what a step in `dir` from `a` would do.
 * -> { kind: 'walk'|'hop'|'bump', to?: {mapId, x, y, ox, oy} }
 * `to.ox/oy` are the destination in the *current map's* frame (may be outside
 * its bounds when crossing an edge connection).
 */
export function planStep(a, dir, world, isBlocked = () => false) {
	const { dx, dy } = DIRS[dir];
	const ox = a.x + dx;
	const oy = a.y + dy;
	const ref = world.resolve(a.mapId, ox, oy);
	if (!ref) return { kind: "bump" };
	const col = collisionAt(ref.map, ref.x, ref.y);
	if (col >= COL.LEDGE_DOWN) {
		if (LEDGE_DIR[col] !== dir) return { kind: "bump" };
		const lx = a.x + dx * 2;
		const ly = a.y + dy * 2;
		const land = world.resolve(a.mapId, lx, ly);
		if (!land || collisionAt(land.map, land.x, land.y) !== COL.FREE || isBlocked(land)) return { kind: "bump" };
		return { kind: "hop", to: { mapId: land.mapId, x: land.x, y: land.y, ox: lx, oy: ly } };
	}
	if (col !== COL.FREE || isBlocked(ref)) return { kind: "bump" };
	return { kind: "walk", to: { mapId: ref.mapId, x: ref.x, y: ref.y, ox, oy } };
}

function beginStep(a, dir, input, ctx, events) {
	const plan = planStep(a, dir, ctx.world, ctx.isBlocked);
	const next = { ...a, facing: dir, t: 0 };
	if (plan.kind === "bump") {
		events.push({ type: "bump", dir });
		return { ...next, phase: "bump", dur: BUMP_TICKS, to: null };
	}
	const running = plan.kind === "walk" && !!input.run && !!ctx.canRun;
	events.push({ type: plan.kind === "hop" ? "hop" : "stepStart", dir, running });
	return {
		...next,
		phase: plan.kind,
		dur: plan.kind === "hop" ? HOP_TICKS : running ? RUN_TICKS : WALK_TICKS,
		dist: plan.kind === "hop" ? 2 : 1,
		to: plan.to,
		running,
	};
}

/**
 * Advance one 60 Hz tick. input = { dir: 'up'|...|null, run: bool }.
 * ctx = { world, isBlocked(ref), canMove, canRun, halt(actor, events) }.
 * Returns { actor, events }. `halt` is asked when a step lands; returning true
 * stops step-chaining so the host can react (warp, trigger, dialogue).
 */
export function tickActor(actor, input, ctx) {
	const events = [];
	let a = { ...actor };
	const dir = ctx.canMove ? input.dir : null;

	if (a.phase === "bump" && (!dir || dir !== a.facing)) a = { ...a, phase: "idle", t: 0 }; // released or changed key: stop bumping
	else if (a.phase === "turn" || a.phase === "bump") {
		a.t += 1;
		if (a.t >= a.dur) a = { ...a, phase: "idle", t: 0 };
		return { actor: a, events };
	}

	if (a.phase === "walk" || a.phase === "hop") {
		a.t += 1;
		if (a.t < a.dur) return { actor: a, events };
		const to = a.to;
		const crossed = to.mapId !== a.mapId;
		a = { ...a, mapId: to.mapId, x: to.x, y: to.y, phase: "idle", t: 0, to: null, parity: a.parity ^ 1 };
		if (crossed) events.push({ type: "mapChange", mapId: to.mapId });
		events.push({ type: "stepEnd", mapId: a.mapId, x: a.x, y: a.y, hop: actor.phase === "hop" });
		if (ctx.halt?.(a, events)) return { actor: a, events };
		if (dir) a = beginStep(a, dir, input, ctx, events); // chain: no turn delay while moving
		return { actor: a, events };
	}

	// idle
	if (!dir) return { actor: a, events };
	if (dir !== a.facing) {
		events.push({ type: "turn", dir });
		return { actor: { ...a, facing: dir, phase: "turn", t: 0, dur: TURN_TICKS }, events };
	}
	return { actor: beginStep(a, dir, input, ctx, events), events };
}

/** Pixel position (top-left of the 16x16 tile) in the actor's current map frame. */
export function actorPixel(a) {
	let px = a.x * TILE;
	let py = a.y * TILE;
	let lift = 0;
	if ((a.phase === "walk" || a.phase === "hop") && a.to) {
		const total = a.dist * TILE;
		const moved = Math.floor((total * a.t) / a.dur);
		const { dx, dy } = DIRS[a.facing];
		px += dx * moved;
		py += dy * moved;
		if (a.phase === "hop") lift = Math.round(6 * Math.sin((Math.PI * a.t) / a.dur));
	}
	return { px, py, lift };
}

/** Sprite column: 0 idle, 1/2 alternating step frames. */
export function actorFrame(a) {
	if (a.phase === "walk" && a.t < a.dur * 0.75) return a.parity ? 1 : 2;
	if (a.phase === "bump" && a.t % 8 < 4) return a.parity ? 1 : 2;
	return 0;
}
