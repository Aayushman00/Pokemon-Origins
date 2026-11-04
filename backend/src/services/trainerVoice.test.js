const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const voices = require("../../data/trainers/voices.json");
const leaders = require("../../data/trainers/gym_leaders.json");
const elite = require("../../data/trainers/elite_four.json");
const champion = require("../../data/trainers/champion.json");
const regular = require("../../data/trainers/regular.json");
const { addVoice, introLine, overworldLines } = require("./trainerVoice");

const session = (over = {}) => ({
	voiceId: "willow_thornby",
	trainerName: "Willow Thornby",
	playerName: "Ash",
	status: "active",
	enemy: { current_hp: 40, max_hp: 40 },
	log: [],
	...over,
});
const texts = (events) => events.filter((e) => e.type === "trainer_line").map((e) => e.event);
const hit = (over = {}) => ({ actor: "player", type: "move", result: "hit", targetHpAfter: 30, targetFainted: false, ...over });

describe("trainer voice", () => {
	it("speaks when the first Pokémon falls, before the next is sent out", () => {
		const out = addVoice(session(), [hit({ targetFainted: true }), { type: "enemy_send", remaining: 2 }]);
		assert.deepEqual(out.map((e) => e.type), ["move", "trainer_line", "enemy_send"]);
		assert.equal(out[1].event, "first_faint");
	});

	it("calls the ace when one Pokémon is left", () => {
		const s = session({ voiced: ["first_faint"] });
		assert.deepEqual(texts(addVoice(s, [{ type: "enemy_send", remaining: 1 }])), ["ace"]);
	});

	it("reacts to a super effective hit from the player only, once", () => {
		const s = session();
		assert.deepEqual(texts(addVoice(s, [hit({ type_multiplier: 2 })])), ["super_effective"]);
		assert.deepEqual(texts(addVoice(s, [hit({ type_multiplier: 2 })])), []);
		assert.deepEqual(texts(addVoice(session(), [hit({ actor: "enemy", type_multiplier: 2 })])), []);
	});

	it("warns at low HP but not on a knockout", () => {
		assert.deepEqual(texts(addVoice(session(), [hit({ targetHpAfter: 9 })])), ["low_hp"]);
		assert.deepEqual(texts(addVoice(session(), [hit({ targetHpAfter: 0, targetFainted: true })])), []);
		assert.deepEqual(texts(addVoice(session(), [hit({ targetHpAfter: 10 })])), []);
	});

	it("has the last word: lose on a player win, win on a player loss", () => {
		assert.deepEqual(texts(addVoice(session({ status: "won" }), [])), ["lose"]);
		assert.deepEqual(texts(addVoice(session({ status: "lost" }), [])), ["win"]);
	});

	it("says nothing for wild battles", () => {
		const events = [hit({ type_multiplier: 2 })];
		assert.equal(addVoice(session({ voiceId: null }), events), events);
	});

	it("fills in the player's name", () => {
		assert.match(introLine("kestrel_vane", "Ash"), /Ash/);
		assert.doesNotMatch(introLine("kestrel_vane", "Ash"), /\{/);
	});

	it("keeps spoken lines in the battle log", () => {
		const s = session({ status: "won" });
		addVoice(s, []);
		assert.equal(s.log.length, 1);
	});
});

describe("voice data", () => {
	const named = { ...leaders, ...elite, ...champion };

	it("gives every leader and League member a line for all seven moments", () => {
		for (const id of Object.keys(named)) {
			for (const event of ["intro", "first_faint", "low_hp", "super_effective", "ace", "win", "lose"]) {
				assert.ok(voices[id]?.[event], `${id} ${event}`);
			}
		}
	});

	it("gives every road trainer an opener, a defeat line and a word after", () => {
		for (const id of Object.keys(regular)) {
			for (const event of ["intro", "lose", "after"]) assert.ok(voices[id]?.[event], `${id} ${event}`);
		}
	});

	it("gives every leader a greeting, a badge line and a word after", () => {
		for (const id of Object.keys(leaders)) {
			for (const event of ["greet", "badge", "after"]) assert.ok(voices[id]?.[event], `${id} ${event}`);
		}
	});

	it("fits every line in a text box", () => {
		for (const [id, v] of Object.entries(voices)) {
			for (const [event, text] of Object.entries(v)) assert.ok(text.length <= 110, `${id} ${event}: ${text.length}`);
		}
	});

	it("only speaks for trainers that exist", () => {
		for (const id of Object.keys(voices)) assert.ok(named[id] || regular[id], id);
	});

	it("exposes the overworld lines the map scripts use", () => {
		assert.deepEqual(Object.keys(overworldLines("willow_thornby")).sort(), ["after", "badge", "greet"]);
	});
});
