# GBA/FRLG Redesign — Phase 8: Battle Message / Event Presentation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the actual battle events ("CHARMANDER used EMBER!", "It's super effective!", "GOLDEEN fainted!") appear in the in-game dialog box during play — the primary gameplay feedback surface, per the original problem statement — instead of only in the timestamped scroll log below the stage. Demote that scroll log to a collapsed-by-default developer panel, matching the spec's explicit split between the player-facing battle message layer and the developer log.

**Architecture:** No new event system, no server changes. Every battle event already funnels its player-visible text through one function, `addLog()` (`BattleSim.jsx:241-244`) — this plan makes `addLog` the single source for BOTH the developer log (unchanged) and a new `currentMessage` piece of state that the existing in-game dialog box renders. This is a much smaller change than building a separate message-queue system: since `playEvent`'s ~25 event-type branches already call `addLog(...)` followed by an `await wait(...)` that paces the animation, `currentMessage` naturally updates once per beat, in order, already correctly sequenced — no new queue/timer logic needed.

**Tech Stack:** No new dependency.

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 13 ("Battle information must be in the game UI") and Section 9 Phase 8.

## Rulings (made during planning, binding on this plan)

1. **Reuse `addLog`'s existing call sites; don't touch all ~25 of them.** The spec's Section 13 conceptual diagram shows a "Battle Event Stream" feeding both a battle message layer and a developer log as if they were two separate things a caller pushes to. In this codebase, every event-type branch in `playEvent` already calls the same `addLog(message)` function for its player-visible text — there is already exactly one call site per event, not two, and it already exists. This plan changes what `addLog` does internally (also update `currentMessage`, not just `battleLog`) rather than duplicating ~25 call sites into two separate calls each. Same outcome (message layer + dev log both fed from one event stream), far smaller and safer diff.
2. **`addLog` needs its own small internal queue — a real gap found during plan review.** The original draft of this ruling assumed `playEvent`'s existing `await wait(motionMs(...))` calls between beats were sufficient pacing for `currentMessage` too. Verified false: `playEvent`'s damage-landed branch (`BattleSim.jsx:605-608`) calls `addLog` up to four times **synchronously, with no `await` between them** (`"X dealt Y damage!"`, optionally `"Hit N times!"`, optionally `"It's a one-hit KO!"`, then `logEffectiveness()` which can itself add a crit line and an effectiveness line). React 18's automatic batching (this app renders via `createRoot`, confirmed in `frontend/src/main.jsx`) collapses all `setCurrentMessage(...)` calls made synchronously in a row into a single committed render — only the **last** call's text would ever actually paint, silently dropping "X dealt Y damage!", "Hit N times!", and the crit line on any hit that also has a multiplier line, which is a common case and exactly the kind of message this phase exists to surface. Fix: `addLog` gets its own tiny internal FIFO queue + `setTimeout`-paced drain, entirely inside `addLog`'s own body — the ~25 call sites in `playEvent` stay completely unchanged (Ruling 1 still holds: one change point, not two), but that one change point now guarantees every distinct message gets its own timed display slot regardless of how many times a caller invokes `addLog` back-to-back without awaiting. This decouples the dialog box's message pacing from `playEvent`'s coarser per-beat `wait()` calls, which for the common single-message-per-beat case is invisible (the queue drains immediately, matching prior behavior) and for the rare multi-message beat is a real, deliberate improvement (each line gets its moment, GBA-style) rather than the silent data loss the original approach would have shipped.
3. **`currentMessage` resets at the one authoritative "player regains control" point, not at every possible UI-navigation exit.** After a full round of events plays out, `BattleSim.jsx`'s response-handling block resets `currentTurn`/`selectedMove`/`hoveredMove` back to idle (currently at `BattleSim.jsx:687-689`) — this plan adds a `setCurrentMessage('')` reset at that exact point, so the dialog falls back to "What will X do?" once the player regains control. Explicit "CANCEL" buttons that back out of the bag/move menus without triggering any event (`BattleSim.jsx:~1178`, `~1247`) are NOT given their own reset — if a stale message is still showing when a player backs out of a sub-menu without acting, it stays visible until the next real action clears it. `ponytail: minor stale-message edge case on cancel-without-acting, not the structural problem this phase fixes; add explicit resets at those two cancel handlers if it's ever reported as visually confusing in practice.`
4. **Developer log collapses in place, doesn't resize the scaled stage.** `BattleSim.jsx` computes `STAGE_TOTAL_HEIGHT` (a constant used to size the whole scaled wrapper) assuming the log container's fixed height. Collapsing the log by hiding its *inner* scrollable content (not unmounting the outer `.gba-battle-log-container`) keeps the container's footprint constant, so `STAGE_TOTAL_HEIGHT` doesn't need to become dynamic — a smaller, safer change than making the overall stage layout height-responsive to a UI toggle.
5. **Victory/faint/XP messages are out of scope here.** `BattleSim.jsx:1098-1114` (the `uiPhase === 'finished'` dialog box showing win/lose text + XP summary) already reads real event-derived text, not generic placeholders — confirmed accurate during the original repo audit and unchanged since. This phase only fixes the *active-battle* dialog box (`BattleSim.jsx:1257` block), which is the one still showing only generic template text.

## Global Constraints

- Do not touch the battle state machine, server communication, damage/turn logic, or any of the ~25 individual event-type branches inside `playEvent` — only `addLog`'s own body changes.
- Do not touch the `uiPhase === 'finished'` victory dialog box (`BattleSim.jsx:1098-1114`) — already correct per Ruling 5.
- The developer log's content and behavior (still receiving every event, still auto-scrolling via `logRef`) must be unchanged — only its default visibility changes.
- RESET/RESTART semantics (`handleMainMenuSelection('RESTART')` → `restartBattle()`) must not be touched by this phase — no file in this plan's diff should come near that code path.

---

### Task 1: Add `currentMessage` state, give `addLog` an internal message queue, reset on round completion

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (add one `useState` and two `useRef`s near the other state declarations, replace `addLog`'s body at lines 241-244 with a queued version, add one reset line near lines 687-689)

**Interfaces:**
- Consumes: `motionMs`, `timersRef` (both already exist in this component, at lines 134 and wherever `timersRef` is declared — reused, not redefined).
- Produces: `currentMessage` (state) and `setCurrentMessage` (setter), used by Task 2. No other task depends on this.

- [ ] **Step 1: Add the state and queue refs**

Find the block of `useState` declarations near the top of the component (around line 97, alongside `const [battleLog, setBattleLog] = useState([]);`) and add directly after it:

```javascript
  const [currentMessage, setCurrentMessage] = useState('');
  const messageQueueRef = useRef([]);
  const messageTimerRef = useRef(null);
