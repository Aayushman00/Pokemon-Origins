# Real Battle Sprites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the sheet-extracted Pokémon battle sprites (enemy front, player back, 2-frame idle animation each) into `BattleSim.jsx`, replacing the curated-art `PokemonSprite` on the battle stage, with the existing FireRed layout, positioning, and fallback chain preserved.

**Architecture:** A dedicated resolver (`src/sprites/battleSprites.js`) maps `{pokemonId, variant, frame}` to `/sprites/battle/<dex>/<variant>[-b].png`, separate from the curated `pokemonSprites.js` resolver used everywhere else (Bag, Pokédex, party rows, landing). A new `BattlePokemonSprite` component wraps that resolver, alternates `frame` on a slow interval for the idle animation, and falls back through battle-art → curated-art → generic fallback on `onError` so a missing battle asset never breaks the screen. `BattleSim.jsx` swaps its two curated-sprite `<PokemonSprite>` usages (enemy front-stage sprite, player back-stage sprite) for `<BattlePokemonSprite>`, keeping every existing prop (motion variants, `as={motion.img}`, `key`, `alt`) unchanged so the FireRed intro/attack/faint animations keep working untouched.

**Tech Stack:** React 18, Framer Motion (`motion.img`), Node's built-in `node:test` + `node:assert/strict` for unit tests (existing repo convention, see `src/sprites/pokemonSprites.test.js`).

**Spec:** User's inline request (see conversation) — front-facing enemy sprite upper-right with its HP panel, back-facing player sprite bottom-left with its HP panel, original pixel proportions preserved via `image-rendering: pixelated`, no distortion, sprites mapped by Pokémon ID, existing battle logic/FireRed UI untouched, existing fallback preserved, and BOTH extracted frames per Pokémon kept and slow-alternated as idle animation (never merged/averaged/discarded/duplicated).

## Global Constraints

