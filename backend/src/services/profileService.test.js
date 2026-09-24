const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { summarizeCampaign, summarizeRecord } = require("./profileService");

const fiveEach = () => 5;

describe("summarizeCampaign", () => {
	it("counts earlier levels plus battles before the current one", () => {
		const c = summarizeCampaign({ current_level: 3, current_battle: 2, unlocked_level: 3 }, fiveEach);
		assert.equal(c.battles_cleared, 11);
		assert.equal(c.total_battles, 50);
		assert.equal(c.champion, false);
	});

	it("treats missing progress as a fresh trainer", () => {
		const c = summarizeCampaign(undefined, fiveEach);
		assert.equal(c.current_level, 1);
		assert.equal(c.battles_cleared, 0);
	});

	it("marks a finished campaign as champion with everything cleared", () => {
		const c = summarizeCampaign({ current_level: 11, current_battle: 1 }, fiveEach);
		assert.equal(c.battles_cleared, 50);
		assert.equal(c.champion, true);
	});
});

describe("summarizeRecord", () => {
	it("derives battles and a one-decimal win rate", () => {
		assert.deepEqual(summarizeRecord({ wins: "2", losses: "1" }), {
			wins: 2,
			losses: 1,
			battles: 3,
			win_rate: 66.7,
		});
	});

	it("has no win rate before the first battle", () => {
		assert.equal(summarizeRecord({ wins: null, losses: null }).win_rate, null);
	});
});