```

(`useRef` is already imported at `BattleSim.jsx:1` alongside `useState`/`useEffect` — verified 2026-09-18, no import change needed.)

- [ ] **Step 2: Replace `addLog` with a queued version**

Change (`BattleSim.jsx:241-244`):

```javascript
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setBattleLog((prevLog) => [...prevLog, `${timestamp} - ${message}`]);
  };
```

to:

```javascript
  // Drains messageQueueRef one at a time, pacing the in-game dialog box
  // independently of however many times addLog was called back-to-back
  // (React 18 batches synchronous setState calls, so without this a
  // multi-message beat like "dealt damage" + "critical hit" + "super
  // effective" would silently collapse to only the last message -- see
  // Phase 8 plan Ruling 2).
  const flushNextMessage = () => {
    if (messageQueueRef.current.length === 0) {
      messageTimerRef.current = null;
      return;
    }
    const next = messageQueueRef.current.shift();
    setCurrentMessage(next);
    messageTimerRef.current = setTimeout(flushNextMessage, motionMs(600));
    timersRef.current.push(messageTimerRef.current);
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setBattleLog((prevLog) => [...prevLog, `${timestamp} - ${message}`]);
    messageQueueRef.current.push(message);
    if (!messageTimerRef.current) {
      flushNextMessage();
    }
  };
