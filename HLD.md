# High-Level Design (HLD) — Pokemon Origins

## 1. System Overview

Pokemon Origins is a full-stack web app: a public Pokédex, trainer accounts, starter selection, a 10-level story campaign against Gen-I-style turn-based battles, a coin/mart economy, and a live vicinity-chat playground. Three processes talk over HTTP; the browser never calls the battle engine directly.

```
Browser (:5173)
  → backend REST + Socket.IO (:5000) → MySQL (pokedex + trainer)
  → backend /api/battle/* (JWT)      → battle-engine (:8000)
```

The public front door is `/` (title screen). Auth, hub, Pokédex, playground, and the campaign levels sit behind or alongside that.

## 2. Architectural Goals

- **Separation of concerns**: React UI, Express BFF/business API, Python combat math
- **Battle engine stays internal**: frontend uses the authenticated backend proxy only
- **One visual language**: design tokens + notched-panel primitives across Title → Auth → Hub → Pokédex → Battle → Playground
- **Fail closed on secrets**: `JWT_SECRET` required at backend boot
- **Incremental hardening**: helmet, rate limits, Zod on write paths, structured request logs

## 3. System Components

### 3.1 Frontend client (SPA)

- **Technology**: React 18, Vite, Framer Motion, React Router v6
- **Entry**: `frontend/src/App.jsx` — session rehydrate via `GET /api/validate`, then routed screens under `frontend/src/v2/`
- **API**: shared Axios client `frontend/src/api.js` (`baseURL = VITE_API_URL`, Bearer from `localStorage`)
- **Design system**:
  - Tokens: `frontend/src/v2/styles/tokens.css`
  - Primitives: `frontend/src/v2/ui/` (`Panel`, `Button`, `MenuList`, `DialogueBox`, `Modal`, `Tabs`, `Toast`, `Bars`, `Badges`, …)
  - Layout chrome: `frontend/src/v2/layout/AppShell.jsx` (top bar + START menu)
  - Type colors: `frontend/src/utils/typeColors.js` (Pokémon data only, never chrome)
  - Guides: [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md), [`docs/design/ANIMATION_GUIDE.md`](docs/design/ANIMATION_GUIDE.md)

**Routes**

