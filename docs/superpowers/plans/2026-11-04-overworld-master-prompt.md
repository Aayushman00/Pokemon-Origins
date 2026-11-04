# Master prompt: Pokemon Origins overworld + FRLG-feel overhaul

Paste everything below the line into Claude cloud. Repo: https://github.com/Aayushman00/Pokemon-Origins, branch `feature/trainer-reset` (base all work on it).

---

## ROLE

You are a senior full-stack game engineer on **Pokemon Origins** (always this exact name in UI copy). Goal: make it feel like Pokemon FireRed/LeafGreen (GBA) while adding a few unique mechanics. Work in phases. After each phase: tests green, `graphify update .` if present, short summary, then stop for my approval before the next phase. Do not combine phases.

## READ FIRST (do not skip)

Read before planning: `README.md`, `HLD.md`, `docs/design/STYLE_GUIDE.md`, `docs/design/ANIMATION_GUIDE.md`, `docs/QA_CAMPAIGN_CHECKLIST.md`, `docs/superpowers/plans/*` (esp. the 14 GBA redesign phases, move-lab, playground plans). Then skim: `frontend/src/App.jsx`, `frontend/src/v2/{battle,pages,ui,styles,layout}`, `frontend/src/v2/pages/playground/*` (movement + Socket.IO), `backend/src/services/*` (battleSessionService, battleStatus, battleAi, campaignService, rewardService, inventoryService, martService, evolutionService, moveLearnService, progressService), `backend/src/playground/*`, `battle-engine/` (FastAPI), `database/`. Reuse existing primitives (`Panel`, `DialogueBox`, `MenuList`, `Modal`, `Toast`, `Bars`, sfx.js, battleBeats, battleMessageQueue) rather than reinventing.

## STACK FACTS (verified)

- Frontend: React 18, Vite, Framer Motion, React Router v6, Axios client `frontend/src/api.js`. Screens under `frontend/src/v2/`.
- Backend: Node/Express + Socket.IO on port 5000, MySQL (schemas `pokedex`, `trainer`), Zod validation, pino logs, JWT.
- Battle engine: Python FastAPI on 8000, stateless damage/crit/miss/turn order; backend proxies it. Frontend never calls it directly.
- Current game loop: hub menu -> 10-level campaign of gauntlet battles -> boss reward (3-card offer) -> mart unlocks after Level 1 boss. Evolution and move-learn surface as pending cards on the hub.
- Playground: Socket.IO chat + movement room, no DB persistence.
- Audio: WebAudio chiptune SFX only (`sfx.js`), no music files.
- Move Lab exists at `/game/movelab`.

## NON-NEGOTIABLE CONSTRAINTS

- All new art/audio is **original or CC0**. No ripped Nintendo sprites, tiles, music or cries. Document asset licenses in `assets/LICENSES.md`.
- Pixel-perfect rendering: fixed internal resolution 240x160 (GBA), integer scaling only, `image-rendering: pixelated`, no sub-pixel camera. 16x16 tiles, 16x32 character sprites.
- Respect `prefers-reduced-motion`, keyboard + gamepad + the existing mobile pad. Wrap every `localStorage` access in try/catch.
- Server is authoritative for progress, rewards, battles, catches, trades. Client never decides outcomes. Validate all writes with Zod; parameterized SQL; transactions for multi-row changes; DB migrations in `database/migrations` (idempotent, reversible notes).
- Keep existing tests passing; add tests for every new service/pure function (Vitest on frontend, existing runner on backend, pytest on engine). No test, no merge.
- Smallest sufficient change per task; no speculative abstraction. New mechanics sit behind feature flags (`backend` config + `frontend` flag helper) so each can be toggled and balance-tested.
- Git: small commits, imperative messages, **no Co-Authored-By / Claude attribution lines**.
- Never commit generated output (`graphify-out/`, venvs, `node_modules`).

## TARGET EXPERIENCE

A player registers, makes an avatar, wakes in a starting town, walks tile-by-tile through towns and routes, talks to NPCs, fights spotted trainers, catches wild Pokemon in tall grass, heals at a Pokemon Center, shops at a Mart, beats a gym to earn a badge, and progresses town to town through 8 gyms, Elite Four and Champion. Menu-driven hub is replaced by the world; Start menu opens Pokedex, Party, Bag, Trainer Card, Move Lab, Save, Options.