```

(`timersRef.current.push(...)` matches the existing `wait()` helper's own cleanup pattern a few lines above — `timersRef` is already declared at `BattleSim.jsx:130`, verified 2026-09-18, no new declaration needed.)

- [ ] **Step 3: Reset the message when the player regains control**

Find the response-handling block that resets `currentTurn`/`selectedMove`/`hoveredMove` after a full round of events has played (currently around `BattleSim.jsx:687-689`):

```javascript
      setCurrentTurn('none');
      setSelectedMove(null);
      setHoveredMove(null);
```

change to:

```javascript
      setCurrentTurn('none');
      setSelectedMove(null);
      setHoveredMove(null);
      // Drop any messages the queue hasn't painted yet (e.g. a multi-line
      // damage beat that outlasted this round's own animation timing) so a
      // stale queued line can't overwrite "What will X do?" after control
      // has already returned to the player.
      messageQueueRef.current = [];
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
      setCurrentMessage('');
```

(Re-verify this exact 3-line snippet's current location with `grep -n "setCurrentTurn('none');" -A2 frontend/src/pages/Game/BattleSim.jsx` before editing — this file has multiple `setCurrentTurn('none')` call sites, e.g. inside individual `playEvent` branches; the one this step targets is specifically the one immediately followed by `setSelectedMove(null)` and `setHoveredMove(null)`, the post-round "return control to player" block, not any of the per-event-type ones inside `playEvent`. The queue-clearing lines are new in this revision of the plan — added because the queue can legitimately still hold undrained messages at this point for a multi-message beat, per Ruling 2.)

- [ ] **Step 4: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build (this task has no new visible behavior yet — `currentMessage` isn't rendered anywhere until Task 2 — so a clean build is the only verification possible at this step).

- [ ] **Step 5: Static verification**

```bash
grep -n "currentMessage" frontend/src/pages/Game/BattleSim.jsx
```

Expected: 3 matching lines — the `useState` declaration (`const [currentMessage, setCurrentMessage] = useState('');`), the `setCurrentMessage(next)` call inside `flushNextMessage`, and the `setCurrentMessage('')` reset. If your count differs, read each match to confirm it's one of exactly these three things, nothing else.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx
git commit -m "feat: add currentMessage state fed by addLog, for the in-game dialog box"
```

---

