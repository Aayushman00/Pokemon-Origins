// The Playground's wild table (data/encounters/park.json): the 62 species the
// overworld never offers, finals very rare, split by the park's clock, with
// levels that follow the trainer's party (spec 2026-11-20-park-wild-mart-spectate).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { parkLevels, getParkTable } = require("./park");

const ROOT = path.join(__dirname, "..", "..", "..");
const park = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "encounters", "park.json"), "utf8"));

const sql = fs.readFileSync(path.join(ROOT, "database", "pokedex_data.sql"), "utf8");
const insert = sql.split("\n").find((l) => l.startsWith("INSERT INTO `Evolution` VALUES"));
const evolutions = [...insert.matchAll(/\((\d+),(\d+),(\d+),'([^']*)','([^']*)'\)/g)].map(([, , base, evolved]) => ({ base: +base, evolved: +evolved }));
const bases = new Set(evolutions.map((e) => e.base));
const finals = new Set(evolutions.map((e) => e.evolved).filter((id) => !bases.has(id)));

const LEGENDARIES = [144, 145, 146, 150, 151];
const STARTER_BASES = [1, 4, 7];
const STARTER_MIDDLES = [2, 5, 8];
const NIGHT_FINALS = [20, 24, 36, 40, 42, 49, 53, 65, 89, 94, 97, 105, 110];
const ids = (time, stage) => park[time].slots.filter((s) => !stage || s.stage === stage).map((s) => s.id);

describe("park table", () => {
	it("uses exactly the 62 park species, no legendary", () => {
		const all = new Set([...ids("day"), ...ids("night")]);
		const expected = new Set([...STARTER_BASES, ...STARTER_MIDDLES, ...[...finals].filter((id) => !LEGENDARIES.includes(id))]);
		assert.equal(expected.size, 62);
		assert.deepEqual([...all].sort((a, b) => a - b), [...expected].sort((a, b) => a - b));
		for (const id of LEGENDARIES) assert.ok(!all.has(id), `#${id} is legendary`);
	});

	it("each table holds all six starter-line species, staged base and middle", () => {
		for (const time of ["day", "night"]) {
			assert.deepEqual(ids(time, "base"), STARTER_BASES, time);
			assert.deepEqual(ids(time, "middle"), STARTER_MIDDLES, time);
		}
	});

	it("night finals are the 13 night species, day finals the other 43, none in both", () => {
		assert.deepEqual(ids("night", "final"), NIGHT_FINALS);
		const day = ids("day", "final");
		assert.equal(day.length, 43);
		assert.ok(day.every((id) => !NIGHT_FINALS.includes(id)));
	});

	it("weights follow 2N / N / 1, so finals share 10%", () => {
		for (const time of ["day", "night"]) {
			const n = ids(time, "final").length;
			const total = park[time].slots.reduce((sum, s) => sum + s.weight, 0);
			for (const s of park[time].slots) assert.equal(s.weight, { base: 2 * n, middle: n, final: 1 }[s.stage], `${time} #${s.id}`);
			assert.equal(n / total, 0.1, time);
		}
	});

	it("parkLevels follow the party's best level, clamped per stage", () => {
		assert.deepEqual(parkLevels("final", 5), [10, 13]);
		assert.deepEqual(parkLevels("final", 40), [40, 43]);
		assert.deepEqual(parkLevels("final", 99), [99, 100]);
		assert.deepEqual(parkLevels("base", 5), [2, 4]);
		assert.deepEqual(parkLevels("base", 30), [15, 15]);
		assert.deepEqual(parkLevels("middle", 5), [2, 4]);
		assert.deepEqual(parkLevels("middle", 40), [31, 31]);
	});

	it("getParkTable levels every slot from the party's best level", () => {
		const table = getParkTable("night", 20);
		assert.deepEqual(table.slots.find((s) => s.id === 94).levels, [20, 23]);
		assert.deepEqual(table.slots.find((s) => s.id === 1).levels, [15, 15]);
		assert.deepEqual(table.levels, [15, 23]);
		assert.equal(table.minLevel, 0);
		assert.equal(getParkTable("dusk", 20), null);
	});
});
