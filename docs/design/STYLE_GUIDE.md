# Style Guide — Pokemon Origins

One continuous GBA / FireRed–LeafGreen handheld experience across **Landing → Auth → Hub → Pokedex → Battle**. Screens are **in-device compositions**, not dashboards. Token source: `frontend/src/styles/tokens.css`. Type hex map: `frontend/src/utils/typeColors.js`.

## Palette

| Token | Value | Use |
|-------|-------|-----|
| `--charcoal` / `--charcoal-deep` | `#262220` / `#171412` | Page backdrop behind the device |
| `--shell` / `--shell-hi` / `--shell-dark` | `#b9b1a6` / `#d6cfc6` / `#8d857b` | Plastic casing gradient |
| `--shell-edge` / `--shell-inset` | `#57504a` / `#3f3a36` | Case border, screen bezel |
| `--lcd-bg` / `--lcd-panel` / `--lcd-raised` | `#0f3d26` / `#175236` / `#1f6a45` | LCD surfaces (bg → raised) |
| `--lcd-ink` / `--lcd-ink-dim` / `--lcd-ink-bright` | `#9ff4b8` / `#5fae7e` / `#d2ffe0` | LCD text hierarchy |
| `--lcd-accent` | `#7fe9a6` | Primary actions, cursor, focus ring |
| `--panel-cream` / `--panel-border` | `#e8e8c8` / `#506860` | Battle dialog family (existing) |
| `--hp-green` / `--hp-yellow` / `--hp-red` | `#48d232` / `#f8d030` / `#f05858` | HP bars only |

Pokémon type colors are reserved for Pokémon data (dex accents, move badges) — never for chrome.

## Typography

- `--font-pixel` (`Press Start 2P`, loaded in `index.html`): headings, menus, buttons, HUD. Small sizes (0.6–0.9rem); it is dense.
- `--font-body` (`Gilroy`): longer copy, form input values.
- `.font-pixel` utility applies the pixel font.

## Primitives

- `Shell` (`frontend/src/components/Shell/Shell.jsx`): plastic case + power LED + bezel. Props: `poweredOn`, `className`.
- `LcdPanel` (`LcdPanel.jsx`): green LCD with scanlines. Props: `on` (boot fade), `scanlines`, `className`.
- CSS classes: `.device-backdrop` (page bg), `.pixel-btn` / `.pixel-btn--primary`, `.menu-row` / `.menu-row--active` (GBA ▶ cursor), `.lcd-field` + `.lcd-label` (forms), `.bg-scanlines`.

## Rules

- Brand **Pokemon Origins** is a hero-level signal on Landing, Auth and Hub.
- Forbidden: purple/indigo SaaS gradients, white card grids as heroes, Inter/Roboto/Arial as display, glow stacks, pill-stat strips, multi-layer decorative shadows.
- Cards only when they are the interaction container (e.g. a dex entry tap target).
- Home (`/`) is the public landing page: hero brand + one headline + CTA group and a Shell/LCD-framed rotating Pokémon showcase from the live `/pokemon` API. Session-aware CTAs (logged out → `/auth`, logged in → `/game`); unknown routes still redirect by session.
- Battle keeps its existing cream/grass GBA stage; LCD greens are for menus/hub/dex chrome.
