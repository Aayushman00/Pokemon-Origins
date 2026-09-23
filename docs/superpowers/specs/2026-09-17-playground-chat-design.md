# Playground — Room Chat Design

## 1. Overview

Builds on `2026-09-17-playground-drag-movement-design.md` (Phase 1: presence + drag movement, shipped). This spec covers the first slice of that spec's Phase 2 ("Chat + Block + Report, future, not designed yet").

The broader Playground roadmap, decomposed per discussion:

1. **Presence & drag movement** (done, prior spec).
2. **Room chat** (this spec).
3. **Block / Report** (future, not designed yet — separate spec).
4. **Presence enrichment** — hover-card showing a player's level/progress (future, not designed yet — separate spec, small).
5. **Challenge + team-select battle bridge** (future, not designed yet — separate spec; largest remaining piece, touches `battleSessionService`'s session lifecycle).

Each gets its own spec → plan → implementation cycle. This document is scoped to chat only.

**In scope:**
- Room-wide chat (one channel for everyone in the `"main"` room — no DMs, no proximity).
- Ephemeral, in-memory only — no DB persistence, resets on server restart (matches Phase 1's `roomState.js` pattern).
- Small backfill on join: last ~50 messages sent once via `room:init`, so a joiner doesn't see a blank chat.
- Basic spam guard: per-message length cap and per-connection rate limit — a sanity clamp, not full moderation (block/report is a separate future spec).

**Explicitly out of scope for this phase:**
- Direct messages, proximity-scoped chat.
- Persisted chat history (DB table, backfill across restarts).
- Block / mute / report (future spec — this spec's rate limit is anti-flood only, not user-directed moderation).
- Profanity filtering or content moderation beyond length/rate limits.

## 2. Architecture

```
Browser                         Backend (existing :5000)
┌────────────────────┐          ┌──────────────────────────────────────────┐
│ Playground.jsx      │  WS      │ server.js                                 │
│ (existing socket)   │◄────────►│  └─ playground/index.js                  │
│                     │          │       ├─ socketAuth.js  (unchanged)       │
│  chat panel (new)   │          │       ├─ roomState.js   (unchanged)      │
│  emit "chat:send"   │          │       ├─ movement.js    (unchanged)      │
│  render "chat:message"│        │       └─ chat.js        (new)            │
└────────────────────┘          └──────────────────────────────────────────┘
```

No new database tables, no new REST endpoints, no new socket connection or auth — chat rides the same authenticated socket Phase 1 already opens, reusing `socket.trainer` (`{ trainerId, name }`) as message identity.

### 2.1 Backend module: `backend/src/playground/chat.js`

- Exports `createChatRing(maxSize = 50)` returning `{ push(msg), recent() }`:
  - `push(msg)` appends to an internal array; when length exceeds `maxSize`, drops the oldest entry (FIFO ring buffer).
  - `recent()` returns a shallow copy of the current buffer, oldest-first.
- One ring buffer per room, held in a module-scoped `Map<roomId, ChatRing>` inside `index.js` (mirrors `roomState.js`'s per-room-state pattern) — for this phase there's only `ROOM_ID = "main"`, so effectively one ring.
- Pure, no I/O — same testability goal as `movement.js`.

### 2.2 `index.js` changes

- On module load: `const chatRing = createChatRing()`.
- `room:init` payload gains a `messages` field: `socket.emit("room:init", { self, players: roomState.listPlayers(), messages: chatRing.recent() })`.
- New handler: `socket.on("chat:send", (text) => { ... })`:
  1. Validate `typeof text === "string"`, `text.trim().length > 0`, `text.length <= 300`. Reject silently (debug log, no throw) on failure — same posture as `move`'s malformed-payload handling (spec §5 of Phase 1: a thrown error inside a socket handler can crash the process if unhandled).
  2. Rate limit: track `lastMessageAt` per connection (closure variable, same technique Phase 1 uses for `move`'s `elapsedMs`). If `Date.now() - lastMessageAt < 1000`, reject silently. Otherwise update `lastMessageAt`.
  3. Build `{ trainerId: socket.trainer.trainerId, name: socket.trainer.name, text: text.trim(), ts: Date.now() }`.
  4. `chatRing.push(msg)`.
  5. `io.to(ROOM_ID).emit("chat:message", msg)` — broadcast to everyone including sender, so the sender's own message renders from the same server-confirmed event as everyone else's (consistent with how `player:moved` already round-trips to the sender).

No changes to `disconnect`, `socketAuth.js`, `roomState.js`, or `movement.js`.

### 2.3 Frontend: `Playground.jsx`

- Add a chat panel (scrollable message log + text input + submit) alongside the existing room canvas.
- On `room:init`, seed local chat state from `messages`.
- On submit: `socket.emit("chat:send", inputValue)`, clear input optimistically (no local echo — wait for the server's `chat:message`, consistent with movement's server-authoritative-broadcast approach and simpler than reconciling an optimistic local message against the server-confirmed one).
- On `chat:message`: append to the local message list, capped client-side at the same ~50 to bound memory (oldest drop off as new ones arrive).
- Render message text as a plain text node (React's default JSX text interpolation, never `dangerouslySetInnerHTML`) — this alone prevents stored/reflected XSS from chat content without needing a sanitization library.

## 3. Event Contract (additions to Phase 1's table)

| Event | Direction | Payload | Notes |
|---|---|---|---|
| `chat:send` | client → server | `string` | Message text; rejected silently if empty, >300 chars, or rate-limited (<1 msg/sec) |
| `chat:message` | server → all (room-wide, including sender) | `{ trainerId, name, text, ts }` | Broadcast on accepted `chat:send` |

`room:init` payload becomes `{ self, players, messages }`, where `messages: ChatMessage[]` (oldest-first, ≤50 entries) and `ChatMessage = { trainerId, name, text, ts }`.

## 4. Error Handling

- **Malformed/oversized/rate-limited `chat:send`**: validated and silently ignored (debug-level log), never throws — identical posture to Phase 1's `move` handler validation.
- **Disconnect mid-type**: no special handling needed: the client simply stops emitting; nothing server-side references a half-sent message.
- **Ring buffer overflow**: not an error — `push` dropping the oldest entry past `maxSize` is expected steady-state behavior, not a fault.

## 5. Testing

Following the existing `node --test` convention (new files added to `backend/package.json`'s `test` script):

- `backend/src/playground/chat.test.js` — unit tests for `createChatRing`: `push`/`recent` round-trip; buffer never exceeds `maxSize`; oldest entry evicted first when full; `recent()` returns oldest-first order; empty ring returns `[]`.
- Rate-limit and validation logic (length cap, empty-string rejection, <1s throttle) tested alongside Phase 1's existing socket handler tests for `index.js` (same file/location Phase 1 used, if any exists; otherwise a new `index.test.js` covering both `move` and `chat:send` validation paths).
- Frontend: manual two-session verification (same method as Phase 1 — two browser sessions, confirm both see each other's messages, confirm rate-limit/length-cap behavior by attempting to violate them).

## 6. Self-Review

- **Placeholder scan:** no TBDs; concrete function signatures, constants (`maxSize=50`, 300-char cap, 1s throttle), and event names throughout.
- **Internal consistency:** `ChatMessage` shape identical across §2.2 (backend emit), §2.3 (frontend render), §3 (event contract), §5 (tests).
- **Scope check:** single module addition (`chat.js`) plus small `index.js`/`Playground.jsx` extensions — appropriately sized for one implementation plan, does not touch `movement.js`/`roomState.js`/`socketAuth.js`.
- **Ambiguity check:** "silently reject" is specified consistently as debug-log-and-drop, never throw, matching Phase 1's established error posture — no room for a differing interpretation between handlers.
