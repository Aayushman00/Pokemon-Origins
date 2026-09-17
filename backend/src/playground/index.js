// backend/src/playground/index.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { createSocketAuthMiddleware } = require("./socketAuth");
const { createRoomState } = require("./roomState");
const { resolveMove, ROOM_WIDTH, ROOM_HEIGHT } = require("./movement");
const { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS } = require("./chat");

const ROOM_ID = "main";

function attachPlayground(io, pool) {
	const roomState = createRoomState();
	const chatRing = createChatRing();
	const lastMoveAt = new Map(); // trainerId -> timestamp (ms)
	const lastMessageAt = new Map(); // trainerId -> timestamp (ms)

	io.use(
		createSocketAuthMiddleware({
			verifyToken: (token) => jwt.verify(token, JWT_SECRET),
			findTrainerById: async (trainerId) => {
				const [rows] = await pool.query(
					"SELECT trainer_id, name FROM trainers WHERE trainer_id = ?",
					[trainerId]
				);
				return rows[0] || null;
			},
		})
	);

	io.on("connection", (socket) => {
		const { trainerId, name } = socket.trainer;
		socket.join(ROOM_ID);

		// lastMessageAt is intentionally keyed by trainerId (not per-socket)
		// and intentionally NOT cleared on disconnect, so the flood guard
		// survives reconnects. Sweep out entries that are old enough to
		// never rate-limit anyone again, so the Map doesn't grow unbounded
		// over the server's lifetime.
		const nowSweep = Date.now();
		for (const [id, ts] of lastMessageAt) {
			if (nowSweep - ts >= MIN_MESSAGE_INTERVAL_MS) {
				lastMessageAt.delete(id);
			}
		}

		const spawn = { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 };
		const self = roomState.addPlayer(trainerId, name, spawn);
		lastMoveAt.set(trainerId, Date.now());

		socket.emit("room:init", {
			self,
			players: roomState.listPlayers(),
			messages: chatRing.recent(),
		});
		socket.to(ROOM_ID).emit("player:joined", self);

		socket.on("move", (target) => {
			if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
				return;
			}
			const current = roomState.getPlayer(trainerId);
			if (!current) return;

			const now = Date.now();
			const elapsedMs = now - (lastMoveAt.get(trainerId) ?? now);
			lastMoveAt.set(trainerId, now);

			const resolved = resolveMove(current, target, elapsedMs);
			roomState.updatePosition(trainerId, resolved.x, resolved.y);
			io.to(ROOM_ID).emit("player:moved", { trainerId, x: resolved.x, y: resolved.y });
		});

		socket.on("chat:send", (text) => {
			const clean = sanitizeMessage(text);
			if (!clean) return;

			const now = Date.now();
			if (isRateLimited(lastMessageAt.get(trainerId), now)) return;
			lastMessageAt.set(trainerId, now);

			const msg = { trainerId, name, text: clean, ts: now };
			chatRing.push(msg);
			io.to(ROOM_ID).emit("chat:message", msg);
		});

		socket.on("disconnect", () => {
			roomState.removePlayer(trainerId);
			lastMoveAt.delete(trainerId);
			// lastMessageAt is deliberately NOT cleared here — see the sweep
			// in the connection handler above.
			io.to(ROOM_ID).emit("player:left", { trainerId });
		});
	});
}

module.exports = attachPlayground;
