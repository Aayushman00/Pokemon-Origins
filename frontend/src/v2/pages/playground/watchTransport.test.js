import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createWatchTransport } from "./watchTransport.js";

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
const state = (round) => ({ status: "active", round });
const round = (matchId, n) => ({ matchId, events: [{ type: "move", n }], state: state(n) });

describe("watch transport", () => {
	it("is read-only and starts from the pvp:watching state", async () => {
		const t = createWatchTransport(fakeSocket(), { matchId: "m1", state: state(0) });
		assert.equal(t.watch, true);
		assert.deepEqual(await t.start(), { success: true, state: state(0) });
	});

	it("queues rounds that arrive before anyone asks, in order", async () => {
		const socket = fakeSocket();
		const t = createWatchTransport(socket, { matchId: "m1", state: state(0) });
		socket.fire("pvp:watch-round", round("m1", 1));
		socket.fire("pvp:watch-round", round("m1", 2));
		assert.deepEqual(await t.nextRound(), { events: [{ type: "move", n: 1 }], state: state(1) });
		assert.deepEqual(await t.nextRound(), { events: [{ type: "move", n: 2 }], state: state(2) });
	});

	it("a round arriving later resolves the waiting nextRound", async () => {
		const socket = fakeSocket();
		const t = createWatchTransport(socket, { matchId: "m1", state: state(0) });
		const next = t.nextRound();
		socket.fire("pvp:watch-round", round("m1", 1));
		assert.deepEqual(await next, { events: [{ type: "move", n: 1 }], state: state(1) });
	});

	it("the end comes after the rounds before it, and stays the answer", async () => {
		const socket = fakeSocket();
		const t = createWatchTransport(socket, { matchId: "m1", state: state(0) });
		const end = { matchId: "m1", winnerName: "Ash", endedBy: "ko", state: { status: "won" } };
		socket.fire("pvp:watch-round", round("m1", 1));
		socket.fire("pvp:watch-end", end);
		assert.equal((await t.nextRound()).state.round, 1);
		assert.deepEqual(await t.nextRound(), { end: { winnerName: "Ash", endedBy: "ko", state: { status: "won" } } });
		assert.equal((await t.nextRound()).end.winnerName, "Ash");
	});

	it("a waiting nextRound gets the end", async () => {
		const socket = fakeSocket();
		const t = createWatchTransport(socket, { matchId: "m1", state: state(0) });
		const next = t.nextRound();
		socket.fire("pvp:watch-end", { matchId: "m1", winnerName: null, endedBy: "timeout", state: {} });
		assert.equal((await next).end.endedBy, "timeout");
	});

	it("ignores other matches", async () => {
		const socket = fakeSocket();
		const t = createWatchTransport(socket, { matchId: "m1", state: state(0) });
		socket.fire("pvp:watch-round", round("m2", 9));
		socket.fire("pvp:watch-end", { matchId: "m2", winnerName: "Nope", state: {} });
		socket.fire("pvp:watch-round", round("m1", 1));
		assert.equal((await t.nextRound()).state.round, 1);
	});

	it("close unhooks and leaves the stands", () => {
		const socket = fakeSocket();
		const t = createWatchTransport(socket, { matchId: "m1", state: state(0) });
		t.close();
		assert.equal(socket.count("pvp:watch-round"), 0);
		assert.equal(socket.count("pvp:watch-end"), 0);
		assert.deepEqual(socket.emitted, [["pvp:unwatch", undefined]]);
	});
});
