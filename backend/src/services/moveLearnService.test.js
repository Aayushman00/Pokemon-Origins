const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	MAX_MOVES,
	MoveLearnError,
	createMoveLearnService,
	createMemoryLearnsetStore,
	createMemoryMoveStore,
} = require("./moveLearnService");

/**
 * Fixture species 4 learnset (level-up rows only — the service query
 * already excludes NULL level_learned rows):
 *   Lv 7  -> 52 Ember
 *   Lv 10 -> 43 Leer      (same-level tiebreak partner for 108)
 *   Lv 10 -> 108 Smokescreen
 *   Lv 13 -> 33 Tackle    (known-by-default in most tests)
 */
const MOVE_META = {
	10: { name: "Scratch", power: 40, accuracy: 100, pp: 35, move_type: "Normal" },
	33: { name: "Tackle", power: 40, accuracy: 100, pp: 35, move_type: "Normal" },
	43: { name: "Leer", power: null, accuracy: 100, pp: 30, move_type: "Normal" },
	45: { name: "Growl", power: null, accuracy: 100, pp: 40, move_type: "Normal" },
	52: { name: "Ember", power: 40, accuracy: 100, pp: 25, move_type: "Fire" },
	108: { name: "Smokescreen", power: null, accuracy: 100, pp: 20, move_type: "Normal" },
};

const LEARNSET = [
	{ pokemon_id: 4, move_id: 52, level_learned: 7 },
	{ pokemon_id: 4, move_id: 43, level_learned: 10 },
	{ pokemon_id: 4, move_id: 108, level_learned: 10 },
	{ pokemon_id: 4, move_id: 33, level_learned: 13 },
];

function makeService({
	movesByMon = { 101: [{ move_id: 10, current_pp: 35 }] },
	party = [
		{
			id: 101,
			position: 1,
			pokemon_id: 4,
			nickname: "Charmander",
			level: 10,
		},
	],
	learnset = LEARNSET,
} = {}) {
	const learnsetStore = createMemoryLearnsetStore({
		learnset,
		moves: MOVE_META,
	});
	const moveStore = createMemoryMoveStore({ movesByMon });
	const service = createMoveLearnService({
		learnsetStore,
		moveStore,
		party: { getPartyRows: async () => party },
	});
	return { service, moveStore };
}

const FOUR_MOVES = [
	{ move_id: 10, current_pp: 35 },
	{ move_id: 33, current_pp: 35 },
	{ move_id: 45, current_pp: 40 },
	{ move_id: 43, current_pp: 30 },
];

async function moveIds(moveStore, monId) {
	return (await moveStore.listMonMoves(monId)).map((row) => row.move_id);
}

describe("moveLearnService.processLevelUp", () => {
	it("auto-learns with free slots and sets current_pp from Move.pp", async () => {
		const { service, moveStore } = makeService();
		const result = await service.processLevelUp({
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 7,
		});
		assert.equal(result.learned.length, 1);
		assert.equal(result.pending.length, 0);
		assert.equal(result.learned[0].move_id, 52);
		assert.equal(result.learned[0].name, "Ember");
		assert.equal(result.learned[0].level_learned, 7);
		const rows = await moveStore.listMonMoves(101);
		assert.deepEqual(
			rows.find((r) => r.move_id === 52),
			{ move_id: 52, current_pp: 25 }
		);
		assert.equal(moveStore.pendingRows.length, 0);
	});

	it("creates a pending offer at 4 moves and leaves moves unchanged", async () => {
		const { service, moveStore } = makeService({
			movesByMon: { 101: FOUR_MOVES },
		});
		const result = await service.processLevelUp({
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 7,
		});
		assert.equal(result.learned.length, 0);
		assert.equal(result.pending.length, 1);
		assert.equal(result.pending[0].move_id, 52);
		assert.deepEqual(await moveIds(moveStore, 101), [10, 33, 45, 43]);
		assert.equal(moveStore.pendingRows.length, 1);
		assert.equal(moveStore.pendingRows[0].status, "pending");
		assert.equal(moveStore.pendingRows[0].learned_at_level, 7);
	});

	it("is idempotent: replaying the same level-up creates no duplicate offer", async () => {
		const { service, moveStore } = makeService({
			movesByMon: { 101: FOUR_MOVES },
		});
		const args = {
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 7,
		};
		await service.processLevelUp(args);
		const replay = await service.processLevelUp(args);
		assert.equal(replay.pending.length, 0);
		assert.equal(moveStore.pendingRows.length, 1);
	});

	it("skips learnset moves the mon already knows", async () => {
		const { service, moveStore } = makeService({
			movesByMon: { 101: [{ move_id: 52, current_pp: 25 }] },
		});
		const result = await service.processLevelUp({
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 7,
		});
		assert.equal(result.learned.length, 0);
		assert.equal(result.pending.length, 0);
		assert.deepEqual(await moveIds(moveStore, 101), [52]);
	});

	it("queues a multi-level jump in level order, then move_id order", async () => {
		const { service, moveStore } = makeService({
			movesByMon: { 101: FOUR_MOVES },
		});
		// 6 -> 13 crosses Lv7 (52), Lv10 (43 known, 108), Lv13 (33 known)
		const result = await service.processLevelUp({
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 13,
		});
		assert.equal(result.learned.length, 0);
		assert.deepEqual(
			result.pending.map((m) => m.move_id),
			[52, 108]
		);
		assert.deepEqual(
			moveStore.pendingRows.map((r) => [r.move_id, r.learned_at_level]),
			[
				[52, 7],
				[108, 10],
			]
		);
	});

	it("fills free slots first, then queues the rest of the jump", async () => {
		const { service, moveStore } = makeService({
			movesByMon: {
				101: [
					{ move_id: 10, current_pp: 35 },
					{ move_id: 45, current_pp: 40 },
					{ move_id: 33, current_pp: 35 },
				],
			},
		});
		// Lv7 Ember takes the 4th slot; Lv10 Leer + Smokescreen must queue.
		const result = await service.processLevelUp({
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 10,
		});
		assert.deepEqual(
			result.learned.map((m) => m.move_id),
			[52]
		);
		assert.deepEqual(
			result.pending.map((m) => m.move_id),
			[43, 108]
		);
		assert.equal((await moveStore.listMonMoves(101)).length, MAX_MOVES);
	});
});

