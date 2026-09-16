# Battle Restart & FireRed Dialogue Box Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead RUN command with a working mid-battle RESTART (with an in-UI Yes/No confirm), and recolor the battle dialogue text box to the navy-on-cream FireRed split shown in the reference screenshots.

**Architecture:** `POST /api/battle/start` currently *resumes* an already-active session instead of resetting it (`backend/src/services/battleSessionService.js:331-344`), so the existing "Battle Again" flow only works because a *finished* session's status isn't `"active"`. A true mid-battle restart needs the same start endpoint to accept an optional `force` flag that skips the resume branch and rebuilds the session from scratch (fresh HP, fresh turn state) even while `status === "active"`. The frontend then swaps the dead `RUN` button for `RESTART`, routes it through a new `restartConfirm` UI phase (Yes/No, rendered with the existing pixel-panel system — no browser `confirm()`), and calls `startBattle(true)` on confirmation. Separately, `.gba-dialog-box` (the left-hand battle-text panel) becomes navy with white text to match the real FireRed screenshots, but only when it's showing text — the move-select grid inside the same box stays on its existing cream buttons.

**Tech Stack:** Node/Express (backend, `node:test`), React (frontend, no test harness for this component — verify in-browser), plain CSS (`BattleGround.css`).

**Spec:** User-supplied FireRed battle-UI brief (2026-09-16 chat) + two reference screenshots (`Screenshot 2026-09-16 230230.png`, `Screenshot 2026-09-16 230340.png`) showing the real navy dialogue box / cream command box split and the FIGHT/BAG/POKéMON/RUN layout. The brief's Phaser/480×320-canvas/HG-SS-overworld/"kubectl rollout" sections describe a different, unrelated project and are **out of scope** — this plan implements only the parts that apply to this codebase: dialogue box recolor (§1, §6) and RUN→RESTART with in-UI confirm (§3, §4). Items already implemented and left untouched: tri-color HP bars, hit-flash/damage-flash, lunge/faint/pokéball animations, PP display, 2×2 move grid — verified in a live playtest earlier in this session.

## Global Constraints

- No browser-native `confirm()`/`alert()` — the restart confirmation renders with the same pixel-panel system as the rest of the battle UI.
- RESTART must only reset the current battle instance (HP, turn state, battle log) — never campaign progress, party composition, or navigate away from the battle screen.
- Existing "Battle Again" button (post-loss screen, `BattleSim.jsx:1060-1069`) must keep working exactly as today — it already forces a fresh session implicitly because a finished session's `status !== "active"`; do not regress it.
- Follow this repo's existing code style (tabs in backend `.js`, 2-space in frontend `.jsx`/`.css` — match surrounding lines).

---

### Task 1: Backend — `force` option on battle-session restart

**Files:**
- Modify: `backend/src/middleware/validate.js:103-106` (`battleStartSchema`)
- Modify: `backend/src/services/battleSessionService.js:318-345` (`startBattle`)
- Test: `backend/src/services/battleSessionService.test.js`

**Interfaces:**
- Consumes: nothing new — `startBattle(trainerId, { level, battleNumber, force })` is called the same way as today by `backend/src/routes/battle.js:14-32`, which already spreads `req.validated` into it.
- Produces: `startBattle` now accepts a third destructured field `force` (boolean, optional, default falsy). When `force` is true and an active session exists for that trainer/level/battleNumber, it is deleted before the normal party/enemy hydration path runs (same path used when no session exists), so the response always has `resumed: false` and a new `sessionId`.

- [ ] **Step 1: Write the failing test**

Add to `backend/src/services/battleSessionService.test.js`, directly after the existing `"start returns authoritative party snapshots and resumes an active session"` test (after line 331, before the `"start rejects an empty party..."` test):

