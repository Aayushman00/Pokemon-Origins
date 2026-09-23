// backend/src/playground/socketAuth.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createSocketAuthMiddleware } = require("./socketAuth");

function fakeSocket(token, extraAuth = {}) {
	return { id: "sock-1", handshake: { auth: { token, ...extraAuth } }, trainer: undefined };
}

describe("createSocketAuthMiddleware", () => {
	it("rejects when no token is provided", (t, done) => {
		const middleware = createSocketAuthMiddleware({
			verifyToken: () => { throw new Error("should not be called"); },
			findTrainerById: async () => { throw new Error("should not be called"); },
		});
		const socket = fakeSocket(undefined);
		middleware(socket, (err) => {
			assert.ok(err instanceof Error);
			assert.equal(socket.trainer, undefined);
			done();
		});
	});

	it("rejects when verifyToken throws (invalid/expired token)", (t, done) => {
		const middleware = createSocketAuthMiddleware({
			verifyToken: () => { throw new Error("jwt expired"); },
			findTrainerById: async () => { throw new Error("should not be called"); },
		});
		const socket = fakeSocket("some-token");
		middleware(socket, (err) => {
			assert.ok(err instanceof Error);
			assert.equal(socket.trainer, undefined);
			done();
		});
	});

	it("rejects when the decoded payload has no trainer_id", (t, done) => {
		const middleware = createSocketAuthMiddleware({
			verifyToken: () => ({}),
			findTrainerById: async () => { throw new Error("should not be called"); },
		});
		const socket = fakeSocket("some-token");
		middleware(socket, (err) => {
			assert.ok(err instanceof Error);
			assert.equal(socket.trainer, undefined);
			done();
		});
	});

	it("rejects when the trainer is not found", (t, done) => {
		const middleware = createSocketAuthMiddleware({
			verifyToken: () => ({ trainer_id: 42 }),
			findTrainerById: async () => null,
		});
		const socket = fakeSocket("some-token");
		middleware(socket, (err) => {
			assert.ok(err instanceof Error);
			assert.equal(socket.trainer, undefined);
			done();
		});
	});

	it("rejects when the trainer lookup throws", (t, done) => {
		const middleware = createSocketAuthMiddleware({
			verifyToken: () => ({ trainer_id: 42 }),
			findTrainerById: async () => { throw new Error("db down"); },
		});
		const socket = fakeSocket("some-token");
		middleware(socket, (err) => {
			assert.ok(err instanceof Error);
			assert.equal(socket.trainer, undefined);
			done();
		});
	});

	it("succeeds and attaches socket.trainer for a valid token + found trainer", (t, done) => {
		const middleware = createSocketAuthMiddleware({
			verifyToken: () => ({ trainer_id: 42 }),
			findTrainerById: async (trainerId) => {
				assert.equal(trainerId, 42);
				return { trainer_id: 42, name: "Ash" };
			},
		});
		const socket = fakeSocket("some-token");
		middleware(socket, (err) => {
			assert.equal(err, undefined);
			assert.deepEqual(socket.trainer, { trainerId: 42, name: "Ash" });
			done();
		});
	});

	it("admits a guest (no token) that supplies a display name", (t, done) => {
		const middleware = createSocketAuthMiddleware({
			verifyToken: () => { throw new Error("should not be called"); },
			findTrainerById: async () => { throw new Error("should not be called"); },
		});
		const socket = fakeSocket(undefined, { name: "  Misty  " });
		middleware(socket, (err) => {
			assert.equal(err, undefined);
			assert.deepEqual(socket.trainer, { trainerId: "guest-sock-1", name: "Misty" });
			done();
		});
	});

	it("rejects a guest (no token) with a blank display name", (t, done) => {
		const middleware = createSocketAuthMiddleware({
			verifyToken: () => { throw new Error("should not be called"); },
			findTrainerById: async () => { throw new Error("should not be called"); },
		});
		const socket = fakeSocket(undefined, { name: "   " });
		middleware(socket, (err) => {
			assert.ok(err instanceof Error);
			assert.equal(socket.trainer, undefined);
			done();
		});
	});
});
