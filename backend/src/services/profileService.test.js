const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { summarizeCampaign, summarizeRecord, summarizeStreak, validateCard } = require("./profileService");

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

describe("summarizeStreak", () => {
	it("counts the run of the newest result", () => {
		assert.deepEqual(summarizeStreak(["Win", "Win", "Loss", "Win"]), { type: "Win", count: 2 });
		assert.deepEqual(summarizeStreak(["Loss"]), { type: "Loss", count: 1 });
	});

	it("has no streak before the first battle", () => {
		assert.equal(summarizeStreak([]), null);
	});
});

describe("validateCard", () => {
	const owned = new Set([5, 6]);
	it("accepts a known theme, a short motto and an owned favourite", () => {
		assert.equal(validateCard({ theme: "ember", motto: "Fire first!", favoriteId: 6 }, owned), null);
		assert.equal(validateCard({ theme: "sky", motto: "", favoriteId: null }, owned), null);
	});

	it("rejects unknown themes, long mottos and Pokémon the trainer doesn't own", () => {
		assert.match(validateCard({ theme: "neon" }, owned), /theme/);
		assert.match(validateCard({ theme: "sky", motto: "x".repeat(41) }, owned), /40/);
		assert.match(validateCard({ theme: "sky", favoriteId: 99 }, owned), /your Pokémon/);
	});
});
