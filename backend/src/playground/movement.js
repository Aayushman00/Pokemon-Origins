// backend/src/playground/movement.js
/**
 * Server-side resolution of one incoming "move" event from an in-progress
 * drag. Dragging is the client's UI interaction; this module resolves the
 * network representation of that drag into an authoritative position.
 */

const ROOM_WIDTH = 3000;
const ROOM_HEIGHT = 2000;
const MAX_SPEED_PX_PER_SEC = 2000;
const CHAT_RADIUS_PX = 250;

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

const SPAWN_RADIUS_PX = 110;

/**
 * Random spawn inside the plaza, within SPAWN_RADIUS_PX of the room center.
 * Keeps new trainers from stacking on one pixel while staying close enough
 * (2 x 110 < CHAT_RADIUS_PX) that everyone who just joined can hear each other.
 */
function spawnPoint(random = Math.random) {
	const angle = random() * Math.PI * 2;
	const dist = Math.sqrt(random()) * SPAWN_RADIUS_PX;
	return {
		x: Math.round(ROOM_WIDTH / 2 + Math.cos(angle) * dist),
		y: Math.round(ROOM_HEIGHT / 2 + Math.sin(angle) * dist),
	};
}

module.exports = { resolveMove, clamp, spawnPoint, SPAWN_RADIUS_PX, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC, CHAT_RADIUS_PX };
