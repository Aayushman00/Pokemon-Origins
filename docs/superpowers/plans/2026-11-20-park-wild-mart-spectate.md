# Playground: Mart Stall, Park Wild Pokémon, Battle Stands — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Playground a server clock for day/night, a tall-grass patch with a rare time-of-day wild table, a Mart stall, and stands where anyone can watch up to 5 live PvP matches.

**Architecture:** The server owns time (`playground/clock.js`) and sends it in `room:init` and `world:time`. Park battles reuse the wild-battle path: the client sends `wild: "playground"`, and `battleSessionService` swaps in `park.json`'s `day` or `night` table, gated by `CATCH`. Spectating extends the in-memory match registry with a match list, a 5-match cap, and Socket.IO rooms `watch:<matchId>`. A read-only transport feeds rounds to the existing battle screen.

**Tech Stack:** Node/Express + Socket.IO, `node:test`; React + Vite, `node:test` + Vitest; Python map build (`scripts/overworld_art`).

**Spec:** `docs/superpowers/specs/2026-11-20-park-wild-mart-spectate-design.md`

## Global Constraints

- Day 06:00–17:59, night 18:00–05:59, server local time (`Date#getHours`).
- Park species = the 62 the overworld never offers: starter bases 1, 4, 7; starter middles 2, 5, 8; the 56 final evolutions. Legendaries 144, 145, 146, 150, 151 never appear.
- Night finals (13): 20, 24, 36, 40, 42, 49, 53, 65, 89, 94, 97, 105, 110. Day finals: the other 43.
- Weights per table with N finals: base 2N each, middle N each, final 1 each.
- Levels follow T = the party's highest level:
  - finals [max(10,T), max(10,T)+3], capped at 100
  - bases [T−3, T−1] clamped to 2..15
  - middles [T−3, T−1] clamped to 2..31
- Encounter chance per grass step = `WILD_CHANCE` (0.1), from `frontend/src/v2/overworld/game/overworld.js`.
- Park battles need `CATCH` on and a signed-in trainer. They don't need `OVERWORLD`, and campaign level doesn't matter.
- At most 5 PvP matches per room (`MAX_MATCHES = 5`). Refusal copy: `The stadium is full — wait for a battle to finish`.
- Spectators never see either side's moves or reserve HP.
- No new dependencies. No Claude attribution in commits.

## Review Focus

1. **Rounds arrive while the watcher is still animating the last one.** All of them play in order; none are dropped. Pinned in Task 6 ("queues rounds").
2. **The match ends while a watcher waits.** `nextRound()` resolves with `{ end }`, and the screen shows the winner. Pinned in Task 6.
3. **A 6th challenge while 5 matches run, or 4 running and 1 still starting.** Refused. Pinned in Task 5 ("counts starting matches").
4. **A seated trainer asks to watch their own match.** Refused. Pinned in Task 5.
5. **A trainer in a park battle gets challenged.** The client declines automatically. Pinned in Task 3 (`parkBusy`).

---

### Task 1: Server clock and shared sky

**Files:**
- Create: `backend/src/playground/clock.js`, `backend/src/playground/clock.test.js`
- Modify: `backend/src/playground/index.js` (room:init payload, minute interval), `backend/src/playground/index.test.js`, `backend/package.json` (test list)
- Modify: `frontend/src/v2/pages/playground/usePlayground.js` (`time`, `catchOn`), `PlaygroundStage.jsx` (drop `isNight` and its MutationObserver), `PlaygroundScreen.jsx`

**Interfaces:**
- Produces: `timeOfDay(date: Date) → "day" | "night"` and `createSkyWatch({ getTime: () => string, onFlip: (time) => void }) → { check(): void, current(): string }`.
- `room:init` gains `time: "day"|"night"` and `catch: boolean`. On a flip, the server broadcasts `world:time { time }` to the room.
- `attachPlayground` options gain `clock = () => timeOfDay(new Date(now()))` and `catchOn = () => flags.isEnabled("CATCH")`.
- `usePlayground()` return gains `time` and `catchOn`.