## PHASES

### Phase 0: Audit and design doc (no feature code)
Deliver `docs/superpowers/plans/overworld-architecture.md` containing: current campaign data model, proposed schema changes, API list, module layout, how existing 10 levels map to towns/gyms (see Phase 7), risks, and a migration path that keeps current players' progress. Flag anything in the repo that contradicts this prompt. Ask me questions here if blocked; do not guess on product decisions.

### Phase 1: Overworld engine (canvas, custom, no game framework)
Location: `frontend/src/v2/overworld/`.
- Fixed-timestep loop; 240x160 offscreen canvas scaled by integer factor to fit viewport; letterbox.
- Tile grid movement FRLG-style: 16px steps, hold to walk, tap to turn in place, run with B (hold) after getting running shoes, bump animation and sound on collision, ledge hops, one-way ledges.
- Layers from Tiled JSON: ground, decor, objects, above-player (roofs/tree tops), collision, encounter zones, warps, triggers, NPC spawns, signs. Tile animation (water, flowers) via tileset animation data.
- Camera follows player, clamps to map bounds; small maps are centered.
- Map streaming: load adjacent map on edge connection with no loading screen; preload warp targets.
- Warps: door enter/exit animation, stairs, cave mouths, fade/iris transitions (reuse battle wipe style).
- Event system: data-driven triggers (on-step, on-interact, on-enter, on-flag) with a small script format (say, give, setFlag, requireFlag, heal, battle, warp, shop, cutscene-move). Flags stored per trainer server-side.
- Interaction: facing tile + A button; dialogue through existing `DialogueBox` with typewriter text, blinking advance arrow, A to fast-forward, text speed option.
- Pure logic (movement, collision, event resolution) separated from rendering so it is unit-testable without a canvas.
- Tests: movement/collision/warp/event unit tests; one smoke test that loads a sample map.
Acceptance: a test map is walkable with keyboard, gamepad and mobile pad at a locked 60 fps on a mid laptop; no sub-pixel shimmer at any window size.

### Phase 2: Avatar system (highly detailed pixel avatars)
- Sprite contract: 16x32 per frame; sheet rows = down/up/left/right (right is flipped left unless art differs); frames = idle, walk A, walk B, run A, run B, bike optional, surf optional, fishing optional, emote pose. Write `assets/sprites/avatar/SPEC.md` with exact pixel grid, palette (limited to 15 colors + transparent per layer, GBA-style), anchor points, and naming.
- Layered creator: skin tone (6+), hair style (10+) with color (12+), outfit (top, bottom, shoes) with color slots, hat, bag, accessory. Layers composited at runtime into a cached sheet; palette-swap via indexed color remap, not per-style duplicate sheets.
- Creator screen in FRLG intro style: Professor-style dialogue, name entry grid (keyboard + pad), gender-neutral presets, live rotating preview, confirm.
- Persist avatar JSON on the trainer row; render the same avatar in overworld, playground, trainer card, battle trainer back-sprite (back-view layer set required), and PvP.
- Create placeholder-quality original sheets now so everything works; the SPEC lets an artist replace them with no code change. Provide a validator script (`npm run validate:avatars`) that checks dimensions, palette count and frame coverage.
- NPC/trainer sprites reuse the same layer system plus a handful of unique class sprites (youngster, lass, hiker, gym leader, rival, professor, nurse, clerk).
Acceptance: creator output identical across overworld/playground/card; validator passes; swapping a layer sheet needs zero code edits.

