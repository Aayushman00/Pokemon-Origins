# Frontend — Pokemon Origins

React + Vite SPA. Setup, env, and architecture live in the **repo root**:

- [`README.md`](../README.md) — `npm run setup` / `npm run dev`
- [`HLD.md`](../HLD.md) — routes, BFF, landing page
- [`docs/design/STYLE_GUIDE.md`](../docs/design/STYLE_GUIDE.md)
- [`docs/design/ANIMATION_GUIDE.md`](../docs/design/ANIMATION_GUIDE.md)

## Local

From the repository root (preferred):

```bash
npm run setup
npm run dev
```

Frontend-only: `npm run dev:frontend` (or `npm run dev` inside `frontend/` after install). Default: http://localhost:5173

## Layout (`src/`)

```
src/
├── api.js                 # Axios client (Bearer interceptor)
├── App.jsx                # Routes + session rehydrate
├── config.js              # API_URL from env
├── styles/tokens.css      # Design tokens
├── utils/typeColors.js    # Shared type hex map
├── sprites/               # Local sprite path resolver (+ tests)
├── components/
│   ├── Header/            # Site header (hidden on in-device screens)
│   ├── PokemonSprite/
│   └── Shell/             # Shell + LcdPanel
└── pages/
    ├── Landing/           # Public `/`
    ├── AuthPage/
    ├── Game/              # Hub, Level, BattleSim, Bag, Mart, RewardPicker
    └── Pokedex/
```

## Routes

| Path | Notes |
|------|--------|
| `/` | Landing (public) |
| `/auth` | Login / register |
| `/pokedex`, `/pokedex/:id` | Public dex |
| `/game`, `/game/bag`, `/game/mart`, `/level/:levelNumber` | JWT required |

Battle calls go through the backend BFF (`/api/battle/*`), not the battle-engine origin.

## UI rules

Use tokens and Shell/LCD primitives. Do not introduce purple SaaS layouts, Inter/Roboto as display, or a second type-color map — import `typeColor` from `utils/typeColors.js`.
