# Real-time PvP, Elo Ladder, Movement Anti-cheat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Live 1v1 battles in the Playground with level-50 copies of real parties, an Elo ladder plus a "most wins today" board, a 3-per-pair daily rating cap, and server-validated Playground movement and steps.

**Architecture:** A two-sided round resolver inside `createBattleSessionService` reuses every existing beat/status/faint rule. A match registry in `backend/src/pvp/` drives it over the existing Playground socket. Results go through the existing `elo.js` into two new MySQL tables. Playground `move` events become tile-step checks against the server copy of `playground.json`.

**Tech Stack:** Node + Express + Socket.IO + mysql2 (backend, `node:test`); React + Vite (frontend, `node:test` + Vitest).

**Spec:** `docs/superpowers/specs/2026-11-20-pvp-elo-anticheat-design.md`

## Global Constraints

- PvP level is exactly **50** for every mon; stats via `statAtLevel(base, 50, isHp)`; full HP, full PP, no status.
- PvP never writes HP, PP, XP, coins, progress, flags or battle history for either trainer.
- Elo constants come from `services/elo.js` only (START 1000, K 32, RATED_PER_PAIR_PER_DAY 3). Day = `dayKey()` (UTC).
- Guests (`typeof trainerId !== "number"`) cannot send or receive challenges.
- Challenge range = `CHAT_RADIUS_PX`; challenge expiry 30 000 ms; round timer 60 000 ms.
- Step budget: refill 8 tiles/s, burst 3; one orthogonal tile max per `move`.
- Product name in UI copy: "Pokemon Origins". No Claude co-author lines in commits.
- Backend tests: add every new `*.test.js` to the explicit list in `backend/package.json` `"test"`.

## Review Focus

1. **Both players act in the same millisecond / one double-sends.** Expect exactly one resolution per round. The second action for the same side in the same round gets `pvp:error "Already chose"`. (Test in Task 1.)
2. **Disconnect mid-round, then reconnect in a new tab.** Expect the forfeit recorded once. The new socket isn't in a match. An old tab closing must not forfeit a match owned by a newer socket. (Test in Task 3.)
3. **Opponent's moves/HP leaking.** `viewFor` output for either side has no `moves` on any enemy entry and no `current_hp` on non-active enemy entries. (Test in Task 1.)
4. **Pair cap counts the pair in either order.** Games A-vs-B and B-vs-A on the same UTC day share one count. (Test in Task 4.)
5. **Lag burst of buffered moves.** 3 queued legal steps arriving together are accepted. The 4th within ~125 ms is corrected, not teleported. (Test in Task 6.)

---

### Task 1: Two-sided PvP round resolver in the battle service

**Files:**
- Modify: `backend/src/services/battleSessionService.js` (add inside `createBattleSessionService`, export on the returned object; no change to campaign paths)
- Test: `backend/src/services/battleSessionService.pvp.test.js` (new; add to `package.json` test list)

**Interfaces:**
- Produces (on the object returned by `createBattleSessionService(deps)`):
  - `createPvpSession({ a: {trainerId, name, party}, b: {trainerId, name, party} }) -> Promise<session>`. `party` is an array of already-scaled raw mons. The session has the same shape as campaign sessions plus `pvp: { names: {player, enemy}, pending: {player: null|action, enemy: null|action}, needsSend: {player: false, enemy: false}, round: 1 }` and `status: "active"`. A side's moves come from `pending`, never `ai`.
  - `submitPvpAction(session, side /* "player"|"enemy" */, action) -> Promise<{ resolved: false } | { resolved: true, events: Event[] }>`. `action` is `{type:"move", moveId}` or `{type:"switch", partyPosition}`. Throws `CampaignError(400, msg)` on illegal actions.
  - `forfeitPvp(session, side) -> void`. Sets `session.status` to `"won"` if `side === "enemy"` gave up, else `"lost"`.
  - `viewFor(session, side) -> publicState` (side `"enemy"` = mirrored).
  - `mirrorEvents(events) -> Event[]` (swaps every own string field whose value is `"player"` or `"enemy"`).
