// backend/src/playground/index.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const attachPlayground = require("./index");
const { ROOM_WIDTH, ROOM_HEIGHT } = require("./movement");

// Blocks synchronously so a subsequent Date.now()-based elapsedMs calculation
// (in the real move handler, which doesn't accept an injectable clock) is
// guaranteed non-trivial instead of racing test-execution speed.
function busyWaitMs(ms) {
	const start = Date.now();
	while (Date.now() - start < ms) {
		// intentionally empty
	}
}

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
	const socket = {
		trainer,
		join() {},
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
		attachPlayground(io, fakePool);

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

		// Both spawn at the room center by default (dist 0); walk Far 400px
		// away — outside the 250px chat radius — before Near speaks. The
		// move handler computes elapsedMs from a real Date.now() delta (no
		// injectable clock), so wait long enough that MAX_SPEED_PX_PER_SEC
		// comfortably covers the distance in one step.
		busyWaitMs(300); // maxDist = 2000px/s * 0.3s = 600px > 400px needed
		farHandlers["move"]({ x: ROOM_WIDTH / 2 + 400, y: ROOM_HEIGHT / 2 });

		nearHandlers["chat:send"]("hello");
		assert.equal(chatEmits(nearEmits).length, 1);
		assert.equal(chatEmits(farEmits).length, 0);
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

	it("room:init includes a messages array from the chat ring", () => {
		const { io, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers, emits } = createFakeSocket({ trainerId: 4, name: "Gary" });
		connect(socket);

		handlers["chat:send"]("hi there");

		const { socket: socket2, emits: emits2 } = createFakeSocket({ trainerId: 5, name: "May" });
		connect(socket2);

		const initEmit = emits2.find((e) => e.event === "room:init");
		assert.ok(initEmit);
		assert.ok(Array.isArray(initEmit.payload.messages));
		assert.ok(initEmit.payload.messages.some((m) => m.text === "hi there"));

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
});