```javascript
	it("start with force:true resets an active session instead of resuming it", async () => {
		const { service } = makeService({
			engine: stubEngine([{ result: "hit", damage: 5 }]),
		});
		const started = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(started.state.enemy.current_hp, 30);

		// Deal damage so the active session's state visibly differs from a
		// fresh one.
		await service.performAction(1, {
			sessionId: started.state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const midFight = service.getSession(1, started.state.sessionId);
		assert.equal(midFight.enemy.current_hp, 25);

		const restarted = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
			force: true,
		});
		assert.equal(restarted.resumed, false);
		assert.notEqual(restarted.state.sessionId, started.state.sessionId);
		assert.equal(restarted.state.enemy.current_hp, 30);
		assert.equal(restarted.state.player.current_hp, 40);
		assert.equal(restarted.state.status, "active");
	});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && node --test src/services/battleSessionService.test.js`
Expected: FAIL — `restarted.resumed` is `true` and `restarted.state.sessionId` equals `started.state.sessionId` (today's `startBattle` always resumes an active session regardless of any `force` field, since the field doesn't exist yet).

- [ ] **Step 3: Add `force` to the schema**

In `backend/src/middleware/validate.js`, change:

```javascript
const battleStartSchema = z.object({
	level: z.number().int().positive(),
	battleNumber: z.number().int().positive(),
});
```

to:

```javascript
const battleStartSchema = z.object({
	level: z.number().int().positive(),
	battleNumber: z.number().int().positive(),
	force: z.boolean().optional(),
});
```

- [ ] **Step 4: Make the service honor `force`**

In `backend/src/services/battleSessionService.js`, change the `startBattle` signature and the resume-check block:

```javascript
	async function startBattle(trainerId, { level, battleNumber, force }) {
		const progressService = getProgressService();
		const progress = await progressService.getProgress(trainerId);
		if (
			progress.current_level !== level ||
			progress.current_battle !== battleNumber
		) {
			throw new CampaignError(
				403,
				`Not the active battle (currently at level ${progress.current_level}, battle ${progress.current_battle})`
			);
		}

		// Resume a live session for this exact battle instead of resetting it,
		// unless the caller explicitly asked for a forced restart (mid-battle
		// RESTART command) — force always falls through to a fresh session.
		const existingId = sessionByTrainer.get(Number(trainerId));
		if (existingId) {
			const existing = sessions.get(existingId);
			if (
				!force &&
				existing &&
				existing.status === "active" &&
				existing.level === level &&
				existing.battleNumber === battleNumber
			) {
				return { state: toPublicState(existing), resumed: true };
			}
			sessions.delete(existingId);
		}
```

Only the `if (` condition inside the existing-session block gains the `!force &&` clause — everything else (the `sessions.delete(existingId)` fallthrough, and the rest of the function that builds a fresh session below) is unchanged, so a forced restart naturally takes the same "no session" path a first-ever `startBattle` call takes.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && node --test src/services/battleSessionService.test.js`
Expected: PASS, including the new test.

- [ ] **Step 6: Run the full backend suite for regressions**

Run: `cd backend && npm test`
Expected: PASS (all suites, no regressions from the schema/service change).

- [ ] **Step 7: Commit**

```bash
git add backend/src/middleware/validate.js backend/src/services/battleSessionService.js backend/src/services/battleSessionService.test.js
git commit -m "Allow forced battle-session restart instead of always resuming"
```

---

### Task 2: Frontend — RESTART button with in-UI confirm

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx`

**Interfaces:**
- Consumes: Task 1's `force` field on `POST /api/battle/start` (sent as `{ level, battleNumber, force: true }`).
- Produces: a new `uiPhase` value `'restartConfirm'` (alongside the existing `'command' | 'moveSelect' | 'partySelect' | ...` values documented in the comment at `BattleSim.jsx:102-104`); a `confirmRestart(confirmed: boolean)` handler.

- [ ] **Step 1: Thread `force` through `startBattle` and drop the dead `isEscapeAllowed` prop**

In `frontend/src/pages/Game/BattleSim.jsx`, remove the unused prop (line 82, and its destructure) — it is never passed by any caller (`Level.jsx` does not pass it) and currently exists only to gate the RUN button, which is being removed:

