/**
 * The Playground's tall grass (data/encounters/park.json): the species the
 * overworld never offers, one table for day and one for night. Slots carry a
 * stage, not levels: levels follow the trainer's best party member, so a rare
 * final evolution is a strong teammate, never a free win (no obedience system).
 */
const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./loader");

const STAGE_CAP = { base: 15, middle: 31 }; // below the starters' level-up evolutions (16; Ivysaur's 32)
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** [lo, hi] for a stage, given `top` = the party's highest level. */
function parkLevels(stage, top) {
	if (stage === "final") {
		const lo = Math.max(10, top);
		return [Math.min(100, lo), Math.min(100, lo + 3)];
	}
	const cap = STAGE_CAP[stage];
	return [clamp(top - 3, 2, cap), clamp(top - 1, 2, cap)];
}

/** A wild table (loader.getWildTable's shape) for `time`, levelled from `top`; null for an unknown time. */
function getParkTable(time, top, dataDir = DATA_DIR) {
	const tables = JSON.parse(fs.readFileSync(path.join(dataDir, "encounters", "park.json"), "utf8"));
	if (!Object.hasOwn(tables, time)) return null;
	const slots = tables[time].slots.map(({ id, weight, stage }) => ({ id, weight, levels: parkLevels(stage, top) }));
	const levels = [Math.min(...slots.map((s) => s.levels[0])), Math.max(...slots.map((s) => s.levels[1]))];
	return { minLevel: 0, levels, slots };
}

module.exports = { parkLevels, getParkTable };
