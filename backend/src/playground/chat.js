/**
 * Pure room-chat logic: ring buffer, message validation, rate-limit check.
 * No I/O, no Socket.IO dependency — same testability goal as movement.js.
 * Ephemeral by design, same as roomState.js: no persistence.
 */

const DEFAULT_MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 300;
const MIN_MESSAGE_INTERVAL_MS = 1000;

function createChatRing(maxSize = DEFAULT_MAX_MESSAGES) {
	const messages = [];

	function push(msg) {
		messages.push(msg);
		if (messages.length > maxSize) {
			messages.shift();
		}
	}

	function recent() {
		return messages.slice();
	}

	return { push, recent };
}

function sanitizeMessage(text) {
	if (typeof text !== "string") return null;
	const trimmed = text.trim();
	if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return null;
	return trimmed;
}

function isRateLimited(lastSentAt, now, minIntervalMs = MIN_MESSAGE_INTERVAL_MS) {
	if (lastSentAt == null) return false;
	return now - lastSentAt < minIntervalMs;
}

module.exports = {
	createChatRing,
	sanitizeMessage,
	isRateLimited,
	DEFAULT_MAX_MESSAGES,
	MAX_MESSAGE_LENGTH,
	MIN_MESSAGE_INTERVAL_MS,
};
