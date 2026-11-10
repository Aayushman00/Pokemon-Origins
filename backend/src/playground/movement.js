// backend/src/playground/movement.js
/**
 * Server-side resolution of one incoming "move" event. The room is the
 * Playground map (frontend/public/maps/playground.json) in game pixels:
 * a position is the top-left of the 16px tile a trainer stands on, sent at
 * the start of each step. The client walks tile by tile on that map; this
 * module only caps speed and keeps positions inside the room.
 */

const TILE_PX = 16;
const ROOM_WIDTH = 40 * TILE_PX; // playground.json is 40 x 28 tiles
const ROOM_HEIGHT = 28 * TILE_PX;
const MAX_SPEED_PX_PER_SEC = 2000;
const CHAT_RADIUS_PX = 6 * TILE_PX; // earshot: six tiles

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function resolveMove(current, target, elapsedMs) {
	const dx = target.x - current.x;
	const dy = target.y - current.y;
	const dist = Math.hypot(dx, dy);
	const maxDist = MAX_SPEED_PX_PER_SEC * (elapsedMs / 1000);

	let next;
	if (dist <= maxDist) {
		next = { x: target.x, y: target.y };
	} else {
		const ratio = maxDist / dist;
		next = { x: current.x + dx * ratio, y: current.y + dy * ratio };
	}

	// Bounds always win, regardless of whether this step arrived at the
	// target or was still speed-capped: a large elapsedMs (e.g. after a
	// reconnect or lag spike) must never resolve outside the room.
	return {
		x: clamp(next.x, 0, ROOM_WIDTH),
		y: clamp(next.y, 0, ROOM_HEIGHT),
	};
}

const SPAWN_RADIUS_PX = 2 * TILE_PX;

/**
 * Random tile on the plaza, within SPAWN_RADIUS_PX of the room center (the
 * map keeps that circle open). Keeps new trainers from stacking on one tile
 * while staying close enough (2 x 32 < CHAT_RADIUS_PX) that everyone who just
 * joined can hear each other.
 */
function spawnPoint(random = Math.random) {
	const angle = random() * Math.PI * 2;
	const dist = Math.sqrt(random()) * SPAWN_RADIUS_PX;
	const snap = (v) => Math.round(v / TILE_PX) * TILE_PX;
	const x = snap(ROOM_WIDTH / 2 + Math.cos(angle) * dist);
	const y = snap(ROOM_HEIGHT / 2 + Math.sin(angle) * dist);
	// Snapping can push a point just past the radius; pull it back a tile toward the center.
	const back = (v, c) => (v > c ? v - TILE_PX : v < c ? v + TILE_PX : v);
	return Math.hypot(x - ROOM_WIDTH / 2, y - ROOM_HEIGHT / 2) <= SPAWN_RADIUS_PX
		? { x, y }
		: { x: back(x, ROOM_WIDTH / 2), y: back(y, ROOM_HEIGHT / 2) };
}

module.exports = { resolveMove, clamp, spawnPoint, SPAWN_RADIUS_PX, TILE_PX, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC, CHAT_RADIUS_PX };
