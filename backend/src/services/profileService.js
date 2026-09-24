/**
 * Public trainer profile (V2 trainer card + chat hover card).
 * Read-only and deliberately narrow: name, campaign progress, battle record,
 * and party species/levels. Never exposes email or other account fields.
 */
const loader = require("../campaign/loader");
const { xpNeededForLevel } = require("./xpService");

const MAX_LEVEL_NUMBER = 10;
const RECENT_LIMIT = 5;
const STREAK_WINDOW = 50;
const HISTORY_MAX = 50;
const CARD_THEMES = ["sky", "grass", "ember", "ocean", "dusk", "gold"];
const MOTTO_MAX = 40;

function profileError(status, message) {
	// Lazy: authService opens a DB pool at import (keeps tests alive).
	const { ServiceError } = require("./authService");
	return new ServiceError(status, message);
}

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

/** Current streak from results newest-first ("Win" | "Loss"). Pure. */
function summarizeStreak(results) {
	if (!results.length) return null;
	const type = results[0];
	let count = 0;
	while (count < results.length && results[count] === type) count++;
	return { type, count };
}

/** Validates a card edit against what the trainer owns. Pure. */
function validateCard({ theme, motto, favoriteId }, ownedIds) {
	if (!CARD_THEMES.includes(theme)) return "Unknown card theme";
	const cleanMotto = typeof motto === "string" ? motto.trim() : "";
	if (cleanMotto.length > MOTTO_MAX) return `Motto can be at most ${MOTTO_MAX} characters`;
	if (favoriteId != null && !ownedIds.has(Number(favoriteId))) return "Favourite must be one of your Pokémon";
	return null;
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
	if (!trainerRows.length) throw profileError(404, "Trainer not found");
	const trainer = trainerRows[0];

	const [[progressRows], [countRows], [recentRows], [partyRows], [streakRows], [cardRows]] = await Promise.all([
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
		pool.query("SELECT result FROM battles WHERE trainer_id = ? ORDER BY battle_id DESC LIMIT ?", [trainerId, STREAK_WINDOW]),
		pool.query(
			`SELECT c.theme, c.motto, tp.id AS fav_id, tp.pokemon_id AS fav_pokemon_id, tp.nickname AS fav_nickname, tp.level AS fav_level
			 FROM trainer_card c
			 LEFT JOIN trainer_pokemon tp ON tp.id = c.favorite_pokemon_row_id AND tp.trainer_id = c.trainer_id
			 WHERE c.trainer_id = ?`,
			[trainerId]
		),
	]);
	const card = cardRows[0];

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
		record: { ...summarizeRecord(countRows[0]), streak: summarizeStreak(streakRows.map((r) => r.result)) },
		card: {
			theme: card?.theme || "sky",
			motto: card?.motto || null,
			favorite: card?.fav_id
				? { id: card.fav_id, pokemon_id: card.fav_pokemon_id, nickname: card.fav_nickname, level: card.fav_level }
				: null,
		},
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

/** Paged battle log, newest first. `before` is the last battle_id seen. */
async function getBattleHistory(trainerId, { limit = 20, before } = {}, pool = require("../config/trainerdb")) {
	const [exists] = await pool.query("SELECT 1 FROM trainers WHERE trainer_id = ?", [trainerId]);
	if (!exists.length) throw profileError(404, "Trainer not found");
	const size = Math.max(1, Math.min(HISTORY_MAX, Number(limit) || 20));
	const [rows] = await pool.query(
		`SELECT battle_id, opponent, result, battle_date FROM battles
		 WHERE trainer_id = ? ${before ? "AND battle_id < ?" : ""}
		 ORDER BY battle_id DESC LIMIT ?`,
		before ? [trainerId, Number(before), size + 1] : [trainerId, size + 1]
	);
	const page = rows.slice(0, size);
	return {
		battles: page.map((r) => ({ id: r.battle_id, opponent: r.opponent, result: r.result, date: r.battle_date })),
		next: rows.length > size ? page[page.length - 1].battle_id : null,
	};
}

/** Saves the caller's own card. Favourite may be any owned Pokémon (party or PC). */
async function updateCard(trainerId, input, pool = require("../config/trainerdb")) {
	const [owned] = await pool.query("SELECT id FROM trainer_pokemon WHERE trainer_id = ?", [trainerId]);
	const problem = validateCard(input, new Set(owned.map((r) => Number(r.id))));
	if (problem) throw profileError(400, problem);
	const motto = typeof input.motto === "string" && input.motto.trim() ? input.motto.trim() : null;
	await pool.query(
		`INSERT INTO trainer_card (trainer_id, theme, motto, favorite_pokemon_row_id) VALUES (?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE theme = VALUES(theme), motto = VALUES(motto), favorite_pokemon_row_id = VALUES(favorite_pokemon_row_id)`,
		[trainerId, input.theme, motto, input.favoriteId ?? null]
	);
	return getPublicProfile(trainerId, pool);
}

module.exports = {
	getPublicProfile,
	getBattleHistory,
	updateCard,
	summarizeCampaign,
	summarizeRecord,
	summarizeStreak,
	validateCard,
	CARD_THEMES,
};
