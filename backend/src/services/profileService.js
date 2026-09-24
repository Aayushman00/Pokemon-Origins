/**
 * Public trainer profile (V2 trainer card + chat hover card).
 * Read-only and deliberately narrow: name, campaign progress, battle record,
 * and party species/levels. Never exposes email or other account fields.
 */
const loader = require("../campaign/loader");
const { xpNeededForLevel } = require("./xpService");

const MAX_LEVEL_NUMBER = 10;
const RECENT_LIMIT = 5;

/** Campaign position -> cleared/total battle counts. Pure. */
function summarizeCampaign(progress, countBattles = loader.countBattles) {
	const currentLevel = Number(progress?.current_level) || 1;
	const currentBattle = Number(progress?.current_battle) || 1;
	let total = 0;
	let cleared = 0;
	for (let level = 1; level <= MAX_LEVEL_NUMBER; level++) {
		const count = countBattles(level);
		total += count;
		if (level < currentLevel) cleared += count;
		else if (level === currentLevel) cleared += Math.min(count, currentBattle - 1);
	}
	return {
		current_level: currentLevel,
		current_battle: currentBattle,
		unlocked_level: Number(progress?.unlocked_level) || currentLevel,
		battles_cleared: cleared,
		total_battles: total,
		champion: currentLevel > MAX_LEVEL_NUMBER,
	};
}

/** Win/loss rows -> record numbers. Pure. */
function summarizeRecord(counts) {
	const wins = Number(counts?.wins) || 0;
	const losses = Number(counts?.losses) || 0;
	const battles = wins + losses;
	return {
		wins,
		losses,
		battles,
		win_rate: battles ? Math.round((wins / battles) * 1000) / 10 : null,
	};
}

function levelName(levelNumber) {
	try {
		return loader.loadLevel(levelNumber).name;
	} catch {
		return null;
	}
}

async function getPublicProfile(trainerId, pool = require("../config/trainerdb")) {
	const [trainerRows] = await pool.query(
		"SELECT trainer_id, name, gender, created_at FROM trainers WHERE trainer_id = ?",
		[trainerId]
	);
	if (!trainerRows.length) {
		// Lazy: authService opens a DB pool at import (keeps tests alive).
		const { ServiceError } = require("./authService");
		throw new ServiceError(404, "Trainer not found");
	}
	const trainer = trainerRows[0];

	const [[progressRows], [countRows], [recentRows], [partyRows]] = await Promise.all([
		pool.query(
			"SELECT current_level, current_battle, unlocked_level FROM trainer_progress WHERE trainer_id = ?",
			[trainerId]
		),
		pool.query(
			`SELECT SUM(result = 'Win') AS wins, SUM(result = 'Loss') AS losses
			 FROM battles WHERE trainer_id = ?`,
			[trainerId]
		),
		pool.query(
			`SELECT opponent, result, battle_date FROM battles
			 WHERE trainer_id = ? ORDER BY battle_id DESC LIMIT ?`,
			[trainerId, RECENT_LIMIT]
		),
		pool.query(
			`SELECT tp.position, tp.pokemon_id, tp.nickname, tp.level, tp.current_hp,
			        tp.max_hp, tp.experience, tp.gender,
			        GROUP_CONCAT(t.name ORDER BY pt.type_id) AS types
			 FROM trainer_pokemon tp
			 LEFT JOIN pokedex.Pokemon_Type pt ON pt.pokemon_id = tp.pokemon_id
			 LEFT JOIN pokedex.Type t ON t.type_id = pt.type_id
			 WHERE tp.trainer_id = ? AND tp.in_pc = 0
			 GROUP BY tp.id
			 ORDER BY tp.position ASC`,
			[trainerId]
		),
	]);

	const campaign = summarizeCampaign(progressRows[0]);
	return {
		trainer_id: trainer.trainer_id,
		name: trainer.name,
		gender: trainer.gender,
		joined: trainer.created_at,
		campaign: {
			...campaign,
			level_name: levelName(Math.min(campaign.current_level, MAX_LEVEL_NUMBER)),
			route: Array.from({ length: MAX_LEVEL_NUMBER }, (_, i) => ({
				level: i + 1,
				name: levelName(i + 1),
			})),
		},
		record: summarizeRecord(countRows[0]),
		recent: recentRows.map((r) => ({
			opponent: r.opponent,
			result: r.result,
			date: r.battle_date,
		})),
		party: partyRows.map((p) => ({
			position: p.position,
			pokemon_id: p.pokemon_id,
			nickname: p.nickname,
			level: p.level,
			current_hp: p.current_hp,
			max_hp: p.max_hp,
			gender: p.gender,
			experience: Number(p.experience) || 0,
			xp_to_next: xpNeededForLevel(p.level),
			types: p.types ? p.types.split(",") : [],
		})),
	};
}

module.exports = { getPublicProfile, summarizeCampaign, summarizeRecord };
