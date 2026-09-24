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

- `--font-pixel` (`Press Start 2P`, loaded in `index.html`): headings, menus, buttons, HUD. Small sizes (0.6–0.9rem); it is dense.
- `--font-body`: longer copy, form input values.
- `.font-pixel` utility applies the pixel font.

## Primitives (`frontend/src/v2/ui/`)

- `Panel` (`Panel.jsx`): notched pixel panel. `variant`: `paper` (default) | `navy` | `sign` | `inset`. `plate` renders a title tab on the top edge; `title`/`meta` a header row.
- `Button` (`Button.jsx`): pixel button.
- `MenuList` (`MenuList.jsx`): GBA-style ▶-cursor menu, used on the title screen and `AppShell` START menu.
- `DialogueBox` (`DialogueBox.jsx`): typewriter dialogue/log box, shared by battle and playground chat.
- `Modal` (`Modal.jsx`), `Tabs` (`Tabs.jsx`), `Toast` (`Toast.jsx`): overlay/nav/feedback primitives.
- `Bars` (`Bars.jsx`), `Badges` (`Badges.jsx`), `PartyRow` (`PartyRow.jsx`), `PixelAvatar` / `PixelTrainer`, `TrainerStats` / `TrainerHoverCard`: game-data display primitives.
- Layout chrome: `AppShell.jsx` — slim top bar with brand crest + the START menu (site-wide nav: Hub, Playground, Pokédex, Trainer card).
- CSS classes: `.frame` / `.panel` (see `Panel` variants above), `.pixel-btn` / `.pixel-btn--primary`, `.menu-row` / `.menu-row--active` (▶ cursor), `.bg-scanlines`.

## Rules

- Brand **Pokemon Origins** is a hero-level signal on Title and Auth.
- Forbidden: purple/indigo SaaS gradients, white card grids as heroes, Inter/Roboto/Arial as display, glow stacks, pill-stat strips, multi-layer decorative shadows.
- Cards only when they are the interaction container (e.g. a dex entry tap target).
- Home (`/`) is the title screen: GBA main menu with session-aware options and a live rotating Pokémon sprite from the `/pokemon` API. Unknown routes still redirect by session.
- Battle keeps its existing cream/grass GBA stage; other screens use the `Panel` paper/navy/sign/inset system.
