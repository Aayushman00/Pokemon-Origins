// backend/src/playground/index.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const attachPlayground = require("./index");
const { CHAT_RADIUS_PX, TILE_PX } = require("./movement");

// Real playground.json collision: (12,2) and (13,2) are open, (14,2) is a wall.
const px = (tx, ty) => ({ x: tx * TILE_PX, y: ty * TILE_PX });
/** Hands out the given spawn points in order (attachPlayground's `spawn` dep). */
const spawns = (...points) => () => ({ ...points.shift() });

/**
 * Minimal fake Socket.IO `io` object. Captures whatever handler
 * attachPlayground registers via `io.on("connection", ...)` and records every
 * room broadcast made via `io.to(ROOM_ID).emit(...)`, so tests can drive the
 * real handler code without a real Socket.IO server.
 */
function createFakeIo() {
	const broadcasts = [];
	let connectionHandler = null;
	const io = {
		use() {
			// Auth middleware registration — irrelevant here, since tests
			// construct already-authenticated fake sockets directly.
		},
		on(event, handler) {
			if (event === "connection") connectionHandler = handler;
		},
		to(room) {
			return {
				emit(event, payload) {
					broadcasts.push({ room, event, payload });
				},
			};
		},
	};
	return {
		io,
		broadcasts,
		connect(socket) {
			connectionHandler(socket);
		},
	};
}

/**
 * Minimal fake Socket.IO `socket`. Captures the event handlers attachPlayground
 * registers via `socket.on(...)` so tests can invoke them directly, and records
 * direct emits (`socket.emit`) and to-others broadcasts (`socket.to(room).emit`).
 */
function createFakeSocket(trainer) {
	const handlers = {};
	const emits = [];
	const toEmits = [];
	const rooms = new Set();
	const socket = {
		trainer,
		rooms,
		join(room) {
			rooms.add(room);
		},
		leave(room) {
			rooms.delete(room);
		},
		on(event, handler) {
			handlers[event] = handler;
		},
		emit(event, payload) {
			emits.push({ event, payload });
		},
		to(room) {
			return {
				emit(event, payload) {
					toEmits.push({ room, event, payload });
				},
			};
		},
	};
	return { socket, handlers, emits, toEmits };
}

function chatBroadcasts(broadcasts) {
	return broadcasts.filter((b) => b.event === "chat:message");
}

// Non-"/all" chat:send is proximity-delivered: attachPlayground looks up each
// in-range trainer's own socket and calls socket.emit(...) directly, rather
// than the shared io.to(room) broadcast (which only "/all" uses). Tests for
// ordinary messages read this off the fake socket's own emits array instead.
function chatEmits(emits) {
	return emits.filter((e) => e.event === "chat:message");
}

const fakePool = { query: async () => [[]] }; // never hit: middleware is bypassed in these tests

