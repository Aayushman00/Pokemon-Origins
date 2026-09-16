# Playground Drag Movement (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unauthenticated Socket.IO prototype in `backend/server.js` with an authenticated, single-room, drag-to-move multiplayer Playground: a trainer enters, sees their own and other online trainers' avatars, and can drag their avatar around a fixed room with the server as the position authority.

**Architecture:** A new `backend/src/playground/` module (pure `movement.js` clamp/speed-cap function, an in-memory `roomState.js` player store, a JWT-based `socketAuth.js` Socket.IO handshake middleware, and `index.js` wiring the three together onto the existing `io` instance) replaces the inline block in `server.js`. A new frontend route `/playground` renders a `Playground.jsx` component that opens a `socket.io-client` connection carrying the JWT, drags the local avatar via pointer events (emitting throttled `move` events), and linearly interpolates remote avatars toward their last known server position every animation frame.

**Tech Stack:** Node.js/Express/Socket.IO 4.8 (backend, already a dependency), `jsonwebtoken` (already a dependency), React 18 + `socket.io-client` (new frontend dependency), Node's built-in `node:test` + `node:assert/strict` (existing backend test convention).

**Spec:** `docs/superpowers/specs/2026-09-17-playground-drag-movement-design.md`

## Global Constraints

- Room bounds: `ROOM_WIDTH = 800`, `ROOM_HEIGHT = 600` (exact values, matches the old prototype's spawn bounds and the frontend canvas size).
- Max movement speed cap: `MAX_SPEED_PX_PER_SEC = 2000` — a sanity clamp, not anti-speedhack hardening.
- Single hardcoded room id for this phase: `ROOM_ID = "main"`.
- No new database tables and no new REST endpoints — everything is Socket.IO events on the existing HTTP server (`server.js`'s `http.createServer` + `socketIo(server, ...)`).
- The JWT payload only carries `trainer_id` (see `backend/src/services/authService.js:30`) — the display name must come from a `trainers` table lookup, never from the socket handshake payload or any client-supplied value.
- Follow the codebase's existing dependency-injection convention for services (e.g. `createStarterService`, `createPartyService` in `backend/src/services/`) rather than requiring `jsonwebtoken`/the DB pool directly inside testable modules — inject `verifyToken`/`findTrainerById` functions instead, so unit tests never need a real `JWT_SECRET` or database.
- Out of scope for this phase (do not implement): chat, challenges/battles, block/report, proximity systems, interest management, tile movement, multiple rooms, collision/pathfinding beyond rectangular bounds clamping.
- Backend tests are run via `node --test`, and new test files must be added to the explicit file list in `backend/package.json`'s `"test"` script (there is no glob — it's a literal list).

---

## Task 1: Movement resolution (pure function)

**Files:**
- Create: `backend/src/playground/movement.js`
- Test: `backend/src/playground/movement.test.js`

**Interfaces:**
- Produces: `resolveMove(current, target, elapsedMs)` — `current: {x: number, y: number}`, `target: {x: number, y: number}`, `elapsedMs: number` → returns `{x: number, y: number}`. Also exports `ROOM_WIDTH`, `ROOM_HEIGHT`, `MAX_SPEED_PX_PER_SEC`, `clamp(value, min, max)`.
- Consumes: nothing (pure, no dependencies).

- [ ] **Step 1: Write the failing tests**

```javascript
// backend/src/playground/movement.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { resolveMove, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC, clamp } = require("./movement");

describe("clamp", () => {
	it("passes values already in range through unchanged", () => {
		assert.equal(clamp(50, 0, 100), 50);
	});

	it("clamps below the minimum", () => {
		assert.equal(clamp(-10, 0, 100), 0);
	});

	it("clamps above the maximum", () => {
		assert.equal(clamp(150, 0, 100), 100);
	});
});

describe("resolveMove", () => {
	it("moves directly to a target within bounds and within the speed limit", () => {
		const result = resolveMove({ x: 100, y: 100 }, { x: 110, y: 100 }, 1000);
		assert.deepEqual(result, { x: 110, y: 100 });
	});

	it("clamps a target outside the room bounds to the boundary", () => {
		const result = resolveMove({ x: 10, y: 10 }, { x: -50, y: ROOM_HEIGHT + 200 }, 1000);
		assert.deepEqual(result, { x: 0, y: ROOM_HEIGHT });
	});

	it("clamps an out-of-bounds target on the far edge too", () => {
		const result = resolveMove(
			{ x: ROOM_WIDTH - 10, y: ROOM_HEIGHT - 10 },
			{ x: ROOM_WIDTH + 500, y: ROOM_HEIGHT + 500 },
			1000
		);
		assert.deepEqual(result, { x: ROOM_WIDTH, y: ROOM_HEIGHT });
	});

	it("caps displacement exceeding the max speed along the direction of travel", () => {
		// 1 second elapsed, requesting a jump twice the max allowed distance
		// in the +x direction. The result should move exactly MAX_SPEED_PX_PER_SEC
		// in that direction, not teleport to the target.
		const current = { x: 0, y: 0 };
		const target = { x: MAX_SPEED_PX_PER_SEC * 2, y: 0 };
		const result = resolveMove(current, target, 1000);
		assert.equal(Math.round(result.x), MAX_SPEED_PX_PER_SEC);
		assert.equal(result.y, 0);
	});

	it("caps diagonal displacement proportionally along both axes", () => {
		const current = { x: 0, y: 0 };
		// A 3-4-5 triangle scaled up so the total distance is 2x the max allowed.
		const target = { x: MAX_SPEED_PX_PER_SEC * 1.2, y: MAX_SPEED_PX_PER_SEC * 1.6 };
		const result = resolveMove(current, target, 1000);
		const distTravelled = Math.hypot(result.x - current.x, result.y - current.y);
		assert.ok(Math.abs(distTravelled - MAX_SPEED_PX_PER_SEC) < 0.01);
		// Direction preserved: y/x ratio should match the target's 1.6/1.2 ratio.
		assert.ok(Math.abs(result.y / result.x - 1.6 / 1.2) < 0.01);
	});

	it("does not move (and does not produce NaN) when elapsedMs is 0 and a move was requested", () => {
		const result = resolveMove({ x: 50, y: 50 }, { x: 200, y: 200 }, 0);
		assert.deepEqual(result, { x: 50, y: 50 });
		assert.ok(Number.isFinite(result.x));
		assert.ok(Number.isFinite(result.y));
	});

	it("returns the current position unchanged when the target equals current", () => {
		const result = resolveMove({ x: 42, y: 17 }, { x: 42, y: 17 }, 1000);
		assert.deepEqual(result, { x: 42, y: 17 });
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && node --test src/playground/movement.test.js`
Expected: FAIL — `Cannot find module './movement'`.

- [ ] **Step 3: Write the implementation**

```javascript
// backend/src/playground/movement.js
/**
 * Server-side resolution of one incoming "move" event from an in-progress
 * drag. Dragging is the client's UI interaction; this module resolves the
 * network representation of that drag into an authoritative position.
 */

const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;
const MAX_SPEED_PX_PER_SEC = 2000;

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function resolveMove(current, target, elapsedMs) {
	const clampedTarget = {
		x: clamp(target.x, 0, ROOM_WIDTH),
		y: clamp(target.y, 0, ROOM_HEIGHT),
	};

	const dx = clampedTarget.x - current.x;
	const dy = clampedTarget.y - current.y;
	const dist = Math.hypot(dx, dy);
	const maxDist = MAX_SPEED_PX_PER_SEC * (elapsedMs / 1000);

	if (dist <= maxDist) {
		return clampedTarget;
	}

	const ratio = maxDist / dist;
	return {
		x: current.x + dx * ratio,
		y: current.y + dy * ratio,
	};
}

module.exports = { resolveMove, clamp, ROOM_WIDTH, ROOM_HEIGHT, MAX_SPEED_PX_PER_SEC };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && node --test src/playground/movement.test.js`
Expected: PASS, all 10 tests.

- [ ] **Step 5: Add the new test file to the backend test script**

Edit `backend/package.json`'s `"test"` script, appending `src/playground/movement.test.js` to the existing space-separated file list (after `src/services/battleSessionService.test.js`).

- [ ] **Step 6: Commit**

```bash
cd backend
git add src/playground/movement.js src/playground/movement.test.js package.json
git commit -m "feat: add playground movement resolution (bounds clamp + speed cap)"
```

---

## Task 2: In-memory room state

**Files:**
- Create: `backend/src/playground/roomState.js`
- Test: `backend/src/playground/roomState.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `createRoomState()` → `{ addPlayer(trainerId, name, spawn), removePlayer(trainerId), getPlayer(trainerId), updatePosition(trainerId, x, y), listPlayers() }`. `addPlayer` and `updatePosition`/`getPlayer` all deal in the shape `PlayerState = { trainerId, name, initial, color, x, y }`. Also exports `colorFor(trainerId)` for direct testing.

- [ ] **Step 1: Write the failing tests**

```javascript
// backend/src/playground/roomState.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createRoomState, colorFor } = require("./roomState");

describe("colorFor", () => {
	it("is deterministic for the same trainerId", () => {
		assert.equal(colorFor(7), colorFor(7));
	});

	it("returns a hex color string", () => {
		assert.match(colorFor(3), /^#[0-9A-Fa-f]{6}$/);
	});
});

describe("createRoomState", () => {
	it("addPlayer stores a player with the derived initial and color", () => {
		const room = createRoomState();
		const state = room.addPlayer(1, "Ash", { x: 400, y: 300 });
		assert.equal(state.trainerId, 1);
		assert.equal(state.name, "Ash");
		assert.equal(state.initial, "A");
		assert.equal(state.color, colorFor(1));
		assert.equal(state.x, 400);
		assert.equal(state.y, 300);
	});

	it("getPlayer returns the stored player", () => {
		const room = createRoomState();
		room.addPlayer(2, "Misty", { x: 0, y: 0 });
		const found = room.getPlayer(2);
		assert.equal(found.name, "Misty");
	});

	it("getPlayer returns null for an unknown trainerId", () => {
		const room = createRoomState();
		assert.equal(room.getPlayer(999), null);
	});

	it("updatePosition mutates x/y for an existing player", () => {
		const room = createRoomState();
		room.addPlayer(3, "Brock", { x: 0, y: 0 });
		const updated = room.updatePosition(3, 55, 66);
		assert.equal(updated.x, 55);
		assert.equal(updated.y, 66);
		assert.equal(room.getPlayer(3).x, 55);
	});

	it("updatePosition returns null for an unknown trainerId", () => {
		const room = createRoomState();
		assert.equal(room.updatePosition(999, 1, 1), null);
	});

	it("removePlayer removes the player from listPlayers", () => {
		const room = createRoomState();
		room.addPlayer(4, "Gary", { x: 0, y: 0 });
		room.removePlayer(4);
		assert.equal(room.getPlayer(4), null);
		assert.deepEqual(room.listPlayers(), []);
	});

	it("listPlayers reflects all currently-added players", () => {
		const room = createRoomState();
		room.addPlayer(5, "May", { x: 1, y: 1 });
		room.addPlayer(6, "Max", { x: 2, y: 2 });
		const ids = room.listPlayers().map((p) => p.trainerId).sort();
		assert.deepEqual(ids, [5, 6]);
	});

	it("two separate createRoomState() instances do not share state", () => {
		const roomA = createRoomState();
		const roomB = createRoomState();
		roomA.addPlayer(1, "Ash", { x: 0, y: 0 });
		assert.equal(roomB.getPlayer(1), null);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && node --test src/playground/roomState.test.js`
Expected: FAIL — `Cannot find module './roomState'`.

- [ ] **Step 3: Write the implementation**

```javascript
// backend/src/playground/roomState.js
/**
 * In-memory presence store for one Playground room. One instance per room;
 * Phase 1 only ever creates one (see index.js). Ephemeral by design — no
 * persistence, state resets on server restart.
 */

const PALETTE = [
	"#FF6633",
	"#FFB399",
	"#FF33FF",
	"#FFFF99",
	"#00B3E6",
	"#E6B333",
	"#3366E6",
	"#999966",
	"#99FF99",
	"#B34D4D",
];

function colorFor(trainerId) {
	const index = Number(trainerId) % PALETTE.length;
	return PALETTE[index];
}

function createRoomState() {
	const players = new Map();

	function addPlayer(trainerId, name, spawn) {
		const state = {
			trainerId,
			name,
			initial: name.charAt(0).toUpperCase(),
			color: colorFor(trainerId),
			x: spawn.x,
			y: spawn.y,
		};
		players.set(trainerId, state);
		return state;
	}

	function removePlayer(trainerId) {
		players.delete(trainerId);
	}

	function getPlayer(trainerId) {
		return players.get(trainerId) || null;
	}

	function updatePosition(trainerId, x, y) {
		const player = players.get(trainerId);
		if (!player) return null;
		player.x = x;
		player.y = y;
		return player;
	}

	function listPlayers() {
		return Array.from(players.values());
	}

	return { addPlayer, removePlayer, getPlayer, updatePosition, listPlayers };
}

module.exports = { createRoomState, colorFor, PALETTE };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && node --test src/playground/roomState.test.js`
Expected: PASS, all 9 tests.

- [ ] **Step 5: Add the new test file to the backend test script**

Edit `backend/package.json`'s `"test"` script, appending `src/playground/roomState.test.js` after `src/playground/movement.test.js`.

- [ ] **Step 6: Commit**

```bash
cd backend
git add src/playground/roomState.js src/playground/roomState.test.js package.json
git commit -m "feat: add playground in-memory room state"
```

---

## Task 3: JWT socket handshake auth

**Files:**
- Create: `backend/src/playground/socketAuth.js`
- Test: `backend/src/playground/socketAuth.test.js`

**Interfaces:**
- Consumes: nothing directly (injected `verifyToken` and `findTrainerById` functions — Task 4 supplies the real `jsonwebtoken`/DB-backed versions).
- Produces: `createSocketAuthMiddleware({ verifyToken, findTrainerById })` → a function `(socket, next) => void` suitable for `io.use(...)`. On success, sets `socket.trainer = { trainerId, name }` and calls `next()`. On any failure, calls `next(new Error(message))` and never sets `socket.trainer`.

- [ ] **Step 1: Write the failing tests**

```javascript
// backend/src/playground/socketAuth.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createSocketAuthMiddleware } = require("./socketAuth");

function fakeSocket(token) {
	return { handshake: { auth: { token } }, trainer: undefined };
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && node --test src/playground/socketAuth.test.js`
Expected: FAIL — `Cannot find module './socketAuth'`.

- [ ] **Step 3: Write the implementation**

```javascript
// backend/src/playground/socketAuth.js
/**
 * Socket.IO handshake middleware factory. Verifies the JWT the same way
 * backend/src/middleware/auth.js does for REST, then resolves the trainer's
 * display name via a lookup (the JWT payload only carries trainer_id — see
 * authService.js). verifyToken/findTrainerById are injected so this module
 * has no direct dependency on jsonwebtoken or the DB pool, matching the
 * DI pattern used by backend/src/services/*.
 */

function createSocketAuthMiddleware({ verifyToken, findTrainerById }) {
	return function socketAuthMiddleware(socket, next) {
		const token = socket.handshake?.auth?.token;
		if (!token) {
			return next(new Error("No token provided"));
		}

		let decoded;
		try {
			decoded = verifyToken(token);
		} catch {
			return next(new Error("Invalid token"));
		}

		if (!decoded || !decoded.trainer_id) {
			return next(new Error("Invalid token payload"));
		}

		findTrainerById(decoded.trainer_id)
			.then((trainer) => {
				if (!trainer) {
					return next(new Error("Trainer not found"));
				}
				socket.trainer = { trainerId: trainer.trainer_id, name: trainer.name };
				next();
			})
			.catch(() => next(new Error("Trainer lookup failed")));
	};
}

module.exports = { createSocketAuthMiddleware };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && node --test src/playground/socketAuth.test.js`
Expected: PASS, all 6 tests.

- [ ] **Step 5: Add the new test file to the backend test script**

Edit `backend/package.json`'s `"test"` script, appending `src/playground/socketAuth.test.js` after `src/playground/roomState.test.js`.

- [ ] **Step 6: Commit**

```bash
cd backend
git add src/playground/socketAuth.js src/playground/socketAuth.test.js package.json
git commit -m "feat: add playground JWT socket handshake auth"
```

---

## Task 4: Wire the playground module into the backend server

**Files:**
- Create: `backend/src/playground/index.js`
- Modify: `backend/server.js` (remove the inline Socket.IO prototype, lines ~10 and ~122–209 in the version read for this plan; wire in the new module instead)

**Interfaces:**
- Consumes: `resolveMove` (Task 1), `createRoomState` (Task 2), `createSocketAuthMiddleware` (Task 3).
- Produces: `attachPlayground(io, pool)` — call once from `server.js` after `io` is constructed. No return value.

- [ ] **Step 1: Write `backend/src/playground/index.js`**

```javascript
// backend/src/playground/index.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { createSocketAuthMiddleware } = require("./socketAuth");
const { createRoomState } = require("./roomState");
const { resolveMove, ROOM_WIDTH, ROOM_HEIGHT } = require("./movement");

const ROOM_ID = "main";

function attachPlayground(io, pool) {
	const roomState = createRoomState();
	const lastMoveAt = new Map(); // trainerId -> timestamp (ms)

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

		socket.emit("room:init", { self, players: roomState.listPlayers() });
		socket.to(ROOM_ID).emit("player:joined", self);

		socket.on("move", (target) => {
			if (!target || typeof target.x !== "number" || typeof target.y !== "number") {
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

		socket.on("disconnect", () => {
			roomState.removePlayer(trainerId);
			lastMoveAt.delete(trainerId);
			io.to(ROOM_ID).emit("player:left", { trainerId });
		});
	});
}

module.exports = attachPlayground;
```

- [ ] **Step 2: Update `backend/server.js`**

Add the require near the other route requires (after the `moveRoutes` require):

```javascript
const attachPlayground = require("./src/playground");
const trainerPool = require("./src/config/trainerdb");
```

Delete the inline block entirely — everything from the `const users = {};` line through the closing brace of the `function getRandomColor() { ... }` block (this removes the unauthenticated prototype's state, the `io.on("connection", ...)` handler with `join`/`move`/`send_message`/`disconnect`, and the `getRandomColor` helper — none of it is reused; chat is a future phase built from scratch).

Immediately after the existing `const io = socketIo(server, { ... });` block, add:

```javascript
attachPlayground(io, trainerPool);
```

Leave `server.listen(PORT, ...)` and everything else in the file unchanged.

- [ ] **Step 3: Manual smoke test (no automated test — this task is integration wiring)**

Run: `cd backend && npm run dev`
Expected: server starts without errors, logs `API + Socket.IO running on http://localhost:5000`. This confirms `attachPlayground` doesn't throw at require/attach time (e.g. no typo in the `pool.query` call, no missing export).

- [ ] **Step 4: Run the full backend test suite to confirm no regression**

Run: `cd backend && npm test`
Expected: PASS — all existing service tests plus Tasks 1–3's new playground tests, unaffected by the `server.js` change (none of them import `server.js`).

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/playground/index.js server.js
git commit -m "feat: wire authenticated playground room into the backend server"
```

---

## Task 5: Frontend Playground screen (drag-to-move)

**Files:**
- Create: `frontend/src/pages/Playground/Playground.jsx`
- Create: `frontend/src/pages/Playground/Playground.css`
- Modify: `frontend/src/App.jsx` (add the `/playground` route)
- Modify: `frontend/package.json` (add `socket.io-client` dependency)

**Interfaces:**
- Consumes: the backend's `room:init` / `player:joined` / `player:moved` / `player:left` events and `move` emit (Task 4); `API_URL` from `frontend/src/config.js`; the `user` value and `/auth` redirect pattern already used by every other JWT-gated route in `App.jsx`.
- Produces: nothing further downstream (this is Phase 1's final deliverable).

- [ ] **Step 1: Add the `socket.io-client` dependency**

Edit `frontend/package.json`'s `"dependencies"` block, adding (alphabetically, after `"react-transition-group"`):

```json
"socket.io-client": "^4.8.1"
```

Run: `cd frontend && npm install`

- [ ] **Step 2: Write `frontend/src/pages/Playground/Playground.css`**

```css
.playground-room {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 0 auto;
  background: #2b2b3a;
  border: 4px solid #424542;
  border-radius: 4px;
  overflow: hidden;
  touch-action: none;
}

.playground-avatar {
  position: absolute;
  width: 40px;
  height: 40px;
  margin-left: -20px;
  margin-top: -20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
  font-weight: bold;
  border: 2px solid rgba(0, 0, 0, 0.4);
  user-select: none;
}

.playground-avatar.is-self {
  cursor: grab;
  box-shadow: 0 0 0 3px #fff, 0 2px 6px rgba(0, 0, 0, 0.5);
}

.playground-avatar.is-self:active {
  cursor: grabbing;
}

.playground-error {
  padding: 24px;
  text-align: center;
  color: var(--lcd-ink, #111);
}
```

- [ ] **Step 3: Write `frontend/src/pages/Playground/Playground.jsx`**

```jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../config";
import "./Playground.css";

const LERP_FACTOR = 0.25;
const MOVE_EMIT_INTERVAL_MS = 50; // ~20/sec

const Playground = () => {
  const [selfId, setSelfId] = useState(null);
  const [connectError, setConnectError] = useState(false);
  const [, forceRender] = useState(0);

  const playersRef = useRef(new Map()); // trainerId -> {trainerId,name,initial,color,x,y,targetX,targetY}
  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const lastEmitRef = useRef(0);

  const rerender = () => forceRender((n) => n + 1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect_error", () => setConnectError(true));

    socket.on("room:init", ({ self, players }) => {
      const map = new Map();
      players.forEach((p) => map.set(p.trainerId, { ...p, targetX: p.x, targetY: p.y }));
      playersRef.current = map;
      setSelfId(self.trainerId);
      rerender();
    });

    socket.on("player:joined", (player) => {
      playersRef.current.set(player.trainerId, {
        ...player,
        targetX: player.x,
        targetY: player.y,
      });
      rerender();
    });

    socket.on("player:moved", ({ trainerId, x, y }) => {
      const existing = playersRef.current.get(trainerId);
      if (existing) {
        existing.targetX = x;
        existing.targetY = y;
      }
    });

    socket.on("player:left", ({ trainerId }) => {
      playersRef.current.delete(trainerId);
      rerender();
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      let changed = false;
      playersRef.current.forEach((player, id) => {
        if (draggingRef.current && id === selfId) return;
        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          player.x += dx * LERP_FACTOR;
          player.y += dy * LERP_FACTOR;
          changed = true;
        }
      });
      if (changed) rerender();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selfId]);

  const pointToRoom = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.min(Math.max(clientX - rect.left, 0), rect.width),
      y: Math.min(Math.max(clientY - rect.top, 0), rect.height),
    };
  };

  const handlePointerDown = () => {
    if (selfId != null) draggingRef.current = true;
  };

  const handlePointerMove = (event) => {
    if (!draggingRef.current || selfId == null) return;
    const { x, y } = pointToRoom(event.clientX, event.clientY);
    const self = playersRef.current.get(selfId);
    if (self) {
      self.x = x;
      self.y = y;
      self.targetX = x;
      self.targetY = y;
      rerender();
    }
    const now = performance.now();
    if (now - lastEmitRef.current > MOVE_EMIT_INTERVAL_MS) {
      lastEmitRef.current = now;
      socketRef.current?.emit("move", { x, y });
    }
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const self = playersRef.current.get(selfId);
    if (self) {
      socketRef.current?.emit("move", { x: self.x, y: self.y });
    }
  };

  if (connectError) {
    return (
      <div className="playground-error font-pixel">
        Could not connect to the Playground.
      </div>
    );
  }

  return (
    <div
      className="playground-room"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {Array.from(playersRef.current.values()).map((player) => (
        <div
          key={player.trainerId}
          className={`playground-avatar${player.trainerId === selfId ? " is-self" : ""}`}
          style={{ left: player.x, top: player.y, background: player.color }}
          onPointerDown={player.trainerId === selfId ? handlePointerDown : undefined}
        >
          {player.initial}
        </div>
      ))}
    </div>
  );
};

export default Playground;
```

- [ ] **Step 4: Add the `/playground` route in `frontend/src/App.jsx`**

Add the import near the other page imports:

```javascript
import Playground from "./pages/Playground/Playground";
```

Add the route inside `<Routes>`, alongside the other JWT-gated routes (after the `/game/mart` route, before the catch-all `*` route):

```jsx
<Route
  path="/playground"
  element={user ? <Playground /> : <Navigate to="/auth" replace />}
/>
```

- [ ] **Step 5: Manual verification (no automated frontend test exists for socket-driven UI in this codebase — same limitation as the recent battle-sprites work)**

Run: `npm run dev` from the repo root (starts frontend, backend, and battle engine together).
Open `http://localhost:5173/playground` in one browser tab logged in as one trainer, and in a second tab (or an incognito window) logged in as a different trainer. Confirm:
- Each tab shows its own avatar (colored circle with the trainer's name's first letter) plus the other tab's avatar.
- Dragging your own avatar in one tab moves it smoothly there, and the other tab sees it move (with the interpolated smoothing, not a snap).
- Dragging to any edge stops the avatar exactly at the room boundary (800×600) — it never goes outside the visible room.
- Closing one tab makes that avatar disappear from the other tab within a moment (the `disconnect` → `player:left` path).

- [ ] **Step 6: Commit**

```bash
cd frontend
git add package.json package-lock.json src/pages/Playground/Playground.jsx src/pages/Playground/Playground.css src/App.jsx
git commit -m "feat: add Playground screen with authenticated drag-to-move"
```

---

## Self-Review

**1. Spec coverage:**
- "Authenticated user can enter the Playground" → Task 3 (socket auth) + Task 4 (wiring) + Task 5 Step 3 (route gating).
- "Their trainer avatar is displayed" → Task 5, `room:init`/`player:joined` rendering.
- "The avatar can be dragged to another location within the playground" → Task 5, pointer handlers.
- "Position updates smoothly as the user drags" → Task 5, local-optimistic update while dragging + lerp for remote players.
- "The server maintains the player's current position so the position is authoritative" → Task 1 (`resolveMove`) + Task 4 (`roomState.updatePosition` driven by the server-resolved value, broadcast back to everyone including the sender).
- "The player cannot drag outside the playground bounds" → Task 1's `clamp` to `ROOM_WIDTH`/`ROOM_HEIGHT`, plus Task 5's `pointToRoom` clamping the raw pointer coordinates before they're even sent.
- Explicit exclusions (chat, challenges, block/report, proximity, interest management, tile movement, multiple rooms, pathfinding) → none of the five tasks touch any of these; the old prototype's chat handler is deleted outright in Task 4, not carried forward.
- Extensibility notes from the spec (§7) → `socket.join(ROOM_ID)` (Task 4) and the `Map`-based `roomState` interface (Task 2) are exactly as designed, without building anything beyond them now.

**2. Placeholder scan:** no TBDs; every step has complete, runnable code or an exact shell command.

**3. Type consistency:** `PlayerState` shape (`trainerId, name, initial, color, x, y`) is identical across Task 2's implementation, Task 4's `roomState.addPlayer`/event payloads, and Task 5's rendering code. `resolveMove(current, target, elapsedMs)`'s signature and return shape (Task 1) match exactly how Task 4 calls it. `createSocketAuthMiddleware({ verifyToken, findTrainerById })`'s injected function signatures (Task 3) match exactly how Task 4 supplies the real `jwt.verify`/`pool.query`-backed implementations.
