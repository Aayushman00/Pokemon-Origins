# Battle System + Pokédex — GBA/FRLG Visual & UX Redesign

Status: approved for Core batch, extends `docs/design/STYLE_GUIDE.md` and `docs/design/ANIMATION_GUIDE.md` (this doc supersedes their battle-scene sections; Pokédex/menu sections in those docs stand as-is unless called out below).

## 1. Problem statement

The battle scene (`frontend/src/pages/Game/BattleSim.jsx` + `BattleGround.css`) and the Pokédex (`pages/Pokedex/*`) read as a modern web dashboard skinned with Pokémon assets, not a GBA Pokémon game. Confirmed structural issues from repo audit (2026-09-18):

- **Battle info is debug-only.** `addLog()` writes every event ("CHARMANDER used EMBER!", "Super effective!", "GOLDEEN fainted!") into a timestamped scroll box (`.gba-battle-log`) below the stage. The in-fight dialog box only ever shows generic filler ("What will X do?"). Players never see the actual events in the game surface.
- **Animation is translateY only.** `enemyIdle`/`playerIdle` keyframes bob vertically; attack is `x: [0,±24,0]`; damage is a brightness flicker; faint is `opacity:0`. No anticipation/impact/recovery phasing, no per-state animation machine.
- **Positioning is ad hoc.** Battle stage is a fixed 768px canvas scaled via `transform: scale()` (reasonable base), but Pokémon/status/shadow placement inside it is hardcoded pixel offsets, not slot-anchored, so sprites of different bounding boxes don't sit consistently on the ground.
- **Shadows are CSS blur ellipses**, not GBA-style flat elliptical shadow art.
- **Trainer battle sprites don't exist.** Opponent NPC trainers already render correctly (`TrainerAvatar.jsx`, 44 local sprites). The player character (Red/Leaf) has no battle sprite at all — the uploaded sheets are raw and unwired.
- **Sprites are currently placeholder-local**, not sourced from real FRLG sprite sheets. Confirmed decision: replace with real Bulbagarden FRLG front/back sprites (Q&A 2026-09-18).
- **Victory flow is mostly fine** (message-progression style, battlefield stays visible) but its "Continue" control (`.gba-restart-btn`) is a rounded-pill modern button, not FRLG chrome — this is a narrow fix, not a rebuild.
- **RESET vs RUN is already correct.** Main menu is FIGHT/BAG/POKÉMON/RESTART; RESTART fully tears down and requests a fresh server session (`restartBattle()` → `startBattle(true)`); no RUN/flee action exists anywhere in the codebase. Do not introduce one; do not rename RESTART.
- **Encoding bug root cause: tooling, not live code.** `database/pokedex_data.sql` has historically been exported from MySQL Workbench on Windows as UTF-16LE; `scripts/reorder-sql-dump.py` is a manual, undocumented fix step. Current on-disk data is UTF-8-clean. Fix is process automation + defense-in-depth, not a string replace.
- **Pokédex stat bars are literal rounded-pill CSS progress bars** — the exact "modern web progress bar" the visual direction rejects. Weaknesses are provided by the API; resistances/immunities are not — must be computed client-side against the existing type chart (`utils/typeColors.js`) rather than inventing fake data.
- **BattleGround.css hardcodes hex colors** that happen to duplicate `tokens.css` variables instead of referencing them — a design-system drift to fix while touching this file.

## 2. Visual direction (binding for every phase)

FRLG-inspired, not a copy: cream/olive status panels, dark-blue-on-cream dialogue box, pixel typography (`--font-pixel`, already in tokens.css), restrained outlines, bottom-center sprite anchoring, elliptical flat shadows, compact HUD density. Forbidden throughout: rounded pill buttons/bars, card-with-shadow victory modals, gradients, blur, floating web-app chrome. Every phase gets a one-line gut check against real FRLG battle screens before commit.

## 3. Architecture

### 3.1 Battle coordinate system

Replace hardcoded pixel offsets with a slot model inside the existing 768×432 (4:3, matching current stage) internal canvas, still scaled via the existing `transform: scale()` wrapper (that part already works and should not change):

```
BATTLE_SLOTS = {
  opponent: { groundX: 528, groundY: 168, anchor: 'bottom-center' },
  player:   { groundX: 176, groundY: 344, anchor: 'bottom-center' },
}
```

