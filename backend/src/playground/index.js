// backend/src/playground/index.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { createSocketAuthMiddleware } = require("./socketAuth");
const { createRoomState } = require("./roomState");
const { resolveMove, ROOM_WIDTH, ROOM_HEIGHT } = require("./movement");
const { createChatRing, sanitizeMessage, isRateLimited } = require("./chat");

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
			lastMessageAt.delete(trainerId);
			io.to(ROOM_ID).emit("player:left", { trainerId });
		});
	});
}

module.exports = attachPlayground;
