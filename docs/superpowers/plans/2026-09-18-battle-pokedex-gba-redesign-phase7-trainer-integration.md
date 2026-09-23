# GBA/FRLG Redesign — Phase 7: Trainer Sprite Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the player's own trainer (Red or Leaf, per the account's registered gender) briefly during the battle's encounter/send-out beat — the one moment the spec calls for a trainer sprite — using the cropped sprites from Phase 3, without permanently occupying any battlefield space.

**Architecture:** No new component and no new battlefield layout slot. `BattleSim.jsx` already has a full-screen, temporary "encounter" overlay (`uiPhase === 'encounter'`, wrapped in `AnimatePresence`) that shows a screen flash, a Poké-Ball-throw animation, the **opposing** trainer's avatar (`TrainerAvatar` + `session.trainerSprite`, already implemented for NPCs), and "X sent out Y!" text — then the whole overlay unmounts once the intro starts. This phase adds one more element to that *same* existing overlay: the player's own trainer sprite, mirrored to the opposite corner. It disappears with the rest of the overlay automatically — no new show/hide logic needed, reusing what's already there.

**Tech Stack:** No new dependency. A small new util module matching the project's existing pattern of small, tested sprite-resolution helpers (`sprites/pokemonSprites.js`, `sprites/battleSprites.js`).

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 11 ("Trainer sprites") and Section 9 Phase 7.

## Rulings (made during planning, binding on this plan)

