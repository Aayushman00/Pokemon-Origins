// The 15 extra road trainers (data/trainers/extra.json): optional fights off the campaign
// cursor, one per `later` slot in the approved route layouts, behind FLAG_EXTRA_TRAINERS.
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const loader = require("./loader");
const { hydrateParty } = require("./hydrate");

const ROOT = path.join(__dirname, "..", "..", "..");
const extras = JSON.parse(fs.readFileSync(path.join(loader.DATA_DIR, "trainers", "extra.json"), "utf8"));
const voices = require("../../data/trainers/voices.json");
const wild = require("../../data/encounters/wild.json");
const routes = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "overworld_art", "route_layouts.json"), "utf8"));
const lookup = async (id) => ({
	pokemon_id: id, name: `species${id}`, hp: 50, attack: 50, defense: 50, special_attack: 50, special_defense: 50, speed: 50,
	types: ["Normal"], learnset: [{ move_id: 33, move_name: "Tackle", power: 40, accuracy: 100, move_type: "Normal", level_learned: 1 }],
});

describe("extra road trainers", () => {
	it("fill every later slot of the route layouts exactly once", () => {
		const slots = routes.flatMap((r) => r.later.map((s) => [s.id, r.id]));
		assert.equal(slots.length, 15);
		assert.deepEqual(Object.fromEntries(slots), Object.fromEntries(Object.values(extras).map((t) => [t.id, t.route])));
	});

	it("load through the schema with their road's level, and stay out of the campaign catalogs", () => {
		const { trainers } = loader.loadAll();
		for (const id of Object.keys(extras)) {
			const t = loader.getExtraTrainer(id);
			assert.equal(t.minLevel, Number(t.route.split("_")[1]), id);
			assert.ok(!trainers[id], `${id} also in a campaign catalog`);
			assert.equal(loader.findTrainerBattle(id), null, `${id} is on the campaign cursor`);
		}
		assert.equal(loader.getExtraTrainer("youngster_joey"), null);
		assert.equal(loader.getExtraTrainer("__proto__"), null);
	});

	it("bring Gen 1 teams at or above their road's wild levels, and hydrate", async () => {
		for (const t of Object.values(extras)) {
			const [low] = wild[t.route].levels;
			for (const m of t.party) {
				assert.ok(Number.isInteger(m.pokemonId) && m.pokemonId >= 1 && m.pokemonId <= 151, `${t.id} species ${m.pokemonId}`);
				assert.ok(m.level >= low && m.level <= 60, `${t.id} Lv ${m.level} vs ${t.route} wild ${low}`);
			}
			const party = await hydrateParty(t.party, lookup);
			assert.ok(party.every((mon) => mon.max_hp > 0 && mon.moves.length), t.id);
		}
	});

	it("have voice lines and an overworld sheet", () => {
		for (const t of Object.values(extras)) {
			for (const line of ["intro", "lose", "after"]) assert.ok(voices[t.id]?.[line], `${t.id} needs a ${line} line`);
			assert.ok(fs.existsSync(path.join(ROOT, "frontend", "public", "sprites", "overworld", `${t.sprite}.png`)), `${t.id} sheet ${t.sprite}`);
		}
	});
});
