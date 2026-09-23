// backend/src/playground/chat.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
} = require("./chat");

describe("createChatRing", () => {
	it("returns an empty array from a fresh ring", () => {
		const ring = createChatRing();
		assert.deepEqual(ring.recent(), []);
	});

	it("returns pushed messages oldest-first", () => {
		const ring = createChatRing();
		ring.push({ text: "one" });
		ring.push({ text: "two" });
		assert.deepEqual(ring.recent().map((m) => m.text), ["one", "two"]);
	});

	it("never exceeds maxSize, evicting the oldest entry first", () => {
		const ring = createChatRing(3);
		ring.push({ text: "a" });
		ring.push({ text: "b" });
		ring.push({ text: "c" });
		ring.push({ text: "d" });
		assert.deepEqual(ring.recent().map((m) => m.text), ["b", "c", "d"]);
	});

	it("recent() returns a copy, not a live reference", () => {
		const ring = createChatRing();
		ring.push({ text: "one" });
		const snapshot = ring.recent();
		ring.push({ text: "two" });
		assert.deepEqual(snapshot.map((m) => m.text), ["one"]);
	});
});

describe("sanitizeMessage", () => {
	it("trims and returns a valid message", () => {
		assert.equal(sanitizeMessage("  hello  "), "hello");
	});

	it("rejects a non-string input", () => {
		assert.equal(sanitizeMessage(42), null);
		assert.equal(sanitizeMessage(null), null);
		assert.equal(sanitizeMessage(undefined), null);
		assert.equal(sanitizeMessage({ text: "hi" }), null);
	});

	it("rejects an empty or whitespace-only string", () => {
		assert.equal(sanitizeMessage(""), null);
		assert.equal(sanitizeMessage("   "), null);
	});

	it("accepts a message exactly at the length cap", () => {
		const text = "a".repeat(MAX_MESSAGE_LENGTH);
		assert.equal(sanitizeMessage(text), text);
	});

	it("rejects a message over the length cap", () => {
		const text = "a".repeat(MAX_MESSAGE_LENGTH + 1);
		assert.equal(sanitizeMessage(text), null);
	});
});

describe("isRateLimited", () => {
	it("is not rate-limited when there is no prior message", () => {
		assert.equal(isRateLimited(undefined, Date.now()), false);
	});

	it("is rate-limited when under the interval", () => {
		const now = 10_000;
		assert.equal(isRateLimited(now - 500, now), true);
	});

	it("is not rate-limited once the interval has elapsed", () => {
		const now = 10_000;
		assert.equal(isRateLimited(now - MIN_MESSAGE_INTERVAL_MS, now), false);
	});

	it("is not rate-limited comfortably past the interval", () => {
		const now = 10_000;
		assert.equal(isRateLimited(now - 5000, now), false);
	});
});
