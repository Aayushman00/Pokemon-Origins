const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createBattleAi, effectiveness } = require("./battleAi");

const CHART = {
	"water>fire": 2,
	"fire>water": 0.5,
	"normal>ghost": 0,
	"electric>ground": 0,
};

function move(overrides = {}) {
	return {
		move_id: 33,
		name: "Tackle",
		power: 40,
		accuracy: 1,
		move_type: "Normal",
		current_pp: 10,
		max_pp: 10,
		...overrides,
	};
}

function mon(overrides = {}) {
	return {
		nickname: "Testmon",
		types: ["Normal"],
		max_hp: 40,
		current_hp: 40,
		status: null,
		moves: [],
		...overrides,
	};
}

describe("battleAi.effectiveness", () => {
	it("multiplies across defender types with neutral fallback", () => {
		assert.equal(effectiveness(CHART, "Water", ["Fire"]), 2);
		assert.equal(effectiveness(CHART, "Normal", ["Ghost"]), 0);
		assert.equal(effectiveness(CHART, "Ice", ["Dragon"]), 1); // unknown
		assert.equal(effectiveness({}, "Water", ["Fire"]), 1); // neutral chart
	});
});

describe("battleAi.pickMove", () => {
	it("prefers the strongest power x effectiveness x STAB move", async () => {
		const ai = createBattleAi({ chart: CHART, random: () => 0.99 });
		const attacker = mon({
			types: ["Water"],
			moves: [
				move({ move_id: 1, name: "Tackle", power: 40 }),
				move({ move_id: 2, name: "Water-gun", power: 40, move_type: "Water" }),
			],
		});
		// Water-gun: 40 x 2 (vs Fire) x 1.5 (STAB) = 120 vs Tackle 40.
		const pick = await ai.pickMove(attacker, mon({ types: ["Fire"] }));
		assert.equal(pick.move_id, 2);
	});

	it("never throws a move the defender is immune to", async () => {
		const ai = createBattleAi({ chart: CHART, random: () => 0.99 });
		const attacker = mon({
			moves: [
				move({ move_id: 1, name: "Tackle", power: 60 }),
				move({ move_id: 2, name: "Water-gun", power: 20, move_type: "Water" }),
			],
		});
		// Tackle is 0x vs Ghost despite the higher power.
		const pick = await ai.pickMove(attacker, mon({ types: ["Ghost"] }));
		assert.equal(pick.move_id, 2);
	});

	it("skips moves that are out of PP and Struggles when all are", async () => {
		const ai = createBattleAi({ chart: CHART, random: () => 0.99 });
		const attacker = mon({
			moves: [
				move({ move_id: 1, power: 90, current_pp: 0 }),
				move({ move_id: 2, name: "Scratch", power: 40, current_pp: 3 }),
			],
		});
		const pick = await ai.pickMove(attacker, mon());
		assert.equal(pick.move_id, 2);

		const emptied = mon({
			moves: [
				move({ move_id: 1, current_pp: 0 }),
				move({ move_id: 2, current_pp: 0 }),
			],
		});
		assert.equal(await ai.pickMove(emptied, mon()), null);
	});

	it("sometimes opens with a status move against a healthy target", async () => {
		const attacker = mon({
			moves: [
				move({ move_id: 1, name: "Tackle", power: 40 }),
				move({ move_id: 2, name: "Growl", power: 0 }),
			],
		});
		// random 0 -> status branch (0 < 0.3), then index 0 of status moves.
		const statusAi = createBattleAi({ chart: CHART, random: () => 0 });
		const pick = await statusAi.pickMove(attacker, mon());
		assert.equal(pick.move_id, 2);

		// random 0.9 -> skip the status branch and hit hard instead.
		const damageAi = createBattleAi({ chart: CHART, random: () => 0.9 });
		assert.equal((await damageAi.pickMove(attacker, mon())).move_id, 1);

		// A statused (or weakened) target never gets the status opener.
		const statused = mon({ status: "brn" });
		assert.equal((await statusAi.pickMove(attacker, statused)).move_id, 1);
	});

	it("falls back to a neutral chart when the DB load fails", async () => {
		const ai = createBattleAi({
			loadChart: async () => {
				throw new Error("db down");
			},
			random: () => 0.99,
		});
		const attacker = mon({
			moves: [
				move({ move_id: 1, name: "Tackle", power: 40 }),
				move({ move_id: 2, name: "Mega-punch", power: 80 }),
			],
		});
		const pick = await ai.pickMove(attacker, mon({ types: ["Fire"] }));
		assert.equal(pick.move_id, 2); // pure power under a neutral chart
	});
});
