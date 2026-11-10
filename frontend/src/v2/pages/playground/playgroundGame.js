import { COL, DIRS, RUN_TICKS, TILE, WALK_TICKS } from "../../overworld/constants.js";
import { collisionAt } from "../../overworld/logic/mapModel.js";
import { createActor, tickActor } from "../../overworld/logic/movement.js";
import { createWorld } from "../../overworld/logic/world.js";
import { playerSpriteFor } from "../../overworld/render/assets.js";

// Further than this (in tiles) and another trainer jumps instead of walking:
// a reconnect or a long stall should not send them strolling through walls.
const TELEPORT_TILES = 6;

const toTile = (px) => Math.round(px / TILE);

/** Nearest open tile to (x, y), searching outward ring by ring. */
function nearestOpen(map, x, y) {
	for (let r = 0; r < Math.max(map.width, map.height); r++) {
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (Math.max(Math.abs(dx), Math.abs(dy)) === r && collisionAt(map, x + dx, y + dy) === COL.FREE) return { x: x + dx, y: y + dy };
			}
		}
	}
	return { x, y };
}

/** One tick of another trainer: finish the step under way, then head for the server's tile. */
function stepRemote(a, p) {
	let next = a;
	if (next.phase === "walk") {
		next = { ...next, t: next.t + 1 };
		if (next.t < next.dur) return next;
		next = { ...next, x: next.to.x, y: next.to.y, phase: "idle", t: 0, dur: 0, to: null };
	}
	const tx = toTile(p.x);
	const ty = toTile(p.y);
	const dx = tx - next.x;
	const dy = ty - next.y;
	if (!dx && !dy) return { ...next, facing: p.facing || next.facing, running: false };
	if (Math.abs(dx) + Math.abs(dy) > TELEPORT_TILES) return { ...next, x: tx, y: ty, facing: p.facing || next.facing, phase: "idle" };
	const dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
	const running = !!p.run || Math.abs(dx) + Math.abs(dy) > 1; // run to catch up on a backlog
	return {
		...next,
		phase: "walk",
		facing: dir,
		t: 0,
		dur: running ? RUN_TICKS : WALK_TICKS,
		dist: 1,
		to: { mapId: next.mapId, x: next.x + DIRS[dir].dx, y: next.y + DIRS[dir].dy },
		running,
		stepFoot: next.foot,
		foot: next.foot ^ 1,
	};
}

/**
 * The Playground as the overworld renderer sees a game: one map, you walking
 * tile by tile (the game's own movement rules), everyone else as walkers that
 * follow the positions the server relays. `players` is the live Map from
 * usePlayground (positions in map pixels); `emitMove` reports your steps.
 */
export function createPlaygroundGame({ map, selfId, players, emitMove }) {
	const world = createWorld((id) => (id === map.id ? map : undefined));
	const remotes = new Map();
	const ctx = { world, canMove: true, canRun: true };
	const send = (a, at = a) => emitMove({ x: at.x * TILE, y: at.y * TILE, facing: a.facing, run: !!a.running });

	const game = {
		map,
		player: null,
		tickCount: 0,
		doorOpening: false,
		transition: null,
		alert: null,
		flash: 0,
		neighbourMap: () => undefined,
		puzzleTiles: () => [],
		npcs: () => [...remotes.values()],
		tick(input) {
			game.tickCount += 1;
			if (!game.player) {
				const me = players.get(selfId);
				if (!me) return;
				const spot = nearestOpen(map, toTile(me.x), toTile(me.y));
				game.player = { ...createActor({ mapId: map.id, ...spot }), id: selfId };
				if (spot.x * TILE !== me.x || spot.y * TILE !== me.y) send(game.player);
			}
			const { actor, events } = tickActor(game.player, input, ctx);
			game.player = actor;
			for (const e of events) {
				if (e.type === "stepStart") send(actor, actor.to);
				else if (e.type === "turn") send(actor);
			}
			for (const id of remotes.keys()) if (!players.has(id)) remotes.delete(id);
			players.forEach((p, id) => {
				if (id === selfId) return;
				const a = remotes.get(id) || { ...createActor({ mapId: map.id, x: toTile(p.x), y: toTile(p.y), facing: p.facing || "down" }), id };
				remotes.set(id, { ...stepRemote(a, p), sprite: playerSpriteFor(p.gender) });
			});
		},
	};
	return game;
}
