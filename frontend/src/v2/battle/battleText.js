// Client-side battle text for server events (Gen 3 wording). The server log
// carries the same lines; the client re-derives them so text stays in step
// with the animation beats.

export const STATUS_APPLIED_TEXT = {
	brn: (n) => `${n} was burned!`,
	par: (n) => `${n} is paralyzed! It may be unable to move!`,
	psn: (n) => `${n} was poisoned!`,
	slp: (n) => `${n} fell asleep!`,
	frz: (n) => `${n} was frozen solid!`,
};

export const CANT_MOVE_TEXT = {
	slp: (n) => `${n} is fast asleep.`,
	par: (n) => `${n} is paralyzed! It can't move!`,
	frz: (n) => `${n} is frozen solid!`,
};

export const STATUS_END_TEXT = {
	slp: (n) => `${n} woke up!`,
	frz: (n) => `${n} thawed out!`,
};

export const STATUS_HURT_TEXT = {
	brn: (n) => `${n} was hurt by its burn!`,
	psn: (n) => `${n} was hurt by poison!`,
};

const STAT_LABELS = {
	atk: "ATTACK",
	def: "DEFENSE",
	spa: "SP. ATK",
	spd: "SP. DEF",
	spe: "SPEED",
	acc: "accuracy",
	eva: "evasiveness",
};

export function statChangeText({ nickname, stat, delta, failed }) {
	const label = STAT_LABELS[stat] || String(stat).toUpperCase();
	if (failed) return `${nickname}'s ${label} won't go any ${delta > 0 ? "higher" : "lower"}!`;
	const sharply = Math.abs(delta) >= 2 ? " sharply" : "";
	return `${nickname}'s ${label} ${delta > 0 ? "rose" : "fell"}${sharply}!`;
}

export const REWARD_EVENT_TYPES = new Set(["xp_gain", "level_up", "coins", "evolution_available", "move_learned", "move_learn_available"]);

/** Post-win reward event → one line. `forBattle` drops the "see hub" hints. */
export function rewardLine(e, { forBattle = false } = {}) {
	switch (e.type) {
		case "xp_gain":
			return `${e.nickname} gained ${e.amount} EXP. Points!`;
		case "level_up":
			return `${e.nickname} grew to Lv. ${e.level}!`;
		case "coins":
			return `Got ${e.amount} coins for winning!`;
		case "evolution_available":
			return forBattle ? `${e.nickname} can now evolve!` : `${e.nickname} can now evolve. Confirm it on the hub.`;
		case "move_learned":
			return `${e.nickname} learned ${e.moveName}!`;
		case "move_learn_available":
			return forBattle ? `${e.nickname} wants to learn ${e.moveName}!` : `${e.nickname} wants to learn ${e.moveName}. Decide on the hub.`;
		default:
			return "";
	}
}
