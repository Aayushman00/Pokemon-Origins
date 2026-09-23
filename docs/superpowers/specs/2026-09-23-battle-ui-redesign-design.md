# Battle UI Redesign

## Context

The battle screen (`frontend/src/pages/Game/BattleSim.jsx`) currently shows:
- HP boxes (name, level, HP bar/number, status badge, party dots) for player and enemy.
- A 60/40 split bottom bar: `.gba-dialog-box` (message text or move grid) / `.gba-menu-box` (command menu or move info).
- A single `currentMessage` line at a time, drained from a queue; the full per-battle event history only exists in a separate collapsed "DEVELOPER LOG" accordion below the device.
- One generic hit-flash animation for every move, regardless of type.

Reference screenshots (FireRed) were provided for tone, not for literal copying — the goal is a redesign that keeps this project's existing cream/navy LCD aesthetic while picking up FireRed's information density and pacing feel. The BEARD BEAR watermark visible in the reference images is not part of the design.

This spec covers the full redesign: a gender icon and EXP bar in the HP boxes, a visual pass on the move-select UI, replacing the single-line message with a full accumulating log that expands to fill the bottom bar during move resolution, and type-based move animations.

## Non-goals

- Per-individual-move bespoke animations (350+ unique FireRed animations) — out of scope; type-based (17 variants) is the agreed ceiling.
- Any change to battle logic, turn order, or the server's event contract beyond the two additive fields below.
- Redesigning the party-select, bag-select, or battle-outcome screens (unchanged).

## 1. Backend data additions

Two pieces of data the HUD needs are not currently exposed on the live battle snapshot:

**Gender.** `trainer_pokemon` has no gender column today — `pokemonDetailService.js`'s `gendersFromRate()` only lists a species' *possible* genders (for the Pokédex), it doesn't assign one to an owned Pokémon.

- New migration `database/migrations/007_trainer_pokemon_gender.sql`: adds `gender ENUM('male','female','genderless') NULL` to `trainer_pokemon`.
- A new helper (near `gendersFromRate`, e.g. `rollGender(genderRate)`) picks one outcome: `genderRate === -1` → `'genderless'`, `=== 0` → `'male'`, `=== 8` → `'female'`, otherwise weighted random (`genderRate` = eighths that are female, per the existing convention).
- Called once, at creation time only, in the two places a `trainer_pokemon` row is created: starter selection (`starterService`) and catching a wild Pokémon. Never re-rolled.
- Party/battle read queries (`partyService.js`, wherever `trainer_pokemon` rows are hydrated into session pokemon) select the new column through.

**Live XP progress.** `trainer_pokemon.experience` already exists as a per-level buffer (`xpService.js`), and `xpService.xpNeededForLevel(level)` already computes the threshold — but `battleSessionService.js`'s `snapshotPokemon()` (line ~126) doesn't carry `experience` onto the public session object, so the client only ever sees XP after a win (`xpSummary`), not live during the fight.

- `snapshotPokemon()` adds `experience: Number(raw.experience) || 0` and `xp_to_next: xpNeededForLevel(raw.level)` to its returned object.
- `clonePokemon()` needs no change (these are plain numbers, already copied via spread).

Both fields flow to the client automatically through the existing session snapshot the frontend already polls/receives — no new endpoint.

## 2. `HpBox.jsx`

New file: `frontend/src/pages/Game/battle/HpBox.jsx`.

Props: `{ pokemon, role /* 'player' | 'enemy' */, party, activePosition, opponentMove }` — the same data `BattleSim.jsx` already computes for the two inline HP boxes today; this is a lift-and-shift with additions, not a new data flow.

Renders what `.gba-hp-box` renders today (name, level, status badge, party dots, HP bar + fill, HP number text for the player box) plus:

- **Gender symbol** next to the name: ♂ (blue, `#5b93ff`) for male, ♀ (pink, `#ff6b9d`) for female, nothing rendered if `genderless` or `null` (e.g. old saves with no assigned gender — the field is nullable, so this must degrade silently, not throw).
- **EXP bar** — player role only. A second thin bar under the HP row, same `motion.div` width-spring pattern the HP fill already uses, filled `pokemon.experience / pokemon.xp_to_next` (clamped 0–100%), color `#3b82f6` (blue, distinct from HP's green/yellow/red). Enemy box does not get one (enemies don't show XP in mainline games either).

CSS: extend `BattleGround.css` with `.gba-exp-container` / `.gba-exp-bar` / `.gba-exp-fill` and `.gba-gender-male` / `.gba-gender-female`, sized to sit under the existing `.gba-health-container` without changing the HP box's outer footprint (so `slotStyle()`/`shadowStyle()` positioning in `battleLayout.js` — which the user explicitly said not to move — stays untouched; the box grows downward by the height of one thin bar, same as PP text already does in the move panel).

## 3. `MoveMenu.jsx`

New file: `frontend/src/pages/Game/battle/MoveMenu.jsx`.

Props: `{ grid, menuCursor, hoveredMove, onSelectMove, onHoverMove, mustStruggle }` — lifted directly from the existing `moveSelect`-phase JSX (lines ~1420–1523 today), no behavior change: same 2×2 grid on the dialog side, same PP/type/description panel on the menu side, same arrow-key (`cursorPhases` effect already in `BattleSim.jsx`) + click/hover handling, same Struggle special case.

