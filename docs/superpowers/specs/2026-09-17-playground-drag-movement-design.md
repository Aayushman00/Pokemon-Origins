# Playground — Drag Movement (Phase 1) Design

## 1. Overview

Pokémon Origins is adding an online multiplayer "Playground" — a shared social room where authenticated trainers can see and interact with each other, separate from the existing single-player campaign battles (`BattleSim`). This is the first of three planned phases:

1. **Presence & drag movement (this spec)** — enter a shared room, see your own trainer avatar, drag it around, server keeps authoritative position.
2. Chat + Block + Report (future, not designed yet).
3. Battle Challenge bridge to the existing battle-engine (future, not designed yet).

This spec covers **Phase 1 only**, scoped down to a single vertical slice per the approved discussion:

**In scope:**
- Authenticated user can enter the Playground.
- Their trainer avatar is displayed.
- The avatar can be dragged to another location within the playground.
- Position updates smoothly as the user drags.
- The server maintains the player's current position as the authoritative value.
- The player cannot drag outside the playground bounds.
- Other currently-present players are visible in the room and their positions update live (this is the minimum needed for "Playground" to mean anything beyond a single-player screen, and nothing in the explicit exclusion list below removes it).

**Explicitly out of scope for this phase** (per direct instruction — do not implement any of these now):
- Chat (room, DM, or proximity)
- Player challenges / battles
- Block / report
- Proximity-based visibility or interaction systems
- Interest management / spatial partitioning / sharding
- Tile-based movement
- NPCs, friends, voice, matchmaking, multiple rooms
- Collision detection or pathfinding beyond simple rectangular bounds clamping

The architecture must not preclude adding the above later, but nothing beyond this slice gets built now.

**Terminology:** dragging is the UI interaction — a pointer gesture on the client. The `move` socket event (§4) is not a separate movement mechanic; it is only the network representation of that drag, sent repeatedly while the gesture is in progress so the server can track where the drag currently points. Nothing below should be read as implying two systems — there is one interaction (drag), carried over the wire as `move` events.

## 2. Prior Art Being Replaced

`backend/server.js` currently contains an inline, **unauthenticated** Socket.IO prototype (lines ~10, 114–209): an in-memory `users` object keyed by `socket.id`, a client-supplied `username` used as identity, unclamped/untrusted `move` position updates, and an unused proximity-chat handler. No frontend route currently connects to it (confirmed via `HLD.md`: "no frontend surface uses it, ChatGround deleted"). This spec replaces that block; the proximity-chat handler and any chat-related code are deleted, not carried forward (chat is Phase 2's job, from scratch, once presence exists).

## 3. Architecture

```
Browser                         Backend (single Node process, existing :5000)
┌────────────────────┐          ┌──────────────────────────────────────────┐
│ PlaygroundScreen    │  WS      │ server.js                                 │
│ (socket.io-client)  │◄────────►│  └─ playground/index.js (registers on io) │
│                     │          │       ├─ socketAuth.js  (io.use middleware)│
│  drag → emit "move" │          │       ├─ roomState.js   (in-memory Map)   │
│  render players     │          │       └─ movement.js    (pure clamp fn)   │
└────────────────────┘          └──────────────────────────────────────────┘
```

No new database tables. No new REST endpoints. Everything for this phase is a Socket.IO event exchange on the backend's existing HTTP server (`server.js`'s `http.createServer` + `socketIo(server, ...)`), reusing the JWT the REST API already issues.

### 3.1 Backend module: `backend/src/playground/`

**`socketAuth.js`**
- Exports `createSocketAuthMiddleware(pool)` returning an `io.use((socket, next) => {...})` handshake middleware.
- Reads `socket.handshake.auth.token`. Missing → `next(new Error("No token provided"))`.
- Verifies with `jwt.verify(token, JWT_SECRET)` (same secret/library as `backend/src/middleware/auth.js`). Invalid/expired → `next(new Error("Invalid token"))`.
- Looks up `trainer_id` from the decoded payload in the `trainers` table (`SELECT trainer_id, name FROM trainers WHERE trainer_id = ?`, via the existing `pool` from `backend/src/config/trainerdb.js`) to get the display name — the JWT payload only carries `trainer_id` (see `authService.js:30`), never `name`. Not found → `next(new Error("Trainer not found"))`.
- On success, attaches `socket.trainer = { trainerId, name }` and calls `next()`.

**`roomState.js`**
- A single hardcoded room for this phase: `const ROOM_ID = "main"`.
- In-memory state: `Map<trainerId, PlayerState>` where
  ```
  PlayerState = {
    trainerId: number,
    name: string,
    initial: string,    // name[0].toUpperCase()
    color: string,       // deterministic per trainerId, assigned once on join
    x: number,
    y: number,
  }
  ```
- Exports: `addPlayer(trainerId, name, spawn)`, `removePlayer(trainerId)`, `getPlayer(trainerId)`, `updatePosition(trainerId, x, y)`, `listPlayers()` (returns `PlayerState[]`).
- `color` is derived deterministically from `trainerId` (e.g. a fixed palette indexed by `trainerId % palette.length`) so it never flickers across reconnects and needs no persistence.
- Spawn position on join: room center, e.g. `{ x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2 }`.