- Session `status` meaning in PvP: `"won"` = side A (player) won, `"lost"` = side B won.

- [ ] **Step 1: Write the failing tests**

Use a stub `engine` (`turnOrder` returns `{first:"pokemon1"}` unless the test says otherwise; `calculateDamage` returns a fixed number) and `random: () => 0.5`, the same way `battleSessionService.test.js` builds deps.

```js
it("resolves only when both sides have acted", async () => {
	const s = await svc.createPvpSession(twoParties());
	assert.deepEqual(await svc.submitPvpAction(s, "player", { type: "move", moveId: 1 }), { resolved: false });
	const r = await svc.submitPvpAction(s, "enemy", { type: "move", moveId: 1 });
	assert.equal(r.resolved, true);
	assert.ok(r.events.some((e) => e.actor === "player") && r.events.some((e) => e.actor === "enemy"));
	assert.deepEqual(s.pvp.pending, { player: null, enemy: null });
});
it("rejects a second action from the same side in one round", async () => { /* CampaignError message "Already chose" */ });
it("switches resolve before moves for both sides", async () => { /* enemy switches, player attacks: damage lands on the switched-in enemy position */ });
it("a KO makes that side pick its replacement before the next round", async () => {
	/* enemy faints with reserves: s.pvp.needsSend.enemy === true; enemy "move" throws; enemy "switch" resolves alone and emits { actor:"enemy", type:"enemy_send" } */
});
it("last mon fainting ends the match", async () => { /* status "won" when enemy party all fainted */ });
it("viewFor hides opponent moves and reserve HP", () => {
	const v = svc.viewFor(s, "enemy");
	assert.equal(v.player.position, s.enemy.position); // mirrored
	assert.ok(!("moves" in v.enemy));
	assert.ok(v.enemyParty.every((m) => !("moves" in m)));
	assert.ok(v.enemyParty.filter((m) => m.position !== v.enemyActivePosition).every((m) => !("current_hp" in m)));
});
it("mirrorEvents swaps player/enemy values only", () => {
	assert.deepEqual(svc.mirrorEvents([{ actor: "player", target: "enemy", type: "move", damage: 5 }]),
		[{ actor: "enemy", target: "player", type: "move", damage: 5 }]);
});
it("never touches pp/hp/history stores", async () => { /* stores are spies; after a full match, zero calls */ });
```

- [ ] **Step 2: Run, verify fail**

Run: `cd backend && node --test src/services/battleSessionService.pvp.test.js`
Expected: FAIL, `svc.createPvpSession is not a function`.

- [ ] **Step 3: Implement**

- Build `party`/`enemyParty` with `snapshotPokemon`, the same as `startBattle`. Set `trainerName` = B's name, `battleType: "pvp"`, and `typeChart` the same way.
- Round resolve: (1) switches, player first then enemy. Generalise the existing `resolveSwitch` validation into `switchSide(session, side, position, events)`. The player side keeps using `session.party`/`activePosition`. The enemy side uses `enemyParty`/`enemyActivePosition` and emits `{actor:"enemy", type:"enemy_send", ...}` like `sendNextEnemy`. (2) Moves via the existing `engine.turnOrder` + `runBeat` loop from `resolveMove`. Stop the loop when either side faints. (3) `endOfRoundChip`.
- After a faint with reserves: set `pvp.needsSend[side] = true` instead of auto-sending. Clear the `requiresSwitch`/`enemyNeedsSend` flags the campaign path set, so `runBeat` and chip guards still work. While any `needsSend` is true, only those sides may submit, only `switch`, and the round resolves once every needing side has sent.
- Validate move legality with the same checks `resolveMove` does for the player (PP, disabled, Struggle). Factor them into `pickLegalMove(mon, moveId)` and reuse it in both places.
- `viewFor`: call `toPublicState`. For `"enemy"`, swap `player↔enemy`, `party↔enemyParty`, `activePosition↔enemyActivePosition`, and set `trainerName` = A's name. Then strip as tested. Add `pvp: { opponent: name, waitingOn: side has acted ? "opponent" : null, needsSend }`.

- [ ] **Step 4: Run, verify pass**

