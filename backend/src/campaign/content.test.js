// Phase 10 content validation: the shipped campaign JSON (levels 1–10,
// trainer catalogs, legendary encounters, reward pools) must load, reference
// only existing IDs, and follow the campaign structure rules.
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const loader = require("./loader");
const campaignService = require("../services/campaignService");
const { loadRewardPool } = require("../services/rewardService");
const {
	createProgressService,
	createMemoryStore,
} = require("../services/progressService");

const MAX_LEVEL = 10;
const GYM_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
const MAX_POKEDEX_ID = 151;

/** Mock species so hydration math runs without the pokedex DB. */
async function fabricatedLookup(pokemonId) {
	return {
		pokemon_id: pokemonId,
		name: `species${pokemonId}`,
		hp: 50,
		attack: 50,
		defense: 50,
		special_attack: 50,
		special_defense: 50,
		speed: 50,
		types: ["Normal"],
		learnset: [
			{
				move_id: 33,
				move_name: "Tackle",
				power: 40,
				accuracy: 100,
				move_type: "Normal",
				level_learned: 1,
			},
		],
	};
}

function assertValidMon(ref, label) {
	assert.ok(
		Number.isInteger(ref.pokemonId) &&
			ref.pokemonId >= 1 &&
			ref.pokemonId <= MAX_POKEDEX_ID,
		`${label}: pokemonId ${ref.pokemonId} is a Gen 1 dex id`
	);
	assert.ok(
		Number.isInteger(ref.level) && ref.level >= 1 && ref.level <= 100,
		`${label}: level ${ref.level} in range`
	);
}

describe("campaign content (Phase 10)", () => {
	before(() => loader.resetCache());

	it("levels 1-10 load with contiguous battle numbers and resolvable references", () => {
		for (let level = 1; level <= MAX_LEVEL; level++) {
			// listBattles resolves every trainerId/encounterId through the
			// catalogs — unknown references throw here.
			const battles = loader.listBattles(level);
			assert.ok(battles.length >= 1, `level ${level} has battles`);
			assert.deepEqual(
				battles.map((b) => b.battleNumber),
				battles.map((_, index) => index + 1),
				`level ${level} battleNumbers run 1..N in order`
			);
			for (const battle of battles) {
				if (battle.type === "legendary") {
					assert.ok(
						battle.encounter,
						`level ${level} battle ${battle.battleNumber} resolves its encounter`
					);
					assertValidMon(
						battle.encounter,
						`level ${level} encounter ${battle.encounterId}`
					);
				} else {
					assert.ok(
						battle.trainer?.party?.length >= 1,
						`level ${level} battle ${battle.battleNumber} has a party`
					);
					for (const mon of battle.trainer.party) {
						assertValidMon(
							mon,
							`level ${level} trainer ${battle.trainerId}`
						);
					}
				}
			}
		}
	});

	it("levels 1-8 are road trainers capped by a gym_boss", () => {
		for (const level of GYM_LEVELS) {
			const battles = loader.listBattles(level);
			const boss = battles[battles.length - 1];
			assert.equal(
				boss.type,
				"gym_boss",
				`level ${level} ends with a gym_boss`
			);
			for (const battle of battles.slice(0, -1)) {
				assert.equal(
					battle.type,
					"trainer",
					`level ${level} battle ${battle.battleNumber} is a road trainer`
				);
			}
		}
	});

	it("level 9 is the Elite Four then the champion; level 10 is all legendary", () => {
		const nine = loader.listBattles(9);
		assert.deepEqual(
			nine.map((b) => b.type),
			[
				"elite_four",
				"elite_four",
				"elite_four",
				"elite_four",
				"champion",
			]
		);
		assert.deepEqual(
			nine.map((b) => b.trainerId),
			["lorelei", "bruno", "agatha", "lance", "blue"]
		);

		const ten = loader.listBattles(10);
		assert.ok(ten.every((b) => b.type === "legendary"));
		assert.deepEqual(
			ten.map((b) => b.encounterId),
			["articuno", "zapdos", "moltres", "mew", "mewtwo"]
		);
	});

	it("gym boss aces outlevel the previous gym across levels 1-8", () => {
		let previousAce = 0;
		for (const level of GYM_LEVELS) {
			const battles = loader.listBattles(level);
			const boss = battles[battles.length - 1];
			const ace = Math.max(...boss.trainer.party.map((m) => m.level));
			assert.ok(
				ace > previousAce,
				`level ${level} ace Lv${ace} > previous Lv${previousAce}`
			);
			previousAce = ace;
		}
	});

	it("every boss level has a reward pool with the matching offer source", () => {
		for (const level of GYM_LEVELS) {
			const pool = loadRewardPool(level);
			assert.ok(pool, `level ${level} boss pool exists`);
			assert.equal(pool.source, "gym_boss");
			assert.ok(pool.optionCount >= 3);
			assert.ok(pool.pool.length >= pool.optionCount);
			pool.pool.forEach((mon, index) =>
				assertValidMon(mon, `level ${level} pool entry ${index}`)
			);
		}
		// Level 9: only the champion win draws an offer (E4 do not).
		const nine = loadRewardPool(9);
		assert.equal(nine.source, "champion");
		assert.ok(nine.pool.length >= nine.optionCount);
		// Level 10: every legendary win draws from the shared pool.
		const ten = loadRewardPool(10);
		assert.equal(ten.source, "legendary");
		assert.ok(ten.pool.length >= ten.optionCount);
	});

	it("hydration succeeds for sampled battles from levels 1, 2, 9 and 10", async () => {
		for (const levelNumber of [1, 2, 9, 10]) {
			const level = await campaignService.getLevel(levelNumber, {
				lookup: fabricatedLookup,
			});
			for (const battle of level.battles) {
				const party =
					battle.type === "legendary"
						? battle.encounter.party
						: battle.trainer.party;
				assert.ok(
					party.length >= 1,
					`level ${levelNumber} battle ${battle.battleNumber} hydrated`
				);
				for (const mon of party) {
					assert.ok(mon.max_hp > 0);
					assert.ok(mon.moves.length >= 1);
					assert.ok(mon.nickname);
				}
			}
		}
	});

	it("completing each level's last battle unlocks the next level up to 10", async () => {
		const progress = createProgressService({
			store: createMemoryStore(),
			countBattles: (level) => loader.countBattles(level),
		});
		const trainerId = 900;
		for (let level = 1; level <= MAX_LEVEL; level++) {
			const count = loader.countBattles(level);
			for (let battleNumber = 1; battleNumber <= count; battleNumber++) {
				await progress.completeBattle(trainerId, {
					level,
					battleNumber,
				});
			}
			const state = await progress.getProgress(trainerId);
			assert.equal(state.current_level, level + 1);
			assert.equal(state.current_battle, 1);
			assert.equal(state.unlocked_level, level + 1);
		}
	});
});