Every sprite (Pokémon, shadow) reads its own natural pixel bounding box (already known at build time from the cropped PNG dimensions) and positions itself so its bottom-center sits on `groundX/groundY`, instead of each component guessing its own top/left. This is the one coordinate system called for in the brief — implemented as a small `battleLayout.js` helper (pure functions: `slotFor(role)`, `anchorStyle(bbox, slot)`), not a new framework. No new abstraction beyond that helper; `BattleSim.jsx` keeps owning state, it just stops hand-computing offsets.

### 3.2 Battle event stream vs developer log (Phase 8 core fix)

`BattleSim.jsx` already receives a clean `events[]` array per server action and replays it through `playEvent()`. Today that function's only visible side effect is `addLog()`. Split the concerns:

```
server events[] → playEvent() → { developerLog: append (unchanged, dev-only panel)
                                 , battleMessageQueue: push formatted line }
```

Add a `battleMessageQueue` (array of `{ text, holdMs }`) consumed by the existing `.gba-dialog-box`: one message at a time, advances on click/timeout, matching the existing `ANIMATION_GUIDE.md` "beats are sequenced, never parallel" rule. Formatted lines reuse the same event data already being logged today ("CHARMANDER used EMBER!", "It's super effective!", "GOLDEEN fainted!", XP/level-up lines) — no new data needed from the server. The existing `.gba-battle-log` stays, relabeled as a collapsible developer panel, not the primary feedback surface.

### 3.3 Animation state machine (Phase 11)

Replace the boolean-flag animation approach (`playerAttacking`, `...DamageEffect`, `...Fainted`) with one explicit state per active Pokémon: `IDLE | SEND_OUT | ATTACK | DAMAGE | CRITICAL_HIT | FAINT | SWITCH | VICTORY`. Each state maps to a CSS animation class swap (matching the existing keyframe-driven approach in `BattleGround.css` — no new animation library) with the anticipation→action→recovery phases specified in section 6. This is a lookup table + one `useState` per side, not a new engine.

### 3.4 Move animation registry (Phase 12, deferred batch)

A small registry keyed by move category (`fire | water | electric | grass | ice | physical | projectile | status | stat`) mapping to a reusable effect component + timing, so individual moves compose primitives instead of one-off components per move. Deferred to the polish batch — not needed for the core structural rebuild, and the current per-move visuals are not called out as broken in the brief.

## 4. Asset pipeline

```
assets/
  pokemon/
    front/{dex3}.png      # e.g. front/004.png
    back/{dex3}.png
  trainers/
    player/red.png
    player/leaf.png
    npc/...                # existing 44 files, unchanged
  battle/
    backgrounds/{name}.png
    shadows/oval-{size}.png
  ui/
    panels/, icons/, cursors/
```

Pipeline script (`scripts/fetch_frlg_sprites.py`, Python + Pillow, already installed): for each of the 151 Gen-I dex numbers, fetch the specific FRLG front sprite file and FRLG back sprite file from Bulbagarden's stable per-file URLs (identified individually, not scraped from category-listing HTML at runtime), verify HTTP 200 + PNG content-type + non-trivial size, open with Pillow, verify mode has alpha (convert to RGBA if needed), trim to the sprite's actual bounding box (`Image.getbbox()` on the alpha channel — this is the real, data-driven crop the brief demands, not a guessed rectangle), save to canonical path. Re-running the script is idempotent and safe to check in outputs (no runtime fetch — the app only ever reads `frontend/public/sprites/pokemon/front/{dex3}.png` etc., mirroring the current working local-sprite pattern). Old `assets/battle_sprites/`, `assets/sprites_cropped/` (disconnected, superseded) get deleted once the new set is verified in place, rather than left as a third dead asset store.

Trainer crop (`scripts/crop_trainer_sprites.py`): the uploaded sheets are indexed spritesheets on a flat color-key background (cyan for male, magenta for female) — verified by visual inspection. Script keys out the background color to alpha, then crops the specific "battle back sprite" pose already present on each sheet (the larger standalone send-out/throw poses at the bottom of the male sheet and in the labeled BATTLE row of the female sheet — exact pixel rects pinned during Phase 6 implementation from the inspected coordinates, not guessed) to `trainers/player/red.png` / `leaf.png`.

