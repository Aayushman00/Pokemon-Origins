# Playground Room Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add room-wide, ephemeral chat to the existing Playground (`/playground`), reusing its authenticated socket connection.

**Architecture:** A new pure module `backend/src/playground/chat.js` (ring buffer + validation + rate-limit check, no I/O — same shape as the existing `movement.js`) is wired into `backend/src/playground/index.js`'s socket handlers. `room:init` gains a `messages` field; a new `chat:send`/`chat:message` event pair carries live messages. The frontend adds a chat panel to `frontend/src/pages/Playground/Playground.jsx`.

**Tech Stack:** Node.js, Socket.IO (existing `io`/`socket` instances — no new connection), `node --test` for backend unit tests, React (existing `Playground.jsx` patterns).

**Spec:** `docs/superpowers/specs/2026-09-17-playground-chat-design.md`

## Global Constraints

- Message length cap: 300 characters (spec §2.2, §3).
- Rate limit: reject a message if less than 1000ms since that trainer's last accepted message (spec §2.2).
- Chat ring buffer size: 50 messages, oldest evicted first (spec §2.1, §2.3).
- No new DB tables, no new REST endpoints, no new socket connection/auth (spec §2).
- Validation failures are silently dropped (debug log only, never throw) — same posture as the existing `move` handler (spec §4).
- Render chat text as a plain JSX text node only — never `dangerouslySetInnerHTML` (spec §2.3).

---

## File Structure

- Create `backend/src/playground/chat.js` — pure ring buffer + message validation + rate-limit check. No I/O, no Socket.IO dependency (mirrors `movement.js`).
- Create `backend/src/playground/chat.test.js` — unit tests for the above.
- Modify `backend/src/playground/index.js` — wire `chat.js` into `room:init` and a new `chat:send` handler.
- Modify `backend/package.json` — add `src/playground/chat.test.js` to the `test` script.
- Modify `frontend/src/pages/Playground/Playground.jsx` — chat panel UI, `chat:send`/`chat:message` wiring.
- Modify `frontend/src/pages/Playground/Playground.css` — chat panel styling.

---

### Task 1: Chat module (`chat.js`) — ring buffer, validation, rate limit

**Files:**
- Create: `backend/src/playground/chat.js`
- Test: `backend/src/playground/chat.test.js`
- Modify: `backend/package.json:11` (add the new test file to the `test` script)

**Interfaces:**
- Consumes: nothing (pure module, no dependencies on other playground files).
- Produces (used by Task 2):
  - `createChatRing(maxSize = 50)` → `{ push(msg): void, recent(): Array }`
  - `sanitizeMessage(text: unknown): string | null` — returns the trimmed message, or `null` if invalid (non-string, empty after trim, or over 300 chars).
  - `isRateLimited(lastSentAt: number | undefined, now: number, minIntervalMs = 1000): boolean`
  - Constants: `DEFAULT_MAX_MESSAGES = 50`, `MAX_MESSAGE_LENGTH = 300`, `MIN_MESSAGE_INTERVAL_MS = 1000`

- [ ] **Step 1: Write the failing tests**

```javascript
// backend/src/playground/chat.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && node --test src/playground/chat.test.js`
Expected: FAIL — `Cannot find module './chat'`

- [ ] **Step 3: Write the implementation**

```javascript
// backend/src/playground/chat.js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && node --test src/playground/chat.test.js`
Expected: PASS, all tests green

- [ ] **Step 5: Add the new test file to `backend/package.json`'s `test` script**

Edit `backend/package.json:11` — append `" src/playground/chat.test.js"` to the existing `"test"` script string, right after `src/playground/socketAuth.test.js`, so the line ends:

```
...src/playground/movement.test.js src/playground/roomState.test.js src/playground/socketAuth.test.js src/playground/chat.test.js"
```

- [ ] **Step 6: Run the full backend test suite to confirm nothing else broke**

Run: `cd backend && npm test`
Expected: PASS, all suites green (including the new chat suite)