describe("moveLearnService.getPendingLearns", () => {
	it("returns enriched offers with the mon and both movesets", async () => {
		const { service } = makeService({
			movesByMon: { 101: FOUR_MOVES },
		});
		await service.processLevelUp({
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 7,
		});
		const pending = await service.getPendingLearns(1);
		assert.equal(pending.length, 1);
		const offer = pending[0];
		assert.equal(offer.position, 1);
		assert.equal(offer.nickname, "Charmander");
		assert.equal(offer.level, 10);
		assert.equal(offer.learnedAtLevel, 7);
		assert.equal(offer.move.move_id, 52);
		assert.equal(offer.move.name, "Ember");
		assert.equal(offer.move.move_type, "Fire");
		assert.equal(offer.move.pp, 25);
		assert.equal(offer.currentMoves.length, 4);
		assert.deepEqual(
			offer.currentMoves.map((m) => m.move_id),
			[10, 33, 45, 43]
		);
		assert.equal(offer.currentMoves[0].name, "Scratch");
	});

	it("omits offers whose mon left the party", async () => {
		const { service } = makeService({
			movesByMon: { 101: FOUR_MOVES },
			party: [], // released via reward replacement
		});
		await service.processLevelUp({
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 7,
		});
		assert.deepEqual(await service.getPendingLearns(1), []);
	});
});

