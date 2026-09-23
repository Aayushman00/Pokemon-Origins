# Animation Guide — Pokemon Origins

Motion is game feedback, not decoration: boot, select, encounter, attack, HP, faint, landing showcase. Tokens in `frontend/src/styles/tokens.css`.

## Timing

| Token | Value | Use |
|-------|-------|-----|
| `--dur-fast` | 100ms | Hover, cursor, button press |
| `--dur-med` | 200ms | Route fades, tab switches |
| `--dur-slow` | 300ms | Panel slides, HP drain steps |
| `--dur-boot` | 1000ms | Power-on LCD fade |
| `--dur-drain` | 600ms | HP bar drain, `steps(12, end)` (≈3 GBA frames per step); `DRAIN_MS` in `BattleSim.jsx` must match |

Easings: `--ease-out` (enter), `--ease-in` (exit), `--ease-in-out` (move). Retro effects may use `steps(n, end)` (HP drain, damage flash) — steps read more "GBA" than smooth curves.

## Landing showcase

Featured Pokémon crossfades (~280ms) every 4s; subtle idle bob on the sprite. Pause the interval on hover/focus of the device. Budget: those two motions plus existing `.pixel-btn:active` — nothing else on `/`.

Reduced motion: instant swap (no fade/bob); rotation still advances.

## Battle beat order (Phase 3 contract)

`encounter` (flash + appear text) → `intro` (enemy slides in, then player + HP boxes) → `idle` (sprite bob) → `attack` → back to menu; `faint` (sink + fade) when HP hits 0.

`attack` (FireRed order, spec 2026-09-24-battle-damage-feedback): "X used Move!" (painted) → attack animation (lunge / ranged flash / status sparkle) → impact tiered by effectiveness (×0 none; <1 soft blink, no stage flash, no shake; ×1 standard; >1 double blink + stronger shake; crit adds white pulse + crit shake) with the stepped HP drain and a 700ms `-N` tick on the defender HP box starting together → drain (`--dur-drain`) → crit line → effectiveness line → multi-hit line → OHKO line → faint beat.

Rule: a visual beat never starts before the line that introduces it has painted (`await addLog(...)`).

Beats are sequenced, never parallel spam. The player can only act when the menu is interactive again.

## Reduced motion

Global `@media (prefers-reduced-motion: reduce)` in tokens.css collapses all animation/transition durations to ~0. Components must still be correct with animations skipped: gate long choreography (encounter flash, lunges) behind a reduced-motion check where timing drives logic — use timeouts that still fire, only shorter, or skip the visual beat while keeping state updates (HP numbers, log text).

## Do / Don't

- Do: one intentional motion per user action; stagger intro elements ≤ 150ms apart.
- Don't: infinite pulsing on interactive controls (except subtle idle bob on sprites), parallel flashes, motion that blocks input after state has resolved.
