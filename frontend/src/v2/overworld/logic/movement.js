import { BUMP_TICKS, COL, DIRS, HOP_ARC, HOP_TICKS, LEDGE_DIR, RUN_TICKS, TILE, TURN_TICKS, WALK_TICKS } from "../constants.js";
import { collisionAt } from "./mapModel.js";

// Pure tile-step state machine shared by the player and walking NPCs, modelled
// on pret/pokefirered (behaviour re-implemented, no code copied):
//
//  src/field_player_avatar.c  CheckMovementInputNotOnBike: three states.
//    no direction            -> NOT_MOVING (stand)
//    direction != facing and
//    not already MOVING      -> TURN_DIRECTION (8-frame walk-in-place, no step)
//    otherwise               -> MOVING (walk / run / ledge jump / collide)
//  The MOVING flag survives a finished step while a direction stays held, so
//  changing direction mid-walk steps straight off without a turn.
//  TryInterruptObjectEventSpecialAnim: only the collision walk-in-place
//  (WALK_IN_PLACE_SLOW) is cut short, and only by pressing a different
//  direction; releasing the key lets it finish its 32 frames.
//
// phase: idle | turn | walk | hop | bump. `t` counts ticks inside a phase. When
// an action completes on tick N the next action is chosen on that same tick
// and starts moving on tick N+1, so held walking is a gapless 16 px / 16 ticks.

