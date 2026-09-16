const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	clampStage,
	freshStages,
	stageMultiplier,
	effectiveSpeed,
	normalizeStatus,
	chipDamage,
	rollSleepTurns,
	statusGate,
	movePriority,
	statChangeLine,
} = require("./battleStatus");

describe("battleStatus stage math", () => {
	it("clamps stages to -6..+6", () => {
		assert.equal(clampStage(9), 6);
		assert.equal(clampStage(-9), -6);
		assert.equal(clampStage(0), 0);
		assert.equal(clampStage(null), 0);
		assert.equal(clampStage("2"), 2);
	});

	it("uses Gen 3 multipliers: (2+s)/2 up, 2/(2-s) down", () => {
		assert.equal(stageMultiplier(0), 1);
		assert.equal(stageMultiplier(2), 2);
		assert.equal(stageMultiplier(6), 4);
		assert.equal(stageMultiplier(-2), 0.5);
		assert.equal(stageMultiplier(-6), 0.25);
	});

	it("freshStages starts every stat at 0", () => {
		assert.deepEqual(freshStages(), {
			atk: 0,
			def: 0,
			spa: 0,
			spd: 0,
			spe: 0,
			acc: 0,
			eva: 0,
		});
	});

	it("effective speed applies the spe stage and paralysis quarter", () => {
		const mon = { speed: 100, stages: freshStages(), status: null };
		assert.equal(effectiveSpeed(mon), 100);
		assert.equal(effectiveSpeed({ ...mon, stages: { spe: 2 } }), 200);
		assert.equal(effectiveSpeed({ ...mon, status: "par" }), 25);
		assert.equal(
			effectiveSpeed({ ...mon, stages: { spe: 2 }, status: "par" }),
			50
		);
		// Never drops below 1.
		assert.equal(
			effectiveSpeed({ speed: 1, stages: { spe: -6 }, status: "par" }),
			1
		);
	});
});

describe("battleStatus status helpers", () => {
	it("normalizes status codes and rejects everything else", () => {
		assert.equal(normalizeStatus("BRN"), "brn");
		assert.equal(normalizeStatus("par"), "par");
		assert.equal(normalizeStatus("Healthy"), null);
		assert.equal(normalizeStatus(null), null);
	});

	it("burn and poison chip 1/8 max HP (minimum 1)", () => {
		assert.equal(chipDamage({ status: "brn", max_hp: 40 }), 5);
		assert.equal(chipDamage({ status: "psn", max_hp: 40 }), 5);
		assert.equal(chipDamage({ status: "psn", max_hp: 7 }), 1);
		assert.equal(chipDamage({ status: "par", max_hp: 40 }), 0);
		assert.equal(chipDamage({ status: null, max_hp: 40 }), 0);
	});

	it("rolls 1-4 sleep turns", () => {
		assert.equal(rollSleepTurns(() => 0), 1);
		assert.equal(rollSleepTurns(() => 0.99), 4);
	});

	it("sleep gate blocks while turns remain and wakes at 0", () => {
		const asleep = { status: "slp", statusTurns: 2 };
		assert.deepEqual(statusGate(asleep, () => 0.9), {
			act: false,
			blocked: "slp",
			nextTurns: 1,
		});
		assert.deepEqual(
			statusGate({ status: "slp", statusTurns: 0 }, () => 0.9),
			{ act: true, cured: "slp" }
		);
	});

	it("freeze gate thaws 20% of the time", () => {
		const frozen = { status: "frz", statusTurns: 0 };
		assert.deepEqual(statusGate(frozen, () => 0.1), {
			act: true,
			cured: "frz",
		});
		assert.deepEqual(statusGate(frozen, () => 0.5), {
			act: false,
			blocked: "frz",
		});
	});

	it("paralysis gate blocks 25% of the time", () => {
		const para = { status: "par", statusTurns: 0 };
		assert.deepEqual(statusGate(para, () => 0.1), {
			act: false,
			blocked: "par",
		});
		assert.deepEqual(statusGate(para, () => 0.5), { act: true });
	});

	it("healthy and chip statuses act normally", () => {
		assert.deepEqual(statusGate({ status: null }, () => 0), { act: true });
		assert.deepEqual(statusGate({ status: "brn" }, () => 0), { act: true });
		assert.deepEqual(statusGate({ status: "psn" }, () => 0), { act: true });
	});
});

describe("battleStatus move meta", () => {
	it("reads Gen 3 priorities from move_meta.json (unlisted -> 0)", () => {
		assert.equal(movePriority("Quick-attack"), 1);
		assert.equal(movePriority("Extreme-speed"), 2);
		assert.equal(movePriority("Roar"), -6);
		assert.equal(movePriority("Tackle"), 0);
		assert.equal(movePriority("Struggle"), 0);
	});
});

describe("battleStatus log lines", () => {
	it("stat change lines cover rise, sharp fall, and the clamp", () => {
		assert.equal(
			statChangeLine("Charmander", "atk", 1, false),
			"Charmander's ATTACK rose!"
		);
		assert.equal(
			statChangeLine("Charmander", "def", -2, false),
			"Charmander's DEFENSE fell sharply!"
		);
		assert.equal(
			statChangeLine("Charmander", "atk", 1, true),
			"Charmander's ATTACK won't go any higher!"
		);
		assert.equal(
			statChangeLine("Charmander", "acc", -1, true),
			"Charmander's accuracy won't go any lower!"
		);
	});
});
