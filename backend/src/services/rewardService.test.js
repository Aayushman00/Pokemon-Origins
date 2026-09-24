const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	createRewardService,
	createMemoryRewardStore,
	RewardError,
} = require("./rewardService");
const {
	createPartyService,
	createMemoryPartyStore,
} = require("./partyService");

function starterMon(overrides = {}) {
	return {
		pokemon_id: 4,
		nickname: "Charmander",
		level: 5,
		current_hp: 39,
		max_hp: 39,
		attack: 12,
		defense: 11,
		speed: 13,
		special_atk: 12,
		special_def: 11,
		experience: 0,
		status: "Healthy",
		...overrides,
	};
}

function seededRandom(seed = 42) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) % 4294967296;
		return s / 4294967296;
	};
}

const POOL = {
	level: 1,
	source: "gym_boss",
	optionCount: 3,
	pool: [
		{ pokemonId: 25, level: 10 },
		{ pokemonId: 133, level: 10 },
		{ pokemonId: 66, level: 11 },
		{ pokemonId: 74, level: 11 },
		{ pokemonId: 37, level: 10 },
	],
};

function makeFixture() {
	const partyStore = createMemoryPartyStore();
	const party = createPartyService({ store: partyStore });
	const store = createMemoryRewardStore();
	const rewards = createRewardService({
		store,
		party,
		loadPool: (level) => (level === 1 ? POOL : null),
		hydrateOption: async ({ pokemonId, level }) => ({
			pokemon_id: pokemonId,
			nickname: `Mon${pokemonId}`,
			level,
			max_hp: 30 + level,
			current_hp: 30 + level,
			attack: 10 + level,
			defense: 10,
			speed: 12,
			special_atk: 11,
			special_def: 9,
			types: ["Normal"],
			moves: [
				{ move_id: 33, pp: 0 },
				{ move_id: 45, pp: 0 },
			],
		}),
		random: seededRandom(),
	});

	async function seedParty(trainerId, count) {
		for (let i = 0; i < count; i++) {
			await party.addPokemon(
				trainerId,
				starterMon({
					pokemon_id: i + 1,
					nickname: `Member${i + 1}`,
				}),
				[{ move_id: 33, pp: 0 }]
			);
		}
	}

	async function bossOffer(trainerId) {
		return rewards.createOfferForWin({
			trainerId,
			level: 1,
			battleNumber: 5,
			sessionId: "session-1",
			battleType: "gym_boss",
		});
	}

	return { rewards, party, store, seedParty, bossOffer };
}

