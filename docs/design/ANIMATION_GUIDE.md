# Animation Guide — Pokemon Origins

Motion is game feedback, not decoration: boot, select, encounter, attack, HP, faint, landing showcase. Tokens in `frontend/src/styles/tokens.css`.

## Timing

| Token | Value | Use |
|-------|-------|-----|
| `--dur-fast` | 100ms | Hover, cursor, button press |
| `--dur-med` | 200ms | Route fades, tab switches |
| `--dur-slow` | 300ms | Panel slides, HP drain steps |
| `--dur-boot` | 1000ms | Power-on LCD fade |

Easings: `--ease-out` (enter), `--ease-in` (exit), `--ease-in-out` (move). Retro effects may use `steps(n, end)` (HP drain, damage flash) — steps read more "GBA" than smooth curves.

## Landing showcase

Featured Pokémon crossfades (~280ms) every 4s; subtle idle bob on the sprite. Pause the interval on hover/focus of the device. Budget: those two motions plus existing `.pixel-btn:active` — nothing else on `/`.

Reduced motion: instant swap (no fade/bob); rotation still advances.

## Battle beat order (Phase 3 contract)

`encounter` (flash + appear text) → `intro` (enemy slides in, then player + HP boxes) → `idle` (sprite bob) → `attack` (lunge → hit shake/flash → HP drain → log line) → back to menu; `faint` (sink + fade) when HP hits 0.

Beats are sequenced, never parallel spam. The player can only act when the menu is interactive again.

## Reduced motion

Global `@media (prefers-reduced-motion: reduce)` in tokens.css collapses all animation/transition durations to ~0. Components must still be correct with animations skipped: gate long choreography (encounter flash, lunges) behind a reduced-motion check where timing drives logic — use timeouts that still fire, only shorter, or skip the visual beat while keeping state updates (HP numbers, log text).

## Do / Don't

- Do: one intentional motion per user action; stagger intro elements ≤ 150ms apart.
- Don't: infinite pulsing on interactive controls (except subtle idle bob on sprites), parallel flashes, motion that blocks input after state has resolved.
