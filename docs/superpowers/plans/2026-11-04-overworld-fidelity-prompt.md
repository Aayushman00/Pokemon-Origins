# Overworld fidelity pass: prompt for Claude cloud

Paste everything below the line into a new Claude cloud session. Repo: https://github.com/Aayushman00/Pokemon-Origins, branch `claude/funny-hopper-804j0z` (Phase 0 + Phase 1 overworld). Base all work on that branch.

---

## CONTEXT

Phase 1 of the overworld (canvas engine under `frontend/src/v2/overworld/`) works and its tests pass, but when played it does not feel like Pokemon FireRed/LeafGreen. Movement, tiles, character sprites, camera, transitions and dialogue all feel off. This task is a **fidelity pass on the engine and world rendering only**. Do NOT redo architecture: keep the `logic/` (no React/canvas) -> `render/` -> `ui/` layering, the flag `OVERWORLD`, the Tiled JSON pipeline, and the existing tests (extend them).

I (the user) will do menu/UI chrome polish (Start menu, panels, fonts, dialogue box skin) in a separate session. **Do not restyle `ui/` chrome beyond what engine behavior requires.**

## REFERENCE: pret/pokefirered

Use https://github.com/pret/pokefirered (the FireRed/LeafGreen decompilation) as the **behavioral and structural reference**. Read the relevant source before changing each system, and cite the file you derived each behavior from in code comments or the PR summary.

Hard rules about the reference:
- Use it for **timings, rules, data structures and behavior**. Re-implement in our own JS. **Do not copy code verbatim.**
- **Never copy any asset from it into this repo**: no graphics, tilesets, sprites, palettes, maps, music or audio. Our art stays original or CC0 (see `assets/LICENSES.md`).
- If a pret file contradicts what I describe below, trust pret and tell me.

Starting points in pret (verify the exact names yourself; list what you actually read):
- Player movement: `src/field_player_avatar.c`, `src/event_object_movement.c`, `src/field_control_avatar.c`
- Tile/map model and behaviors: `src/fieldmap.c`, `include/fieldmap.h`, `include/constants/metatile_behaviors.h`, `include/constants/metatile_labels.h`, `data/layouts/`, `data/maps/`
- Camera: `src/field_camera.c`
- Warps, doors, fades: `src/field_door.c`, `src/field_fadetransition.c`, `src/overworld.c`
- Field effects (grass, splash, ledge dust, tall grass rustle): `src/field_effect.c`, `src/field_effect_helpers.c`
- NPC movement types and facing: `src/event_object_movement.c` (movement type tables), `include/constants/event_object_movement.h`
- Text and dialogue: `src/text.c`, `src/script_menu.c`, `src/field_message_box.c`
- Scripts/events: `data/scripts/`, `src/script.c`
- Encounter and trainer sight: `src/wild_encounter.c`, `src/trainer_see.c`

## REQUIRED CHANGES

### 1. Movement feel (highest priority)
Match pret frame-accurate behavior at 60 logical fps:
- Walking = one 16px tile in a fixed frame count (confirm in pret; I expect 16 frames), running (B held) = faster (I expect 8 frames), with the correct per-frame pixel step. No easing, no float positions, positions snap to the tile grid at step end.
- **Turn-in-place**: pressing a different direction first turns the player without moving unless the key is held past a short delay (confirm the exact rule in `field_player_avatar.c`). Tapping turns; holding walks.
- Input handling: direction held at step end continues the next step with no gap; releasing finishes the current step. Buffering rules as in pret.
- Collision: bump animation + sound with the correct "walk in place against wall" frame cycle; ledge jumps (one-way, jump arc and landing); map-edge and connection behavior; blocked-by-NPC.
- Walk animation: the 4-step cycle with alternating foot frames, idle frame when stopped, correct frame timing relative to the step. Running uses its own frame set.
- Add a `movement.test.js` case for each rule above (frame counts, turn-then-walk, ledge, bump).

### 2. Tile and map model
- Move to FRLG's model: **16x16 metatiles** composed of 8x8 tiles, two background layers (bottom + top) with a per-metatile **behavior** and **layer type** (normal / covered / split) so the player correctly walks behind tree tops, roofs and door lintels. Keep Tiled JSON as authoring format; define in `docs/design/MAPS.md` how Tiled layers/properties map to metatile id + behavior + layer type.
- Metatile behavior table (own naming) covering at least: normal, impassable, tall grass, long grass, water, ledge (4 directions), door, warp, stairs/cave mouth, sign, counter, bookshelf, ice (stretch).
- Animated tiles (water shimmer, flowers) driven by a tileset animation table with FRLG-like timing.
- Fix the renderer so tiles never shimmer or leak seams (integer scaling, no sub-pixel draw, offscreen 240x160, tile-aligned camera clamp).