**`movement.js`**
- Server-side resolution of one incoming `move` event — i.e. one wire update from an in-progress drag, not a movement system of its own. Pure function, no I/O — the part that needs the most unit-test coverage:
  ```js
  function resolveMove(current, target, elapsedMs) { ... }
  // current: {x, y}, target: {x, y} (client-requested), elapsedMs: number
  // returns: {x, y} — the new authoritative position
  ```
- Step 1 — clamp `target` into room bounds: `clampedTarget = { x: clamp(target.x, 0, ROOM_WIDTH), y: clamp(target.y, 0, ROOM_HEIGHT) }`.
- Step 2 — cap displacement by max speed: compute `dx = clampedTarget.x - current.x`, `dy = clampedTarget.y - current.y`, `dist = Math.hypot(dx, dy)`, `maxDist = MAX_SPEED_PX_PER_SEC * (elapsedMs / 1000)`. If `dist <= maxDist`, return `clampedTarget` as-is. Otherwise return `current` moved `maxDist` along the `(dx, dy)` direction: `{ x: current.x + (dx / dist) * maxDist, y: current.y + (dy / dist) * maxDist }`.
- Constants: `ROOM_WIDTH = 800`, `ROOM_HEIGHT = 600` (matches the old prototype's spawn bounds, keeps the frontend canvas size unsurprising), `MAX_SPEED_PX_PER_SEC = 2000` (generous — this isn't anti-speedhack hardening, it's a sanity clamp so a malformed/malicious single event can't teleport a player across the room in one frame; drag gestures normally emit many small deltas well under this).

