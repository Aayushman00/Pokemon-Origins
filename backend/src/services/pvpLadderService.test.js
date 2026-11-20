const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createPvpLadderService, createMemoryLadderStore } = require("./pvpLadderService");

const NOON = Date.UTC(2026, 10, 20, 12);
const NEXT_DAY = Date.UTC(2026, 10, 21, 0, 30);
const NAMES = { 1: "Ash", 2: "Gary", 3: "Misty" };

function setup({ ratings, now = NOON } = {}) {
	let clock = now;
	const store = createMemoryLadderStore({ ratings, names: NAMES });
	const ladder = createPvpLadderService({ store, now: () => clock });
	const win = (aId, bId, winnerId = aId) => ladder.recordResult({ aId, bId, winnerId, endedBy: "ko" });
	return { ladder, store, win, setClock: (ms) => (clock = ms) };
}

describe("pvp ladder", () => {
	it("new players start at 1000 and swap 16 on an even win", async () => {
		const { win } = setup();
		const r = await win(1, 2);
		assert.deepEqual([r.a.rating, r.a.delta, r.b.rating, r.b.delta, r.rated], [1016, 16, 984, -16, true]);
	});

	it("B winning moves points the other way", async () => {
		const { win } = setup();
		const r = await win(1, 2, 2);
		assert.deepEqual([r.a.rating, r.b.rating], [984, 1016]);
	});

	it("upset pays far more than beating a weak alt", async () => {
		const upset = await setup({ ratings: { 1: 1000, 2: 1400 } }).win(1, 2);
		const farm = await setup({ ratings: { 1: 1400, 2: 1000 } }).win(1, 2);
		assert.ok(upset.a.delta >= 29, `upset ${upset.a.delta}`);
		assert.ok(farm.a.delta <= 3, `farm ${farm.a.delta}`);
	});

	it("4th game of the pair today is unrated in either order", async () => {
		const { win } = setup();
		await win(1, 2);
		await win(2, 1);
		await win(1, 2);
		const r = await win(2, 1);
		assert.equal(r.rated, false);
		assert.equal(r.a.delta, 0);
		assert.equal(r.b.delta, 0);
	});

	it("unrated wins still count W/L but not on the today board", async () => {
		const { ladder, win, store } = setup();
		for (let i = 0; i < 5; i++) await win(1, 2);
		const [ash] = await store.getRatings([1]);
		assert.equal(ash.wins, 5);
		const today = await ladder.leaderboard("today");
		assert.deepEqual(today.map((r) => [r.name, r.wins]), [["Ash", 3]]);
	});

	it("next UTC day resets the pair cap", async () => {
		const { win, setClock } = setup();
		for (let i = 0; i < 3; i++) await win(1, 2);
		setClock(NEXT_DAY);
		assert.equal((await win(1, 2)).rated, true);
	});

	it("today board orders by rated wins; rating board by rating with ≥1 game", async () => {
		const { ladder, win } = setup();
		await win(1, 2);
		await win(3, 2);
		await win(3, 1);
		const today = await ladder.leaderboard("today");
		assert.deepEqual(today.map((r) => [r.rank, r.name, r.wins]), [[1, "Misty", 2], [2, "Ash", 1]]);
		const rating = await ladder.leaderboard("rating");
		assert.deepEqual(rating.map((r) => r.name), ["Misty", "Ash", "Gary"]);
		assert.ok(rating[0].rating > rating[1].rating);
	});

	it("rejects an unknown board", async () => {
		const { ladder } = setup();
		await assert.rejects(ladder.leaderboard("weekly"), /Unknown board/);
	});
});