- Battle sprites live under `frontend/public/sprites/battle/<3-digit dex>/{front,front-b,back,back-b}.png` — already extracted for all 151 dex entries (604 files, verified distinct per-frame via md5 spot check on #001/#025/#150).
- Curated resolver (`pokemonSprites.js`) and its consumers (Bag, Pokédex, party rows, landing) must NOT change — this work is scoped to the battle stage only.
- `image-rendering: pixelated` must apply to every battle sprite `<img>`; sprite width is fixed in CSS (`.gba-pokemon-sprite img { width: 130px }`) with no explicit height, which preserves aspect ratio (no distortion) — do not add a fixed height.
- Idle animation interval must be slow/subtle (existing implementation uses 900ms) — do not speed this up into a flicker.
- On sprite load failure, must fall back battle-art → curated-art (`getPokemonSprite`) → generic fallback (`getPokemonSpriteFallback`) — never a blank image or thrown error.

---

## Current State (already implemented, verified this session)

Reading the repo showed most of this plan already built in an earlier, uncommitted pass:

- `frontend/src/sprites/battleSprites.js` (untracked) — resolver, done, matches spec.
- `frontend/src/components/PokemonSprite/BattlePokemonSprite.jsx` (untracked) — component with frame alternation + 3-stage fallback, done, matches spec.
- `frontend/src/pages/Game/BattleSim.jsx` (modified, uncommitted) — both stage sprites already swapped from `PokemonSprite` to `BattlePokemonSprite`.
- `frontend/public/sprites/battle/**` — all 151 dex folders present, 604 PNGs, front/back frame pairs confirmed distinct (not duplicated) by hash spot-check.
- `frontend/src/pages/Game/BattleGround.css` — enemy container already `top/right`-positioned with its own HP box; player container already `bottom/left`-positioned with its own HP box; `.gba-pokemon-sprite img` already pixelated with fixed width only.

What's missing: no unit test exists for the new resolver/component (repo convention is a co-located `*.test.js` per module, e.g. `pokemonSprites.test.js`), and the `BattleSim.jsx` change is uncommitted.

---

### Task 1: Unit-test the battle sprite resolver

**Files:**
- Create: `frontend/src/sprites/battleSprites.test.js`
- Test: same file (Node's built-in test runner, run via `node --test`)

**Interfaces:**
- Consumes: `getBattleSprite({ pokemonId, variant, frame })` from `frontend/src/sprites/battleSprites.js:18` — returns `string|null`.
- Produces: nothing new; this task only adds test coverage for the existing function.

- [ ] **Step 1: Write the failing test**

```javascript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBattleSprite, BATTLE_SPRITE_BASE } from "./battleSprites.js";

describe("getBattleSprite", () => {
  it("resolves #001 front frame a (default)", () => {
    assert.equal(getBattleSprite({ pokemonId: 1, variant: "front" }), "/sprites/battle/001/front.png");
  });

  it("resolves #001 front frame b", () => {
    assert.equal(
      getBattleSprite({ pokemonId: 1, variant: "front", frame: "b" }),
      "/sprites/battle/001/front-b.png"
    );
  });

  it("resolves #025 back frame a and b", () => {
    assert.equal(getBattleSprite({ pokemonId: 25, variant: "back" }), "/sprites/battle/025/back.png");
    assert.equal(
      getBattleSprite({ pokemonId: 25, variant: "back", frame: "b" }),
      "/sprites/battle/025/back-b.png"
    );
  });

  it("pads single-digit dex numbers", () => {
    assert.equal(getBattleSprite({ pokemonId: 7, variant: "front" }), "/sprites/battle/007/front.png");
  });

  it("defaults an invalid variant to front", () => {
    assert.equal(getBattleSprite({ pokemonId: 1, variant: "icon" }), "/sprites/battle/001/front.png");
  });

  it("returns null for an out-of-range dex id", () => {
    assert.equal(getBattleSprite({ pokemonId: 152, variant: "front" }), null);
    assert.equal(getBattleSprite({ pokemonId: 0, variant: "front" }), null);
    assert.equal(getBattleSprite({ pokemonId: null, variant: "front" }), null);
  });

  it("never points outside the battle sprite base", () => {
    const url = getBattleSprite({ pokemonId: 150, variant: "back", frame: "b" });
    assert.equal(url.startsWith(BATTLE_SPRITE_BASE + "/"), true);
    assert.equal(url.startsWith("http"), false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `cd frontend && node --test src/sprites/battleSprites.test.js`
Expected: since `battleSprites.js` already exists and matches this contract, this should PASS immediately — this step confirms the resolver's real behavior matches the spec, not just its intent. If any case fails, fix `battleSprites.js` (not the test) to match the Global Constraints above, then rerun.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/sprites/battleSprites.test.js
git commit -m "test: cover battle sprite resolver (front/back, frame a/b, fallback range)"
```

---

### Task 2: Commit the BattleSim wiring + new sprite assets

**Files:**
- Modify: `frontend/src/pages/Game/BattleSim.jsx` (already edited — swaps `PokemonSprite` → `BattlePokemonSprite` for the enemy front sprite and the player back sprite)
- Create (already on disk, untracked): `frontend/src/components/PokemonSprite/BattlePokemonSprite.jsx`
- Create (already on disk, untracked): `frontend/src/sprites/battleSprites.js`
- Create (already on disk, untracked): `frontend/public/sprites/battle/**/*.png` (604 files)

**Interfaces:**
- Consumes: `BattlePokemonSprite` component (`frontend/src/components/PokemonSprite/BattlePokemonSprite.jsx:19`) — props `{ pokemonId, variant, alt, as, ...motionProps }`, same surface as `PokemonSprite` so it drops into the existing JSX without other changes.
- Produces: nothing further downstream.

- [ ] **Step 1: Confirm the two call sites in BattleSim.jsx**

`frontend/src/pages/Game/BattleSim.jsx:963` (enemy, `variant="front"`) and `frontend/src/pages/Game/BattleSim.jsx:1000` (player, `variant="back"`) already read `<BattlePokemonSprite ...>`. No further JSX edit needed for this task — just verify with:

```bash
grep -n "BattlePokemonSprite" frontend/src/pages/Game/BattleSim.jsx
```

Expected: 3 matches (the import + the two usages).

- [ ] **Step 2: Manually verify in the running app**

```bash
cd frontend && npm run dev
```

Open a battle screen in the browser. Confirm:
- Enemy sprite is front-facing, upper-right, next to its own HP box.
- Player sprite is back-facing, bottom-left, next to its own HP box.
- Both sprites are crisp/blocky (no blur) — inspect element and confirm computed `image-rendering: pixelated`.
- Leave the battle open ~2s and watch for a subtle idle bob/shift as the frame alternates every 900ms (not a fast flicker).
- Sprites are not stretched (width fixed, height auto in devtools).

- [ ] **Step 3: Stage and commit everything together**

```bash
git add frontend/src/pages/Game/BattleSim.jsx \
        frontend/src/components/PokemonSprite/BattlePokemonSprite.jsx \
        frontend/src/sprites/battleSprites.js \
        frontend/public/sprites/battle
git commit -m "feat: use sheet-extracted sprites with 2-frame idle animation on the battle stage"
```

---

### Task 3: Full test suite sanity check

**Files:**
- None modified; verification only.

**Interfaces:**
- Consumes: whatever `npm test` wires up in `frontend/package.json`.
- Produces: nothing.

- [ ] **Step 1: Run the full frontend test suite**

```bash
cd frontend && npm test
```

Expected: PASS, including the new `battleSprites.test.js` and the existing `pokemonSprites.test.js`, with no regressions in other suites (e.g. any `BattleSim`-adjacent tests).

- [ ] **Step 2: If anything fails, fix forward**

Any failure here means either the resolver contract from Task 1 is wrong, or an existing test assumed `PokemonSprite` was still used on the battle stage. Fix the source (not the test, unless the test's assumption is genuinely stale) and rerun until green. Do not commit a red suite.

---

## Self-Review

**Spec coverage:**
- Enemy front-facing, upper-right, own HP panel → `.gba-enemy-container` CSS (`top: 30px; right: 40px`) + existing enemy HP box markup — pre-existing, unchanged, verified in Task 2.
- Player back-facing, bottom-left, own HP panel → `.gba-player-container` CSS (`bottom: 40px; left: 40px`) + existing player HP box markup — pre-existing, unchanged, verified in Task 2.
- Original proportions / no distortion → `.gba-pokemon-sprite img { width: 130px }` with no explicit height — verified as a Global Constraint.
- `image-rendering: pixelated`, no blur/smoothing → present on `.gba-pokemon-sprite img` and `.battle-page` — verified as a Global Constraint.
- Mapped by Pokémon ID → `getBattleSprite({ pokemonId, ... })` dex-padding logic — covered by Task 1.
- Existing battle logic / FireRed UI preserved → only the sprite `<img>` source swapped; all motion/animation props on the call sites left untouched — verified in Task 2, Step 1.
- Missing-sprite fallback → `BattlePokemonSprite`'s 3-stage `onError` chain (battle → classic curated → generic fallback) — pre-existing, exercised implicitly by Task 1's resolver tests plus the Task 2 manual check (breaking a filename locally would be the way to hard-verify, optional).
- Preserve ALL frames, 2-frame animation, no merge/discard/duplicate → both `front`/`front-b` and `back`/`back-b` files extracted per dex folder, confirmed non-duplicate via md5 hash spot-check (#001/#025/#150 this session) — covered by Task 1's frame-a vs frame-b resolver tests.
- Slow, subtle alternation → `FRAME_INTERVAL_MS = 900` in `BattlePokemonSprite.jsx:8` — verified as a Global Constraint, exercised visually in Task 2, Step 2.

**Placeholder scan:** none — every step has real code or a real shell command.

**Type consistency:** `getBattleSprite` signature (`{pokemonId, variant, frame}` → `string|null`) matches its one consumer, `BattlePokemonSprite.jsx:47`. `BattlePokemonSprite`'s prop surface (`pokemonId`, `variant`, `alt`, `as`, `...rest`) matches both `BattleSim.jsx` call sites exactly.

No gaps found; no missing tasks.
