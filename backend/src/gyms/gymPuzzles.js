const path = require("path");
const fs = require("fs");
const engine = require("./puzzles");

const FILE = path.join(__dirname, "..", "..", "data", "gyms", "gym_puzzles.json");
let cache = null;

function load() {
	if (!cache) cache = JSON.parse(fs.readFileSync(FILE, "utf8"));
	return cache;
}

/** Puzzle spec for a gym leader id (as in trainers/gym_leaders.json), or null. */
function getGymPuzzle(leaderId) {
	return load()[leaderId] || null;
}

/** All eight specs in gym order. */
function listGymPuzzles() {
	return Object.values(load()).sort((a, b) => a.gym - b.gym);
}

/** Build a playable engine instance from a spec. */
function buildPuzzle(spec) {
	const make = engine[spec.mechanic];
	if (typeof make !== "function") throw new Error(`unknown puzzle mechanic "${spec.mechanic}"`);
	return make(spec.rows, spec.config);
}

/**
 * Replay a list of moves ("up"|"down"|"left"|"right") against a spec.
 * A fall or an illegal move resets the room, like the client does.
 * Returns { solved, moves } so the server can verify a claimed solve.
 */
function replay(spec, moves) {
	const puz = buildPuzzle(spec);
	let state = puz.init();
	let count = 0;
	for (const m of moves) {
		const d = engine.DIRS[m];
		if (!d) return { solved: false, moves: count };
		const next = puz.step(state, d);
		if (!next) continue;
		if (next.dead) { state = puz.init(); count = 0; continue; }
		state = next;
		count += 1;
		if (puz.won(state)) return { solved: true, moves: count };
	}
	return { solved: puz.won(state), moves: count };
}

function resetCache() {
	cache = null;
}

module.exports = { getGymPuzzle, listGymPuzzles, buildPuzzle, replay, resetCache, solve: engine.solve };
