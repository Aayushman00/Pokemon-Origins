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
	// Distance/speed-cap math uses the raw (unclamped) target so that a
	// speed-limited step moves the full max distance toward it. Room-bounds
	// clamping is applied only once the target is actually reached within
	// this tick's speed budget; a step that's still speed-capped is, by
	// definition, moving toward an in-bounds `current` and hasn't arrived
	// at the (possibly out-of-bounds) target yet.
	const dx = target.x - current.x;
	const dy = target.y - current.y;
	const dist = Math.hypot(dx, dy);
	const maxDist = MAX_SPEED_PX_PER_SEC * (elapsedMs / 1000);

	if (dist <= maxDist) {
		return {
			x: clamp(target.x, 0, ROOM_WIDTH),
			y: clamp(target.y, 0, ROOM_HEIGHT),
		};
	}

	const ratio = maxDist / dist;
	return {
		x: current.x + dx * ratio,
		y: current.y + dy * ratio,
	};
}

module.exports = { resolveMove, clamp, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC };
