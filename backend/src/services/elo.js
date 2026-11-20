/**
 * Elo for PvP. Beating a stronger player moves more points than beating a weaker
 * one; a 400-point favourite who wins gains about K/11. Repeat matches against the
 * same opponent stop moving ratings once RATED_PER_PAIR_PER_DAY have been played
 * that (UTC) day, so farming an alt is worth nothing after the first few.
 */
const START = 1000;
const K = 32;
const RATED_PER_PAIR_PER_DAY = 3;

/** Chance `a` beats `b`. */
function expected(a, b) {
	return 1 / (1 + 10 ** ((b - a) / 400));
}

/**
 * New ratings after one match. `score`: 1 winner a, 0 winner b, 0.5 draw.
 * `pairGamesToday`: rated games these two already played today (before this one).
 */
function rate(a, b, score, pairGamesToday = 0) {
	if (pairGamesToday >= RATED_PER_PAIR_PER_DAY) return { a, b, delta: 0, rated: false };
	const delta = Math.round(K * (score - expected(a, b)));
	return { a: a + delta, b: b - delta, delta, rated: true };
}

/** UTC day key, for "most wins today" and the per-pair cap. */
const dayKey = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

module.exports = { START, K, RATED_PER_PAIR_PER_DAY, expected, rate, dayKey };