**`index.js`**
- Exports a function `attachPlayground(io, pool)` called once from `server.js`.
- Calls `io.use(createSocketAuthMiddleware(pool))`.
- On `io.on("connection", socket)`:
  - `socket.join(ROOM_ID)` (Socket.IO room, for broadcast scoping — future-proofs multi-room without changing this event shape).
  - `roomState.addPlayer(socket.trainer.trainerId, socket.trainer.name, spawnPosition)`.
  - `socket.emit("room:init", { self: <own PlayerState>, players: roomState.listPlayers() })`.
  - `socket.to(ROOM_ID).emit("player:joined", <own PlayerState>)`.
  - `socket.on("move", (target) => { ... })`: validates `target` is `{x: number, y: number}` (reject silently — log and ignore — on malformed payload, never throw), computes `elapsedMs` since this player's last processed move (tracked per-connection, default a large value on the very first move so it isn't over-clamped), calls `movement.resolveMove`, `roomState.updatePosition(...)`, then `io.to(ROOM_ID).emit("player:moved", { trainerId, x, y })` (broadcast to everyone including sender, so the sender's own state also stays server-driven, not locally optimistic-then-corrected in a visible way beyond normal network latency).
  - `socket.on("disconnect", () => { roomState.removePlayer(trainerId); io.to(ROOM_ID).emit("player:left", { trainerId }); })`.

**`server.js` change:**
- Delete the inline block (the `users`/`CHAT_VICINITY_DISTANCE`/`getRandomColor` code and its `io.on("connection", ...)` handler).
- Add `require("./src/playground")(io, trainerPool)` after `io` is constructed (`trainerPool` is the existing pool from `backend/src/config/trainerdb.js`, already used elsewhere — no new pool).

### 3.2 Frontend

**Route:** `/playground`, JWT-gated the same way `/game` and `/level/:levelNumber` already are in `App.jsx` (session-aware redirect to `/auth` if not logged in — follow the existing route-guard pattern verbatim, do not invent a new one).

**Component:** `frontend/src/pages/Playground/Playground.jsx`
- On mount: opens a socket via `socket.io-client`, `io(API_URL, { auth: { token: localStorage.getItem("token") } })`. This is a separate transport from the `api.js` Axios client (different protocol), but reuses the same stored token — no separate login/identity.
- Renders a fixed-size room area (800×600, matching backend bounds) as a positioned `<div>`; each visible player renders as a circle `<div>` with a background `color` and the `initial` letter centered — no sprite assets needed for this phase (per the approved "simple V1 placeholder" decision).
- **Drag interaction** on the local player's own avatar only: `onPointerDown` starts a drag, `onPointerMove` (while dragging) updates the avatar's on-screen position immediately for local responsiveness and emits a throttled `move` event (~20/sec, e.g. via a simple timestamp-gate, not a full library) with the pointer's room-relative `{x, y}`; `onPointerUp` ends the drag. The client's own displayed position, while dragging, follows the pointer directly (optimistic) — server corrections arrive via the same `player:moved` event as everyone else's and simply overwrite local state after the drag ends, since `MAX_SPEED_PX_PER_SEC` is generous enough that normal drags are never visibly clamped.
- **Remote players**: on `player:joined`/`player:moved`, store each player's latest **target** position; on every `requestAnimationFrame`, linearly interpolate each remote avatar's rendered position a fraction of the way toward its target (simple lerp, e.g. `pos += (target - pos) * 0.25` per frame) so remote movement reads as smooth motion instead of teleporting between network updates. On `player:left`, remove that player.
- On `room:init`, seed local state with `self` and `players`.
- Socket disconnects (tab close, navigation away) are handled by `socket.disconnect()` in a cleanup effect — the backend's own `disconnect` handler does the rest (`roomState.removePlayer` + broadcast).

## 4. Event Contract

| Event | Direction | Payload | Notes |
|---|---|---|---|
| `room:init` | server → client | `{ self: PlayerState, players: PlayerState[] }` | Sent once, right after a successful join |
| `player:joined` | server → others | `PlayerState` | Broadcast to everyone already in the room |
| `move` | client → server | `{ x: number, y: number }` | The requested target position; may be sent many times per second while dragging |
| `player:moved` | server → all (room-wide, including sender) | `{ trainerId, x, y }` | The server-resolved (clamped) authoritative position |
| `player:left` | server → others | `{ trainerId }` | On disconnect |

`PlayerState = { trainerId, name, initial, color, x, y }`.

## 5. Error Handling

- **Handshake auth failure** (missing/invalid/expired token, unknown trainer): the `io.use()` middleware calls `next(new Error(...))`, which Socket.IO turns into a `connect_error` event on the client — no `connection` fires, nothing is added to `roomState`. The frontend shows a simple inline error state ("Could not connect to the Playground") rather than a blank room.
- **Malformed `move` payload** (missing/non-numeric `x`/`y`): the handler validates and silently ignores the event (logs at debug level) — never throws, since a thrown error inside a socket event handler can crash the process if unhandled.
- **Mid-session backend restart**: out of scope for this phase — the client simply loses connection; reconnection/resync is not designed here (Socket.IO's default reconnection will re-run the handshake and get a fresh `room:init`, which is sufficient default behavior, not something to special-case).

## 6. Testing

Following the existing backend convention (`node --test`, listed explicitly in `backend/package.json`'s `test` script — new test files must be added to that list):

- `backend/src/playground/movement.test.js` — unit tests for `resolveMove`: target within bounds and within speed limit passes through; target outside room bounds gets clamped to the boundary; target within bounds but requested displacement exceeding `MAX_SPEED_PX_PER_SEC * elapsedMs` gets capped along the direction vector; zero-elapsed-time edge case doesn't produce `NaN`/`Infinity` (should return `current` unchanged, not divide by zero).
- `backend/src/playground/socketAuth.test.js` — unit tests for the middleware factory: no token → rejects; invalid/expired JWT → rejects; valid JWT but trainer not found in a stubbed pool → rejects; valid JWT + found trainer → calls `next()` with `socket.trainer` set correctly. Stub `pool.query` rather than hitting real MySQL.
- `backend/src/playground/roomState.test.js` — unit tests for the in-memory store: add/get/update/remove round-trip; `listPlayers()` reflects current membership; same `trainerId` always gets the same `color` across multiple `addPlayer` calls (deterministic derivation, not random).
- No frontend test convention exists yet for socket-driven UI (the codebase's only frontend tests are the plain-function sprite resolvers under `node --test`), so frontend verification for this phase is manual: run the dev server, open the Playground in two browser sessions (or one normal + one incognito, two different trainer logins), confirm each sees the other's avatar and drags smoothly. This mirrors how the recent battle-sprites work was verified when no browser tool was available — call it out explicitly in the plan rather than skip it.

## 7. Extensibility Notes (not built now, but why this shape allows it later)

- Socket.IO's `socket.join(ROOM_ID)` scoping means adding real multiple rooms later is a routing change (which room a player joins), not a broadcast-model rewrite.
- `roomState.js`'s `Map`-based interface is swappable for a Redis-backed store later (for multi-process scaling) without changing `index.js`'s call sites.
- `movement.js` being a pure function makes it trivial to extend with obstacle/collision checks later (Phase 1 explicitly excludes this) without touching the Socket.IO plumbing.
- Chat (Phase 2) can reuse `socket.trainer` (already-authenticated identity) and the same `ROOM_ID` broadcast scoping, needing no changes to Phase 1's auth or room-join code.

## 8. Self-Review

- **Placeholder scan:** no TBDs; every component has concrete function signatures, constants, and event names.
- **Internal consistency:** `PlayerState` shape is identical across §3.1's `roomState.js`, §3.2's frontend rendering, §4's event contract table, and §6's test descriptions.
- **Scope check:** single vertical slice, one backend module, one frontend route — appropriately sized for one implementation plan.
- **Ambiguity check:** the "in scope" list didn't explicitly mention seeing other players; resolved explicitly in §1 as in-scope (a room with only the local user visible isn't a "Playground," and nothing in the exclusion list removes basic multi-player visibility — only proximity/interest-management *systems* on top of it).
