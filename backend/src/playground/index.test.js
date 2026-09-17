// backend/src/playground/index.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const attachPlayground = require("./index");

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

const fakePool = { query: async () => [[]] }; // never hit: middleware is bypassed in these tests

describe("attachPlayground chat wiring", () => {
	it("broadcasts a valid chat:send with the correct payload shape", () => {
		const { io, broadcasts, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers } = createFakeSocket({ trainerId: 1, name: "Ash" });
		connect(socket);

		handlers["chat:send"]("hello world");

		const sent = chatBroadcasts(broadcasts);
		assert.equal(sent.length, 1);
		assert.equal(sent[0].room, "main");
		const payload = sent[0].payload;
		assert.equal(payload.trainerId, 1);
		assert.equal(payload.name, "Ash");
		assert.equal(payload.text, "hello world");
		assert.ok(Number.isFinite(payload.ts));
	});

	it("does not broadcast invalid text and does not burn the rate-limit slot", () => {
		const { io, broadcasts, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers } = createFakeSocket({ trainerId: 2, name: "Misty" });
		connect(socket);

		handlers["chat:send"](""); // empty
		handlers["chat:send"](42); // non-string
		handlers["chat:send"]("a".repeat(301)); // over length cap

		assert.equal(chatBroadcasts(broadcasts).length, 0);

		// A subsequent valid send right after should NOT be rejected as
		// rate-limited, proving the invalid sends never touched lastMessageAt.
		handlers["chat:send"]("finally valid");
		assert.equal(chatBroadcasts(broadcasts).length, 1);
		assert.equal(chatBroadcasts(broadcasts)[0].payload.text, "finally valid");
	});

	it("rate-limits a second chat:send within 1000ms from the same trainer", () => {
		const { io, broadcasts, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const { socket, handlers } = createFakeSocket({ trainerId: 3, name: "Brock" });
		connect(socket);

		handlers["chat:send"]("first");
		handlers["chat:send"]("second"); // immediately after — rate-limited

		const sent = chatBroadcasts(broadcasts);
		assert.equal(sent.length, 1);
		assert.equal(sent[0].payload.text, "first");
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
		const { io, broadcasts, connect } = createFakeIo();
		attachPlayground(io, fakePool);

		const trainer = { trainerId: 6, name: "Dawn" };

		const { socket: socket1, handlers: handlers1 } = createFakeSocket(trainer);
		connect(socket1);
		handlers1["chat:send"]("before disconnect");
		assert.equal(chatBroadcasts(broadcasts).length, 1);

		handlers1["disconnect"]();

		// Reconnect immediately (same trainerId) and try to send again right away.
		const { socket: socket2, handlers: handlers2 } = createFakeSocket(trainer);
		connect(socket2);
		handlers2["chat:send"]("right after reconnect");

		// Still only the one broadcast from before disconnect — the
		// reconnect must not have granted a fresh rate-limit slot.
		assert.equal(chatBroadcasts(broadcasts).length, 1);
	});
});
