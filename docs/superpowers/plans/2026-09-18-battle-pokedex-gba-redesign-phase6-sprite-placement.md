# GBA/FRLG Redesign — Phase 6: Pokémon Sprite Rendering + Placement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify that Phase 6's stated objective (spec Section 9, Phase 6: "swap sprite source to the new pipeline output, bottom-center anchoring via the coordinate system... front/back correct sides, no stretch/blur") is met — and record that verification, since reading the actual current code shows it already is, entirely as a side effect of Phase 2 (real sprite pipeline) and the pre-existing CSS this project already had before this redesign started.

**Architecture:** No code changes in this phase. This is a verification-only phase, documented as its own phase (rather than silently skipped) because the master spec named it explicitly and the phase-by-phase process calls for each phase to be checked off deliberately, not assumed.

**Tech Stack:** N/A (no code).

**Spec:** `docs/superpowers/specs/2026-09-18-battle-pokedex-gba-redesign-design.md`, Section 9 Phase 6.

## Finding (why this phase has no implementation tasks)

Reading `frontend/src/pages/Game/BattleGround.css` and `BattleSim.jsx` directly (2026-09-18) shows every requirement this phase would otherwise implement is already satisfied:

1. **Sprite source already swapped.** Phase 2 replaced the actual PNG files at `frontend/public/sprites/pokemon/*/front.png` and `frontend/public/sprites/battle/*/{front,front-b,back,back-b}.png` with real Bulbagarden FRLG sprites. `BattlePokemonSprite.jsx` (unchanged, pre-existing component) already reads from these exact paths — nothing needed to change in the component for it to start rendering real art, because the redesign targeted the files, not the code, per Phase 2's Ruling 1.
2. **Pixel-perfect rendering already present.** `BattleGround.css:306-311` (`.gba-pokemon-sprite img`) already sets `image-rendering: pixelated` — this predates this redesign project and was never broken.
3. **Bottom-center anchoring already present.** The same rule sets `transform-origin: bottom center` — already correct, already verified as sufficient in Phase 4's Ruling 1 (given every Gen1 sprite shares Phase 2's uniform 64×64 canvas, uniform CSS scaling + this transform-origin correctly preserves both relative scale and ground alignment without needing per-sprite bounding-box math).
4. **Front/back sides already correct.** `BattleSim.jsx` passes `variant="front"` to the enemy's `BattlePokemonSprite` (opponent always shows its front sprite, as it should) and `variant="back"` to the player's (the player's own Pokémon shows its back, facing away from camera, as it should in every mainline Pokémon game). Verified by direct grep, not assumed.
5. **No stretch:** the uniform `width: 130px` with no explicit `height` lets the browser preserve the sprite's natural aspect ratio (always 1:1 post-Phase-2, since every source PNG is a 64×64 square) — nothing stretches a non-square box into a square one.

## Global Constraints

- This phase makes zero code changes. If Task 1's verification finds a real discrepancy, that finding gets escalated as a new, separately-planned fix — not patched inline during what was scoped as a verification-only phase.

---

### Task 1: Verify sprite rendering/placement claims

**Files:** none modified.

**Interfaces:** none.

- [x] **Step 1: Confirm pixelated rendering and bottom-center anchor are present**

Run: `grep -n "gba-pokemon-sprite img" -A5 frontend/src/pages/Game/BattleGround.css`

Expected: shows `width: 130px;`, `image-rendering: pixelated;`, and `transform-origin: bottom center;` all present in the same rule.

**Result (2026-09-18):** Confirmed at `BattleGround.css:306-311` — all three properties present exactly as expected.

- [x] **Step 2: Confirm front/back variant assignment is correct**

Run: `grep -n "variant=\"front\"\|variant=\"back\"" frontend/src/pages/Game/BattleSim.jsx`

Expected: at least one `variant="front"` near the enemy container's `BattlePokemonSprite` usage and one `variant="back"` near the player container's — read the surrounding ~15 lines of each match with the Read tool to confirm which container each belongs to (do not assume from grep output order alone).

**Result (2026-09-18):** Confirmed — `variant="front"` at line 976 is inside the enemy `BattlePokemonSprite` (enclosing container is `.gba-enemy-container`), `variant="back"` at line 1016 is inside the player `BattlePokemonSprite` (enclosing container is `.gba-player-container`). Correct assignment.

- [x] **Step 3: Confirm the real sprite files exist and are non-placeholder**

Run: `python -c "from PIL import Image; import hashlib; ..."` (see original step text for full script).

**Result (2026-09-18):** `frontend/public/sprites/battle/001/front.png` → `(64, 64)`; `frontend/public/sprites/battle/001/back.png` → `(64, 64)`. Both 64×64, matching Phase 2's real FRLG sprite output.

- [x] **Step 4: Record the finding**

No commit needed (no files changed) — this plan document itself, once its checkboxes are ticked, is the record of this phase's verification. If any step's actual output contradicts its "Expected" text, stop and report the discrepancy rather than checking the box — that would mean this phase does have real work after all, and needs its own follow-up plan.

---

## Phase Completion

Phase 6 is done once Task 1's four checks all pass as expected. Next phase per the spec's Core batch is **Phase 7 — Trainer sprite integration** (rendering the Phase 3 `red.png`/`leaf.png` trainer sprites during a SEND_OUT beat, real new JSX work), a separate plan written and reviewed on its own.
