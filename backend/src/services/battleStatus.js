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

// Volatile conditions (confusion/attract/disable/flinch): unlike major
// statuses, these are tracked independently and a mon can have one of these
// AND a major status at the same time.
const CONFUSION_SELF_HIT_CHANCE = 1 / 3;
const ATTRACT_SKIP_CHANCE = 0.5;
// ponytail: real Gen 3 Disable lasts 2-7 turns; simplified to 2-5 here.
const DISABLE_TURNS_MIN = 2;
const DISABLE_TURNS_MAX = 5;

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

/** Confusion lasts 1-4 attempted turns (uniform), rolled when applied. */
function rollConfusionTurns(random) {
	return 1 + Math.floor(random() * 4);
}

/** Disable lasts DISABLE_TURNS_MIN..DISABLE_TURNS_MAX turns, rolled when applied. */
function rollDisableTurns(random) {
	return DISABLE_TURNS_MIN + Math.floor(random() * (DISABLE_TURNS_MAX - DISABLE_TURNS_MIN + 1));
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

/**
 * Pre-move gate for volatile conditions (flinch/confusion/attract), checked
 * only once the major-status gate above has already cleared the mon to act.
 * Returns a decision the session applies (this helper never mutates):
 * - { act: true }                                        proceed normally
 * - { act: true, nextTurns }                              still confused, hit through it
 * - { act: true, curedConfusion: true, nextTurns: 0 }     snapped out, acts freely this turn
 * - { act: false, blocked: "flinch" }                     flinched, no move
 * - { act: false, blocked: "confusion", selfHit, nextTurns } hurt itself instead
 * - { act: false, blocked: "attract" }                    immobilized by love
 */
function volatileGate(mon, random) {
	if (mon.flinched) {
		return { act: false, blocked: "flinch" };
	}
	if ((mon.confusionTurns ?? 0) > 0) {
		// The self-hit roll always happens on a confused turn, including the
		// last one — the mon snaps out AFTER this turn's check, not instead
		// of it (so a 1-turn confusion still gets its one real chance).
		const nextTurns = mon.confusionTurns - 1;
		const curedConfusion = nextTurns <= 0;
		if (random() < CONFUSION_SELF_HIT_CHANCE) {
			return { act: false, blocked: "confusion", selfHit: true, nextTurns, curedConfusion };
		}
		return { act: true, nextTurns, curedConfusion };
	}
	if (mon.attracted && random() < ATTRACT_SKIP_CHANCE) {
		return { act: false, blocked: "attract" };
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
		case "attract":
			return `${nickname} is immobilized by love!`;
		case "flinch":
			return `${nickname} flinched and couldn't move!`;
		default:
			return `${nickname} can't move!`;
	}
}

/** "X became confused!" / "X fell in love!"-style line for a fresh volatile effect. */
function volatileAppliedLine(nickname, volatile) {
	switch (volatile) {
		case "confusion":
			return `${nickname} became confused!`;
		case "attract":
			return `${nickname} fell in love!`;
		default:
			return `${nickname} was affected!`;
	}
}

/** "X snapped out of its confusion!"-style line when a volatile effect ends. */
function volatileEndLine(nickname, volatile) {
	switch (volatile) {
		case "confusion":
			return `${nickname} snapped out of its confusion!`;
		case "disable":
			return `${nickname}'s move is no longer disabled!`;
		default:
			return `${nickname} returned to normal!`;
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
	CONFUSION_SELF_HIT_CHANCE,
	ATTRACT_SKIP_CHANCE,
	DISABLE_TURNS_MIN,
	DISABLE_TURNS_MAX,
	loadMoveMeta,
	movePriority,
	clampStage,
	freshStages,
	stageMultiplier,
	effectiveSpeed,
	normalizeStatus,
	chipDamage,
	rollSleepTurns,
	rollConfusionTurns,
	rollDisableTurns,
	statusGate,
	volatileGate,
	statusAppliedLine,
	cantMoveLine,
	statusEndLine,
	chipLine,
	statChangeLine,
	volatileAppliedLine,
	volatileEndLine,
};
