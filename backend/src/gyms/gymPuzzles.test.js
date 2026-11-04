const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const gyms = require("./gymPuzzles");
const loader = require("../campaign/loader");

describe("gym puzzles", () => {
	before(() => gyms.resetCache());

	it("has one puzzle per gym leader, in gym order", () => {
		const specs = gyms.listGymPuzzles();
		assert.equal(specs.length, 8);
		assert.deepEqual(specs.map((s) => s.gym), [1, 2, 3, 4, 5, 6, 7, 8]);
		for (const s of specs) {
			const leader = loader.getTrainer(s.leaderId);
			assert.equal(leader.title, "Gym Leader", `${s.leaderId} is a gym leader`);
		}
	});

	it("each campaign gym level ends with the matching leader", () => {
		for (const s of gyms.listGymPuzzles()) {
			const battles = loader.listBattles(s.gym);
			assert.equal(battles[battles.length - 1].trainerId, s.leaderId);
		}
	});

	it("every puzzle is solvable and its par equals the shortest solution", () => {
		for (const s of gyms.listGymPuzzles()) {
			const sol = gyms.solve(gyms.buildPuzzle(s), 9000000);
			assert.ok(sol, `gym ${s.gym} (${s.mechanic}) is solvable`);
			assert.equal(sol.length, s.par, `gym ${s.gym} par`);
		}
	});

	it("replay accepts a real solution and rejects a partial one", () => {
		const s = gyms.getGymPuzzle("willow_thornby");
		const sol = gyms.solve(gyms.buildPuzzle(s));
		assert.equal(gyms.replay(s, sol).solved, true);
		assert.equal(gyms.replay(s, sol.slice(0, -1)).solved, false);
		assert.equal(gyms.replay(s, []).solved, false);
	});

	it("unknown leader has no puzzle", () => {
		assert.equal(gyms.getGymPuzzle("nobody"), null);
	});
});
