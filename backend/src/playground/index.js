// backend/src/playground/index.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { createSocketAuthMiddleware } = require("./socketAuth");
const { createRoomState } = require("./roomState");
const { validateStep, freshBudget, spawnPoint, CHAT_RADIUS_PX, ROOM_WIDTH, ROOM_HEIGHT } = require("./movement");
const { createStepService, createMysqlStepStore } = require("../services/stepService");
const { createChatRing, sanitizeMessage, isRateLimited, MIN_MESSAGE_INTERVAL_MS } = require("./chat");
const { createMatchRegistry } = require("../pvp/matches");
const { loadPvpParty } = require("../pvp/party");
const { createBattleSessionService } = require("../services/battleSessionService");
const { timeOfDay, createSkyWatch } = require("./clock");
const flags = require("../config/flags");

const ROOM_ID = "main";
const FACINGS = new Set(["up", "down", "left", "right"]);
// Emote ids the client draws overhead; anything else is dropped.
const EMOTES = new Set(["heart", "exclaim", "question", "music", "happy", "sad", "angry", "sleep"]);
const EMOTE_INTERVAL_MS = 600;

const STEP_FLUSH_MS = 60_000;
const SKY_CHECK_MS = 60_000;

/**
 * `pvp` (a match registry), `recordResult`, `spawn`, `now`, `steps` (step counter),
 * `clock` (the park's "day"/"night") and `catchOn` (the CATCH flag) are injectable for tests.
 */