describe("attachPlayground chat wiring", () => {
	it("proximity-delivers a valid chat:send with the correct payload shape", () => {
		const { io, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers, emits } = createFakeSocket({ trainerId: 1, name: "Ash" });
		connect(socket);

		handlers["chat:send"]("hello world");

		const sent = chatEmits(emits);
		assert.equal(sent.length, 1);
		const payload = sent[0].payload;
		assert.equal(payload.trainerId, 1);
		assert.equal(payload.name, "Ash");
		assert.equal(payload.text, "hello world");
		assert.equal(payload.broadcast, false);
		assert.ok(Number.isFinite(payload.ts));
	});

	it("does not deliver invalid text and does not burn the rate-limit slot", () => {
		const { io, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers, emits } = createFakeSocket({ trainerId: 2, name: "Misty" });
		connect(socket);

		handlers["chat:send"](""); // empty
		handlers["chat:send"](42); // non-string
		handlers["chat:send"]("a".repeat(301)); // over length cap

		assert.equal(chatEmits(emits).length, 0);

		// A subsequent valid send right after should NOT be rejected as
		// rate-limited, proving the invalid sends never touched lastMessageAt.
		handlers["chat:send"]("finally valid");
		assert.equal(chatEmits(emits).length, 1);
		assert.equal(chatEmits(emits)[0].payload.text, "finally valid");
	});

	it("rate-limits a second chat:send within 1000ms from the same trainer", () => {
		const { io, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers, emits } = createFakeSocket({ trainerId: 3, name: "Brock" });
		connect(socket);

		handlers["chat:send"]("first");
		handlers["chat:send"]("second"); // immediately after — rate-limited

		const sent = chatEmits(emits);
		assert.equal(sent.length, 1);
		assert.equal(sent[0].payload.text, "first");
	});

	it("only delivers a non-broadcast message to trainers within the chat radius", () => {
		const { io, connect } = createFakeIo();
		// Far spawns well past the chat radius from Near.
		attachPlayground(io, fakePool, { spawn: spawns(px(2, 3), { x: px(2, 3).x + CHAT_RADIUS_PX * 3, y: px(2, 3).y }) });

		const { socket: nearSocket, handlers: nearHandlers, emits: nearEmits } = createFakeSocket({
			trainerId: 10,
			name: "Near",
		});
		connect(nearSocket);
		const { socket: farSocket, handlers: farHandlers, emits: farEmits } = createFakeSocket({
			trainerId: 11,
			name: "Far",
		});
		connect(farSocket);

		assert.ok(farHandlers["move"]); // Far is on the map, just out of earshot
		nearHandlers["chat:send"]("hello");
		assert.equal(chatEmits(nearEmits).length, 1);
		assert.equal(chatEmits(farEmits).length, 0);
	});

	it("refuses a wall, a jump and a speed burst: snaps the sender back, tells nobody, counts no step", () => {
		const { io, broadcasts, connect } = createFakeIo();
		const counted = [];
		let clock = 5_000;
		attachPlayground(io, fakePool, { spawn: spawns(px(13, 2)), now: () => clock, steps: { add: (id) => counted.push(id), flush: async () => {} } });
		const { socket, handlers, emits } = createFakeSocket({ trainerId: 21, name: "Cheat" });
		connect(socket);

		handlers["move"](px(14, 2)); // wall
		handlers["move"](px(13, 9)); // teleport
		const corrections = emits.filter((e) => e.event === "player:correct");
		assert.deepEqual(corrections.map((e) => e.payload), [px(13, 2), px(13, 2)]);
		assert.equal(broadcasts.filter((b) => b.event === "player:moved").length, 0);

		// Three quick legal steps pass, a fourth in the same instant does not.
		for (const t of [px(12, 2), px(13, 2), px(12, 2)]) handlers["move"](t);
		handlers["move"](px(13, 2));
		assert.equal(broadcasts.filter((b) => b.event === "player:moved").length, 3);
		assert.deepEqual(counted, [21, 21, 21]);
		clock += 200; // budget refills
		handlers["move"](px(13, 2));
		assert.equal(counted.length, 4);
	});

	it("flushes a trainer's steps when they leave", () => {
		const { io, connect } = createFakeIo();
		const flushed = [];
		attachPlayground(io, fakePool, { spawn: spawns(px(12, 2)), steps: { add() {}, flush: async (id) => flushed.push(id) } });
		const { socket, handlers } = createFakeSocket({ trainerId: 22, name: "Walker" });
		connect(socket);
		handlers["disconnect"]();
		assert.deepEqual(flushed, [22]);
	});

	it("relays a step's facing and run flag, and drops anything else", () => {
		const { io, broadcasts, connect } = createFakeIo();
		attachPlayground(io, fakePool, { spawn: spawns(px(12, 2)) });
		const { socket, handlers } = createFakeSocket({ trainerId: 13, name: "Walker" });
		connect(socket);

		handlers["move"]({ ...px(13, 2), facing: "right", run: true, evil: "<b>" });
		handlers["move"]({ ...px(13, 2), facing: "sideways", run: "yes" });

		const moved = broadcasts.filter((b) => b.event === "player:moved").map((b) => b.payload);
		assert.equal(moved[0].facing, "right");
		assert.equal(moved[0].run, true);
		assert.equal("evil" in moved[0], false);
		assert.equal(moved[1].facing, undefined);
		assert.equal(moved[1].run, false);
	});

	it("relays known emotes to the room, drops unknown ones and floods", () => {
		const { io, broadcasts, connect } = createFakeIo();
		attachPlayground(io, fakePool);
		const { socket, handlers } = createFakeSocket({ trainerId: 14, name: "Waver" });
		connect(socket);

		handlers["emote"]("heart");
		handlers["emote"]("heart"); // inside the flood window
		handlers["emote"]("<script>");

		const sent = broadcasts.filter((b) => b.event === "player:emote");
		assert.equal(sent.length, 1);
		assert.equal(sent[0].room, "main");
		assert.equal(sent[0].payload.trainerId, 14);
		assert.equal(sent[0].payload.emote, "heart");
	});

	it("delivers a \"/all\" message to every player via the room broadcast, stripped of the prefix", () => {
		const { io, broadcasts, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers } = createFakeSocket({ trainerId: 12, name: "Oak" });
		connect(socket);

		handlers["chat:send"]("/all everyone hello");

		const sent = chatBroadcasts(broadcasts);
		assert.equal(sent.length, 1);
		assert.equal(sent[0].room, "main");
		assert.equal(sent[0].payload.text, "everyone hello");
		assert.equal(sent[0].payload.broadcast, true);
	});

	it("room:init replays everyone-chat history but never nearby messages", () => {
		const { io, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers, emits } = createFakeSocket({ trainerId: 4, name: "Gary" });
		connect(socket);
		const { socket: socket3, handlers: handlers3 } = createFakeSocket({ trainerId: 7, name: "Rose" });
		connect(socket3);

		handlers["chat:send"]("psst nearby only");
		handlers3["chat:send"]("/all hi there");

		const { socket: socket2, emits: emits2 } = createFakeSocket({ trainerId: 5, name: "May" });
		connect(socket2);

		const initEmit = emits2.find((e) => e.event === "room:init");
		assert.ok(initEmit);
		assert.ok(Array.isArray(initEmit.payload.messages));
		assert.ok(initEmit.payload.messages.some((m) => m.text === "hi there"));
		assert.ok(!initEmit.payload.messages.some((m) => m.text === "psst nearby only"));

		// Sanity: the first socket's own room:init also carried a messages array.
		const firstInit = emits.find((e) => e.event === "room:init");
		assert.ok(Array.isArray(firstInit.payload.messages));
	});

	it("a reconnect for the same trainer does not reset their rate limit", () => {
		const { io, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const trainer = { trainerId: 6, name: "Dawn" };

		const { socket: socket1, handlers: handlers1, emits: emits1 } = createFakeSocket(trainer);
		connect(socket1);
		handlers1["chat:send"]("before disconnect");
		assert.equal(chatEmits(emits1).length, 1);

		handlers1["disconnect"]();

		// Reconnect immediately (same trainerId) and try to send again right away.
		const { socket: socket2, handlers: handlers2, emits: emits2 } = createFakeSocket(trainer);
		connect(socket2);
		handlers2["chat:send"]("right after reconnect");

		// Still only the one delivery from before disconnect — the
		// reconnect must not have granted a fresh rate-limit slot.
		assert.equal(chatEmits(emits1).length, 1);
		assert.equal(chatEmits(emits2).length, 0);
	});

	it("an older tab disconnecting does not remove a trainer who reconnected in another tab", () => {
		const { io, broadcasts, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const trainer = { trainerId: 20, name: "TwoTabs" };
		const first = createFakeSocket(trainer);
		connect(first.socket);
		const second = createFakeSocket(trainer);
		connect(second.socket);

		first.handlers["disconnect"]();
		assert.equal(broadcasts.filter((b) => b.event === "player:left").length, 0);

		second.handlers["disconnect"]();
		assert.equal(broadcasts.filter((b) => b.event === "player:left").length, 1);
	});
});


describe("attachPlayground pvp wiring", () => {
	function spyRegistry() {
		const calls = [];
		const rec = (name) => async (...args) => { calls.push([name, ...args]); };
		return { calls, challenge: rec("challenge"), respond: rec("respond"), act: rec("act"), forfeit: rec("forfeit"), inMatch: () => false };
	}

	it("pvp:watch seats a socket (even a guest's) in the stands; pvp:unwatch takes it out", () => {
		const { io, connect } = createFakeIo();
		const pvp = {
			...spyRegistry(),
			list: () => [{ matchId: "m1" }],
			watch: (viewer, matchId) => (matchId === "m1" ? { state: { viewer } } : { error: "That battle is over" }),
		};
		attachPlayground(io, fakePool, { pvp });
		const { socket, handlers, emits } = createFakeSocket({ trainerId: "guest-x", name: "Guest" });
		connect(socket);
		assert.deepEqual(emits.find((e) => e.event === "room:init").payload.matches, [{ matchId: "m1" }]);
		handlers["pvp:watch"]({ matchId: "m1" });
		assert.ok(socket.rooms.has("watch:m1"));
		assert.deepEqual(emits.find((e) => e.event === "pvp:watching").payload, { matchId: "m1", state: { viewer: "guest-x" } });
		handlers["pvp:watch"]({ matchId: "gone" });
		assert.equal(emits.find((e) => e.event === "pvp:error").payload.message, "That battle is over");
		assert.ok(socket.rooms.has("watch:m1"), "a refused watch keeps the seat you had");
		handlers["pvp:unwatch"]();
		assert.ok(![...socket.rooms].some((r) => String(r).startsWith("watch:")));
	});

	it("room:init carries the sky and the catch flag", () => {
		const { io, connect } = createFakeIo();
		attachPlayground(io, fakePool, { clock: () => "night", catchOn: () => true });
		const { socket, emits } = createFakeSocket({ trainerId: 4, name: "Gary" });
		connect(socket);
		const init = emits.find((e) => e.event === "room:init").payload;
		assert.equal(init.time, "night");
		assert.equal(init.catch, true);
	});

	it("routes pvp events to the registry with the socket's own trainer", () => {
		const { io, connect } = createFakeIo();
		const pvp = spyRegistry();
		attachPlayground(io, fakePool, { pvp });
		const { socket, handlers } = createFakeSocket({ trainerId: 1, name: "Ash" });
		connect(socket);
		handlers["pvp:challenge"]({ targetId: 2 });
		handlers["pvp:respond"]({ fromId: 2, accept: true });
		handlers["pvp:action"]({ type: "move", moveId: 33 });
		handlers["pvp:forfeit"]();
		assert.deepEqual(pvp.calls, [
			["challenge", 1, "Ash", 2],
			["respond", 1, "Ash", 2, true],
			["act", 1, { type: "move", moveId: 33 }],
			["forfeit", 1],
		]);
	});

	it("only the socket that owns the trainer forfeits on disconnect", () => {
		const { io, connect } = createFakeIo();
		const pvp = spyRegistry();
		attachPlayground(io, fakePool, { pvp });
		const first = createFakeSocket({ trainerId: 5, name: "Ash" });
		const second = createFakeSocket({ trainerId: 5, name: "Ash" });
		connect(first.socket);
		connect(second.socket);
		first.handlers["disconnect"]();
		assert.deepEqual(pvp.calls, []);
		second.handlers["disconnect"]();
		assert.deepEqual(pvp.calls, [["forfeit", 5, "disconnect"]]);
	});
});