```javascript
const BattleSim = ({
  levelNumber,
  battleNumber,
  onBattleWon,
  onContinue,
}) => {
```

Change `startBattle` (currently at line 153) to accept and forward a `force` flag:

```javascript
  const startBattle = async (force = false) => {
    try {
      const { data } = await api.post('/api/battle/start', {
        level: levelNumber,
        battleNumber,
        ...(force ? { force: true } : {}),
      });
```

(The rest of `startBattle`'s body is unchanged.)

- [ ] **Step 2: Make `restartBattle` force a fresh session**

Change the `startBattle();` call inside `restartBattle` (currently at line 758) to `startBattle(true);`. No other line in `restartBattle` changes — it already clears all local UI/animation state before calling `startBattle`, so this is the only edit needed for the existing post-loss "Battle Again" button to also go through the force path (harmless there, since a finished session is already non-active and would take the same fresh-session path either way).

- [ ] **Step 3: Replace the RUN branch with RESTART + confirm handler**

In `handleMainMenuSelection` (currently at line 277-292), replace:

```javascript
    } else if (action === 'RUN') {
      addLog("Can't run from a trainer battle!");
    }
  };
```

with:

```javascript
    } else if (action === 'RESTART') {
      setUiPhase('restartConfirm');
    }
  };

  const confirmRestart = (confirmed) => {
    playSound('select');
    if (confirmed) {
      restartBattle();
    } else {
      setUiPhase('command');
    }
  };
```

- [ ] **Step 4: Show "Restart this battle?" in the left dialogue panel**

In the reused dialogue box (currently at lines 1233-1241), replace:

```javascript
                    ) : (
                      <div className="gba-dialog-text">
                        {currentTurn === 'player' && selectedMove
                          ? `${userPokemon.nickname} used ${selectedMove.name}!`
                          : currentTurn === 'enemy'
                          ? `${trainerPokemon.nickname} is attacking...`
                          : `What will ${userPokemon.nickname} do?`}
                      </div>
                    )}
```

with:

```javascript
                    ) : (
                      <div className="gba-dialog-text">
                        {uiPhase === 'restartConfirm'
                          ? 'Restart this battle?'
                          : currentTurn === 'player' && selectedMove
                          ? `${userPokemon.nickname} used ${selectedMove.name}!`
                          : currentTurn === 'enemy'
                          ? `${trainerPokemon.nickname} is attacking...`
                          : `What will ${userPokemon.nickname} do?`}
                      </div>
                    )}
```

- [ ] **Step 5: Replace the RUN button and add the Yes/No panel on the right**

In the right-hand menu box (currently at lines 1281-1290), replace:

```javascript
                    ) : uiPhase === 'command' ? (
                      <div className="gba-main-menu">
                        <button onClick={() => handleMainMenuSelection('FIGHT')}>FIGHT</button>
                        <button onClick={() => handleMainMenuSelection('BAG')}>BAG</button>
                        <button onClick={() => handleMainMenuSelection('POKEMON')}>POKéMON</button>
                        {isEscapeAllowed && (
                          <button onClick={() => handleMainMenuSelection('RUN')}>RUN</button>
                        )}
                      </div>
                    ) : null}
```

with:

```javascript
                    ) : uiPhase === 'command' ? (
                      <div className="gba-main-menu">
                        <button onClick={() => handleMainMenuSelection('FIGHT')}>FIGHT</button>
                        <button onClick={() => handleMainMenuSelection('BAG')}>BAG</button>
                        <button onClick={() => handleMainMenuSelection('POKEMON')}>POKéMON</button>
                        <button onClick={() => handleMainMenuSelection('RESTART')}>RESTART</button>
                      </div>
                    ) : uiPhase === 'restartConfirm' ? (
                      <div className="gba-main-menu">
                        <button onClick={() => confirmRestart(true)}>YES</button>
                        <button onClick={() => confirmRestart(false)}>NO</button>
                      </div>
                    ) : null}
```

(Reuses the existing `.gba-main-menu` 2×2 grid CSS — two buttons land side by side in the top row, matching the reference screenshot's "▶ YES … NO" layout with zero new CSS.)

- [ ] **Step 6: Manual verification in the browser**

Start the dev stack (`npm run dev` from the repo root; MySQL container must be running — `docker start pokemon-origins-mysql` if needed) and, in a battle:
1. Click RESTART from the command menu → left panel shows "Restart this battle?", right panel shows YES/NO.
2. Click NO → returns to the normal FIGHT/BAG/POKéMON/RESTART menu, no server call, HP unchanged.
3. Deal some damage with a move, then RESTART → YES. Confirm both Pokémon's HP bars reset to full and the battle log clears/restarts (`network` tab: a `POST /api/battle/start` with `force: true` in the body, response `resumed: false`).
4. Lose a battle on purpose (or reuse an existing low-HP save) and confirm the post-loss "Battle Again" button still works exactly as before.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx
git commit -m "Replace dead RUN command with a working mid-battle RESTART"
```

---

### Task 3: FireRed-style navy dialogue box

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (two JSX sites)
- Modify: `frontend/src/pages/Game/BattleGround.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: a `.gba-dialog-box--message` modifier class, applied whenever the box is showing text (not the move-select grid).

- [ ] **Step 1: Apply the modifier class at both `gba-dialog-box` sites**

In `frontend/src/pages/Game/BattleSim.jsx`, the finished (win/loss) screen's dialogue box (currently at line 1033):

```javascript
                <div className="gba-dialog-box">
```

becomes:

```javascript
                <div className="gba-dialog-box gba-dialog-box--message">
```

The reused mid-battle dialogue box (currently at line 1191) only shows text when `uiPhase !== 'moveSelect'` — the move grid renders in the same div when it is `'moveSelect'`. Change:

```javascript
                  <div className="gba-dialog-box">
```

to:

```javascript
                  <div className={`gba-dialog-box ${uiPhase !== 'moveSelect' ? 'gba-dialog-box--message' : ''}`}>
```

- [ ] **Step 2: Add the navy styling in `BattleGround.css`**

Directly after the existing `.gba-dialog-box::after` / `@keyframes arrowBounce` block (currently ending at line 412, right before `.gba-dialog-text` at line 414), insert:

```css
/* FireRed reference: the message box is navy with white text; only the
   move-select grid (rendered in the same box) keeps the cream background. */
.gba-dialog-box--message {
  background: #1f3b57;
  border-right-color: #e8e8c8;
  box-shadow: inset 4px 0 0 rgba(255,255,255,0.08);
}

.gba-dialog-box--message::after {
  border-right-color: #ef4444;
  border-bottom-color: #ef4444;
}

.gba-dialog-box--message .gba-dialog-text {
  color: #fff;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
}

.gba-dialog-box--message .gba-xp-summary p {
  color: #cbd5c9;
}
```

- [ ] **Step 3: Manual verification in the browser**

With the dev stack running, open a battle and confirm:
1. The idle "What will X do?" prompt and mid-turn text ("X used Y!", "X is attacking...") render on a navy panel with white text and a red bounce arrow, matching `Screenshot 2026-09-16 230230.png`.
2. Opening FIGHT (move-select) shows the cream move-grid buttons as before — the navy background must **not** show through (the modifier class is absent in that state).
3. The win/loss screen's message and XP summary lines are readable (white/light text on navy), and the red "Continue"/"Battle Again" button is unaffected.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css
git commit -m "Recolor the battle dialogue box to match FireRed's navy message panel"
```

---

## Out of Scope (explicitly, from the user-supplied brief)

Everything under the brief's Phaser/480×320-canvas/tile-overworld/HeartGold-SoulSilver-movement/"kubectl rollout" headings does not apply to this codebase (a React + Express + FastAPI web app with no game-engine layer and no overworld) and is not planned here. If any of that is still wanted, it needs its own brainstorming pass as a separate architectural project — it is not a battle-UI polish task.
