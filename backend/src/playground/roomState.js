// backend/src/playground/roomState.js
/**
 * In-memory presence store for one Playground room. One instance per room;
 * Phase 1 only ever creates one (see index.js). Ephemeral by design — no
 * persistence, state resets on server restart.
 */

const PALETTE = [
	"#FF6633",
	"#FFB399",
	"#FF33FF",
	"#FFFF99",
	"#00B3E6",
	"#E6B333",
	"#3366E6",
	"#999966",
	"#99FF99",
	"#B34D4D",
];

function hashToUint(value) {
	let hash = 0;
	for (const char of String(value)) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}
	return hash;
}

/** trainerId is a DB number for signed-in trainers, or a "guest-<socketId>" string. */
function colorFor(trainerId) {
	const numeric = Number(trainerId);
	const id = Number.isFinite(numeric) ? numeric : hashToUint(trainerId);
	const index = id % PALETTE.length;
	return PALETTE[index];
}

function createRoomState() {
	const players = new Map();

	function addPlayer(trainerId, name, spawn, gender) {
		const state = {
			trainerId,
			name,
			gender: gender || null,
			initial: name.charAt(0).toUpperCase(),
			color: colorFor(trainerId),
			x: spawn.x,
			y: spawn.y,
		};
		players.set(trainerId, state);
		return state;
	}

	function removePlayer(trainerId) {
		players.delete(trainerId);
	}

	function getPlayer(trainerId) {
		return players.get(trainerId) || null;
	}

	function updatePosition(trainerId, x, y) {
		const player = players.get(trainerId);
		if (!player) return null;
		player.x = x;
		player.y = y;
		return player;
	}

	function listPlayers() {
		return Array.from(players.values());
	}

	return { addPlayer, removePlayer, getPlayer, updatePosition, listPlayers };
}

module.exports = { createRoomState, colorFor, PALETTE };
