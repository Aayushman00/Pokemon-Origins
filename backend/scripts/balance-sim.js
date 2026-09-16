// Campaign balance simulator (Phase 11) — dev tool, no DB required.
//
//   cd backend && node scripts/balance-sim.js
//
// Prints the deterministic level ladder for a "carry" playthrough:
// campaign battles are one-time (no wild grinding), so total XP income is
// fixed and the player's level at every battle can be computed exactly.
//
// Model (documents the tuning assumptions):
// - All win XP funnels into one carry Pokémon (starter, Lv 5). Win XP is
//   6 × the sum of enemy party levels — the battleSessionService rule.
// - After each offer-creating boss win (gym_boss / champion / legendary)
//   the player claims a reward mon. Offers draw 3 of the pool's 6 options,
//   so the second-highest pool level approximates the best claim. Claimed
//   mons never take XP here; they only raise the "Eff" (effective
//   front-line) column used to judge fight fairness.
// - Coins: STARTING_COINS plus the per-win award (boss types pay
//   BOSS_WIN_COINS), assuming every battle is completed once.
//
// Read "Gap" as enemy ace minus effective player level: positive = the
// enemy outlevels the player. Targets used for the Phase 11 tune: roads
// within ±3, gym aces about +2…+5, champion/legendaries up to ~+7 (items,
// type picks and claimed legendaries close the rest).
const loader = require("../src/campaign/loader");
const {
	applyExperience,
	xpGainForWin,
	XP_CURVE_SLOPE,
	XP_PER_ENEMY_LEVEL,
} = require("../src/services/xpService");
const { loadRewardPool } = require("../src/services/rewardService");
const {
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
	BOSS_BATTLE_TYPES,
} = require("../src/services/walletService");

const MAX_LEVEL = 10;
const OFFER_BATTLE_TYPES = new Set(["gym_boss", "champion", "legendary"]);

function enemyLevels(battle) {
	if (battle.type === "legendary") return [battle.encounter.level];
	return battle.trainer.party.map((mon) => mon.level);
}

function pad(value, width) {
	return String(value).padEnd(width);
}

function main() {
	let carry = { level: 5, experience: 0 };
	let bestClaim = 0;
	let coins = STARTING_COINS;

	console.log(
		`XP curve: threshold(L→L+1) = ${XP_CURVE_SLOPE}·L | win XP = ${XP_PER_ENEMY_LEVEL} × Σ enemy levels | start Lv ${carry.level}, ${coins} coins`
	);
	console.log(
		`${pad("Battle", 26)}${pad("Enemies", 16)}${pad("Carry", 7)}${pad(
			"Claim",
			7
		)}${pad("Eff", 5)}${pad("Ace", 5)}Gap`
	);

	for (let levelNumber = 1; levelNumber <= MAX_LEVEL; levelNumber++) {
		const battles = loader.listBattles(levelNumber);
		for (const battle of battles) {
			const levels = enemyLevels(battle);
			const ace = Math.max(...levels);
			const eff = Math.max(carry.level, bestClaim);
			const gap = ace - eff;
			const name =
				battle.type === "legendary"
					? battle.encounter.name
					: battle.trainer.name;
			console.log(
				`${pad(`L${levelNumber}.${battle.battleNumber} ${battle.type}`, 26)}${pad(
					`[${levels.join(",")}]`,
					16
				)}${pad(carry.level, 7)}${pad(bestClaim || "-", 7)}${pad(eff, 5)}${pad(
					ace,
					5
				)}${gap >= 0 ? "+" : ""}${gap}  ${name}`
			);

			// Win: XP to the carry, coins, then any boss claim.
			const gained = xpGainForWin({
				level: levels.reduce((sum, lv) => sum + lv, 0),
			});
			carry = applyExperience(carry, gained);
			coins += BOSS_BATTLE_TYPES.has(battle.type)
				? BOSS_WIN_COINS
				: WIN_COINS;

			if (OFFER_BATTLE_TYPES.has(battle.type)) {
				const pool = loadRewardPool(levelNumber);
				if (pool?.pool?.length) {
					const sorted = pool.pool
						.map((mon) => mon.level)
						.sort((a, b) => b - a);
					const claim = sorted[Math.min(1, sorted.length - 1)];
					bestClaim = Math.max(bestClaim, claim);
				}
			}
		}
		console.log(
			`  └ after level ${levelNumber}: carry Lv ${carry.level} (+${carry.experience} xp buffered), best claim Lv ${bestClaim || 0}, ${coins} coins`
		);
	}
}

main();