export function createActor({ mapId, x, y, facing = "down" }) {
	return { mapId, x, y, facing, phase: "idle", t: 0, dur: 0, dist: 0, to: null, running: false, moving: false, foot: 0, stepFoot: 0 };
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

// MOVING state: walk, run, jump a ledge, or walk in place against an obstacle.
function beginStep(a, dir, input, ctx, events) {
	const plan = planStep(a, dir, ctx.world, ctx.isBlocked);
	const next = { ...a, facing: dir, t: 0, moving: true, stepFoot: a.foot };
	if (plan.kind === "bump") {
		events.push({ type: "bump", dir });
		return { ...next, phase: "bump", dur: BUMP_TICKS, to: null, running: false };
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
		foot: a.foot ^ 1,
	};
}

// Choose the next action from rest (CheckMovementInputNotOnBike).
function decide(a, dir, input, ctx, events) {
	if (!dir) return { ...a, phase: "idle", t: 0, dur: 0, moving: false, running: false };
	if (dir !== a.facing && !a.moving && !ctx.noTurn) {
		events.push({ type: "turn", dir });
		return { ...a, facing: dir, phase: "turn", t: 0, dur: TURN_TICKS, running: false, stepFoot: a.foot, foot: a.foot ^ 1 };
	}
	return beginStep(a, dir, input, ctx, events);
}

/**
 * Advance one 60 Hz tick. input = { dir: 'up'|...|null, run: bool }.
 * ctx = { world, isBlocked(ref), canMove, canRun, noTurn, halt(actor, events) }.
 * `noTurn` (scripted movement) steps in a new direction without turning in place first.
 * Returns { actor, events }. `halt` is asked when a step lands; returning true
 * stops step-chaining so the host can react (warp, trigger, dialogue).
 */
export function tickActor(actor, input, ctx) {
	const events = [];
	let a = { ...actor };
	const dir = ctx.canMove ? input.dir : null;

	if (a.phase === "bump") {
		if (dir && dir !== a.facing) return { actor: decide({ ...a, phase: "idle", t: 0 }, dir, input, ctx, events), events };
		a.t += 1;
		if (a.t < a.dur) return { actor: a, events };
		return { actor: decide({ ...a, phase: "idle", t: 0 }, dir, input, ctx, events), events };
	}

	if (a.phase === "turn") {
		a.t += 1;
		if (a.t < a.dur) return { actor: a, events };
		return { actor: decide({ ...a, phase: "idle", t: 0 }, dir, input, ctx, events), events };
	}

	if (a.phase === "walk" || a.phase === "hop") {
		a.t += 1;
		if (a.t < a.dur) return { actor: a, events };
		const to = a.to;
		const crossed = to.mapId !== a.mapId;
		a = { ...a, mapId: to.mapId, x: to.x, y: to.y, phase: "idle", t: 0, dur: 0, to: null };
		if (crossed) events.push({ type: "mapChange", mapId: to.mapId });
		events.push({ type: "stepEnd", mapId: a.mapId, x: a.x, y: a.y, hop: actor.phase === "hop" });
		if (ctx.halt?.(a, events)) return { actor: { ...a, moving: false, running: false }, events };
		return { actor: decide(a, dir, input, ctx, events), events };
	}

	return { actor: decide(a, dir, input, ctx, events), events };
}

/** Pixel position (top-left of the 16x16 tile) in the actor's current map frame; `lift` = jump height in px. */
export function actorPixel(a) {
	let px = a.x * TILE;
	let py = a.y * TILE;
	let lift = 0;
	if ((a.phase === "walk" || a.phase === "hop") && a.to) {
		const moved = ((a.dist * TILE) / a.dur) * a.t; // 1, 2 or 1 px per tick: always an integer
		const { dx, dy } = DIRS[a.facing];
		px += dx * moved;
		py += dy * moved;
		if (a.phase === "hop" && a.t > 0) lift = 0 - HOP_ARC[Math.min(HOP_ARC.length - 1, (a.t - 1) >> 1)] || 0;
	}
	return { px, py, lift };
}

const foot = (f) => (f ? "walkB" : "walkA");

/**
 * Animation pose, following the object event anim tables in pret
 * (src/data/object_events/object_event_anims.h):
 *  walk  sAnim_Go*      foot 8f, stand 8f; the foot alternates every step
 *  run   sAnim_Run*     run-stand 5f, run-foot 3f per 8-frame step
 *  turn  sAnim_GoFast*  foot 4f, stand 4f (8-frame walk in place)
 *  bump  sAnim_Go*      full 32f cycle: foot, stand, other foot, stand
 *  hop   sAnim_Go*      runs through the 32-frame jump like the bump cycle
 * -> 'stand' | 'walkA' | 'walkB' | 'runStand' | 'runA' | 'runB' | 'alert'
 *
 * An idle actor with `pose: "alert"` (a trainer that just spotted the
 * player) shows the arms-up frame instead of standing.
 */
export function actorPose(a) {
	const t = a.t;
	const f = a.stepFoot;
	switch (a.phase) {
		case "walk":
			if (a.running) return t < 5 ? "runStand" : f ? "runB" : "runA";
			return t < 8 ? foot(f) : "stand";
		case "turn":
			return t < 4 ? foot(f) : "stand";
		case "bump":
		case "hop": {
			const q = (t >> 3) & 3;
			if (q === 1 || q === 3) return "stand";
			return foot(q === 0 ? f : f ^ 1);
		}
		default:
			return a.pose === "alert" ? "alert" : "stand";
	}
}

// Sheet columns (16x32 frames): stand, walkA, walkB, runStand, runA, runB,
// then the expression frames blink and alert ("spotted you", arms up).
export const POSE_COLUMN = { stand: 0, walkA: 1, walkB: 2, runStand: 3, runA: 4, runB: 5, blink: 6, alert: 7 };

export const BLINK_PERIOD = 210; // ticks between blinks (~3.5s at 60Hz)
export const BLINK_TICKS = 6;

/** Small stable hash so every actor blinks on its own schedule. */
function seedOf(key) {
	let h = 0;
	for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
	return h % BLINK_PERIOD;
}

/**
 * Sprite column for the current pose. Pass the game tick to let standing
 * actors blink now and then; without it the result is the plain pose.
 */
export function actorFrame(a, tick) {
	const pose = actorPose(a);
	if (pose === "stand" && tick !== undefined && (tick + seedOf(a.id ?? "player")) % BLINK_PERIOD < BLINK_TICKS) {
		return POSE_COLUMN.blink;
	}
	return POSE_COLUMN[pose];
}