### Phase 3: Core world content and the Start menu
- Maps (Tiled JSON in `frontend/public/maps/`, tilesets original): starting town (player house, rival house, lab), Route 1, Town 2 with Pokemon Center and Mart, one cave, one gym interior. Author a map-authoring guide (`docs/design/MAPS.md`) with Tiled layer/property conventions.
- Pokemon Center: nurse dialogue, ball-tray heal animation + jingle, heals HP/PP/status. Mart: reuse martService and mart UI as an in-world clerk dialogue; add sell mode at half price; FRLG pocket tabs in Bag (Items, Key Items, Balls, TMs, Berries).
- Start menu overlay (Pokedex, Party, Bag, Trainer Card, Move Lab, Save, Options) in FRLG layout; remember cursor position.
- Save: server-side position, map, flags, party; "Continue / New Game / Options" title menu. Autosave on map change.
- Day/night tint from local time (flagged, off by default).
Acceptance: new player can create avatar, leave house, reach Town 2, heal, shop, and reload into the same tile.

### Phase 4: Encounters, catching, party/PC
- Wild encounters in tall grass / water / cave tiles using per-map encounter tables (rates per slot like FRLG, level ranges, repel-style item). Server rolls the encounter; client plays grass-rustle, battle-wipe transition.
- Catching: Poke Ball / Great Ball / Ultra Ball, FRLG-style catch formula (HP, status, species catch rate, ball modifier), 0-3 shake sequence animation, "Gotcha!" jingle, nickname prompt, sent to party or PC box.
- Party cap 6; PC boxes (e.g. 8 boxes x 30) with move/withdraw/release UI; Pokedex seen vs caught states.
- Run away, ball-throw, and safe-flee rules in the battle menu.
- Tests for catch formula and encounter roller (seeded RNG).
Acceptance: catch rates statistically match the formula in a 10k-trial test; server rejects client-supplied outcomes.

### Phase 5: Trainer line-of-sight and in-world battles
- Overworld trainers with facing + sight range; "!" bubble, walk-up animation, pre-battle speech, post-battle speech, defeated flag, rematch rules.
- Battle entry/exit transitions (flash, spiral/blinds wipe, platform slide-in, ball send-out) and return to the exact overworld tile.
- Blackout: whiteout on all fainted -> respawn at last Pokemon Center, lose half coins.
Acceptance: trainers cannot be re-fought after defeat unless flagged; whiteout restores correct location and state.

### Phase 6: Battle mechanics upgrade (each behind a flag; run `balance-sim.js` after each and record results)
Order: 6a Gen-III correctness, 6b unique features.
- 6a (verify what exists first, implement only gaps): physical/special split per move category, abilities (from `pokedex` data), natures, IV/EV-style stats, held items, weather (rain/sun/sand/hail), status accuracy (sleep, confusion, leech seed, toxic escalation), switch-in rules, party screen mid-battle with HP bars, EXP bar fill and level-up stat popup, FRLG text strings ("Wild X appeared!", "Go! X!", "It's super effective!").
- 6b unique features, each independently flagged:
  1. **Momentum / Surge**: hits, crits and super-effective hits fill a gauge; full gauge unlocks one Surge move per battle (stronger variant + FX). Enemy has a gauge. Tunable constants in one config file.
  2. **Terrain tiles**: moves leave a 3-5 turn field effect under one side (e.g. scorched, flooded); drawn as a platform overlay.
  3. **Switch-in pair combos**: defined type-pair bonuses on swap, listed in the party screen.
  4. **Boss phases**: HP-threshold behavior changes, music swap, telegraphed charge move.
  5. **Bond**: bond points from shared fights; tiny effects (endure, status shake-off, crit boost); hearts in Summary.
  6. **Move Lab as headline**: custom moves from a point budget (power/accuracy/PP/secondary effect), validated server-side so no custom move beats stock moves of the same cost; shareable by code; usable in battle and PvP.
- Keep the engine stateless; new state lives in the battle session, validated by backend.
Acceptance: flags off = identical behavior to today (regression-tested); balance-sim report committed per feature.