- [ ] **Step 1: Write failing tests in `clock.test.js`.** `timeOfDay` at 05:59 → night, 06:00 → day, 17:59 → day, 18:00 → night, 00:00 → night (build dates with `new Date(2026, 10, 20, h, m)`). `createSkyWatch` with a mutable `getTime`: `check()` with no change calls `onFlip` 0 times; after a change it calls it once with the new value; calling again without a change calls it 0 more times.
- [ ] **Step 2: Add an `index.test.js` case.** "room:init carries the sky and the catch flag": inject `clock: () => "night"` and `catchOn: () => true`; assert `init.time === "night"` and `init.catch === true`.
- [ ] **Step 3: Run and watch both fail.** `cd backend && node --test src/playground/clock.test.js src/playground/index.test.js`. Expected: FAIL, cannot find `./clock` / `time` undefined.
- [ ] **Step 4: Implement.** Write `clock.js`. In `attachPlayground`, build one `createSkyWatch({ getTime: clock, onFlip: (time) => io.to(ROOM_ID).emit("world:time", { time }) })`, run `setInterval(sky.check, 60_000).unref?.()`, and add `time: sky.current(), catch: catchOn()` to the `room:init` payload. Add `clock.test.js` to `backend/package.json`'s test list.
- [ ] **Step 5: Run and watch them pass.** Same command. Expected: PASS.
- [ ] **Step 6: Wire the client.**
  - `usePlayground`: on `room:init`, store `time` and `catch` (as `catchOn`). On `world:time`, update `time`.
  - `PlaygroundStage` gets prop `time`. Delete `isNight` and the observer. Keep `timeRef`, call `game.setNight(timeRef.current === "night")` right after creating the game, and add `useEffect(() => gameRef.current?.setNight(time === "night"), [time])`.
  - `PlaygroundScreen` passes `time={play.time}`.
- [ ] **Step 7: Verify the frontend.** `cd frontend && npm test && npx vite build`. Expected: all pass, build clean.
- [ ] **Step 8: Commit.** `git commit -m "Playground: server clock decides day and night"`.

### Task 2: Park wild table, party-scaled levels, and server gating

**Files:**
- Create: `backend/data/encounters/park.json`, `backend/src/campaign/park.js`, `backend/src/campaign/park.test.js`
- Modify: `backend/src/campaign/wild.test.js` (skip `playground` zones), `backend/src/services/battleSessionService.js` (`resolveWildTable`, `startBattle`), `backend/src/services/battleSessionService.test.js`, `backend/package.json`

**Interfaces:**
- Consumes: `timeOfDay` (Task 1).
- Produces, from `park.js`:
  - `parkLevels(stage: "base"|"middle"|"final", top: number) → [lo, hi]`
  - `getParkTable(time: "day"|"night", top: number, dataDir?) → { minLevel: 0, levels: [lo, hi], slots: [{ id, weight, levels }] } | null`, wild-table shaped. `levels` is the min/max over the slots.
- `park.json`: `{ day: { slots: [{ id, weight, stage }] }, night: { ... } }`.
- New deps on `createBattleSessionService`: `findParkTable` (default `park.getParkTable`) and `parkTime` (default `() => timeOfDay(new Date())`).
- `startBattle(trainerId, { wild: "playground" })` → a wild battle from the current time's park table, levelled from the trainer's party.

