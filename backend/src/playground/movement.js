// backend/src/playground/movement.js
/**
 * Server-side check of one incoming "move" event. The room is the Playground
 * map (frontend/public/maps/playground.json, served to the server as
 * maps.index.json "playground") in game pixels: a position is the top-left of
 * the 16px tile a trainer stands on, sent at the start of each step.
 *
 * A move is accepted only if it is the same tile (a turn) or one orthogonal
 * tile onto a free tile, and the trainer's step budget allows it. The budget
 * is a token bucket a little faster than running (8 ticks a tile at 60 Hz =
 * 7.5 tiles/s), with a small burst for network bunching. Anything else is
 * refused and the client is snapped back.
 */
const { canStand } = require("../world/maps");

const TILE_PX = 16;
const ROOM_WIDTH = 40 * TILE_PX; // playground.json is 40 x 28 tiles
const ROOM_HEIGHT = 28 * TILE_PX;
const CHAT_RADIUS_PX = 6 * TILE_PX; // earshot: six tiles
const STEP_REFILL_PER_SEC = 8;
const STEP_BURST = 3;

const standOnPlayground = (tx, ty) => canStand("playground", tx, ty);

/** A full bucket, for a trainer who just arrived. */
const freshBudget = (nowMs) => ({ tokens: STEP_BURST, at: nowMs });

/**
 * `current`/`target` are { x, y } in pixels. Returns the position the server
 * now holds (`target` if ok, else `current`), whether a tile was crossed, and
 * the updated budget.
 */
function validateStep(current, target, budget, nowMs, stand = standOnPlayground) {
	const tokens = Math.min(STEP_BURST, budget.tokens + ((nowMs - budget.at) / 1000) * STEP_REFILL_PER_SEC);
	const refilled = { tokens, at: nowMs };
	const refuse = { ok: false, x: current.x, y: current.y, stepped: false, budget: refilled };
	if (!Number.isFinite(target?.x) || !Number.isFinite(target?.y)) return refuse;
	if (target.x % TILE_PX || target.y % TILE_PX) return refuse;
	const dx = (target.x - current.x) / TILE_PX;
	const dy = (target.y - current.y) / TILE_PX;
	if (!dx && !dy) return { ok: true, x: current.x, y: current.y, stepped: false, budget: refilled };
	if (Math.abs(dx) + Math.abs(dy) !== 1) return refuse;
	if (!stand(target.x / TILE_PX, target.y / TILE_PX)) return refuse;
	if (tokens < 1) return refuse;
	return { ok: true, x: target.x, y: target.y, stepped: true, budget: { tokens: tokens - 1, at: nowMs } };
}

const SPAWN_RADIUS_PX = 3 * TILE_PX;
let spawnTiles = null;

/**
 * Random free tile within SPAWN_RADIUS_PX of the room center (the fountain
 * sits on the center itself). Close enough (2 x 48 = CHAT_RADIUS_PX) that
 * everyone who just joined can hear each other.
 */
function spawnPoint(random = Math.random) {
	if (!spawnTiles) {
		spawnTiles = [];
		for (let ty = 0; ty < ROOM_HEIGHT / TILE_PX; ty++) {
			for (let tx = 0; tx < ROOM_WIDTH / TILE_PX; tx++) {
				const x = tx * TILE_PX;
				const y = ty * TILE_PX;
				if (Math.hypot(x - ROOM_WIDTH / 2, y - ROOM_HEIGHT / 2) <= SPAWN_RADIUS_PX && standOnPlayground(tx, ty)) spawnTiles.push({ x, y });
			}
		}
	}
	if (!spawnTiles.length) return { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 };
	return { ...spawnTiles[Math.min(spawnTiles.length - 1, Math.floor(random() * spawnTiles.length))] };
}

module.exports = {
	validateStep,
	freshBudget,
	spawnPoint,
	SPAWN_RADIUS_PX,
	STEP_BURST,
	STEP_REFILL_PER_SEC,
	TILE_PX,
	ROOM_WIDTH,
	ROOM_HEIGHT,
	CHAT_RADIUS_PX,
};
