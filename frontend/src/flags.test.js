import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createFlags } from "./flags.js";

const store = (o) => ({ getItem: (k) => (k in o ? o[k] : null) });

describe("client flags", () => {
	it("is off by default", () => assert.equal(createFlags({}).isEnabled("OVERWORLD"), false));
	it("reads VITE_FLAG_ env values", () => {
		assert.equal(createFlags({ env: { VITE_FLAG_OVERWORLD: "1" } }).isEnabled("OVERWORLD"), true);
		assert.equal(createFlags({ env: { VITE_FLAG_OVERWORLD: "true" } }).isEnabled("OVERWORLD"), true);
		assert.equal(createFlags({ env: { VITE_FLAG_OVERWORLD: "0" } }).isEnabled("OVERWORLD"), false);
	});
	it("allows a localStorage override only in dev", () => {
		const s = store({ "po.flag.OVERWORLD": "1" });
		assert.equal(createFlags({ env: { DEV: true }, storage: s }).isEnabled("OVERWORLD"), true);
		assert.equal(createFlags({ env: {}, storage: s }).isEnabled("OVERWORLD"), false);
	});
	it("survives a throwing storage", () => {
		const bad = { getItem: () => { throw new Error("blocked"); } };
		assert.equal(createFlags({ env: { DEV: true, VITE_FLAG_OVERWORLD: "1" }, storage: bad }).isEnabled("OVERWORLD"), true);
	});
});