Run: `cd backend && node --test src/services/battleSessionService.pvp.test.js src/services/battleSessionService.test.js`
Expected: all pass (campaign tests unchanged).

- [ ] **Step 5: Commit**: `git commit -m "feat(pvp): two-sided round resolver in battle service"`

---

### Task 2: Level-50 party snapshot

**Files:**
- Create: `backend/src/pvp/party.js`
- Modify: `backend/src/campaign/hydrate.js` (export `lookupSpecies`)
- Test: `backend/src/pvp/party.test.js`

**Interfaces:**
- Produces: `createPvpPartyLoader({ getTrainerData, lookupSpecies }) -> async (trainerId) => RawMon[]` (max 6, by `position`). Also the default instance `loadPvpParty(trainerId)`.
- Each RawMon: the original row's `pokemon_id, nickname, position, gender, ability, types, moves` (each move's `current_pp = pp`), plus `level: 50`, `max_hp = current_hp = statAtLevel(hp,50,true)`, `attack/defense/special_atk/special_def/speed = statAtLevel(base,50,false)`, `status: null`.

- [ ] **Step 1: Failing test**

```js
it("scales every mon to level 50 from base stats, full HP/PP", async () => {
	const load = createPvpPartyLoader({
		getTrainerData: async () => ({ pokemon: [{ pokemon_id: 4, nickname: "Ember", level: 12, current_hp: 3, max_hp: 30, position: 1, moves: [{ move_id: 1, pp: 35, current_pp: 2 }] }] }),
		lookupSpecies: async () => ({ hp: 39, attack: 52, defense: 43, special_attack: 60, special_defense: 50, speed: 65 }),
	});
	const [m] = await load(7);
	assert.equal(m.level, 50);
	assert.equal(m.max_hp, 99); // floor(2*39*50/100)+50+10
	assert.equal(m.current_hp, 99);
	assert.equal(m.speed, 70); // floor(2*65*50/100)+5
	assert.equal(m.moves[0].current_pp, 35);
});
it("caps at 6 and returns [] for an empty party", async () => { /* 7 rows in → 6 out, lowest positions */ });
```

- [ ] **Step 2: Run, verify fail**: `cd backend && node --test src/pvp/party.test.js` → module not found.
- [ ] **Step 3: Implement** as specified. Pokédex column names: `special_attack`/`special_defense`. Party row names: `special_atk`/`special_def`.
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit**: `feat(pvp): level-50 party snapshot`

---

### Task 3: Match registry + socket wiring

**Files:**
- Create: `backend/src/pvp/matches.js`
- Modify: `backend/src/playground/index.js` (wire events, forfeit on owning-socket disconnect)
- Test: `backend/src/pvp/matches.test.js`; extend `backend/src/playground/index.test.js` with one wiring test

**Interfaces:**
- Consumes: Task 1 service methods; Task 2 `loadPvpParty`.
- Produces: `createMatchRegistry({ battle, loadParty, recordResult, emitTo, distance, setTimer, clearTimer })`. Every dependency is injectable:
  - `emitTo(trainerId, event, payload)`
  - `distance(aId, bId) -> px | null`
  - `recordResult({ aId, bId, winnerId, endedBy }) -> Promise<{ a:{rating,delta}, b:{rating,delta}, rated } | null>`. Task 3 passes `async () => null`; Task 4 swaps in the real one.
  - Methods: `challenge(fromId, fromName, toId)`, `respond(toId, fromId, accept)`, `act(trainerId, action)`, `forfeit(trainerId, endedBy = "forfeit")`, `inMatch(trainerId) -> boolean`.
- Socket events (server → client): `pvp:challenged {fromId, name}`, `pvp:declined {byId}`, `pvp:expired {fromId, toId}`, `pvp:start {matchId, state}`, `pvp:waiting {}`, `pvp:round {events, state}`, `pvp:end {winnerId, endedBy, rating: {rating, delta, rated} | null}`, `pvp:error {message}`.
- Socket events (client → server): `pvp:challenge {targetId}`, `pvp:respond {fromId, accept}`, `pvp:action {type, moveId?, partyPosition?}`, `pvp:forfeit`.