- [ ] **Step 1: Write `park.test.js`.** Derive `finals` from `database/pokedex_data.sql` the same way `wild.test.js` does (copy its parsing).
  - "uses exactly the 62 park species, no legendary": the union of both tables' ids equals {1, 2, 4, 5, 7, 8} ∪ (finals − legendaries). Size 62; none of 144, 145, 146, 150, 151.
  - "each table holds all six starter-line species, staged base (1, 4, 7) and middle (2, 5, 8)".
  - "night finals are exactly [20, 24, 36, 40, 42, 49, 53, 65, 89, 94, 97, 105, 110]; day finals are the rest; none in both".
  - "weights follow 2N / N / 1": base 2N, middle N, final 1 (finals' share 10%).
  - "parkLevels":
    - `("final", 5)` → [10, 13]; `("final", 40)` → [40, 43]; `("final", 99)` → [99, 100]
    - `("base", 5)` → [2, 4]; `("base", 30)` → [15, 15]
    - `("middle", 5)` → [2, 4]; `("middle", 40)` → [31, 31]
  - "getParkTable levels every slot from top": `getParkTable("night", 20)` puts Gengar (94) at [20, 23] and Bulbasaur at [15, 15]. `getParkTable("dusk", 20) === null`.
- [ ] **Step 2: Run and watch it fail.** `cd backend && node --test src/campaign/park.test.js`. Expected: FAIL, cannot find `./park`.
- [ ] **Step 3: Generate `park.json` once.** Use a throwaway node one-liner from the rule above (not committed). Slots are ordered bases, middles, then finals by id. Then write `park.js`, reading the file with the loader's `readJson` and `DATA_DIR`.
- [ ] **Step 4: Run and watch it pass.** Expected: PASS.
- [ ] **Step 5: Update `wild.test.js`.** "every encounter zone names a table that exists" adds `if (table === "playground") continue; // park.json, see park.test.js`.
- [ ] **Step 6: Write failing session tests.** Add `describe("park battles")`, using `makeService` with a `findParkTable` spy that records `(time, top)` and returns a one-slot table (Bulbasaur by day, Gengar by night, `levels: [top, top]`).
  - "flag off → 404 Not found": `catchOn: () => false`.
  - "night clock picks the night table": `parkTime: () => "night"` → the enemy is 94.
  - "levels come from the party's highest level": a party at Lv 12 and Lv 30 → the spy saw top 30, and the enemy is Lv 30.
  - "works with OVERWORLD off at campaign level 1": `overworldOn: () => false`, progress `current_level: 1` → it starts, `battleType: "wild"`.
- [ ] **Step 7: Run and watch them fail.** `node --test src/services/battleSessionService.test.js`. Expected: 4 FAIL.
- [ ] **Step 8: Implement.**
  - `resolveWildTable` gets, first: `if (id === "playground") { if (!catchOn()) throw new CampaignError(404, "Not found"); return { park: parkTime() }; }`.
  - In `startBattle`, when `wildTable?.park`, load the party first, then call `getWildBattle(findParkTable(wildTable.park, Math.max(...partyRaw.map((m) => m.level))))`. Other battles keep the existing `Promise.all`.
  - Add `park.test.js` to the test list.
- [ ] **Step 9: Run the whole backend suite.** `cd backend && npm test`. Expected: all pass.
- [ ] **Step 10: Commit.** `git commit -m "Park wild table by time of day, levels follow the party, behind CATCH"`.

### Task 3: Grass patch, encounters, and park battles in the Playground

**Files:**
- Modify: `scripts/overworld_art/towns.py` (`playground()`), `scripts/overworld_art/test_nature.py` (`PlaygroundMap`), `frontend/public/maps/playground.json` (rebuilt)
- Modify: `frontend/src/v2/overworld/logic/fixtures.js` (`asciiMap` option `encounters = []`)
- Modify: `frontend/src/v2/pages/playground/playgroundGame.js`, `playgroundGame.test.js`, `PlaygroundStage.jsx`, `PlaygroundScreen.jsx`

**Interfaces:**
- Consumes: `play.catchOn` (Task 1), `wild: "playground"` (Task 2).
- `createPlaygroundGame({ ..., onWild?: (table) => void, encounterRoll = Math.random })` calls `onWild(table)` on a `stepEnd` inside an encounters zone when `encounterRoll() < WILD_CHANCE`.
- `parkBusy(incoming, inParkBattle) → boolean`, exported from `playgroundGame.js`: true means auto-decline the challenge.

- [ ] **Step 1: Update the Python map test.** In `test_every_spawn_lands_on_open_ground_within_earshot`, replace `assertEqual(groups.get("encounters", []), [])` with a check: every encounters object has `table == "playground"`, and together they cover exactly the `g` cells of `towns.PLAYGROUND` (x 29–34, y 16–19).
- [ ] **Step 2: Run and watch it fail.** `python3 -m unittest scripts.overworld_art.test_nature.PlaygroundMap -v`. Expected: FAIL, no encounter objects.
- [ ] **Step 3: Implement and rebuild.** In `playground()`, add `for i, (x, y, w) in enumerate(grass_runs(PLAYGROUND)): m.obj("encounters", f"grass_{i + 1}", x, y, w, 1, table="playground")`, importing `grass_runs` the same way `towns.py` gets `dress_grass`. Run `python3 -m scripts.overworld_art.build_all`, then `git status`.
  - Expected: of the maps, only `playground.json` changes.
  - Revert any other changed output with `git checkout -- <file>`, and ledger a ruling.
- [ ] **Step 4: Run and watch it pass.** The same test, plus `cd backend && node --test src/campaign/wild.test.js`. Expected: PASS.
- [ ] **Step 5: Write failing game tests in `playgroundGame.test.js`.** Use `asciiMap(..., { encounters: [{ x: 1, y: 0, props: { table: "playground" } }] })`.
  - "a step into grass rolls an encounter": `encounterRoll: () => 0`. After one tile right, `onWild` was called once with `"playground"`.
  - "a missed roll starts nothing": roll `() => 0.5` → 0 calls.
  - "no onWild, no roll": omit `onWild`, and the roll is never called.
  - "parkBusy": `parkBusy({ fromId: 2 }, true) === true`, `parkBusy({ fromId: 2 }, false) === false`, `parkBusy(null, true) === false`.
- [ ] **Step 6: Run and watch them fail.** `cd frontend && node --test src/v2/pages/playground/playgroundGame.test.js`. Expected: FAIL.
- [ ] **Step 7: Implement.**
  - `fixtures.js` adds an `encounters` objectgroup like `signs`.
  - `tick` handles `e.type === "stepEnd"`: `const table = onWild && wildTable(map, actor); if (table && encounterRoll() < WILD_CHANCE) onWild(table);`. Import `wildTable` from `overworld/logic/events.js` and `WILD_CHANCE` from `overworld/game/overworld.js`.
  - Add `parkBusy`.
- [ ] **Step 8: Run and watch them pass.** Expected: PASS.
- [ ] **Step 9: Wire the screen.**
  - `PlaygroundStage` takes `onWild` and passes `(t) => uiRef.current.onWild?.(t)` to the game, so the latest callback is used.
  - `PlaygroundScreen` keeps `park` state and passes `onWild={play.catchOn && !isGuestId(play.selfId) ? setPark : undefined}`.
  - While `park` is set, it returns `<BattleView wild="playground" levelName="In the park's tall grass" ... />`, with continue/leave/lost/run all calling `setPark(null)`.
  - An effect calls `play.respond(pvp.incoming.fromId, false)` when `parkBusy(pvp.incoming, !!park)`.
- [ ] **Step 10: Verify.** `cd frontend && npm test && npx vite build`. Expected: pass, clean.
- [ ] **Step 11: Commit.** `git commit -m "Playground tall grass: wild battles from the park table"`.

### Task 4: Mart stall

**Files:**
- Modify: `frontend/src/v2/pages/playground/playgroundGame.js` (`SPOTS`), `playgroundGame.test.js`, `PlaygroundStage.jsx`, `PlaygroundScreen.jsx`, `frontend/src/v2/pages/mart/MartScreen.jsx`, `scripts/overworld_art/towns.py` (spot comment only)

**Interfaces:**
- `SPOTS` gains `{ kind: "mart", x: 32, y: 9, w: 1, h: 2 }` (the barrel and crate).
- `PlaygroundStage` prop `onSpot(kind) → boolean` (true = handled) replaces `onBoard`.
- `MartScreen({ onClose?: () => void })`: when given, both "Back to hub" buttons become `onClick={onClose}` labelled "Close"; no navigation.

- [ ] **Step 1: Write a failing test.** "the barrel stall is the Mart": `spotAt(32, 9).kind === "mart"` and `spotAt(32, 10).kind === "mart"`.
- [ ] **Step 2: Run and watch it fail.** `node --test src/v2/pages/playground/playgroundGame.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add the spot.
  - The Stage's A press calls `ui.onSpot?.(spot.kind)` first and falls back to `setDialog(spotText(...))` when it returns false.
  - `PlaygroundScreen`: `board` → ladder, `mart` → `martOpen`. Render `<Modal open={martOpen} title="Mart stall"><MartScreen onClose={...} /></Modal>`. `martOpen` joins `busy`.
- [ ] **Step 4: Run and watch it pass.** Then `npm test && npx vite build`. Expected: pass, clean.
- [ ] **Step 5: Commit.** `git commit -m "Playground Mart stall"`.

### Task 5: Spectating and the 5-match cap (server)

**Files:**
- Modify: `backend/src/services/battleSessionService.js` (`spectatorView`, exported on the service like `viewFor`), `backend/src/services/battleSessionService.pvp.test.js`
- Modify: `backend/src/pvp/matches.js`, `backend/src/pvp/matches.test.js`
- Modify: `backend/src/playground/index.js`, `backend/src/playground/index.test.js`

**Interfaces:**
- `spectatorView(session)`: `viewFor(session, "player")`, with `player` passed through `hideFoe(_, true)` and `party` hidden like `enemyParty`. Also `requiresSwitch: false` and `pvp: { spectator: true, names: { player, enemy }, round }`.
- `createMatchRegistry` deps gain `broadcast(event, payload)` (lobby) and `emitWatchers(matchId, event, payload)`.
- The registry gains:
  - `list() → [{ matchId, names: { player, enemy }, round }]`
  - `watch(viewerId, matchId) → { state } | { error }`
- Exports `MAX_MATCHES = 5`.
- Events:
  - server → lobby: `pvp:matches { matches }` on every start and end.
  - server → watchers: `pvp:watch-round { matchId, events, state }` and `pvp:watch-end { matchId, winnerName, endedBy, state }`.
  - client → server: `pvp:watch { matchId }` (on success: `socket.join("watch:" + matchId)`, then emit `pvp:watching { matchId, state }`; otherwise `pvp:error`) and `pvp:unwatch` (leave every `watch:` room).
- `room:init` gains `matches: registry.list()`.

- [ ] **Step 1: Write a failing pvp-session test.** "spectatorView hides both sides' moves and reserve HP": the player and enemy have no `moves`; non-active `party` entries have no `current_hp`; `pvp.names` names both trainers.
- [ ] **Step 2: Write failing registry tests in `matches.test.js`.** Extend `setup` with `broadcast`/`emitWatchers` recorders, and give `PARTIES`/`NAMES` 12 trainers.
  - "a 6th match is refused while 5 run": after 5 `startMatch` calls, the 6th challenger gets `pvp:error` with the stadium copy.
  - "counts starting matches": the 5th accept's `loadParty` is held on an unresolved promise. The 6th challenge is refused.
  - "list shows live matches; start and end broadcast it".
  - "watch returns the spectator view; a seated trainer can't watch their own match" (error `You're in this battle`); unknown match → `That battle is over`.
  - "rounds and the end reach watchers".
- [ ] **Step 3: Run and watch them fail.** `cd backend && node --test src/services/battleSessionService.pvp.test.js src/pvp/matches.test.js`. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - Keep `byMatch: Map<matchId, match>`. The cap check is `byMatch.size + starting.size / 2 >= MAX_MATCHES`, in `challenge` and in `respond` before `starting.add`.
  - `act` and `end` also call `emitWatchers`.
  - Start and `end` call `broadcast("pvp:matches", { matches: list() })`.
- [ ] **Step 5: Run and watch them pass.** Expected: PASS.
- [ ] **Step 6: Wire `index.js` and test it.** Add an `index.test.js` case: "pvp:watch joins the watch room and replies pvp:watching", with a registry stub (`watch: () => ({ state: {} })`, `list: () => []`). Wiring:
  - `broadcast: (e, p) => io.to(ROOM_ID).emit(e, p)`
  - `emitWatchers: (id, e, p) => io.to("watch:" + id).emit(e, p)`
  - socket handlers for `pvp:watch` and `pvp:unwatch`
  - `matches` added to `room:init`
- [ ] **Step 7: Run the whole backend suite.** `cd backend && npm test`. Expected: all pass.
- [ ] **Step 8: Commit.** `git commit -m "PvP: live match list, watchers, 5 battles per room"`.

### Task 6: Battle stands (client)

**Files:**
- Create: `frontend/src/v2/pages/playground/watchTransport.js`, `watchTransport.test.js`
- Modify: `frontend/src/v2/battle/useBattle.js`, `useBattle.spec.jsx`, `frontend/src/v2/pages/battle/BattleMenus.jsx`, `BattleView.jsx`
- Modify: `frontend/src/v2/pages/playground/usePlayground.js`, `PlaygroundScreen.jsx`, `playgroundGame.js` (`bench` → `stands`), `PlaygroundStage.jsx` (`spotText`), `playground.css`

**Interfaces:**
- Consumes: the Task 5 events.
- `createWatchTransport(socket, { matchId, state })` returns:
  - `watch: true`
  - `start() → Promise<{ success: true, state }>`
  - `nextRound() → Promise<{ events, state } | { end: { winnerName, endedBy, state } }>`. Rounds queue in arrival order; other matches' events are ignored.
  - `close()`: unhooks the listeners and emits `pvp:unwatch`.
- `usePlayground` gains `matches`, `watching` (`{ matchId, state } | null`), `watch(matchId)`, `stopWatching()`.
- `useBattle` with `transport.watch`: after the intro, phase `"watching"` (never `"command"`). It then loops `nextRound()` and plays each round through the same path as `act`. On `{ end }`, outcome is `{ result: "watched", name: end.winnerName }` and phase `"finished"`.

- [ ] **Step 1: Write `watchTransport.test.js`** (`node:test`, a fake socket with `on`/`off`/`emit` and `fire(event, payload)`).
  - "queues rounds": two rounds fired before two `nextRound()` calls come back in order.
  - "a round arriving after nextRound resolves it".
  - "end resolves the waiting nextRound with { end }".
  - "ignores other matches' rounds".
  - "close unhooks and sends pvp:unwatch".
- [ ] **Step 2: Run and watch it fail.** `cd frontend && node --test src/v2/pages/playground/watchTransport.test.js`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `watchTransport.js`.** Run and watch it pass.
- [ ] **Step 4: Write a failing `useBattle.spec.jsx` case.** "a watch transport plays pushed rounds and ends on the winner": a stub `nextRound` resolves one round, then `{ end: { winnerName: "Ash" } }`. Assert phase `"finished"` and `outcome` `{ result: "watched", name: "Ash" }`, and that `act` is never called.
- [ ] **Step 5: Run and watch it fail.** `npx vitest run src/v2/battle/useBattle.spec.jsx`. Expected: FAIL.
- [ ] **Step 6: Implement.**
  - Pull `act`'s post-response block (play events → rewards → drain → set state → next phase or `finish`) into `applyRound(data, myGen)`, shared by `act` and the watch loop. The loop is a `useEffect` that stops when `gen` changes.
  - `finish` sets the `"watched"` outcome for a watch transport.
  - `BattleMenus`:
    - Phase `"watching"` shows `Watching ${names.player} vs ${names.enemy}` and a "Leave" button → `onLeave`.
    - `ResultPanel` gets a `"watched"` branch: plate `${name} wins!`, Continue → `onLeave`.
  - `BattleView`: hide the run/forfeit button for a watch transport.
  - Check that `HpPanel` renders the hidden player-side `party` the way it renders the foe's. If it reads `current_hp` there, give it the foe side's fallback.
- [ ] **Step 7: Run and watch it pass.** Then run the full `npm test`.
- [ ] **Step 8: Wire the stands.**
  - `SPOTS` benches become `kind: "stands"`; `spotText` drops `bench`.
  - `onSpot("stands")` opens a "Battle stands" modal listing `play.matches` ("A vs B · round N", a Watch button each). Empty: "No battles right now."
  - Watch → `play.watch(id)`. While `play.watching` is set, `PlaygroundScreen` returns `<BattleView key={matchId} transport={watchTransport} levelName="Battle stands" onLeave={play.stopWatching} onContinue={play.stopWatching} />`.
  - The transport is built once per `matchId` with `useMemo`; `stopWatching` calls `close()`.
  - Guests may watch.
- [ ] **Step 9: Verify.** `cd frontend && npm test && npx vite build`. Expected: pass, clean.
- [ ] **Step 10: Commit.** `git commit -m "Playground battle stands: watch live PvP"`.

### Manual check (user)

- [ ] Set `FLAG_CATCH=1`. Two browsers in the Playground: fight in the grass (a starter appears), buy balls at the barrel stall, and have one browser watch the other's PvP from the benches.
- [ ] Set the machine clock past 18:00. The park tints at the next minute check, and new grass battles use the night table.
