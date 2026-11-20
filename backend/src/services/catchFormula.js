/**
 * Gen 3 (FireRed) catch roll. Pure: the battle service passes the wild
 * Pokémon's HP, its species catch rate, the ball's bonus, its battle status
 * and a random source, and plays back the result.
 *
 * Catch rates: backend/data/catch_rates.json (dex number -> PokeAPI
 * capture_rate), written once by backend/scripts/fetch-catch-rates.js.
 */
const CATCH_RATES = require("../../data/catch_rates.json");

const DEFAULT_CATCH_RATE = 45;
const STATUS_BONUS = { slp: 2, frz: 2, par: 1.5, psn: 1.5, brn: 1.5 };

const catchRateOf = (pokemonId) => CATCH_RATES[pokemonId] ?? DEFAULT_CATCH_RATE;

/** The modified catch rate `a`; 255 or more is a sure catch. */
function catchValue({ maxHp, hp, rate, ballBonus, status }) {
	const base = Math.floor(((3 * maxHp - 2 * hp) * rate * ballBonus) / (3 * maxHp));
	return Math.floor(base * (STATUS_BONUS[status] || 1));
}

/** Four shake checks; the ball wobbles once per passed check (at most 3 shown). */
function rollCatch({ maxHp, hp, rate, ballBonus, status, random }) {
	const a = catchValue({ maxHp, hp, rate, ballBonus, status });
	if (a >= 255) return { shakes: 3, caught: true };
	const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a))));
	let passed = 0;
	while (passed < 4 && random() * 65536 < b) passed += 1;
	return { shakes: Math.min(passed, 3), caught: passed === 4 };
}

module.exports = { catchValue, rollCatch, catchRateOf, DEFAULT_CATCH_RATE };