- [ ] **Step 1: Failing tests** (fake timers: `setTimer` pushes to an array the test fires by hand)

```js
it("rejects guests, self, out-of-range, busy, empty-party challenges", async () => { /* each emits pvp:error to challenger, no pvp:challenged */ });
it("accept starts a match and sends each side its own view", async () => { /* pvp:start to A has state.player = A's lead; to B has B's lead */ });
it("challenge expires after 30 s", () => { /* fire timer → pvp:expired to both; respond afterwards → pvp:error */ });
it("round resolves once, mirrored to B", async () => { /* A acts → A gets pvp:waiting; B acts → both get pvp:round; B's events mirrored */ });
it("60 s with no action forfeits the idle side", async () => { /* only A acted; fire round timer → pvp:end winnerId=A, endedBy "timeout"; recordResult called once */ });
it("disconnect forfeits once; second forfeit is a no-op", async () => { /* recordResult called once */ });
it("KO ends the match and calls recordResult with endedBy 'ko'", async () => {});
it("recordResult throwing still sends pvp:end with rating null", async () => {});
```

In `index.test.js`: a trainer with an older socket and a newer one; the older one disconnects → no `pvp:end` is emitted.

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement.**
  - Matches live in a `Map` keyed by matchId, plus a `trainerId -> matchId` map. On end: clear timers and both map entries, call `recordResult` and wait for it, then emit `pvp:end` to both with each side's own `{rating, delta, rated}`.
  - In `index.js`: `distance` uses `roomState` positions. `emitTo` uses `trainerSockets`. In the `disconnect` handler, after the existing ownership guard: `registry.forfeit(trainerId, "disconnect")`. Every PvP handler drops events from guests.
- [ ] **Step 4: Run, verify pass**: `cd backend && node --test src/pvp/matches.test.js src/playground/index.test.js`
- [ ] **Step 5: Commit**: `feat(pvp): challenge/match registry over playground socket`

---

### Task 4: Elo persistence + leaderboards

**Files:**
- Create: `database/migrations/015_pvp.sql`, `backend/src/services/pvpLadderService.js`, `backend/src/routes/pvp.js`
- Modify: `backend/server.js` (`app.use("/api/pvp", pvpRoutes)`), `backend/src/playground/index.js` (pass real `recordResult`), `backend/package.json` (add `elo.test.js` and the new test — `elo.test.js` is missing from the list today)
- Test: `backend/src/services/pvpLadderService.test.js`

**Interfaces:**
- Consumes: `elo.rate`, `elo.dayKey`, `elo.START`.
- Produces: `createPvpLadderService({ store, now })`, where `store` is `createMysqlLadderStore(pool)` or `createMemoryLadderStore()`.
  - `recordResult({ aId, bId, winnerId, endedBy })` → shape from Task 3.
  - `leaderboard(board /* "rating"|"today" */, limit = 20) -> [{ rank, trainerId, name, rating, wins }]`.
- Store interface: `withTransaction(fn)`, `getRatings(ids)`, `pairCountToday(aId, bId, day)`, `saveRatings(rows)`, `insertMatch(row)`, `topRatings(limit)`, `topWinsToday(day, limit)`.
- SQL:
  - Tables exactly as in the spec.
  - Pair count: `WHERE day = ? AND ((a_id = ? AND b_id = ?) OR (a_id = ? AND b_id = ?))`.
  - Today board: `WHERE day = ? AND rated = 1 AND winner_id IS NOT NULL GROUP BY winner_id`.
  - Rating rows are read with `SELECT ... FOR UPDATE` inside the transaction.
  - Migration header follows the 013 style (`USE \`trainer\`;`, re-runnable).
- Route: `GET /api/pvp/leaderboard?board=rating|today` behind `requireAuth`. An unknown board returns 400.

- [ ] **Step 1: Failing tests** (memory store, clock fixed to `Date.UTC(2026,10,20,12)`)