describe("moveLearnService.resolveLearn", () => {
	async function pendingOffer(overrides = {}) {
		const ctx = makeService({
			movesByMon: { 101: FOUR_MOVES },
			...overrides,
		});
		await ctx.service.processLevelUp({
			trainerId: 1,
			trainerPokemonId: 101,
			pokemonId: 4,
			fromLevel: 6,
			toLevel: 7,
		});
		const pendingId = ctx.moveStore.pendingRows[0].id;
		return { ...ctx, pendingId };
	}

	it("learn with forgetMoveId swaps exactly one move and archives it", async () => {
		const { service, moveStore, pendingId } = await pendingOffer();
		const result = await service.resolveLearn(1, {
			pendingId,
			action: "learn",
			forgetMoveId: 33,
		});
		assert.equal(result.action, "learn");
		assert.equal(result.learned.move_id, 52);
		assert.equal(result.forgot.move_id, 33);
		assert.equal(result.moves.length, MAX_MOVES);

		const ids = await moveIds(moveStore, 101);
		assert.equal(ids.length, MAX_MOVES);
		assert.ok(ids.includes(52), "new move learned");
		assert.ok(!ids.includes(33), "forgotten move removed");
		// current_pp of the new move comes from Move.pp
		const learnedRow = (await moveStore.listMonMoves(101)).find(
			(r) => r.move_id === 52
		);
		assert.equal(learnedRow.current_pp, 25);
		// forgotten_moves archive row
		assert.deepEqual(moveStore.forgotten, [
			{ trainer_pokemon_id: 101, move_id: 33 },
		]);
		assert.equal(moveStore.pendingRows[0].status, "resolved");
		assert.deepEqual(await service.getPendingLearns(1), []);
	});

	it("skip resolves the offer without touching moves", async () => {
		const { service, moveStore, pendingId } = await pendingOffer();
		const result = await service.resolveLearn(1, {
			pendingId,
			action: "skip",
		});
		assert.equal(result.action, "skip");
		assert.deepEqual(await moveIds(moveStore, 101), [10, 33, 45, 43]);
		assert.equal(moveStore.forgotten.length, 0);
		assert.equal(moveStore.pendingRows[0].status, "resolved");
		assert.deepEqual(await service.getPendingLearns(1), []);
	});

	it("learn at 4 moves without forgetMoveId is a 400 FORGET_REQUIRED", async () => {
		const { service, moveStore, pendingId } = await pendingOffer();
		await assert.rejects(
			() => service.resolveLearn(1, { pendingId, action: "learn" }),
			(err) => {
				assert.equal(err instanceof MoveLearnError, true);
				assert.equal(err.status, 400);
				assert.equal(err.code, "FORGET_REQUIRED");
				return true;
			}
		);
		assert.equal(moveStore.pendingRows[0].status, "pending");
		assert.deepEqual(await moveIds(moveStore, 101), [10, 33, 45, 43]);
	});

	it("cannot forget a move the mon does not know", async () => {
		const { service, moveStore, pendingId } = await pendingOffer();
		await assert.rejects(
			() =>
				service.resolveLearn(1, {
					pendingId,
					action: "learn",
					forgetMoveId: 108,
				}),
			(err) => err.status === 400 && /doesn't know/.test(err.message)
		);
		assert.deepEqual(await moveIds(moveStore, 101), [10, 33, 45, 43]);
		assert.equal(moveStore.forgotten.length, 0);
		assert.equal(moveStore.pendingRows[0].status, "pending");
	});

	it("rejects a foreign trainer's offer with 403", async () => {
		const { service, pendingId } = await pendingOffer();
		await assert.rejects(
			() =>
				service.resolveLearn(2, {
					pendingId,
					action: "learn",
					forgetMoveId: 33,
				}),
			(err) => err.status === 403
		);
	});

	it("rejects an unknown pendingId with 404", async () => {
		const { service } = await pendingOffer();
		await assert.rejects(
			() => service.resolveLearn(1, { pendingId: 999, action: "skip" }),
			(err) => err.status === 404
		);
	});

	it("rejects an already-resolved offer with 409", async () => {
		const { service, pendingId } = await pendingOffer();
		await service.resolveLearn(1, { pendingId, action: "skip" });
		await assert.rejects(
			() =>
				service.resolveLearn(1, {
					pendingId,
					action: "learn",
					forgetMoveId: 33,
				}),
			(err) => err.status === 409
		);
	});

	it("learns without a forget when the mon has a free slot at resolve time", async () => {
		// Offer was created at 4 moves, but a slot freed up before resolving
		// (e.g. an earlier queued offer forgot a move).
		const { service, moveStore } = makeService({
			movesByMon: {
				101: [
					{ move_id: 10, current_pp: 35 },
					{ move_id: 33, current_pp: 35 },
					{ move_id: 45, current_pp: 40 },
				],
			},
		});
		await moveStore.insertPending({
			trainerId: 1,
			trainerPokemonId: 101,
			moveId: 52,
			learnedAtLevel: 7,
		});
		const pendingId = moveStore.pendingRows[0].id;
		const result = await service.resolveLearn(1, {
			pendingId,
			action: "learn",
		});
		assert.equal(result.action, "learn");
		assert.equal(result.forgot, null);
		assert.deepEqual(await moveIds(moveStore, 101), [10, 33, 45, 52]);
		assert.equal(moveStore.forgotten.length, 0);
		assert.equal(moveStore.pendingRows[0].status, "resolved");
	});

	it("auto-resolves and rejects when the mon already knows the offered move", async () => {
		const { service, moveStore } = makeService({
			movesByMon: { 101: FOUR_MOVES },
		});
		await moveStore.insertPending({
			trainerId: 1,
			trainerPokemonId: 101,
			moveId: 33, // already known
			learnedAtLevel: 7,
		});
		const pendingId = moveStore.pendingRows[0].id;
		await assert.rejects(
			() =>
				service.resolveLearn(1, {
					pendingId,
					action: "learn",
					forgetMoveId: 10,
				}),
			(err) => err.status === 400 && /already knows/.test(err.message)
		);
		assert.equal(moveStore.pendingRows[0].status, "resolved");
		assert.deepEqual(await moveIds(moveStore, 101), [10, 33, 45, 43]);
	});

	it("auto-resolves and rejects when the mon left the party", async () => {
		const { service, moveStore } = makeService({
			movesByMon: { 101: FOUR_MOVES },
			party: [],
		});
		await moveStore.insertPending({
			trainerId: 1,
			trainerPokemonId: 101,
			moveId: 52,
			learnedAtLevel: 7,
		});
		const pendingId = moveStore.pendingRows[0].id;
		await assert.rejects(
			() =>
				service.resolveLearn(1, {
					pendingId,
					action: "learn",
					forgetMoveId: 33,
				}),
			(err) => err.status === 400 && /no longer in your party/.test(err.message)
		);
		assert.equal(moveStore.pendingRows[0].status, "resolved");
	});
});