Visual-only changes:
- Font size increased on move names and the info panel (matching the reference's denser, "menu feels full" look) — a token bump in `BattleGround.css`'s move-grid/move-info rules, not a layout change.
- Type chip styling kept as-is (already color-coded via `TYPE_COLORS`), given a slightly bolder border/shadow to read as a "chip" rather than a plain background swatch.
- Palette stays this project's existing cream (`#f8f8f8`) / navy (`#1f3b57`) — FireRed's purple move-info borders are not copied, per the "don't copy blindly" direction.

## 4. `MessageLog.jsx` + fullwidth flow

New file: `frontend/src/pages/Game/battle/MessageLog.jsx`.

**Data change:** `BattleSim.jsx` currently tracks `currentMessage` (one string, overwritten each drain tick) alongside `battleLog` (the full accumulated history, used only by the dev accordion). MessageLog is given a new `activeBeatLines` array instead of a single string — the drain loop (`messageQueueRef`, `addLog`, the effect around line ~285) starts a fresh `activeBeatLines` array when a new player turn begins (`uiPhase` transitions into `command`) and appends each drained line to it, same pacing/timing as today. `currentMessage` is removed as a concept; MessageLog renders the full `activeBeatLines` array as stacked lines (scrollable if it overflows the box, same font as today).

**Layout rule:** `.gba-bottom-ui`'s two children currently always render at fixed 60/40 width. New CSS state — when `uiPhase` is not one of `command` / `moveSelect` / `partySelect` / `bagSelect` / `restartConfirm` / `finished` (i.e. we're in `intro`/`acting`/mid-beat, purely relaying messages), `.gba-dialog-box` gets a `--fullwidth` modifier class (100% width, absolute-positioned or flex-grow over `.gba-menu-box`) and `.gba-menu-box` is not rendered (returns `null`) for that phase. On the next `command` phase, both revert to the existing 60/40 split — no player input needed for the revert (confirmed: auto-revert once the beat finishes, matching FireRed).

**Dev log removal:** the collapsible "DEVELOPER LOG" section below the Shell (`devLogOpen` state, the accordion JSX at the bottom of `BattleSim.jsx`) is deleted — `MessageLog` showing the full per-beat history in the main UI makes it redundant. `battleLog` state can also be removed if nothing else reads it (confirm during implementation; `xpSummary` and `battleOutcome` are separate state, unaffected).

## 5. Type-based move animations

`frontend/src/pages/Game/battleAnimation.js`'s `ANIMATION_VARIANTS` / `getAnimState` currently return one generic set of motion values regardless of the move used. This adds a `move_type` parameter to `getAnimState` and three animation *families* (not 17 fully bespoke variants — one shared shape per family, parameterized by the mover's existing lunge direction):

- **Physical-feel** (Normal, Fighting, Rock, Ground, Steel, Bug, Poison, Ghost, Dark, Dragon): existing lunge-into-contact motion (already in `BattleSim.jsx`'s inline `x` animation) + a contact hit-flash tinted by `TYPE_COLORS[move_type]` instead of today's fixed flash color.
- **Special/ranged-feel** (Water, Electric, Psychic, Fire, Ice, Fairy, Flying): no lunge — attacker stays put, a brief projectile-colored flash sweeps toward the defender (reusing the existing `hitFlash` overlay div, just given a directional CSS transform and the type's color).
- **Status** (Status-category moves, detected via `move.power === 0` or existing category data if present): no lunge, no hit-flash — a soft sparkle/glow pulse on the *user* rather than the target, since status moves don't deal contact damage.

This is additive to `battleAnimation.js` and the `hitFlash`/`criticalFlash` state already in `BattleSim.jsx` — no new animation state machine, just more variants selected by `move.move_type` (already present on every move object from `sanitizeMove()` server-side).

## 6. File layout

```
frontend/src/pages/Game/battle/
  HpBox.jsx
  MoveMenu.jsx
  MessageLog.jsx
```

`BattleSim.jsx` imports these three and renders them where the equivalent inline JSX blocks are today (HP boxes, the `moveSelect`-phase dialog/menu split, the message-relay phases). `battleLayout.js`, `battleAnimation.js`, `BattleGround.css`, and `BattleSim.jsx`'s state/handlers stay in the same file, only gaining new fields/params as described above.

## Testing

- `xpService`/`battleSessionService` unit tests already exist (`battleSessionService.test.js`) — extend to assert `snapshotPokemon()` includes `gender`, `experience`, `xp_to_next`.
- New gender-assignment logic gets a unit test (deterministic for `genderRate` -1/0/8, statistical/seeded for in-between ratios, matching existing test patterns in `pokemonDetailService.test.js`).
- No new frontend test framework is introduced; `HpBox`/`MoveMenu`/`MessageLog` are presentational and covered by manually driving the battle screen in-browser (existing project convention — no frontend test suite currently exists for `BattleSim.jsx`).

## Migration/compatibility notes

- `gender` is nullable — existing `trainer_pokemon` rows (created before this change) have `gender = NULL` and simply show no gender symbol. No backfill migration needed.
- `experience`/`xp_to_next` are derived from data that already exists; no data migration needed, purely an additive field on an existing snapshot function.