```js
it("new players start at 1000 and swap 16 on an even win", async () => {
	const r = await ladder.recordResult({ aId: 1, bId: 2, winnerId: 1, endedBy: "ko" });
	assert.deepEqual([r.a.rating, r.b.rating, r.rated], [1016, 984, true]);
});
it("4th game of the pair today is unrated in either order", async () => {
	for (const [a, b] of [[1, 2], [2, 1], [1, 2]]) await ladder.recordResult({ aId: a, bId: b, winnerId: a, endedBy: "ko" });
	const r = await ladder.recordResult({ aId: 2, bId: 1, winnerId: 2, endedBy: "ko" });
	assert.equal(r.rated, false);
	assert.equal(r.a.delta, 0);
});
it("unrated wins still count W/L but not on the today board", async () => {});
it("next UTC day resets the pair cap", async () => {});
it("today board orders by rated wins; rating board by rating, ≥1 game", async () => {});
it("upset pays more than farming", async () => { /* seed 1400 vs 1000: underdog win delta ≥ 29; favourite win ≤ 3 */ });
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** service, memory + MySQL stores, migration, route, wiring.
- [ ] **Step 4: Run, verify pass**: `cd backend && node --test src/services/pvpLadderService.test.js src/services/elo.test.js`
- [ ] **Step 5: Manual DB check.** The user applies `015_pvp.sql` themselves in their MySQL client. Expected: `SHOW TABLES LIKE 'pvp_%'` lists `pvp_match` and `pvp_rating`.
- [ ] **Step 6: Commit**: `feat(pvp): Elo ladder with per-pair daily cap and today board`

---

### Task 5: Frontend — challenge, battle overlay, ladder board

**Files:**
- Modify:
  - `frontend/src/v2/battle/useBattle.js`: optional `transport` param.
  - `frontend/src/v2/pages/battle/BattleView.jsx`: pass `transport`; hide Bag/Run when `battleType === "pvp"`; show Forfeit.
  - `frontend/src/v2/pages/playground/usePlayground.js`: pvp events and emitters.
  - `PlaygroundStage.jsx`: A on a trainer → challenge; A on `board` → ladder.
  - `PlaygroundScreen.jsx`: challenge toast, battle overlay.
- Create: `frontend/src/v2/pages/playground/pvpTransport.js`, `frontend/src/v2/pages/playground/LadderPanel.jsx`
- Test: `frontend/src/v2/pages/playground/pvpTransport.test.js`; extend `frontend/src/v2/battle/useBattle.spec.jsx`

**Interfaces:**
- Consumes: Task 3 socket events; Task 4 `GET /api/pvp/leaderboard`.
- Produces: `createPvpTransport(socket, initialState) -> { start(): Promise<{state, resumed:false}>, act(action): Promise<{state, events}>, forfeit(): void, onEnd(cb) }`. `act` emits `pvp:action` and resolves on the next `pvp:round`. It rejects on `pvp:error` and settles on `pvp:end` with the final state.
- `useBattle({ ..., transport })`: when `transport` is given, `start`/`act` call it instead of `api.post`. Every other code path stays unchanged.

- [ ] **Step 1: Failing tests**

```js
// pvpTransport.test.js (fake socket = EventEmitter with an emit spy)
it("act resolves with the next pvp:round", async () => { /* "pvp:action" emitted; fire pvp:round → resolves {state, events} */ });
it("act rejects on pvp:error", async () => {});
it("onEnd fires once with winnerId and rating", () => {});
// useBattle.spec.jsx
it("uses the injected transport instead of the REST api", async () => { /* api.post never called */ });
```

- [ ] **Step 2: Run, verify fail**: `cd frontend && node --test src/v2/pages/playground/pvpTransport.test.js && npx vitest run src/v2/battle/useBattle.spec.jsx`
- [ ] **Step 3: Implement.**
  - A while facing a trainer's tile → "Challenge NAME?" yes/no in the existing dialog box.
  - Incoming challenge → toast with Accept/Decline. It hides on `pvp:expired`.
  - While waiting, the battle line shows "Waiting for NAME…".
  - On `pvp:end`, show "You won!"/"You lost." plus "Rating 1016 (+16)", or "Unrated (daily limit vs NAME)" when `rated` is false. Then close the overlay.
  - `LadderPanel` has two tabs, Rating and Today. Each row shows rank, name, and rating or wins, and your own row is highlighted.
- [ ] **Step 4: Run, verify pass**: `cd frontend && npm test`
- [ ] **Step 5: Manual check.** Open two browsers (one normal, one incognito, different accounts) in the Playground. Challenge, accept, fight to a KO, see the rating change, and open the board. Fight a 4th time the same day: it shows "Unrated".
- [ ] **Step 6: Commit**: `feat(pvp): playground challenge, battle overlay, ladder board`

---

### Task 6: Server-side movement validation + steps

**Files:**
- Modify:
  - `backend/src/playground/movement.js`: replace `resolveMove`; `spawnPoint` only returns free tiles.
  - `backend/src/playground/index.js`: use it, `player:correct`, step counting and flush.
  - `frontend/src/v2/pages/playground/usePlayground.js` + `playgroundGame.js`: snap self on `player:correct`.
  - `backend/src/services/profileService.js` + `frontend/src/v2/pages/hub/TrainerRecord.jsx`: show steps.
- Create: `database/migrations/016_trainer_steps.sql`, `backend/src/services/stepService.js`
- Test: `backend/src/playground/movement.test.js` (rewrite the `resolveMove` cases), `backend/src/services/stepService.test.js`

**Interfaces:**
- Produces: `validateStep(current /* {x,y} px */, target, budget /* {tokens, at} */, nowMs, canStand = (tx,ty)=>maps.canStand("playground",tx,ty)) -> { ok, x, y, stepped, budget }`. `x,y` = the accepted position, or `current` when rejected. `stepped` = tile changed.
- Constants: `STEP_REFILL_PER_SEC = 8`, `STEP_BURST = 3`. Remove `MAX_SPEED_PX_PER_SEC` and its tests.
- `createStepService({ store }) -> { add(trainerId, n), flush(trainerId?), get(trainerId) }`. Counts are buffered in memory and written as `INSERT ... ON DUPLICATE KEY UPDATE steps = steps + ?`.
- Table: `trainer_steps(trainer_id INT PK FK trainers ON DELETE CASCADE, steps BIGINT NOT NULL DEFAULT 0)`.

- [ ] **Step 1: Failing tests**

```js
it("accepts one orthogonal free tile", () => { /* ok, stepped */ });
it("rejects diagonal, 2-tile jumps, non-tile-aligned, out of bounds", () => {});
it("rejects stepping into a wall", () => { /* canStand stub false → ok:false, x,y = current */ });
it("same tile (facing change) is ok and not a step", () => {});
it("burst of 3 ok, 4th inside 125 ms rejected, refills at 8/s", () => {});
it("spawnPoint always lands on a free tile", () => { /* 200 seeded randoms, canStand true for every result */ });
// stepService.test.js
it("buffers and flushes increments; guests are ignored", async () => {});
```

Plus an `index.test.js` case: an illegal move gets `player:correct` to the sender only, with no `player:moved` broadcast and no step counted.

- [ ] **Step 2: Run, verify fail**: `cd backend && node --test src/playground/movement.test.js src/services/stepService.test.js`
- [ ] **Step 3: Implement.**
  - The budget is kept per trainer in `index.js` (replaces `lastMoveAt`).
  - Flush on the owning socket's disconnect and on a 60 s `setInterval(...).unref()`.
  - The client handles `player:correct` by placing `game.player` at that tile and cancelling the walk in progress.
  - `profileService` returns `steps`, and `TrainerRecord` shows it next to wins.
- [ ] **Step 4: Run, verify pass**: `cd backend && npm test` and `cd frontend && npm test`
- [ ] **Step 5: Manual check.**
  - Apply `016_trainer_steps.sql`.
  - In the devtools console: `socket.emit("move", {x: 0, y: 0})` → your trainer snaps back, and the other browser sees nothing.
  - Walk 10 tiles, reconnect → the trainer record shows +10.
- [ ] **Step 6: Commit**: `feat(playground): server-validated steps, wall and speed checks`

---

After every task: `graphify update .` (project rule).