function attachPlayground(
	io,
	pool,
	{ pvp, recordResult, spawn = spawnPoint, now = Date.now, steps, clock = () => timeOfDay(new Date(now())), catchOn = () => flags.isEnabled("CATCH") } = {}
) {
	const roomState = createRoomState();
	const chatRing = createChatRing();
	const stepBudgets = new Map(); // trainerId -> { tokens, at }, see movement.validateStep
	const stepCounter = steps || createStepService({ store: createMysqlStepStore(pool) });
	setInterval(() => stepCounter.flush(), STEP_FLUSH_MS).unref?.();
	// One sky for the room: checked once a minute, broadcast only when it turns.
	const sky = createSkyWatch({ getTime: clock, onFlip: (time) => io.to(ROOM_ID).emit("world:time", { time }) });
	setInterval(sky.check, SKY_CHECK_MS).unref?.();
	const lastMessageAt = new Map(); // trainerId -> timestamp (ms)
	const lastEmoteAt = new Map(); // trainerId -> timestamp (ms)
	const trainerSockets = new Map(); // trainerId -> socket, for proximity chat delivery
	const registry =
		pvp ||
		createMatchRegistry({
			battle: createBattleSessionService(),
			loadParty: loadPvpParty,
			recordResult,
			emitTo: (id, event, payload) => trainerSockets.get(id)?.emit(event, payload),
			distance: (a, b) => {
				const p = roomState.getPlayer(a);
				const q = roomState.getPlayer(b);
				return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : null;
			},
		});
	const logFailure = (err) => console.error("PvP handler failed:", err.message);

	io.use(
		createSocketAuthMiddleware({
			verifyToken: (token) => jwt.verify(token, JWT_SECRET),
			findTrainerById: async (trainerId) => {
				const [rows] = await pool.query(
					"SELECT trainer_id, name, gender FROM trainers WHERE trainer_id = ?",
					[trainerId]
				);
				return rows[0] || null;
			},
		})
	);

	io.on("connection", (socket) => {
		const { trainerId, name, gender } = socket.trainer;
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

		const self = roomState.addPlayer(trainerId, name, spawn(), gender);
		stepBudgets.set(trainerId, freshBudget(now()));
		trainerSockets.set(trainerId, socket);

		socket.emit("room:init", {
			self,
			players: roomState.listPlayers(),
			messages: chatRing.recent(),
			roomWidth: ROOM_WIDTH,
			roomHeight: ROOM_HEIGHT,
			chatRadius: CHAT_RADIUS_PX,
			time: sky.current(),
			catch: catchOn(),
		});
		socket.to(ROOM_ID).emit("player:joined", self);

		// One tile at a time, onto open ground, no faster than running. A refused
		// move snaps only the sender back; nobody else sees it and it is no step.
		socket.on("move", (target) => {
			const current = roomState.getPlayer(trainerId);
			if (!current || !target) return;
			const result = validateStep(current, target, stepBudgets.get(trainerId) || freshBudget(now()), now());
			stepBudgets.set(trainerId, result.budget);
			if (!result.ok) {
				socket.emit("player:correct", { x: current.x, y: current.y });
				return;
			}
			roomState.updatePosition(trainerId, result.x, result.y);
			if (result.stepped) stepCounter.add(trainerId);
			// facing / run only steer the walk animation other players see.
			const facing = FACINGS.has(target.facing) ? target.facing : undefined;
			io.to(ROOM_ID).emit("player:moved", { trainerId, x: result.x, y: result.y, facing, run: target.run === true });
		});

		// A reaction bubble over the sender's head, seen by everyone on the map.
		socket.on("emote", (emote) => {
			if (!EMOTES.has(emote)) return;
			const now = Date.now();
			if (now - (lastEmoteAt.get(trainerId) ?? 0) < EMOTE_INTERVAL_MS) return;
			lastEmoteAt.set(trainerId, now);
			io.to(ROOM_ID).emit("player:emote", { trainerId, emote, ts: now });
		});

		// Live PvP. The registry checks guests, range and turn legality itself.
		socket.on("pvp:challenge", (p) => registry.challenge(trainerId, name, p?.targetId)?.catch?.(logFailure));
		socket.on("pvp:respond", (p) => registry.respond(trainerId, name, p?.fromId, p?.accept === true)?.catch?.(logFailure));
		socket.on("pvp:action", (action) => registry.act(trainerId, action)?.catch?.(logFailure));
		socket.on("pvp:forfeit", () => registry.forfeit(trainerId)?.catch?.(logFailure));

		socket.on("chat:send", (text) => {
			const clean = sanitizeMessage(text);
			if (!clean) return;

			const isAllBroadcast = /^\/all\s+/i.test(clean);
			const body = isAllBroadcast ? clean.replace(/^\/all\s+/i, "").trim() : clean;
			if (!body) return;

			const now = Date.now();
			if (isRateLimited(lastMessageAt.get(trainerId), now)) return;
			lastMessageAt.set(trainerId, now);

			const msg = { trainerId, name, text: body, ts: now, broadcast: isAllBroadcast };
			if (isAllBroadcast) {
				// Only room-wide messages are kept for room:init history: nearby chat
				// must not be replayed to players who were out of earshot or join later.
				chatRing.push(msg);
				io.to(ROOM_ID).emit("chat:message", msg);
				return;
			}

			// Proximity chat: only deliver to players within CHAT_RADIUS_PX of the sender.
			const sender = roomState.getPlayer(trainerId);
			if (!sender) return;
			roomState.listPlayers().forEach((player) => {
				const dist = Math.hypot(player.x - sender.x, player.y - sender.y);
				if (dist <= CHAT_RADIUS_PX) {
					trainerSockets.get(player.trainerId)?.emit("chat:message", msg);
				}
			});
		});

		socket.on("disconnect", () => {
			// Same trainer in two tabs: a newer socket owns the slot, so an
			// older tab closing must not remove the trainer who is still here.
			if (trainerSockets.get(trainerId) !== socket) return;
			roomState.removePlayer(trainerId);
			stepBudgets.delete(trainerId);
			stepCounter.flush(trainerId).catch?.((err) => console.error("Steps flush failed:", err.message));
			lastEmoteAt.delete(trainerId);
			trainerSockets.delete(trainerId);
			// Leaving the Playground mid-battle is a loss; open challenges go too.
			registry.forfeit(trainerId, "disconnect")?.catch?.(logFailure);
			// lastMessageAt is deliberately NOT cleared here — see the sweep
			// in the connection handler above.
			io.to(ROOM_ID).emit("player:left", { trainerId });
		});
	});
}

module.exports = attachPlayground;