### Task 2: Show the real battle message in the dialog box

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (the active-battle dialog box's text branch, currently around lines 1299-1311)

**Interfaces:**
- Consumes: `currentMessage` (Task 1).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Replace the generic-text branch with the real message**

Re-verify the current exact location first: `grep -n "What will \${userPokemon.nickname} do?" frontend/src/pages/Game/BattleSim.jsx`.

Change (currently, inside the dialog box's non-`moveSelect` branch):

```jsx
                    ) : (
                      <div className="gba-dialog-text">
                        {uiPhase === 'restartConfirm'
                          ? 'Restart this battle?'
                          : uiPhase === 'restarting'
                          ? 'Restarting battle...'
                          : currentTurn === 'player' && selectedMove
                          ? `${userPokemon.nickname} used ${selectedMove.name}!`
                          : currentTurn === 'enemy'
                          ? `${trainerPokemon.nickname} is attacking...`
                          : `What will ${userPokemon.nickname} do?`}
                      </div>
                    )}
```

to:

```jsx
                    ) : (
                      <div className="gba-dialog-text">
                        {uiPhase === 'restartConfirm'
                          ? 'Restart this battle?'
                          : uiPhase === 'restarting'
                          ? 'Restarting battle...'
                          : currentMessage
                          ? currentMessage
                          : `What will ${userPokemon.nickname} do?`}
                      </div>
                    )}
```

(This removes the `currentTurn`/`selectedMove` guesswork entirely — `currentMessage` already contains the exact real text `addLog` would have shown, including "X used Y!" for the player's own move, "It's super effective!", "X fainted!", status/stat-change lines, everything — because every one of those already calls `addLog` today. The two `restartConfirm`/`restarting` cases stay as literal UI-navigation prompts, since those aren't battle events.)

- [ ] **Step 2: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 3: Static verification**

```bash
grep -n "currentTurn === 'player' && selectedMove\|currentTurn === 'enemy'" frontend/src/pages/Game/BattleSim.jsx
```

Expected: no output in the dialog-box branch (the two guesswork conditions are gone from that spot — note `currentTurn`/`selectedMove` are still used elsewhere in the file for animation/menu-highlight logic, which this grep may still match; if it does, read each match and confirm none of them are inside the dialog-box text branch you just edited).

If a live database happens to be available, start a battle, use a move, and confirm the dialog box now shows the real sequence ("X used Y!" → "It's super effective!" → "Y fainted!" etc.) instead of freezing on "X used Y!" or reverting early to "What will X do?".

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx
git commit -m "feat: show real battle event messages in the dialog box, not just the debug log"
```

---

### Task 3: Demote the developer log to a collapsed-by-default panel

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (add a `devLogOpen` state; add a toggle header to the log container, currently around lines 1370-1384)
- Modify: `frontend/src/pages/Game/BattleGround.css` (add a header/toggle style; the existing `.gba-battle-log-container`/`.gba-battle-log` rules, lines 677-696, are otherwise unchanged per plan Ruling 4)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing for later tasks.

- [ ] **Step 1: Add the toggle state**

Alongside the `currentMessage` state added in Task 1 (or any other `useState` block), add:

```javascript
  const [devLogOpen, setDevLogOpen] = useState(false);
```

(Defaults closed — per spec Section 13, the debug log "must NOT be the main gameplay feedback mechanism," so it starts hidden and is opt-in, matching that intent.)

- [ ] **Step 2: Add the toggle header and conditionally render the log content**

Re-verify current location: `grep -n "Battle log lives below the stage" frontend/src/pages/Game/BattleSim.jsx`.

Change:

```jsx
          {/* Battle log lives below the stage so it is actually visible */}
          <div className="gba-battle-log-container">
            <div className="gba-battle-log" ref={logRef}>
              {battleLog.map((entry, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {entry}
                </motion.p>
              ))}
            </div>
          </div>
```

to:

```jsx
          {/* Developer log: full event history with timestamps, collapsed by
              default. The in-game dialog box (Phase 8) is the primary
              gameplay feedback surface now -- this stays available for
              debugging, not as the main way players see battle events. */}
          <div className="gba-battle-log-container">
            <button
              type="button"
              className="gba-battle-log-toggle"
              onClick={() => setDevLogOpen((open) => !open)}
            >
              {devLogOpen ? '▼' : '▶'} DEVELOPER LOG
            </button>
            {devLogOpen && (
              <div className="gba-battle-log" ref={logRef}>
                {battleLog.map((entry, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {entry}
                  </motion.p>
                ))}
              </div>
            )}
          </div>
```

- [ ] **Step 3: Add the toggle button style**

In `frontend/src/pages/Game/BattleGround.css`, add directly above the existing `.gba-battle-log-container` rule (line 677):

```css
.gba-battle-log-toggle {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 15px;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(80, 104, 96, 0.3);
  color: #506860;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.gba-battle-log-toggle:hover {
  background: rgba(80, 104, 96, 0.08);
}

```

- [ ] **Step 4: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 5: Static verification**

```bash
grep -n "devLogOpen\|gba-battle-log-toggle" frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css
```

Expected: matches in both files — the state declaration, the toggle button JSX, the conditional render, and the CSS rule.

If a live database happens to be available, start a battle and confirm the developer log starts collapsed (only the "▶ DEVELOPER LOG" header visible below the stage), and clicking it reveals the full timestamped event history exactly as before.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css
git commit -m "feat: collapse developer battle log by default (dialog box is now the primary feedback surface)"
```

---

## Phase Completion

After Task 3's review is clean, Phase 8 is done — the largest remaining behavioral change in the Core batch. Next phase per the spec's Core batch is **Phase 9 — Command panel and RESET/RUN verification** (restyle the command panel chrome; explicit test that RESTART still calls `startBattle(true)` and remains distinct from any flee concept, which doesn't exist in this codebase), a separate plan written and reviewed on its own.
