const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createStepService, createMemoryStepStore } = require("./stepService");

describe("step counter", () => {
	it("buffers steps and writes them on flush", async () => {
		const store = createMemoryStepStore();
		const steps = createStepService({ store });
		steps.add(1);
		steps.add(1);
		steps.add(2);
		assert.equal(store.get(1), 0);
		await steps.flush();
		assert.equal(store.get(1), 2);
		assert.equal(store.get(2), 1);
		await steps.flush();
		assert.equal(store.get(1), 2); // nothing double-counted
	});

	it("flushes one trainer on their own", async () => {
		const store = createMemoryStepStore();
		const steps = createStepService({ store });
		steps.add(1);
		steps.add(2);
		await steps.flush(1);
		assert.deepEqual([store.get(1), store.get(2)], [1, 0]);
	});

	it("ignores guests", async () => {
		const store = createMemoryStepStore();
		const steps = createStepService({ store });
		steps.add("guest-abc");
		await steps.flush();
		assert.deepEqual(store.writes, []);
	});

	it("keeps the steps for the next flush when a write fails", async () => {
		const store = createMemoryStepStore();
		let fail = true;
		const flaky = { addSteps: async (id, n) => (fail ? Promise.reject(new Error("db down")) : store.addSteps(id, n)) };
		const steps = createStepService({ store: flaky });
		steps.add(1);
		await steps.flush();
		fail = false;
		steps.add(1);
		await steps.flush();
		assert.equal(store.get(1), 2);
	});
});
