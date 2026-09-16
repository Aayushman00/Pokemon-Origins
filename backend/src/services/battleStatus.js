/**
 * Pure Gen 3 battle-fidelity helpers shared by the battle session (and its
 * tests): stat-stage math, effective speed, major-status gates and chip
 * damage, and move priority from backend/data/move_meta.json.
 *
 * Major status codes: "brn" | "par" | "psn" | "slp" | "frz" (null = healthy).
 * All constants follow the documented Gen 3 simplifications: sleep lasts 1-4
 * attempted turns, thaw chance 20%/turn, full paralysis 25%, burn/poison chip
 * 1/8 max HP per round, paralysis speed x0.25.
 */

const fs = require("fs");
const path = require("path");

const STAGE_MIN = -6;
const STAGE_MAX = 6;
const STAGE_KEYS = ["atk", "def", "spa", "spd", "spe", "acc", "eva"];

const MAJOR_STATUSES = new Set(["brn", "par", "psn", "slp", "frz"]);

const PARALYSIS_SPEED_MULTIPLIER = 0.25;
const FULL_PARALYSIS_CHANCE = 0.25;
const THAW_CHANCE = 0.2;
const CHIP_FRACTION = 1 / 8;

const MOVE_META_FILE = path.join(__dirname, "..", "..", "data", "move_meta.json");

let cachedMoveMeta = null;
function loadMoveMeta() {
	if (!cachedMoveMeta) {
		try {
			const parsed = JSON.parse(fs.readFileSync(MOVE_META_FILE, "utf-8"));
			cachedMoveMeta = parsed.moves || {};
		} catch {
			cachedMoveMeta = {};
		}
	}
	return cachedMoveMeta;
}

/** Gen 3 priority bracket for a move (by exact DB name); unlisted -> 0. */
function movePriority(moveName) {
	const meta = loadMoveMeta()[moveName];
	return meta && Number.isFinite(Number(meta.priority))
		? Number(meta.priority)
		: 0;
}

function clampStage(value) {
	const stage = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
	return Math.max(STAGE_MIN, Math.min(STAGE_MAX, stage));
}

function freshStages() {
	return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
}

/** Gen 3 multiplier for atk/def/spa/spd/spe stages: (2+s)/2 or 2/(2-s). */
function stageMultiplier(stage) {
	const s = clampStage(stage);
	return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

/** Turn-order speed: base speed with the spe stage, quartered by paralysis. */
function effectiveSpeed(mon) {
	let speed = Number(mon.speed) * stageMultiplier(mon.stages?.spe ?? 0);
	if (mon.status === "par") speed *= PARALYSIS_SPEED_MULTIPLIER;
	return Math.max(1, Math.floor(speed));
}

/** Normalizes any status value to a major-status code or null. */
function normalizeStatus(value) {
	if (!value) return null;
	const code = String(value).trim().toLowerCase();
	return MAJOR_STATUSES.has(code) ? code : null;
}

/** End-of-round chip damage for brn/psn; 0 for everything else. */
function chipDamage(mon) {
	if (mon.status !== "brn" && mon.status !== "psn") return 0;
	return Math.max(1, Math.floor(mon.max_hp * CHIP_FRACTION));
}

/** Sleep lasts 1-4 attempted turns (uniform), rolled when applied. */
function rollSleepTurns(random) {
	return 1 + Math.floor(random() * 4);
}

/**
 * Pre-move gate for the attacker's major status. Returns a decision the
 * session applies (this helper never mutates):
 * - { act: true }                              proceed normally
 * - { act: true, cured: "slp" | "frz" }        woke up / thawed, then acts
 * - { act: false, blocked: "slp"|"par"|"frz" } turn is consumed, no move
 */
function statusGate(mon, random) {
	if (mon.status === "slp") {
		// statusTurns counts remaining blocked attempts (rolled 1-4). At 0 the
		// mon wakes and acts on the same turn (Gen 3 checks at move time).
		if ((mon.statusTurns ?? 0) <= 0) {
			return { act: true, cured: "slp" };
		}
		return {
			act: false,
			blocked: "slp",
			nextTurns: (mon.statusTurns ?? 0) - 1,
		};
	}
	if (mon.status === "frz") {
		if (random() < THAW_CHANCE) {
			return { act: true, cured: "frz" };
		}
		return { act: false, blocked: "frz" };
	}
	if (mon.status === "par" && random() < FULL_PARALYSIS_CHANCE) {
		return { act: false, blocked: "par" };
	}
	return { act: true };
}

/** "X was burned!"-style line for a freshly applied status. */
function statusAppliedLine(nickname, status) {
	switch (status) {
		case "brn":
			return `${nickname} was burned!`;
		case "par":
			return `${nickname} is paralyzed! It may be unable to move!`;
		case "psn":
			return `${nickname} was poisoned!`;
		case "slp":
			return `${nickname} fell asleep!`;
		case "frz":
			return `${nickname} was frozen solid!`;
		default:
			return `${nickname} was afflicted!`;
	}
}

/** "X is fast asleep."-style line when the gate blocks the move. */
function cantMoveLine(nickname, status) {
	switch (status) {
		case "slp":
			return `${nickname} is fast asleep.`;
		case "par":
			return `${nickname} is paralyzed! It can't move!`;
		case "frz":
			return `${nickname} is frozen solid!`;
		default:
			return `${nickname} can't move!`;
	}
}

/** "X woke up!"-style line when a status ends. */
function statusEndLine(nickname, status) {
	switch (status) {
		case "slp":
			return `${nickname} woke up!`;
		case "frz":
			return `${nickname} thawed out!`;
		case "brn":
			return `${nickname}'s burn was healed!`;
		case "par":
			return `${nickname} was cured of paralysis!`;
		case "psn":
			return `${nickname} was cured of its poisoning!`;
		default:
			return `${nickname} returned to normal!`;
	}
}

/** "X was hurt by its burn!"-style end-of-round chip line. */
function chipLine(nickname, status) {
	return status === "brn"
		? `${nickname} was hurt by its burn!`
		: `${nickname} was hurt by poison!`;
}

const STAT_LABELS = {
	atk: "ATTACK",
	def: "DEFENSE",
	spa: "SP. ATK",
	spd: "SP. DEF",
	spe: "SPEED",
	acc: "accuracy",
	eva: "evasiveness",
};

/** "X's ATTACK rose!" / "fell sharply!" / clamp-failure line. */
function statChangeLine(nickname, stat, delta, failed) {
	const label = STAT_LABELS[stat] || String(stat).toUpperCase();
	if (failed) {
		return delta > 0
			? `${nickname}'s ${label} won't go any higher!`
			: `${nickname}'s ${label} won't go any lower!`;
	}
	const magnitude = Math.abs(delta) >= 2 ? " sharply" : "";
	return delta > 0
		? `${nickname}'s ${label} rose${magnitude}!`
		: `${nickname}'s ${label} fell${magnitude}!`;
}

module.exports = {
	STAGE_MIN,
	STAGE_MAX,
	STAGE_KEYS,
	MAJOR_STATUSES,
	PARALYSIS_SPEED_MULTIPLIER,
	FULL_PARALYSIS_CHANCE,
	THAW_CHANCE,
	CHIP_FRACTION,
	loadMoveMeta,
	movePriority,
	clampStage,
	freshStages,
	stageMultiplier,
	effectiveSpeed,
	normalizeStatus,
	chipDamage,
	rollSleepTurns,
	statusGate,
	statusAppliedLine,
	cantMoveLine,
	statusEndLine,
	chipLine,
	statChangeLine,
};