Background crop (`scripts/crop_battle_background.py`): the uploaded sheet is a 3-column × 4-row grid of individually bordered battlefield backgrounds (dark-red 3px separators, confirmed by inspection: cell size ≈246×116px for the first three rows). Script slices each populated cell (skip the credit-text cell), strips the 3px border, saves each as its own named background (`grass.png`, `water.png`, `plain.png`, `sand.png`, `dirt.png`, etc.), keeps them in `assets/battle/backgrounds/`. Default battle background: the classic route grass cell. No blur/resize — dimensions kept native, CSS scales the whole stage with `image-rendering: pixelated`, never the individual asset.

Shadow: not a photographic asset — a small flat SVG/PNG ellipse (dark, ~40% opacity, no blur/gradient) sized relative to each Pokémon's sprite width, per FRLG's flat-shadow look. Two or three size buckets (small/medium/large quadruped/tall) are enough; no per-species shadow needed.

## 5. Encoding fix

1. Add `charset: 'utf8mb4'` explicitly to the `mysql2.createPool()` config in `backend/src/config/db.js` (defense-in-depth; cheap, no behavior change since utf8mb4 is already the DB's collation).
2. Fold `scripts/reorder-sql-dump.py`'s UTF-16→UTF-8 normalization into the documented DB-import step (README / migration instructions) so a future MySQL Workbench re-export (which defaults to UTF-16 on Windows) can't silently reintroduce mojibake — this is a process/documentation fix, not new code, matching the audit's root-cause finding.
3. Repo-wide grep for mojibake patterns (`Pok├⌐mon`, `PokÃ©mon`, `Ã©`, `�`) as a one-time verification pass across `.sql/.js/.jsx/.json/.md/.py/.env` — audit already found none currently present, so this phase is confirm-and-document, not hunt-and-fix.

## 6. Animation states (detail for Phase 11)

| State | Beats |
|---|---|
| IDLE | Very subtle 2px vertical drift, slow (existing `--dur-slow`-scale cadence), never a bounce loop that reads as floating. |
| SEND_OUT | Poké Ball arc (reuse trainer back sprite + small ball sprite) → flash → Pokémon sprite fades/scales in at slot → settle (tiny overshoot then still). |
| ATTACK | Anticipation (lean back / scale 0.97, ~100ms) → lunge toward opponent slot (~150ms) → impact hold (~80ms) → recovery back to slot (~150ms). |
| DAMAGE | Recoil shift opposite the attacker → 2–3 frame shake → white hit-flash (`steps()` easing per `ANIMATION_GUIDE.md`) → settle. |
| CRITICAL_HIT | Same as DAMAGE but sharper shake amplitude + a brief screen-flash accent + distinct message beat ("A critical hit!") before HP drains. |
| FAINT | Damage settle → sink ~12px while fading alpha to 0 over `--dur-slow`-ish → removed from slot. |
| SWITCH | Current Pokémon does a shortened FAINT-style sink (no fade-to-black, just drop below stage line) → new SEND_OUT plays. |
| VICTORY | Player Pokémon plays one small "cheer" bounce (reuse IDLE amplitude ×2, once, not looping) while message queue runs XP/level-up lines. |

All timings pull from existing `--dur-fast/med/slow` tokens rather than inventing new magic numbers, and every state respects the existing `prefers-reduced-motion` contract already documented in `ANIMATION_GUIDE.md` (skip the visual beat, keep state/timeout logic firing).

## 7. Pokédex

- Replace `rounded-full` stat bars with a segmented pixel-block bar (fixed-width ticks filled left-to-right, `steps()` fill, no border-radius pill) — same HP color rule (`--hp-green/yellow/red`) extended to stat bars for visual consistency.
- Add a compact type-matchup panel: reuse the already-fetched `weaknesses[]` from the API, and compute resistances/immunities client-side from the existing type multiplier table (wherever the frontend already has or needs a type chart — check `utils/typeColors.js` and battle-engine's type data for a chart to share/port, don't hand-author a second one). No fake data; if a multiplier table doesn't already exist on the frontend, port the real one used by the battle engine's damage calc so both stay consistent.
- Everything else in the Pokédex (device-shell chrome, LcdPanel, entry cards) already matches `STYLE_GUIDE.md` and stays as-is — this is a targeted fix to the two components that read as modern-web (stat bars, weakness list), not a full page rebuild.

## 8. Victory flow

No architecture change — the message-progression flow in `BattleSim.jsx`'s `finished` phase already matches the brief. Only fix: restyle `.gba-restart-btn` off the rounded-pill/decorative-circle treatment onto the same pixel-button chrome already defined for the rest of the app (`.pixel-btn` in `tokens.css`/`STYLE_GUIDE.md`) instead of inventing new button chrome.

## 9. Phased plan (Core batch — approved; Polish batch listed for later)

Core batch, each phase ends in its own commit, tested before moving on:

1. **Encoding + DB config** — `db.js` charset, migration doc note, verification grep. *Files:* `backend/src/config/db.js`, `database/README.md`. *Test:* fresh import round-trip with a Workbench-style UTF-16 sample, confirm reorder script catches it; grep clean.
2. **Asset pipeline: Pokémon sprites** — `scripts/fetch_frlg_sprites.py`, populate `frontend/public/sprites/pokemon/{front,back}/`, delete superseded `assets/battle_sprites/`, `assets/sprites_cropped/`. *Test:* `scripts/validate-sprites.js` (existing) extended/run against new set; spot-check 5 sprites visually.
3. **Asset pipeline: trainers + background** — crop scripts for Red/Leaf battle sprites and the background sheet. *Test:* visual diff, transparency check (no cyan/magenta halo), correct crop rect (no neighboring frame bleed).
4. **Battle coordinate system** — `battleLayout.js`, wire into `BattleSim.jsx`/`BattleGround.css`, replace hardcoded offsets. *Test:* Pokémon of very different sprite heights (e.g. Onix vs Diglett) both sit correctly on the ground line.
5. **Backgrounds + shadows** — swap in cropped background, elliptical flat shadow assets sized per Pokémon. *Test:* visual check at 3 viewport sizes.
6. **Pokémon sprite rendering + placement** — swap sprite source to new pipeline output, bottom-center anchoring via the coordinate system. *Test:* front/back correct sides, no stretch/blur (`image-rendering: pixelated`).
7. **Trainer sprite integration** — Red/Leaf appear only during SEND_OUT beat, not parked on the battlefield permanently. *Test:* send-out sequence for both a male- and female-flagged account (whatever currently selects avatar gender).
8. **Battle message system** — `battleMessageQueue`, dialog box shows real event text, developer log demoted to a dev-only collapsible panel. *Test:* full battle transcript matches queue exactly what devlog shows today, in order.
9. **Command panel / RESET verification** — restyle command panel with new chrome; explicit test that RESTART still calls `startBattle(true)` and is not conflated with any flee concept. *Test:* existing battle flow tests + manual RESTART click mid-battle confirms full reset.
10. **Victory flow button restyle** — swap `.gba-restart-btn` to `.pixel-btn` chrome. *Test:* visual check only, no logic change.
11. **Animation state machine** — IDLE/SEND_OUT/ATTACK/DAMAGE/CRITICAL_HIT/FAINT/SWITCH/VICTORY per section 6. *Test:* trigger each state manually in a dev battle, confirm phase timing and reduced-motion fallback.

Polish batch (deferred, separate future approval — not started now): move animation registry (section 3.4), HP bar animated drain + Pokédex stat-bar segmented rendering, send-out Poké Ball flourish detail, critical-hit screen accent, idle sprite micro-variation per species, sound hooks if architecture supports it.

## 10. Testing approach

Battle-engine/damage-calc Python tests are untouched by this work (pure UI/asset layer) — rerun existing suite after each phase as a regression guard, don't add battle-logic tests for a UI change. Frontend: extend `sprites/*.test.js` and `validate-sprites.js` for the new asset set; add a small test for `battleLayout.js`'s pure anchor math (given a bbox + slot, assert resulting top/left). Visual verification via the `run` skill/dev server at desktop, medium, and small viewport widths after phases 4–11, per the brief's responsive requirement — automated tests don't substitute for this.

## 11. Risks / rollback

- Bulbagarden sprite fetch is one-time and scripted but network-dependent at *build* time only (never runtime) — if a specific dex number's stable URL 404s, the script must fail loudly per-file rather than silently skip, so gaps are caught before commit, not discovered in the running app.
- Coordinate-system change (`battleLayout.js`) touches every sprite's on-screen position — highest visual-regression risk phase; verify at three breakpoints before committing.
- `BattleGround.css` currently hardcodes colors that happen to match tokens.css; switching them to `var(--panel-cream)` etc. is intentionally in scope during phase 9/10 touch but should be a mechanical find-replace, not a redesign, to keep that diff reviewable.
- Deleting `assets/battle_sprites/`/`assets/sprites_cropped/` is a real deletion of tracked files — do it in its own reviewable commit within phase 2, after confirming the new pipeline's output is complete and correct, not in the same commit as the new script.
