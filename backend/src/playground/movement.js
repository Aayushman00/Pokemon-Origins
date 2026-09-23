// backend/src/playground/movement.js
/**
 * Server-side resolution of one incoming "move" event from an in-progress
 * drag. Dragging is the client's UI interaction; this module resolves the
 * network representation of that drag into an authoritative position.
 */

const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;
const MAX_SPEED_PX_PER_SEC = 2000;

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

module.exports = { resolveMove, clamp, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC };
