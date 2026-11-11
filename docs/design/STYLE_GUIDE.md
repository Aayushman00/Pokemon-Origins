# Style Guide — Pokemon Origins

One continuous retro, pixel-panel game feel across **Title → Auth → Hub → Pokedex → Battle → Playground**. Screens are **in-device compositions**, not dashboards. Token source: `frontend/src/v2/styles/tokens.css`. Type hex map: `frontend/src/utils/typeColors.js`.

## Palette

Tokens are defined once in `tokens.css` and swapped per theme (`<html data-theme="light|dark">`, toggled from `AppShell`, default follows OS preference). Key groups:

| Token group | Examples | Use |
|-------|-------|-----|
| `--c-ink*` | `--c-ink`, `--c-ink-soft`, `--c-ink-faint` | Body/heading text, outlines |
| `--c-card*` / `--c-paper` / `--c-cream*` / `--c-sand` | — | Panel fills (paper/notched-card look) |
| `--c-navy*` | `--c-navy`, `--c-navy-deep`, `--c-navy-line` | Dark/inverted panels, header chrome |
| `--c-scene-*` | `--c-scene-sky`, `--c-scene-ground` | Diorama backdrops behind sprites |
| `--c-sun`, `--c-red`, `--c-grass`, `--c-earth`, `--c-sky` (+`-dark`/`-deep`) | — | Accent/brand colors |
| `--c-hp-hi` / `--c-hp-mid` / `--c-hp-lo` | `#4fc35b` / `#f0b429` / `#e0452f` | HP bars only |

Pokémon type colors are reserved for Pokémon data (dex accents, move badges) — never for chrome.

## Typography

Three faces, all tokens in `tokens.css`, loaded in `index.html`:

- `--font-pixel` (`DotGothic16`): menus, buttons, HUD, labels. `.font-pixel` applies it.
- `--font-display` (`Pixelify Sans`): big titles only. Its small sizes blur 5/S and C/O.
- `--font-read` (`Atkinson Hyperlegible`): longer copy, chat, form values. `.read` applies it.

Sizes come from the `--fs-*` scale. `--fs-xs` (13px) is the floor for anything a player has to read; text sized in `cqw` needs a `clamp()` floor of 11px or more, because on a phone the floor is the real size.

## Layout tokens

- Breakpoints: `640px`, `820px`, `1000px`. Nothing else, except the battle side rail at `1200px`.
- `--tap`: smallest height of a compact control. 36px with a mouse, 44px on touch (`pointer: coarse`). Use it instead of a literal `min-height`.
- `--z-*`: stacking order (`overlay` 20, `topbar` 60, `hovercard` 70, `modal` 80, `toast` 90, `drag` 95, `skip` 100). Values under 10 stay local to one screen.

## Primitives (`frontend/src/v2/ui/`)

- `Panel` (`Panel.jsx`): notched pixel panel. `variant`: `paper` (default) | `navy` | `sign` | `inset`. `plate` renders a title tab on the top edge; `title`/`meta` a header row.
- `Button` (`Button.jsx`): pixel button.
- `MenuList` (`MenuList.jsx`): GBA-style ▶-cursor menu, used on the title screen and `AppShell` START menu.
- `DialogueBox` (`DialogueBox.jsx`): typewriter dialogue/log box, shared by battle and playground chat.
- `Modal` (`Modal.jsx`), `Tabs` (`Tabs.jsx`), `Toast` (`Toast.jsx`): overlay/nav/feedback primitives.
- `MenuIcon` (`MenuIcon.jsx`): 8x8 one-colour glyphs for menu rows and item categories; pass as a `MenuList` item `icon`.
- `Bars` (`Bars.jsx`), `Badges` (`Badges.jsx`), `PartyRow` (`PartyRow.jsx`), `PixelTrainer` (the overworld sprite as an SVG) / `PixelAvatar` (its head crop; no separate avatar art), `TrainerStats` / `TrainerHoverCard`: game-data display primitives.
- Layout chrome: `AppShell.jsx` — slim top bar with brand crest, your avatar, day/night, and START. The START menu is the only site nav; do not add links to the top bar.
- CSS classes: `.frame` / `.panel` (see `Panel` variants above), `.btn` (+ `--primary` / `--go` / `--danger` / `--navy`, `--sm` / `--lg`), `.menu__item` (▶ cursor).

## Rules

- Brand **Pokemon Origins** is a hero-level signal on Title and Auth.
- Forbidden: purple/indigo SaaS gradients, white card grids as heroes, Inter/Roboto/Arial as display, glow stacks, pill-stat strips, multi-layer decorative shadows.
- Cards only when they are the interaction container (e.g. a dex entry tap target).
- Home (`/`) is the title screen: GBA main menu with session-aware options and a live rotating Pokémon sprite from the `/pokemon` API. Unknown routes still redirect by session.
- Battle keeps its existing cream/grass GBA stage; other screens use the `Panel` paper/navy/sign/inset system.