### Phase 7: Campaign rework: gyms and gauntlets become the world
This is the point of the overhaul. First propose, then implement after my sign-off.
- Mapping: each of the 10 existing levels becomes a town + route(s); the gauntlet's ordered battles become the trainers inside that town's gym (placed with line of sight); the boss becomes the gym leader (badge + TM + coin + reward offer preserved). Levels 9-10 become Elite Four + Champion with a lockout run (no healing between), if that fits the existing 10-level count; otherwise propose 8 gyms + E4 + Champion and a data migration.
- Keep `campaignService`/`progressService` as the source of truth; add map/town unlock flags instead of replacing progress. Existing players' level progress must migrate into badge + town unlock state without loss; write the migration and a rollback note.
- Badges: badge case on Trainer Card; badges gate level caps (obedience) and grant small stat boosts.
- Preserve the reward offer, coin economy, mart unlock rule (after Level 1 boss), pending evolution/move-learn flows (now surfaced as in-world prompts after battle).
- Keep a legacy `/level/:n` route working behind a flag until QA passes; update `docs/QA_CAMPAIGN_CHECKLIST.md`.
- Include a short "Rival" arc: named rival with scripted battles at fixed story beats.
Acceptance: full run from new account to Champion is possible; an existing mid-campaign account lands in the correct town with correct badges.

### Phase 8: Music, audio and pixel UI polish
- Music: original/CC0 looped chiptune: title, each town theme (or 3-4 shared), route, Pokemon Center, wild battle, trainer battle, gym leader, boss/phase-2, victory fanfare, low-HP beep, level-up jingle, evolution. Crossfade manager, volume sliders (music/SFX/cries), mute, resume after browser autoplay unlock. Per-species cry hook with a graceful no-asset fallback synthesized tone.
- Pixel UI pass: one 8px grid, dithered panel shadows, 16x16 icons (types, statuses, pockets, badges), block-style stat bars and HP bars with FRLG green/yellow/red thresholds and slow tick-down, 2-frame idle bob on party/hub sprites, shiny sparkle on send-out, pixel skeleton loaders, screen transitions as wipes/iris not fades.
- Input polish: hold-to-repeat menus, consistent cursor sound, remember cursor, full gamepad mapping, rebindable keys.
- Accessibility: colorblind-safe type palette option, text size/speed options, ARIA labels on bars, visible focus rings in pixel style.
- Mobile: proper D-pad + A/B/Start/Select, haptics where supported, landscape layout.
- Onboarding: scripted tutorial battle (types, PP, items, catching).

### Phase 9: Playground becomes the social overworld
- Replace the free-drag room with tile-grid movement on real maps using the Phase 1 engine; same Socket.IO transport, server-validated movement (reject teleports/collisions).
- Persistent named rooms + lobby with population counts and private room codes; avatar + position restored on rejoin.
- Lead Pokemon follows the player (HGSS style).
- Pixel emote wheel (heart, "!", "...", wave) and chat bubbles above heads; chat filter, mute, report; rate limits.
- Click a trainer -> card with party preview.
- PvP duels: challenge by walking up; reuse battleSessionService; ranked ladder with seasons.
- Trading: two-sided window with confirm step, server-transactional, trade-evolution hook.
- Shared events: timed raid boss for the room, summed damage, rewards to all participants.
- Wild zones in the playground (first catch claims), mini-games (fishing spot, Game Corner), cosmetics shop (hats, outfits, room themes) funded by coins, leaderboards (win streak, Pokedex completion, Move Lab clears).
- Abuse controls throughout: auth on sockets, per-event rate limits, size caps, server authority.

### Phase 10: Retention and extras (only if I approve)
Achievements/stamps on Trainer Card, daily rule-modifier challenge level, daily quests (light), roguelite run mode reusing the 3-card reward offer, battle replays from `battleBeats` with share link, Safari Zone.

## WORKING AGREEMENT

1. Start with Phase 0 only. Ask me any blocking question before writing code.
2. Per phase output: plan (files to add/change, DB changes, API changes), implementation, tests run with real output, known gaps, and what you need from me (art, music, decisions).
3. Do not claim done without running tests/build and pasting the result.
4. Where art or audio must come from a human, generate working placeholders plus an exact spec, and list them in `assets/TODO_ART_AUDIO.md`.
5. If an instruction here conflicts with the repo reality, stop and tell me instead of silently choosing.

## OPEN QUESTIONS FOR ME (answer in Phase 0 if I haven't)

- Final badge/town count: keep 10 levels, or move to 8 gyms + E4 + Champion?
- Playground: replace the current free-drag room, or keep both modes?
- Hosting target for assets (size budget for maps/music)?
- Multiplayer scale expectation (concurrent players per room)?