1. **Gender-to-sprite mapping and default.** The `trainers` table has a `gender` enum of `Male | Female | Other` (`backend/src/middleware/validate.js:43`, confirmed live). Phase 3 only produced two trainer sprites: `red.png` (male) and `leaf.png` (female) — there is no third asset for `Other`. This plan maps `"Female"` → `leaf.png` and everything else (`"Male"`, `"Other"`, missing/null) → `red.png`. This mirrors the mainline games' own binary player-sprite convention (there is no canonical third FRLG player sprite) and is a reasonable, explicit default rather than a silent gap.
2. **Reuse the existing encounter overlay, don't build a new one.** The spec's Section 11 says "Trainer sprites should be used for battle introduction / encounter / send-out presentation... Do not permanently clutter the battlefield." `BattleSim.jsx`'s `uiPhase === 'encounter'` overlay (lines 840-895) already does exactly this for the *opponent* trainer. Adding a second, separate overlay/animation system for the player's trainer would duplicate logic the spec explicitly warns against inventing twice. This plan adds one more animated element inside the same overlay block instead.
3. **Positioning: mirror the opponent's avatar, not the player's future battle slot.** The opponent trainer avatar (`.gba-trainer-avatar-wrap`) sits at a fixed `top: 18px; right: 24px` within the full battle container — not tied to `battleLayout.js`'s `BATTLE_SLOTS` (which position the *Pokémon* sprites, not this temporary trainer flash). The player's trainer avatar mirrors this exactly: `bottom: 18px; left: 24px`, same z-index, same overlay lifecycle. This is a deliberate, minimal placement choice consistent with the existing opponent pattern, not a new coordinate concept.
4. **The stale "(no trainer character sprites)" CSS comment gets corrected, not just left wrong.** `BattleGround.css:114`'s `.pokeball-throw` comment currently reads "FireRed-style pokéball throw (no trainer character sprites)" — accurate when it was written, inaccurate after this phase adds one. It's updated in Task 2 as a one-line, in-scope correction (the comment sits directly above code this phase's diff touches contextually), not left to rot.

## Global Constraints

- Do not touch the battle state machine, event handling, damage/turn logic, or any file other than the one new util module (+ its test) and `BattleSim.jsx`/`BattleGround.css`.
- The player trainer sprite must disappear with the rest of the encounter overlay (governed by the existing `AnimatePresence`/`uiPhase === 'encounter'` condition) — it must never remain visible once the intro starts, matching "do not permanently clutter the battlefield."
- Do not touch the opposing-trainer (`TrainerAvatar`/`session.trainerSprite`) code path — this phase only adds a sibling element, it doesn't modify the existing one.

---

### Task 1: Player trainer sprite resolver

**Files:**
- Create: `frontend/src/utils/trainerSprite.js`
- Test: `frontend/src/utils/trainerSprite.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `playerTrainerSprite(gender)` — a pure function taking the account's `gender` string (or `undefined`/`null`) and returning the local sprite URL string. Task 2 imports this by name.

- [ ] **Step 1: Write the failing test**

```javascript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { playerTrainerSprite } from "./trainerSprite.js";

describe("playerTrainerSprite", () => {
  it("returns leaf.png for Female", () => {
    assert.equal(playerTrainerSprite("Female"), "/sprites/trainers/player/leaf.png");
  });

  it("returns red.png for Male", () => {
    assert.equal(playerTrainerSprite("Male"), "/sprites/trainers/player/red.png");
  });

  it("returns red.png for Other (no third asset exists -- see plan Ruling 1)", () => {
    assert.equal(playerTrainerSprite("Other"), "/sprites/trainers/player/red.png");
  });

  it("returns red.png when gender is missing/null/undefined", () => {
    assert.equal(playerTrainerSprite(undefined), "/sprites/trainers/player/red.png");
    assert.equal(playerTrainerSprite(null), "/sprites/trainers/player/red.png");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd frontend && node --test src/utils/trainerSprite.test.js`

Expected: FAIL — `trainerSprite.js` does not exist yet.

- [ ] **Step 3: Write `trainerSprite.js`**

```javascript
/**
 * Player trainer battle-intro sprite, from the account's registered gender.
 * Only two assets exist (Phase 3 crop) -- "Other"/missing defaults to the
 * male sprite, there is no canonical third FRLG player sprite. See plan
 * Ruling 1.
 */
export function playerTrainerSprite(gender) {
  return gender === "Female"
    ? "/sprites/trainers/player/leaf.png"
    : "/sprites/trainers/player/red.png";
}
```

- [ ] **Step 4: Run the test again to verify it passes**

Run: `cd frontend && node --test src/utils/trainerSprite.test.js`

Expected: PASS, `# pass 4`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/trainerSprite.js frontend/src/utils/trainerSprite.test.js
git commit -m "feat: add player trainer sprite resolver (gender -> Red/Leaf asset)"
```

---

### Task 2: Render the player's trainer during the encounter beat

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (add `useUser` import + call near the top of the component; add one new `motion.div` inside the existing encounter overlay, mirroring the opponent's `.gba-trainer-avatar-wrap` block)
- Modify: `frontend/src/pages/Game/BattleGround.css:98-112` (add a `.gba-player-trainer-avatar-wrap` / reuse `.gba-trainer-avatar` for sizing, correct the stale comment)

**Interfaces:**
- Consumes: `playerTrainerSprite` from `frontend/src/utils/trainerSprite.js` (Task 1); `useUser` from `frontend/src/App` (already exported, already used identically by `frontend/src/pages/Game/Bag.jsx:8,15` and `Mart.jsx:9,15` — same import path, same destructure pattern).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Add the imports**

In `frontend/src/pages/Game/BattleSim.jsx`, add near the other local imports (after the existing `import { slotStyle, shadowStyle } from './battleLayout';`):

```javascript
import { useUser } from '../../App';
import { playerTrainerSprite } from '../../utils/trainerSprite';
```

- [ ] **Step 2: Get the user and compute the sprite inside the component**

Find the component's existing state/derived-value section (near where `introStarted`, `trainerName` etc. are computed, around line 815) and add:

```javascript
  const { user } = useUser();
  const playerSpriteUrl = playerTrainerSprite(user?.gender);
```

- [ ] **Step 3: Add the player trainer avatar element to the encounter overlay**

In the same `uiPhase === 'encounter'` overlay block that already renders the opponent's `.gba-trainer-avatar-wrap` (around lines 869-882), add a sibling block right after it (before the closing `motion.h2` that shows the "sent out" text):

```jsx
                    <motion.div
                      className="gba-player-trainer-avatar-wrap"
                      initial={{ x: -80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: motionMs(150) / 1000, duration: motionMs(350) / 1000 }}
                    >
                      <img
                        src={playerSpriteUrl}
                        alt=""
                        aria-hidden="true"
                        className="gba-trainer-avatar pixelated"
                      />
                    </motion.div>
```

(This reuses the existing `.gba-trainer-avatar` sizing class — only the wrapper position differs, per Ruling 3. `alt=""`/`aria-hidden="true"` because this is a decorative flourish alongside the "X sent out Y!" text that already announces the same event to screen readers.)

- [ ] **Step 4: Add the CSS for the new wrapper and fix the stale comment**

In `frontend/src/pages/Game/BattleGround.css`, change:

```css
/* Opposing trainer's battle-intro portrait (absent for legendary/wild
   encounters — TrainerAvatar renders nothing when trainerSprite is null) */
.gba-trainer-avatar-wrap {
  position: absolute;
  top: 18px;
  right: 24px;
  z-index: 11;
}

.gba-trainer-avatar {
  width: 64px;
  height: auto;
  image-rendering: pixelated;
  filter: drop-shadow(2px 3px 0 rgba(0,0,0,0.5));
}

/* FireRed-style pokéball throw (no trainer character sprites) */
.pokeball-throw {
```

to:

```css
/* Opposing trainer's battle-intro portrait (absent for legendary/wild
   encounters — TrainerAvatar renders nothing when trainerSprite is null) */
.gba-trainer-avatar-wrap {
  position: absolute;
  top: 18px;
  right: 24px;
  z-index: 11;
}

/* Player's own trainer (Red/Leaf), mirrored to the opposite corner --
   Phase 7. Same lifecycle as .gba-trainer-avatar-wrap: only visible during
   the encounter overlay, unmounts with it. */
.gba-player-trainer-avatar-wrap {
  position: absolute;
  bottom: 18px;
  left: 24px;
  z-index: 11;
}

.gba-trainer-avatar {
  width: 64px;
  height: auto;
  image-rendering: pixelated;
  filter: drop-shadow(2px 3px 0 rgba(0,0,0,0.5));
}

/* FireRed-style pokéball throw, now paired with a brief trainer-avatar
   flash on both sides (Phase 7) rather than no trainer sprites at all. */
.pokeball-throw {
```

- [ ] **Step 5: Verify the build**

Run: `cd frontend && npm run build`

Expected: clean build.

- [ ] **Step 6: Static verification**

```bash
grep -n "gba-player-trainer-avatar-wrap" frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css
```

Expected: one match in each file (the JSX usage, the CSS rule).

```bash
grep -n "playerTrainerSprite\|useUser" frontend/src/pages/Game/BattleSim.jsx
```

Expected: 3 matches (the two imports, one call site).

If a live database happens to be available (`docker ps` shows MySQL running), start a battle and visually confirm: during the encounter flash, a small trainer sprite appears briefly in the bottom-left corner (opposite the opponent's top-right avatar), matching the account's registered gender, then disappears once the Pokémon intro animation begins and never reappears during the rest of the battle.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Game/BattleSim.jsx frontend/src/pages/Game/BattleGround.css
git commit -m "feat: show player's own trainer sprite during battle encounter beat"
```

---

## Phase Completion

After Task 2's review is clean, Phase 7 is done. Next phase per the spec's Core batch is **Phase 8 — Battle message/event presentation** (splitting the developer log from real in-game battle messages — the structural fix for "battle information is being shown in a debugging log instead of the gameplay UI"), a separate plan written and reviewed on its own. This is the largest remaining behavioral change in the Core batch.
