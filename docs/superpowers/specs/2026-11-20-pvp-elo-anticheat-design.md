# Real-time PvP, Elo ladder, movement anti-cheat — design

Date: 2026-11-20. Status: awaiting approval.

## Intent

Players in the Playground can challenge each other to live 1v1 battles. A ranked ladder uses Elo, so an upset win pays a lot and beating a weak alt pays almost nothing. A second board shows "most wins today". Repeated games against the same opponent stop moving ratings after 3 in a day. Playground movement is validated on the server: speed cap, wall collision, and a step count built only from validated moves. Build order: PvP → Elo → anti-cheat.

## Goals

- Signed-in Playground trainers challenge a nearby trainer, the other accepts, and both fight in the existing battle screen in real time.
- Teams: the trainer's real party (max 6), copied and scaled to **level 50** (user ruling, option B). Nothing carries back: no HP/PP/XP/coins/progress changes.
- Elo through the existing `backend/src/services/elo.js` (START 1000, K 32, `RATED_PER_PAIR_PER_DAY` 3, UTC `dayKey`).
- Two boards: top ratings and most wins today (UTC).
- Server rejects Playground moves that are too fast, longer than one tile, or into a wall. Steps count only accepted moves.

## Non-goals

- Spectating, rematch button, matchmaking queue, PvP items (bag disabled in PvP), PvP outside the Playground.
- Capture / Poké Balls (not built anywhere yet; separate project).
- Anti-cheat for the single-player overworld (already server-checked via `canStand` on `world/save`).

## Anti-goals

- Farming: a burst of alt wins must not move rating or the daily board.
- Leaking the opponent's hidden info (their moves and reserve HP) to the client.
- A refresh or lag spike that lets a losing player dodge the result.

## Constraints (from the repo)

- Battle rules live in `backend/src/services/battleSessionService.js`. Beats are already side-keyed (`runBeat(session, "player"|"enemy", move)`), but the enemy side's choices come from the AI (`pickEnemyMove`, `sendNextEnemy`). PvP replaces those with the opponent's choices.
- The Playground socket (`backend/src/playground/index.js`) is the only live channel. If the client leaves `PlaygroundScreen`, the socket drops, so the PvP battle renders as an overlay inside the Playground.
- `useBattle` talks REST. PvP needs an injectable transport; the view (`BattleView.jsx`) stays the same.
- Level-50 stats come from `statAtLevel` + `lookupSpecies` in `backend/src/campaign/hydrate.js`, using party `pokemon_id`.
- Server map collision: `canStand("playground", x, y)` in `backend/src/world/maps.js` (playground is in `maps.index.json`).
- Client step speed: run = 8 ticks @ 60 Hz ≈ 133 ms/tile; walk = 16 ticks ≈ 267 ms/tile.
- Last migration is `014`; next is `015`.

## Approaches considered

1. **Extend `battleSessionService` with a two-sided round resolver (picked).** Reuses every beat, status and faint rule. Cost: new switch/send code paths for the enemy side.
2. Separate PvP engine. Duplicates ~1000 lines of battle rules that would drift. Rejected.
3. Run PvP as two AI sessions synced together. Their RNG and state diverge. Rejected.

Team approaches A/B/C were laid out in conversation; user picked **B (level 50)**.

## Design

**Challenge flow (socket, Playground).** `pvp:challenge {targetId}` → the target gets `pvp:challenged {fromId, name}` → `pvp:respond {fromId, accept}`. Rules: both signed in (numeric trainerId, no guests), neither in a match, within `CHAT_RADIUS_PX` (6 tiles), both have ≥1 party mon. A challenge expires after 30 s. One outgoing challenge per trainer.

**Match.** The server builds a session from both scaled parties (A = "player" side, B = "enemy" side) and emits `pvp:start` to each with that side's view. Each round, both sides send `pvp:action {type:"move"|"switch", ...}`. When both are in (or a forced send after a faint is chosen), the server resolves the round and emits `pvp:round {events, state}` to each, mirrored for B. Round timer: 60 s. No action in time → that side forfeits. Disconnect → forfeit. Explicit `pvp:forfeit` is allowed.

**Round order.** Switches first (A then B), then moves by `engine.turnOrder` with priority, then end-of-round chip (existing). A fainted side picks its replacement before the next round. Both fainted → both pick.

**Views.** `viewFor(session, side)`: side B gets player/enemy swapped and event `"player"/"enemy"` values flipped. The opponent's party is sent without `moves`, and its non-active members are reduced to `{position, nickname, pokemon_id, fainted}`.

**Elo + boards.** Migration `015_pvp.sql`:
- `pvp_rating(trainer_id PK FK, rating INT DEFAULT 1000, wins INT, losses INT, updated_at)`
- `pvp_match(id PK AI, a_id, b_id, winner_id NULL, day DATE, rated TINYINT, delta INT, ended_by ENUM('ko','forfeit','timeout','disconnect'), created_at)` with index `(day)` and `(a_id, b_id, day)`.

On match end, inside one transaction: count today's matches for the unordered pair, call `rate()`, update both ratings (W/L always increments), and insert the match. Boards (REST `GET /api/pvp/leaderboard?board=rating|today`, top 20): rating = order by rating with ≥1 game. Today = count of **rated** wins where `day = dayKey()` (my call: so alt farming can't top the daily board either).

**Anti-cheat (Playground `move`).** Convert px → tile. Reject unless the tile is the same or 1 orthogonal tile away, `canStand("playground")` is true, and a step budget allows it. Budget is a token bucket: refill 8 tiles/s (just above run speed), burst 3. On reject, emit `player:correct {x, y}` to the sender only and broadcast nothing. Accepted moves that change tile add 1 step. `spawnPoint` must return a free tile (today it can land on the fountain, and the client then jumps several tiles). Steps persist in `trainer_steps(trainer_id PK, steps BIGINT)`, flushed on disconnect and every 60 s, and show on the trainer record.

**UI.**
- Face a trainer and press A, or click their name in the roster → "Challenge NAME?" dialog. Incoming challenge → Accept/Decline toast.
- The battle overlay reuses `BattleView` through a `usePvpTransport`. "Waiting for NAME…" shows while your action is in and theirs isn't.
- The plaza notice board (A at `board` spot) opens the ladder with two tabs, Rating and Today.

## Left to the builder

Copy wording, overlay styling, how the forfeit button looks, log line text.
