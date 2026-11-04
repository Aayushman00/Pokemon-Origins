# Complete the Game: Plan

Governing instruction (user, 2026-11-05): loop plan, implement, verify, repeat until the game is
complete, then report. No audio work. Dialogue and gym leader design first.

Sources of truth: Town Layouts, Town Designs, Journey Map and Gym Puzzles artifacts (ids in memory
`world-build-decisions`), `docs/trainer-voices.md`, `backend/data/gyms/gym_puzzles.json`,
`scripts/overworld_art/route_layouts.json`, `docs/design/ART_BIBLE.md`.

## Rules for every slice

- Failing test first, watched failing, then the change.
- `verify.sh` plus backend `npm test` and `vite build` green before each commit.
- No Claude attribution on commits. `graphify update .` after code changes. Never commit `graphify-out/`.
- Slim sprites, details only where necessary, no blocky rectangles, restrained environment.
- All display names come from `backend/data/world/names.json`; no existing-game names ship.

## Slices

1. **Leader sprites.** 13 hand-designed overworld sheets (8 leaders, 4 Elite, Champion), id = trainer
   `sprite`, each with its own silhouette. Generic `leader_m`, `leader_f` retired.
2. **Leader battle portraits.** Original 64x64 front art for those 13. Today the leader ids point at
   files that do not exist, so a Gym battle shows a broken image.
3. **Names.** Rename `elite_four.json`, `champion.json`, `rocket_grunt_*`, level files; `people` in names.json.
4. **Battle dialogue.** `docs/trainer-voices.md` becomes `backend/data/trainers/voices.json`; the server
   sends lines on the session, the battle queue speaks intro, first_faint, low_hp, super_effective,
   ace, win, lose. `{player_name}` filled by the server.
5. **Overworld dialogue.** Pre-battle, post-battle and badge lines for leaders, per-trainer road lines,
   town NPCs with something to say, signs.
6. **Puzzle rendering.** Pieces drawn for all 8 mechanics, the vanish-under-player bug, per-gym tiles.
7. **Map generator.** Routes 2-9 and towns from artifact grids; one generic `town()` and `route()`.
8. **Gyms 2-8.** Rooms from `gym_puzzles.json`, leaders in place, badge gate on each route.
9. **League.** Zenith Summit, lobby with Center and Mart, five rooms, lockout, credits flag.
10. **Legendary cave.** One cave behind the Champion flag, the 4 guard gates removed (ruling).
11. **Play systems.** Wild encounters in grass, Start menu (party, bag, save), Mart in towns, NPC wander.
12. **Whole-game proof.** Headless walk from Dawnbrook to the Champion, final review, report.
