# High-Level Design (HLD) — Pokemon Origins

## 1. System Overview

Pokemon Origins is a full-stack web app: a public Pokédex, trainer accounts, starter selection, and a Gen-I-style turn-based battle. The UI is one continuous GBA / FireRed–LeafGreen handheld experience. Three processes talk over HTTP; the browser never calls the battle engine directly.

```
Browser (:5173)
  → backend REST + Socket.IO (:5000) → MySQL (pokedex + trainer)
  → backend /api/battle/* (JWT)      → battle-engine (:8000)
```

The public front door is `/` (landing). Auth, hub, Pokédex, and Level 1 battle sit behind that.

## 2. Architectural Goals

- **Separation of concerns**: React UI, Express BFF/business API, Python combat math
- **Battle engine stays internal**: frontend uses the authenticated backend proxy only
- **One visual language**: design tokens + Shell/LCD primitives across Landing → Auth → Hub → Pokédex → Battle
- **Fail closed on secrets**: `JWT_SECRET` required at backend boot
- **Incremental hardening**: helmet, rate limits, Zod on write paths, structured request logs

## 3. System Components

### 3.1 Frontend client (SPA)

- **Technology**: React 18, Vite, Tailwind, Framer Motion, React Router v6
- **Entry**: `frontend/src/App.jsx` — session rehydrate via `GET /api/validate`, then routed screens
- **API**: shared Axios client `frontend/src/api.js` (`baseURL = VITE_API_URL`, Bearer from `localStorage`)
- **Design system**:
  - Tokens: `frontend/src/styles/tokens.css`
  - Primitives: `Shell`, `LcdPanel`
  - Type colors: `frontend/src/utils/typeColors.js` (Pokémon data only, never chrome)
  - Guides: [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md), [`docs/design/ANIMATION_GUIDE.md`](docs/design/ANIMATION_GUIDE.md)

**Routes**

| Path | Auth | Screen |
|------|------|--------|
| `/` | Public | Landing — hero brand, session-aware CTAs, live rotating showcase from `GET /pokemon` |
| `/pokedex`, `/pokedex/:id` | Public | Pokédex list / detail |
| `/auth` | Public | Login / register (GameBoy shell) |
| `/game` | JWT | Hub + starter lab |
| `/level/:levelNumber` | JWT | Campaign level battles (1–10, progress-locked server-side) |
| `*` | — | Redirect: session → `/game`, else `/auth` |

Header shows on landing / auth / dex; hidden on all in-device screens (`/game`, `/game/*`, `/level/*`).

The unrouted ChatGround Socket.IO prototype has been **deleted** (UI/UX cleanup pass).

### 3.2 Backend API (BFF)

- **Technology**: Node.js, Express, Socket.IO on the **same** HTTP server (`PORT`, default 5000)
- **Entrypoint**: `backend/server.js`
- **Cross-cutting**: `helmet`, CORS from `CORS_ORIGIN`, JSON body ≤ 1mb, `pino-http` + `X-Request-Id`, rate limits (auth 20/15min; API 100/15min)
- **Auth**: JWT (`requireAuth`); trainer-bound routes compare JWT `trainer_id` to the path
- **Validation**: Zod schemas on login, register, choose-starter, battle damage body
- **Services**: `authService`, `starterService`, `trainerService`, `battleService` (battle-engine HTTP client)

