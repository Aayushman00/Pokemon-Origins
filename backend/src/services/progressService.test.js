const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	createProgressService,
	createMemoryStore,
} = require("./progressService");
const { CampaignError } = require("../campaign/errors");
const { countBattles } = require("../campaign/loader");

function makeService() {
	return createProgressService({
		store: createMemoryStore(),
		countBattles,
	});
}

describe("progressService", () => {
	it("defaults a new trainer to level 1 battle 1", async () => {
		const service = makeService();
		const progress = await service.getProgress(101);
		assert.equal(progress.trainer_id, 101);
		assert.equal(progress.current_level, 1);
		assert.equal(progress.current_battle, 1);
		assert.equal(progress.unlocked_level, 1);
		assert.equal(progress.status, "in_progress");
		assert.equal(progress.completed, false);
	});

	it("complete battle 1 advances current_battle to 2", async () => {
		const service = makeService();
		await service.getProgress(1);
		const result = await service.completeBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(result.alreadyCompleted, false);
		assert.equal(result.current_level, 1);
		assert.equal(result.current_battle, 2);
		assert.equal(result.unlocked_level, 1);
	});

	it("cannot complete battle 3 before battle 2", async () => {
		const service = makeService();
		await service.completeBattle(2, { level: 1, battleNumber: 1 });
		await assert.rejects(
			() => service.completeBattle(2, { level: 1, battleNumber: 3 }),
			(err) => {
				assert.equal(err instanceof CampaignError, true);
				assert.equal(err.status, 403);
				assert.match(err.message, /Not the active battle/);
				return true;
			}
		);
		const progress = await service.getProgress(2);
		assert.equal(progress.current_battle, 2);
	});

	it("cannot fetch a locked level", async () => {
		const service = makeService();
		await service.getProgress(3);
		await assert.rejects(
			() => service.assertLevelUnlocked(3, 7),
			(err) => {
				assert.equal(err.status, 403);
				assert.match(err.message, /Level 7 is locked/);
				return true;
			}
		);
		const progress = await service.assertLevelUnlocked(3, 1);
		assert.equal(progress.unlocked_level, 1);
	});

	it("completing the final Level 1 battle unlocks level 2", async () => {
		const service = makeService();
		for (let battleNumber = 1; battleNumber <= 5; battleNumber += 1) {
			await service.completeBattle(4, { level: 1, battleNumber });
		}
		const progress = await service.getProgress(4);
		assert.equal(progress.current_level, 2);
		assert.equal(progress.current_battle, 1);
		assert.equal(progress.unlocked_level, 2);
		assert.equal(progress.completed, true);
		const unlocked = await service.assertLevelUnlocked(4, 2);
		assert.equal(unlocked.unlocked_level, 2);
		await assert.rejects(
			() => service.assertLevelUnlocked(4, 3),
			(err) => err.status === 403
		);
	});

	it("replaying a completed battle does not double-advance", async () => {
		const service = makeService();
		await service.completeBattle(5, { level: 1, battleNumber: 1 });
		const replay = await service.completeBattle(5, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(replay.alreadyCompleted, true);
		assert.equal(replay.current_battle, 2);
		assert.equal(replay.unlocked_level, 1);

		for (let battleNumber = 2; battleNumber <= 5; battleNumber += 1) {
			await service.completeBattle(5, { level: 1, battleNumber });
		}
		const afterClear = await service.getProgress(5);
		assert.equal(afterClear.unlocked_level, 2);
		const replayFinal = await service.completeBattle(5, {
			level: 1,
			battleNumber: 5,
		});
		assert.equal(replayFinal.alreadyCompleted, true);
		assert.equal(replayFinal.current_level, 2);
		assert.equal(replayFinal.unlocked_level, 2);
	});
});