- [ ] **Step 7: Commit**

```bash
git add backend/src/playground/chat.js backend/src/playground/chat.test.js backend/package.json
git commit -m "feat: add playground chat ring buffer and message validation"
```

---

### Task 2: Wire chat into the Playground socket handlers

**Files:**
- Modify: `backend/src/playground/index.js`

**Interfaces:**
- Consumes (from Task 1): `createChatRing`, `sanitizeMessage`, `isRateLimited` from `./chat`.
- Consumes (existing, unchanged): `ROOM_ID`, `roomState` (`listPlayers`, `getPlayer`, etc.), the existing `lastMoveAt` Map pattern for per-connection timestamp tracking, `socket.trainer = { trainerId, name }`.
- Produces (used by Task 3 / frontend): `room:init` payload now includes `messages: ChatMessage[]`; new `chat:send` (client→server, `string`) and `chat:message` (server→room, `{ trainerId, name, text, ts }`) events.

- [ ] **Step 1: Add the chat wiring**

Modify `backend/src/playground/index.js`:

```javascript
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
```

- [ ] **Step 2: Run the full backend test suite**

Run: `cd backend && npm test`
Expected: PASS — no existing test touches `index.js` directly (it has no dedicated test file, consistent with Phase 1), so this step confirms the change didn't break `chat.js`, `movement.js`, `roomState.js`, or `socketAuth.js`'s own suites.

- [ ] **Step 3: Manual smoke check (backend only, no frontend chat UI yet)**

Run: `cd backend && npm run dev`, then in a scratch Node REPL or a quick script connect with `socket.io-client` using a valid JWT, emit `chat:send` with a string, confirm a `chat:message` event comes back on the same connection (frontend UI lands in Task 3, but this confirms the wire-level event before building UI on top of it). Skip this step if a quick manual client isn't convenient — Task 3's two-session check will exercise the same path end-to-end.

- [ ] **Step 4: Commit**

```bash
git add backend/src/playground/index.js
git commit -m "feat: wire room chat into the playground socket handlers"
```

---

### Task 3: Chat panel UI in `Playground.jsx`

**Files:**
- Modify: `frontend/src/pages/Playground/Playground.jsx`
- Modify: `frontend/src/pages/Playground/Playground.css`

**Interfaces:**
- Consumes (from Task 2): `room:init` payload's new `messages: ChatMessage[]` field; `chat:message` event (`{ trainerId, name, text, ts }`); emits `chat:send` (a `string`) on the existing `socketRef.current`.
- Produces: nothing consumed by later tasks — this is the last task in this plan.

- [ ] **Step 1: Add chat state, socket listeners, and a ~50-message client-side cap**

Modify `frontend/src/pages/Playground/Playground.jsx` — add near the top of the component (alongside the existing `useState`/`useRef` declarations):

```javascript
const MAX_CLIENT_MESSAGES = 50;
```

Add a new piece of state below the existing `connectError` state:

```javascript
const [messages, setMessages] = useState([]);
const [chatInput, setChatInput] = useState("");
```

Inside the existing connection `useEffect` (the one that registers `room:init`, `player:joined`, etc.), extend the `room:init` handler and add two new listeners:

```javascript
socket.on("room:init", ({ self, players, messages: initialMessages }) => {
  const map = new Map();
  players.forEach((p) => map.set(p.trainerId, { ...p, targetX: p.x, targetY: p.y }));
  playersRef.current = map;
  setSelfId(self.trainerId);
  setMessages(initialMessages || []);
  rerender();
});

socket.on("chat:message", (msg) => {
  setMessages((prev) => {
    const next = [...prev, msg];
    return next.length > MAX_CLIENT_MESSAGES ? next.slice(next.length - MAX_CLIENT_MESSAGES) : next;
  });
});
```

(Leave the existing `player:joined`, `player:moved`, `player:left`, `connect_error` handlers exactly as they are.)

- [ ] **Step 2: Add a submit handler**

Add below the existing `handlePointerUp` function:

```javascript
const handleChatSubmit = (event) => {
  event.preventDefault();
  const text = chatInput.trim();
  if (!text) return;
  socketRef.current?.emit("chat:send", text);
  setChatInput("");
};
```

- [ ] **Step 3: Render the chat panel**

Modify the component's return JSX — add a chat panel as a sibling to the existing `playground-room` div (both wrapped in a new outer container), leaving the room `div` and its drag handlers untouched:

```javascript
return (
  <div className="playground-layout">
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

    <div className="playground-chat">
      <div className="playground-chat-log">
        {messages.map((msg, i) => (
          <div key={`${msg.trainerId}-${msg.ts}-${i}`} className="playground-chat-message">
            <span className="playground-chat-author">{msg.name}:</span> {msg.text}
          </div>
        ))}
      </div>
      <form className="playground-chat-form" onSubmit={handleChatSubmit}>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          maxLength={300}
          placeholder="Say something..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  </div>
);
```

Note: message text (`msg.text`) is rendered as plain JSX interpolation — never `dangerouslySetInnerHTML` — so it can never execute as HTML/script.

- [ ] **Step 4: Add chat panel styling**

Append to `frontend/src/pages/Playground/Playground.css`:

```css
.playground-layout {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.playground-chat {
  display: flex;
  flex-direction: column;
  width: 260px;
  height: 600px;
  border: 2px solid #333;
  background: #111;
  color: #eee;
}

.playground-chat-log {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-size: 13px;
}

.playground-chat-message {
  margin-bottom: 4px;
  word-break: break-word;
}

.playground-chat-author {
  font-weight: bold;
}

.playground-chat-form {
  display: flex;
  border-top: 1px solid #333;
}

.playground-chat-form input {
  flex: 1;
  padding: 6px;
  background: #222;
  color: #eee;
  border: none;
}

.playground-chat-form button {
  padding: 6px 12px;
}
```

- [ ] **Step 5: Manual two-session verification**

Run the dev server (frontend + backend), open `/playground` in two browser sessions logged in as two different trainers (or one normal + one incognito). Confirm:
- Both see a chat panel with an empty log on first join.
- A message sent from session A appears in both sessions' logs, prefixed with A's trainer name.
- A message over 300 characters is rejected by the `maxLength` input attribute (can't even be typed/submitted past the cap).
- Sending messages faster than 1/sec: extra messages within the same second don't appear (silently dropped server-side) — confirm by sending several messages in rapid succession and observing at most ~1 per second lands in the log.
- A third session joining after messages exist sees the recent backlog (up to 50) seeded from `room:init`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Playground/Playground.jsx frontend/src/pages/Playground/Playground.css
git commit -m "feat: add chat panel to the Playground screen"
```

---

## Self-Review

**Spec coverage:**
- §2.1 ring buffer (`createChatRing`, FIFO eviction, `maxSize=50`) → Task 1.
- §2.2 `chat:send` validation, rate limit, `room:init` messages field, broadcast including sender → Task 2.
- §2.3 frontend panel, plain-text rendering (no `dangerouslySetInnerHTML`), client-side ~50 cap, no local echo (wait for server broadcast) → Task 3.
- §3 event contract (`chat:send`, `chat:message`, extended `room:init`) → Tasks 2 & 3.
- §4 error handling (silent drop, never throw) → Task 2 (`sanitizeMessage`/`isRateLimited` return falsy, handler just returns).
- §5 testing (`chat.test.js` unit tests, manual two-session frontend check) → Tasks 1 & 3.

**Placeholder scan:** none — every step has concrete code, exact file paths/line references, and runnable commands.

**Type consistency:** `ChatMessage = { trainerId, name, text, ts }` used identically in Task 1 (test fixtures use `.text` field), Task 2 (`index.js` constructs this exact shape), and Task 3 (frontend reads `msg.trainerId`/`msg.name`/`msg.text`/`msg.ts`). `createChatRing`/`sanitizeMessage`/`isRateLimited` signatures match between Task 1's implementation and Task 2's usage.
