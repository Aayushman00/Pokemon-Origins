const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	xpNeededForLevel,
	xpGainForWin,
	applyExperience,
	createXpService,
	createMemoryXpStore,
	MAX_LEVEL,
} = require("./xpService");

function row(overrides = {}) {
	return {
		id: 101,
		trainer_id: 1,
		pokemon_id: 4,
		nickname: "Charmander",
		level: 5,
		experience: 0,
		current_hp: 40,
		max_hp: 40,
		attack: 20,
		defense: 15,
		speed: 60,
		special_atk: 18,
		special_def: 14,
		...overrides,
	};
}

describe("xpService", () => {
	it("uses the linear curve: threshold from level L is 12·L", () => {
		assert.equal(xpNeededForLevel(5), 60);
		assert.equal(xpNeededForLevel(8), 96);
	});

	it("win XP is enemy level × 6", () => {
		assert.equal(xpGainForWin({ level: 5 }), 30);
		assert.equal(xpGainForWin({ level: 4 }), 24);
		assert.equal(xpGainForWin({}), 6); // defaults to level 1
	});

	it("applyExperience buffers XP below the threshold", () => {
		const result = applyExperience({ level: 5, experience: 30 }, 20);
		assert.deepEqual(result, { level: 5, experience: 50, levelsGained: 0 });
	});

	it("applyExperience levels up and carries the remainder", () => {
		const result = applyExperience({ level: 5, experience: 50 }, 20);
		// 70 >= 60 -> level 6, buffer 10
		assert.deepEqual(result, { level: 6, experience: 10, levelsGained: 1 });
	});

	it("applyExperience can cross multiple levels", () => {
		// From level 1: thresholds 12, 24, 36 -> 80 XP reaches level 4 with 8 left
		const result = applyExperience({ level: 1, experience: 0 }, 80);
		assert.deepEqual(result, { level: 4, experience: 8, levelsGained: 3 });
	});

	it("applyExperience caps at MAX_LEVEL and keeps the buffer", () => {
		const result = applyExperience({ level: MAX_LEVEL, experience: 0 }, 999);
		assert.equal(result.level, MAX_LEVEL);
		assert.equal(result.levelsGained, 0);
		assert.equal(result.experience, 999);
	});

	it("awardWinXp persists XP without a level-up", async () => {
		const store = createMemoryXpStore([row()]);
		const service = createXpService({ store });
		const award = await service.awardWinXp({
			trainerId: 1,
			pokemonRowId: 101,
			enemy: { level: 4 },
		});
		assert.equal(award.gained, 24);
		assert.equal(award.levelsGained, 0);
		assert.equal(award.after.level, 5);
		assert.equal(award.after.experience, 24);

		const saved = await store.getMon(1, 101);
		assert.equal(saved.level, 5);
		assert.equal(saved.experience, 24);
		assert.equal(saved.max_hp, 40); // no stat change without level-up
		assert.equal(saved.attack, 20);
	});

	it("awardWinXp levels up, applies increments, and persists", async () => {
		const store = createMemoryXpStore([row({ experience: 36 })]);
		const service = createXpService({ store });
		const award = await service.awardWinXp({
			trainerId: 1,
			pokemonRowId: 101,
			enemy: { level: 4 },
		});
		// 36 + 24 = 60 >= 60 -> level 6, buffer 0
		assert.equal(award.levelsGained, 1);
		assert.equal(award.before.level, 5);
		assert.equal(award.after.level, 6);
		assert.equal(award.after.experience, 0);
		assert.equal(award.xpToNext, 72);
		assert.deepEqual(award.statIncreases, {
			max_hp: 5,
			attack: 2,
			defense: 2,
			speed: 1,
			special_atk: 2,
			special_def: 2,
		});

		const saved = await store.getMon(1, 101);
		assert.equal(saved.level, 6);
		assert.equal(saved.experience, 0);
		assert.equal(saved.max_hp, 45);
		assert.equal(saved.current_hp, 45); // grew by the max_hp delta
		assert.equal(saved.attack, 22);
		assert.equal(saved.defense, 17);
		assert.equal(saved.speed, 61);
		assert.equal(saved.special_atk, 20);
		assert.equal(saved.special_def, 16);
	});

	it("current_hp grows by the delta and clamps to the new max", async () => {
		// Damaged mon: 10/40. One level-up -> 15/45 (no full heal).
		const store = createMemoryXpStore([
			row({ experience: 54, current_hp: 10 }),
		]);
		const service = createXpService({ store });
		await service.awardWinXp({
			trainerId: 1,
			pokemonRowId: 101,
			enemy: { level: 1 },
		});
		const saved = await store.getMon(1, 101);
		assert.equal(saved.level, 6);
		assert.equal(saved.max_hp, 45);
		assert.equal(saved.current_hp, 15);
	});

	it("returns null when the row does not exist or belongs to another trainer", async () => {
		const store = createMemoryXpStore([row()]);
		const service = createXpService({ store });
		assert.equal(
			await service.awardWinXp({
				trainerId: 1,
				pokemonRowId: 999,
				enemy: { level: 4 },
			}),
			null
		);
		assert.equal(
			await service.awardWinXp({
				trainerId: 2,
				pokemonRowId: 101,
				enemy: { level: 4 },
			}),
			null
		);
		assert.equal(
			await service.awardWinXp({
				trainerId: 1,
				pokemonRowId: null,
				enemy: { level: 4 },
			}),
			null
		);
	});
});
