// The wild tables (data/encounters/wild.json) against the rules of
// docs/superpowers/specs/2026-11-12-wild-encounters-design.md, checked
// against the pokédex dump's Evolution rows.
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");
const tables = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "encounters", "wild.json"), "utf8"));

const BANNED = new Set([144, 145, 146, 150, 151, 1, 2, 4, 5, 7, 8]); // legendaries, starter lines
const TRADE_LEVEL = 37; // database/migrations/014_trade_evolutions_by_level.sql

const sql = fs.readFileSync(path.join(ROOT, "database", "pokedex_data.sql"), "utf8");
const insert = sql.split("\n").find((l) => l.startsWith("INSERT INTO `Evolution` VALUES"));
const evolutions = [...insert.matchAll(/\((\d+),(\d+),(\d+),'([^']*)','([^']*)'\)/g)].map(([, , base, evolved, method, cond]) => ({
	base: +base,
	evolved: +evolved,
	method,
	cond,
}));
const bases = new Set(evolutions.map((e) => e.base));
const finals = new Set(evolutions.map((e) => e.evolved).filter((id) => !bases.has(id)));
const ceiling = {}; // the level at which a species evolves by levelling up
for (const { base, method, cond } of evolutions) {
	const level = method === "trade" ? TRADE_LEVEL : method === "level-up" ? Number(cond.replace("Level ", "")) : null;
	if (level) ceiling[base] = Math.min(ceiling[base] ?? Infinity, level);
}
const eligible = Array.from({ length: 151 }, (_, i) => i + 1).filter((id) => !BANNED.has(id) && !finals.has(id));
const slots = Object.entries(tables).flatMap(([name, t]) => t.slots.map((s) => ({ name, table: t, ...s })));

describe("wild tables", () => {
	it("every table's weights sum to 100 with no species twice", () => {
		for (const [name, t] of Object.entries(tables)) {
			assert.equal(t.slots.reduce((sum, s) => sum + s.weight, 0), 100, name);
			assert.equal(new Set(t.slots.map((s) => s.id)).size, t.slots.length, `${name} repeats a species`);
		}
	});

	it("has no legendary, starter line or final stage", () => {
		for (const { name, id } of slots) {
			assert.ok(!BANNED.has(id), `${name}: #${id} is banned`);
			assert.ok(!finals.has(id), `${name}: #${id} is a final stage`);
		}
	});

	it("keeps every wild level inside its table and below the species' level evolution", () => {
		for (const { name, id, table, levels = table.levels } of slots) {
			const [lo, hi] = levels;
			assert.ok(lo <= hi && lo >= table.levels[0] && hi <= table.levels[1], `${name}: #${id} levels ${levels}`);
			if (ceiling[id]) assert.ok(hi < ceiling[id], `${name}: #${id} Lv ${hi} reaches its evolution at ${ceiling[id]}`);
		}
	});

	it("places all 84 eligible species", () => {
		assert.equal(eligible.length, 84);
		const placed = new Set(slots.map((s) => s.id));
		assert.deepEqual(eligible.filter((id) => !placed.has(id)), []);
	});

	describe("against the overworld maps", () => {
		const mapsDir = path.join(ROOT, "frontend", "public", "maps");
		const used = new Map(); // table -> first map naming it
		for (const file of fs.readdirSync(mapsDir).filter((f) => f.endsWith(".json"))) {
			const map = JSON.parse(fs.readFileSync(path.join(mapsDir, file), "utf8"));
			for (const layer of map.layers || []) {
				if (layer.name !== "encounters") continue;
				for (const o of layer.objects) {
					const table = (o.properties || []).find((p) => p.name === "table")?.value;
					if (table && !used.has(table)) used.set(table, file);
				}
			}
		}

		it("every encounter zone names a table that exists", () => {
			for (const [table, file] of used) {
				if (table.startsWith("test_")) continue; // the engine's fixture maps (test_route, test_town, test_house)
				assert.ok(tables[table], `${file} names unknown table ${table}`);
			}
		});

		it("every table is used by some map", () => {
			assert.deepEqual(Object.keys(tables).filter((t) => !used.has(t)), []);
		});
	});
});