### 3. Camera
- Player stays centered except near map edges; camera moves in lockstep with the player's pixel step (no lag, no lerp). Match pret's map-edge clamping and how connected maps are shown past the border. Show the connected neighbor map instead of void at connections.

### 4. Character sprites and NPCs
- Player and NPC sprites are 16x32 with correct anchor/feet alignment and **draw ordering by Y** so characters pass in front of and behind objects properly.
- Proper walk/run/idle/bump frame sets per direction using the sheet contract in `assets/sprites/avatar/SPEC.md` (extend it if the current contract lacks frames).
- Replace the crude generated placeholder sprites with clearly better **original** pixel art (cleaner outlines, 3-tone shading, GBA-like proportions: slightly large head, small body, readable at 1x). Improve `scripts/gen_overworld_placeholders.py` or hand-author PNGs; keep the validator working.
- NPC behaviors from pret's movement-type table: stand and face a direction, look around (random facing), wander within a radius, walk fixed path, and face the player when talked to. Data-driven in the Tiled object properties.

### 5. Tilesets and maps
- Replace the placeholder tileset with a **proper original tileset** that reads like FRLG: grass with edge blending, dirt path with autotiled corners, tall grass, trees (multi-tile, tops drawn above player), fences, flowers, water with shore edges, ledges, signs, rooftops (multi-tile houses with door), interiors (floor, rug, table, bookshelf, TV, stairs, door mat).
- Rebuild the sample maps (`test_town`, `test_route`, `test_house`) to showcase it: a Pallet-sized town with 2 houses + lab-sized building, a route with tall grass and a ledge, correct building entrances with door tiles.
- Provide a map validation script (`npm run validate:maps`) checking dimensions, tileset ids, warp targets, NPC property schema.

### 6. Field effects and transitions
- Tall grass rustle on step, grass overlay covering lower legs, splash on water, ledge-hop dust, door open/close animation + enter/exit steps, bump spark. Use original art.
- Warp transitions matching FRLG feel: fade to black (door/stairs) with the player stepping through the door; map-name popup on entering a new area (box slides in, holds, slides out).
- Connection transitions between maps with no fade.

### 7. Dialogue in-world
- Text box behavior (not the skin): FRLG 2-line box, character-by-character at the three speeds (confirm per-char frame delays in `text.c`), line scroll when a third line is needed, A to fast-forward the current line, blinking advance arrow, wait-for-button between boxes. Hook into the existing `DialogueBox`/`useTypewriter` instead of building a new component; only change behavior, not styling.
- Sign interaction (face the sign from below), NPC talk (NPC turns to face you), and yes/no prompt.

### 8. Audio hooks (no music files yet)
Keep WebAudio SFX but add the missing FRLG-style events: step bump, ledge hop, door, warp, menu cursor, text blip (optional), grass rustle. Leave a clean `music` interface with a `setTrack(mapId)` stub that does nothing yet.

## NON-GOALS
- No Start menu / bag / party UI work (I handle UI polish).
- No wild encounters, catching, trainers or battles (later phases).
- No gym/campaign changes. No DB changes.
- Do not change `OVERWORLD` flag behavior: flag off must leave the rest of the app identical.

## WORKING AGREEMENT
1. First reply: a short audit: list the pret files you read, list what in our engine differs from pret (movement frames, turn rule, layering, camera, anim frames), and a task order. Wait for my "go".
2. Then implement in small commits, in this order: movement -> metatile/layer model -> camera -> sprites -> tileset + maps -> field effects/transitions -> dialogue behavior -> audio hooks.
3. After each step: run `npm test` in `frontend/` and `backend/` (backend needs `backend/.env` with `JWT_SECRET`), run `vite build`, and paste the real results.
4. Provide a short "how to verify manually" list per step (what to walk, press, look at) with the URL `/overworld` and `VITE_FLAG_OVERWORLD=1`. Where timing matters, add a debug overlay toggle (frame counter, tile coords, behavior id) behind the dev flag so I can compare against pret.
5. Commits: imperative messages, no Co-Authored-By or Claude attribution lines. Never commit `graphify-out/`, `node_modules`, venvs.
6. If anything here conflicts with the repo or pret, stop and ask.