**HTTP surface (current)**

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/health` | No | `{ status: "ok" }` |
| POST | `/api/register`, `/api/login` | No | Rate-limited |
| GET | `/api/validate` | JWT | Session rehydrate |
| POST | `/api/choose-starter` | JWT | Transactional party insert |
| GET | `/pokemon` | No | Landing showcase + Pokédex list |
| GET | `/pokemon-detail/:id` | No | Species detail |
| GET | `/trainer/:id/data` | JWT, id must match token | Party for battle |
| GET | `/api/battle/level/1` | JWT | Proxies battle-engine level payload |
| POST | `/api/battle/calculate-damage` | JWT | Proxies combat |

Errors prefer `{ success, error }`.

### 3.3 Battle engine

- **Technology**: Python 3.11, FastAPI (`battle-engine/`)
- **Role**: Stateless combat — damage, type multiplier, crit, miss, turn order
- **Called only by the backend** (`BATTLE_ENGINE_URL`). Browser CORS is not the client path.
- **Health**: `GET /health`
- **Tests**: `pytest` on `app/combat.py` (damage / turn order / miss)

The legacy `battle-logic-service/` directory has been **deleted**. `battle-engine/` is the only combat service.

### 3.4 Data storage

- **Technology**: MySQL 8 — two schemas in one dump (`database/pokedex_data.sql`)
  - `pokedex`: species, moves, types, abilities
  - `trainer`: trainers, party Pokémon, party moves, inventory
- Cross-schema FK: `trainer.trainer_pokemon_moves.move_id` → `pokedex.Move(move_id)`
- Restore notes: [`database/README.md`](database/README.md)

## 4. Component Interfaces

### 4.1 Browser ↔ backend

- HTTP/JSON; Bearer JWT on authenticated calls (Axios interceptor)
- Public reads: `/pokemon`, `/pokemon-detail/:id`, landing does not require a session
- The backend still hosts a Socket.IO endpoint on the API origin, but no frontend surface uses it (ChatGround deleted)

### 4.2 Backend ↔ battle-engine (BFF)

- Backend `battleService` forwards `GET /level/1` and `POST /calculate-damage`
- Frontend battle UI (`BattleSim.jsx`, `level1.jsx`) uses `api` only — no `BATTLE_URL` / `battleClient`

### 4.3 Backend ↔ MySQL

- Two pools (`pokedex` + `trainer`) via `mysql2`
- Parameterized queries; starter selection runs in a transaction

## 5. Key user flows

1. **Landing** — `GET /pokemon` → shuffle ~8 → rotate featured sprite every 4s (pause on hover/focus). CTAs: logged out → `/auth`, logged in → `/game`. Showcase failure does not block CTAs.
2. **Register / login** — JWT stored in `localStorage`; App rehydrates with `/api/validate`.
3. **Choose starter** — hub lab → `POST /api/choose-starter` → Continue unlocks `/level/1`.
4. **Level 1** — `GET /api/battle/level/1` + `GET /trainer/:id/data` → sequenced battle UI → `POST /api/battle/calculate-damage` per turn.

## 6. System qualities (as built)

| Area | Current |
|------|---------|
| Security | JWT required for trainer/battle/starter; helmet; CORS from env; auth + API rate limits; 1mb JSON cap |
| Observability | Backend `/health`, battle `/health`, pino request logs + request id |
| Reliability | Battle proxy errors mapped to HTTP; landing degrades if Pokédex API is down |
| Motion / a11y | `prefers-reduced-motion` collapses tokens; battle skips flash/lunge; landing showcase instant-swaps |
| Not in this revision | JWT refresh rotation, `/api/v1` versioning, Redis Socket.IO adapter, GraphQL, extra levels, BAG/POKéMON/RUN |

## 7. Deployment

**Local:** `npm run setup` then `npm run dev` (workspaces + concurrently). MySQL via `npm run docker:db` or a local instance.

**Compose:** MySQL by default; `--profile full` builds frontend, backend, and battle-engine images. Backend exposes **5000 only** (Socket.IO is on that port). Battle-engine exposes 8000 for the BFF, not the browser.

## 8. Future (out of current scope)

- Multiplayer chat (would need a new client for the backend Socket.IO endpoint + Redis presence adapter)
- JWT refresh, API versioning, extra battle levels, BAG / party / run
- GraphQL, TypeScript rewrite, Kubernetes / Helm

## 9. Document control

**Version**: 1.1  
**Date**: 2026-08-13  
**Status**: Matches the landing-page + BFF architecture in this repo  
**See also**: [`README.md`](README.md), [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md)