| Path | Auth | Screen |
|------|------|--------|
| `/` | Public | Title — GBA main menu, session-aware options, live rotating sprite from `GET /pokemon` |
| `/pokedex`, `/pokedex/:id` | Public | Pokédex list / detail |
| `/auth` | Public | Login / register |
| `/playground` | Public | Vicinity-chat + movement room (guests and trainers) |
| `/game` | JWT | Hub — party, starter lab, campaign continue, bag/mart entry points |
| `/game/bag` | JWT | Inventory / item use |
| `/game/mart` | JWT | Coin shop (unlocks after the Level 1 boss) |
| `/trainer`, `/trainer/:trainerId` | Mixed | Trainer card (own card is JWT-protected; other trainers' cards are public) |
| `/trainer/:trainerId/battles` | Mixed | Battle history / win streaks |
| `/level/:levelNumber` | JWT | Campaign level battles (1–10, progress-locked server-side) |
| `*` | — | Redirect: session → `/game`, else `/` |

### 3.2 Backend API (BFF)

- **Technology**: Node.js, Express, Socket.IO on the **same** HTTP server (`PORT`, default 5000)
- **Entrypoint**: `backend/server.js`
- **Cross-cutting**: `helmet`, CORS from `CORS_ORIGIN`, JSON body ≤ 1mb, `pino-http` + `X-Request-Id`, rate limits (auth 20/15min; API 100/15min)
- **Auth**: JWT (`requireAuth`); trainer-bound routes compare JWT `trainer_id` to the path
- **Validation**: Zod schemas (`backend/src/middleware/validate.js`) on write paths
- **Services** (`backend/src/services/`): `authService`, `starterService`, `trainerService`, `battleService` (battle-engine HTTP client), `battleSessionService`, `battleAi`, `battleStatus`, `campaignService`, `rewardService`, `inventoryService`, `martService`, `evolutionService`, `moveLearnService`, `progressService`, `xpService`, `walletService`, `profileService`, `genderService`, `pokemonDetailService`, `pokeApiClient`
- **Campaign content**: `backend/src/campaign/` (loader/hydrate/schemas) reading JSON under `backend/data/`

**Route mounts (`backend/server.js`)**

| Mount | File | Covers |
|-------|------|--------|
| `/api` (register/login/validate/choose-starter) | `register.js`, `login.js`, `validate.js`, `games.js` | Auth + starter pick |
| `/api/battle` | `routes/battle.js` | Level payloads, damage calc, battle sessions |
| `/api/campaign` | `routes/campaign.js` | Progress, level entry, level-complete |
| `/api/rewards` | `routes/rewards.js` | Boss reward offers |
| `/api/inventory` | `routes/inventory.js` | Item use/read |
| `/api/mart` | `routes/mart.js` | Coin shop purchases |
| `/api/evolutions` | `routes/evolutions.js` | Evolution confirm |
| `/api/moves` | `routes/moves.js` | Pending move-learn resolution |
| `/api/trainers` | `routes/trainers.js` | Public trainer profiles / battle history |
| `/api/party` | `routes/party.js` | Party management |
| `/pokemon`, `/pokemon-detail/:id` | `Pokedex.js`, `PokemonDetailRoutes.js` | Public Pokédex data |
| `/trainer` | `trainer.js` | Trainer party data for battle |
| Socket.IO namespace | `backend/src/playground/` (`chat.js`, `movement.js`, `roomState.js`, `socketAuth.js`) | Playground vicinity chat + movement |

Errors prefer `{ success, error }`.

### 3.3 Battle engine

- **Technology**: Python 3.11, FastAPI (`battle-engine/`)
- **Role**: Stateless combat — damage, type multiplier, crit, miss, turn order
- **Called only by the backend** (`BATTLE_ENGINE_URL`). Browser CORS is not the client path.
- **Health**: `GET /health`
- **Tests**: `pytest` on `app/combat.py` (damage / turn order / miss)

The legacy `battle-logic-service/` directory has been **deleted**. `battle-engine/` is the only combat service.

### 3.4 Data storage

- **Technology**: MySQL 8 — two schemas in one dump (`database/pokedex_data.sql`) plus six migrations
  - `pokedex`: species, moves, types, abilities
  - `trainer`: trainers, party Pokémon, party moves, progress, rewards, inventory, wallet, pending move-learns
- Cross-schema FK: `trainer.trainer_pokemon_moves.move_id` → `pokedex.Move(move_id)`
- Full migration-by-migration notes: [`database/README.md`](database/README.md)

## 4. Component Interfaces

### 4.1 Browser ↔ backend

- HTTP/JSON; Bearer JWT on authenticated calls (Axios interceptor)
- Public reads: `/pokemon`, `/pokemon-detail/:id`; title screen and Pokédex don't require a session
- Socket.IO on the same origin now backs a live product surface: the playground vicinity chat + movement room (`/playground`), authenticated via `socketAuth.js`

### 4.2 Backend ↔ battle-engine (BFF)

- Backend `battleService` forwards combat calls for campaign battle sessions
- Frontend battle UI uses `api` only — no direct `BATTLE_URL` / `battleClient` from the browser

### 4.3 Backend ↔ MySQL

- Two pools (`pokedex` + `trainer`) via `mysql2`
- Parameterized queries; starter selection, mart purchases, and evolution/move-learn resolution run in transactions

## 5. Key user flows

1. **Title** — `GET /pokemon` → shuffle ~8 → rotate featured sprite. Menu options: guests get New game / Continue / Playground / Pokédex; trainers get Continue / Playground / Pokédex.
2. **Register / login** — JWT stored in `localStorage`; App rehydrates with `/api/validate`.
3. **Choose starter** — hub lab → `POST /api/choose-starter` → campaign unlocks at Level 1 · Battle 1.
4. **Campaign level** — `GET /api/campaign/progress`, level entry, then per-battle: `GET /api/battle/level/:n` + `GET /trainer/:id/data` → sequenced battle UI → damage/turn calls per move, PP tracked and persisted at battle end.
5. **Boss reward → mart** — boss win pays XP + coins once, opens a 3-card reward offer; mart unlocks after the Level 1 boss for coin-funded items/stones.
6. **Evolution / move learning** — level-up crossing an evolution or learnset threshold surfaces a pending card on the hub, resolved via `POST /api/evolutions/*` or `POST /api/moves/learn`.
7. **Playground** — guests or trainers join a shared room; Socket.IO relays chat + movement, no DB persistence.

## 6. System qualities (as built)

| Area | Current |
|------|---------|
| Security | JWT required for trainer/battle/starter/mart/inventory routes; helmet; CORS from env; auth + API rate limits; 1mb JSON cap |
| Observability | Backend `/health`, battle `/health`, pino request logs + request id |
| Reliability | Battle proxy errors mapped to HTTP; title screen degrades if Pokédex API is down |
| Motion / a11y | `prefers-reduced-motion` collapses tokens; battle skips flash/lunge; title sprite instant-swaps |
| Not in this revision | JWT refresh rotation, `/api/v1` versioning, Redis Socket.IO adapter for playground (single-instance only), GraphQL |

## 7. Deployment

**Local:** `npm run setup` then `npm run dev` (workspaces + concurrently). MySQL via `npm run docker:db` or a local instance.

**Compose:** MySQL by default; `--profile full` builds frontend, backend, and battle-engine images (`pokemon-origins-frontend`, `pokemon-origins-backend`, `pokemon-origins-battle`, `pokemon-origins-mysql`). Backend exposes **5000 only** (Socket.IO is on that port). Battle-engine exposes 8000 for the BFF, not the browser.

## 8. Future (out of current scope)

- Redis Socket.IO adapter for multi-instance playground presence
- JWT refresh, API versioning
- GraphQL, TypeScript rewrite, Kubernetes / Helm

## 9. Document control

**Version**: 2.0
**Date**: 2026-09-24
**Status**: Matches the v2 frontend + full 10-level campaign/economy backend in this repo
**See also**: [`README.md`](README.md), [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md), [`database/README.md`](database/README.md)