describe("rewardService", () => {
	it("creates exactly 3 distinct server-authored options for a boss win", async () => {
		const { rewards, bossOffer } = makeFixture();
		const offer = await bossOffer(1);

		assert.ok(offer.offerId);
		assert.equal(offer.level, 1);
		assert.equal(offer.battleNumber, 5);
		assert.equal(offer.source, "gym_boss");
		assert.equal(offer.options.length, 3);

		const ids = offer.options.map((o) => o.pokemon_id);
		assert.equal(new Set(ids).size, 3);
		for (const option of offer.options) {
			assert.ok(option.optionId);
			assert.ok(option.level >= 10);
			assert.ok(option.max_hp > 0);
			assert.deepEqual(option.types, ["Normal"]);
			// Snapshot internals (moves) stay server-side
			assert.equal(option.moves, undefined);
		}

		const pending = await rewards.getPendingOffer(1);
		assert.equal(pending.offerId, offer.offerId);
	});

	it("returns null for non-boss battles and levels without a pool", async () => {
		const { rewards } = makeFixture();
		assert.equal(
			await rewards.createOfferForWin({
				trainerId: 1,
				level: 1,
				battleNumber: 2,
				sessionId: "s",
				battleType: "trainer",
			}),
			null
		);
		assert.equal(
			await rewards.createOfferForWin({
				trainerId: 1,
				level: 2,
				battleNumber: 5,
				sessionId: "s",
				battleType: "gym_boss",
			}),
			null
		);
		assert.equal(await rewards.getPendingOffer(1), null);
	});

	it("re-creating the same boss offer returns the existing one; claimed offers stay gone", async () => {
		const { rewards, seedParty, bossOffer } = makeFixture();
		await seedParty(1, 1);

		const first = await bossOffer(1);
		const again = await bossOffer(1);
		assert.equal(again.offerId, first.offerId);

		await rewards.claimOffer(1, {
			offerId: first.offerId,
			optionId: first.options[0].optionId,
		});
		assert.equal(await bossOffer(1), null);
		assert.equal(await rewards.getPendingOffer(1), null);
	});

	it("claim adds the chosen Pokémon when the party has space", async () => {
		const { rewards, party, seedParty, bossOffer } = makeFixture();
		await seedParty(7, 1);
		const offer = await bossOffer(7);
		const chosen = offer.options[1];

		const result = await rewards.claimOffer(7, {
			offerId: offer.offerId,
			optionId: chosen.optionId,
		});
		assert.equal(result.pokemon.pokemon_id, chosen.pokemon_id);
		assert.equal(result.position, 2); // lowest free position
		assert.equal(result.party.length, 2);
		assert.deepEqual(
			result.party.map((m) => m.position),
			[1, 2]
		);

		const rows = await party.getPartyRows(7);
		const added = rows.find((r) => r.position === 2);
		assert.equal(added.pokemon_id, chosen.pokemon_id);
		assert.equal(added.level, chosen.level);
		assert.equal(added.moves.length, 2); // snapshot moves persisted
	});

	it("claim with a full party requires a replacement target", async () => {
		const { rewards, seedParty, bossOffer } = makeFixture();
		await seedParty(8, 3);
		const offer = await bossOffer(8);

		await assert.rejects(
			() =>
				rewards.claimOffer(8, {
					offerId: offer.offerId,
					optionId: offer.options[0].optionId,
				}),
			(err) =>
				err instanceof RewardError &&
				err.status === 400 &&
				/Party is full/.test(err.message)
		);
		// Not consumed by the failed attempt
		assert.ok(await rewards.getPendingOffer(8));
	});

	it("claim with a full party replaces the chosen member at its position", async () => {
		const { rewards, party, seedParty, bossOffer } = makeFixture();
		await seedParty(9, 3);
		const offer = await bossOffer(9);
		const chosen = offer.options[0];

		const result = await rewards.claimOffer(9, {
			offerId: offer.offerId,
			optionId: chosen.optionId,
			replacePartyPosition: 2,
		});
		assert.equal(result.position, 2); // freed slot is reused
		assert.equal(result.party.length, 3);

		const rows = await party.getPartyRows(9);
		const atTwo = rows.find((r) => r.position === 2);
		assert.equal(atTwo.pokemon_id, chosen.pokemon_id);
		assert.equal(
			rows.some((r) => r.nickname === "Member2"),
			false
		);		// Replaced, not released: Member2 now waits in the PC.
		const pc = await party.getPcRows(9);
		assert.deepEqual(pc.map((r) => r.nickname), ["Member2"]);
	});

	it("a claim is one-time", async () => {
		const { rewards, seedParty, bossOffer } = makeFixture();
		await seedParty(10, 1);
		const offer = await bossOffer(10);

		await rewards.claimOffer(10, {
			offerId: offer.offerId,
			optionId: offer.options[0].optionId,
		});
		await assert.rejects(
			() =>
				rewards.claimOffer(10, {
					offerId: offer.offerId,
					optionId: offer.options[1].optionId,
				}),
			(err) => err.status === 409 && /already claimed/i.test(err.message)
		);
	});

	it("cannot claim another trainer's offer or an unknown offer", async () => {
		const { rewards, seedParty, bossOffer } = makeFixture();
		await seedParty(11, 1);
		const offer = await bossOffer(11);

		await assert.rejects(
			() =>
				rewards.claimOffer(999, {
					offerId: offer.offerId,
					optionId: offer.options[0].optionId,
				}),
			(err) => err.status === 404
		);
		await assert.rejects(
			() =>
				rewards.claimOffer(11, {
					offerId: 424242,
					optionId: offer.options[0].optionId,
				}),
			(err) => err.status === 404
		);
		// Untouched by the failed attempts
		assert.ok(await rewards.getPendingOffer(11));
	});

	it("cannot claim an option that is not part of the offer", async () => {
		const { rewards, seedParty, bossOffer } = makeFixture();
		await seedParty(12, 1);
		const offer = await bossOffer(12);

		await assert.rejects(
			() =>
				rewards.claimOffer(12, {
					offerId: offer.offerId,
					optionId: 999999,
				}),
			(err) =>
				err.status === 400 && /Invalid reward option/.test(err.message)
		);
		assert.ok(await rewards.getPendingOffer(12));
	});

	it("reopens the offer when the party write fails after the claim mark", async () => {
		const partyStore = createMemoryPartyStore();
		const party = createPartyService({ store: partyStore });
		const failingParty = {
			MAX_PARTY: 3,
			getPartyRows: party.getPartyRows,
			removeByPosition: party.removeByPosition,
			addPokemon: async () => {
				throw new Error("insert exploded");
			},
		};
		const store = createMemoryRewardStore();
		const rewards = createRewardService({
			store,
			party: failingParty,
			loadPool: () => POOL,
			hydrateOption: async ({ pokemonId, level }) => ({
				pokemon_id: pokemonId,
				nickname: `Mon${pokemonId}`,
				level,
				max_hp: 40,
				current_hp: 40,
				attack: 10,
				defense: 10,
				speed: 10,
				special_atk: 10,
				special_def: 10,
				types: ["Normal"],
				moves: [{ move_id: 33, pp: 0 }],
			}),
			random: seededRandom(),
		});
		const offer = await rewards.createOfferForWin({
			trainerId: 13,
			level: 1,
			battleNumber: 5,
			sessionId: "s",
			battleType: "gym_boss",
		});

		await assert.rejects(
			() =>
				rewards.claimOffer(13, {
					offerId: offer.offerId,
					optionId: offer.options[0].optionId,
				}),
			/insert exploded/
		);
		// Claim was handed back, so the trainer can retry
		assert.ok(await rewards.getPendingOffer(13));
	});
});
