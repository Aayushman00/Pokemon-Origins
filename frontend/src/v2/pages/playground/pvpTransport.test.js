import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPvpTransport, ratingLine } from "./pvpTransport.js";

function fakeSocket() {
	const handlers = {};
	const emitted = [];
	return {
		emitted,
		on: (event, fn) => ((handlers[event] ||= []).push(fn)),
		off: (event, fn) => (handlers[event] = (handlers[event] || []).filter((h) => h !== fn)),
		emit: (event, payload) => emitted.push([event, payload]),
		fire: (event, payload) => (handlers[event] || []).forEach((h) => h(payload)),
		count: (event) => (handlers[event] || []).length,
	};
}
const active = { status: "active", player: { nickname: "Alpha" } };
const won = { status: "won", player: { nickname: "Alpha" } };

describe("pvp transport", () => {
	it("start hands back the pvp:start state", async () => {
		const t = createPvpTransport(fakeSocket(), { matchId: "m1", state: active });
		assert.deepEqual(await t.start(), { success: true, state: active });
	});

	it("act emits pvp:action and resolves with the next pvp:round", async () => {
		const s = fakeSocket();
		const t = createPvpTransport(s, { state: active });
		const p = t.act({ type: "move", moveId: 33 });
		assert.deepEqual(s.emitted, [["pvp:action", { type: "move", moveId: 33 }]]);
		s.fire("pvp:round", { events: [{ type: "move" }], state: active });
		assert.deepEqual(await p, { success: true, state: active, events: [{ type: "move" }] });
	});

	it("act rejects on pvp:error with a 400-shaped error", async () => {
		const s = fakeSocket();
		const t = createPvpTransport(s, { state: active });
		const p = t.act({ type: "move", moveId: 1 });
		s.fire("pvp:error", { message: "Already chose this turn" });
		await assert.rejects(p, (err) => err.response.status === 400 && err.response.data.error === "Already chose this turn");
	});

	it("a deciding round waits for pvp:end and carries its rating", async () => {
		const s = fakeSocket();
		const t = createPvpTransport(s, { state: active });
		const p = t.act({ type: "move", moveId: 33 });
		s.fire("pvp:round", { events: [{ type: "move" }], state: won });
		const end = { winnerId: 1, endedBy: "ko", rating: { rating: 1016, delta: 16, rated: true }, state: won };
		s.fire("pvp:end", end);
		assert.deepEqual(await p, { success: true, state: won, events: [{ type: "move" }], pvpEnd: end });
	});

	it("onEnd fires once when the match ends while idle (opponent left)", () => {
		const s = fakeSocket();
		const t = createPvpTransport(s, { state: active });
		const seen = [];
		t.onEnd((end) => seen.push(end));
		const end = { winnerId: 1, endedBy: "disconnect", rating: null, state: won };
		s.fire("pvp:end", end);
		s.fire("pvp:end", end);
		assert.deepEqual(seen, [end]);
	});

	it("close removes every listener; forfeit emits pvp:forfeit", () => {
		const s = fakeSocket();
		const t = createPvpTransport(s, { state: active });
		t.forfeit();
		assert.deepEqual(s.emitted, [["pvp:forfeit", undefined]]);
		t.close();
		assert.equal(s.count("pvp:round") + s.count("pvp:error") + s.count("pvp:end"), 0);
	});

	it("ratingLine words each outcome", () => {
		assert.equal(ratingLine({ rating: 1016, delta: 16, rated: true }, "Gary"), "Rating 1016 (+16)");
		assert.equal(ratingLine({ rating: 984, delta: -16, rated: true }, "Gary"), "Rating 984 (-16)");
		assert.equal(ratingLine({ rating: 1000, delta: 0, rated: false }, "Gary"), "Unrated: you've already played Gary 3 times today.");
		assert.equal(ratingLine(null, "Gary"), "This match wasn't rated.");
	});
});
