# Pokemon Origins

Full-stack Pokemon app: React Pokedex UI, Node/Express trainer API, and a Python FastAPI battle engine.

## Folder structure

```
Pokemon-Origins/
├── frontend/              # React + Vite client
├── backend/               # Express API + Socket.IO (BFF for battle)
├── battle-engine/         # FastAPI combat microservice
├── database/              # SQL seed / schema dumps
├── docs/design/           # STYLE_GUIDE + ANIMATION_GUIDE
├── scripts/               # Cross-platform start/setup helpers
├── package.json           # Root workspace + one-command `npm run dev`
├── docker-compose.yml     # MySQL (default) + optional full stack
├── .env.example           # Documented env vars
├── HLD.md                 # High-level design (current architecture)
└── README.md
```

| Service | Path | Default ports |
|---------|------|----------------|
| Frontend | `frontend/` | `5173` |
| Backend API + Socket.IO | `backend/server.js` | `5000` |
| Battle engine | `battle-engine/` | `8000` |
| MySQL | Docker / local | `3306` |

## Prerequisites

- Node.js 18+
- Python 3.11+ (`py -3` on Windows, or `python3`)
- MySQL 8 (local or Docker)
- Git

## Quick start (one command)

From the repository root:

```bash
# 1) Install JS deps + create Python venv / install requirements
npm run setup

# 2) Copy env files and edit secrets / DB credentials
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp battle-engine/.env.example battle-engine/.env

# 3) Start MySQL (optional if you already have MySQL locally)
npm run docker:db

# 4) Launch frontend + backend + battle engine together
npm run dev
```

Then open:

- Frontend: http://localhost:5173
- Backend API + Socket.IO: http://localhost:5000
- Battle engine: http://localhost:8000

`npm run dev` uses [concurrently](https://www.npmjs.com/package/concurrently) with `-k` so stopping the root process (Ctrl+C) stops all child services. Logs are prefixed with `frontend`, `backend`, and `battle`.

### Useful scripts

| Command | What it does |
|---------|----------------|
| `npm run setup` | `npm install` (workspaces) + Python venv/deps |
| `npm run dev` | Start all three app services |
| `npm run dev:frontend` | Frontend only |
| `npm run dev:backend` | Backend only |
| `npm run dev:battle` | Battle engine only |
| `npm run docker:db` | Start MySQL via Compose |
| `npm run docker:up` | Full stack containers (`--profile full`) |
| `npm run docker:down` | Stop Compose services |

Full stack Docker:

```bash
docker compose --profile full up --build
```

MySQL only (recommended for local Node/Python development):

```bash
docker compose up mysql -d
# or: npm run docker:db
```

## Environment variables

Never commit real `.env` files. Use the examples:

- Root: [`.env.example`](.env.example)
- Backend: [`backend/.env.example`](backend/.env.example)
- Frontend: [`frontend/.env.example`](frontend/.env.example)
- Battle engine: [`battle-engine/.env.example`](battle-engine/.env.example)

### Backend (`backend/.env`)

```
PORT=5000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change_me_in_local_env
BATTLE_ENGINE_URL=http://localhost:8000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=pokedex
TRAINER_DB_NAME=trainer
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:5000
```

Battle UI calls go through the backend BFF (`/api/battle/*`), not directly to the battle engine.

### Battle engine (`battle-engine/.env`)

```
BATTLE_HOST=0.0.0.0
BATTLE_PORT=8000
CORS_ORIGINS=http://localhost:5000
BATTLE_SERVICE_URL=http://localhost:8000
```

## Database

See [`database/README.md`](database/README.md) for dump layout, FK notes, restore steps, and campaign-progress migrations.

1. Start MySQL (`npm run docker:db` or your own instance).
2. The dump creates both `pokedex` and `trainer` schemas.
3. Seed data is mounted from `database/pokedex_data.sql` when using Compose MySQL (first volume init).
4. Apply `database/migrations/001_trainer_progress.sql` if the volume already existed (Compose init does not re-run).
5. Align `backend/.env` (`DB_NAME`, `TRAINER_DB_NAME`, credentials) with MySQL.

## Architecture (short)

```
Browser → frontend (:5173)
        → backend API + Socket.IO (:5000) → MySQL
        → backend /api/battle/* (JWT) → battle-engine (:8000)
```

Health: `GET http://localhost:5000/health`, `GET http://localhost:8000/health`.

### Removed prototypes

The unrouted ChatGround vicinity-chat prototype has been **deleted** from the frontend (UI/UX cleanup pass). The backend Socket.IO chat endpoint still exists but has no product surface; a future multiplayer feature would need a new client and a Redis Socket.IO adapter.

The live battle service is `battle-engine/` (the legacy `battle-logic-service/` directory has been deleted from the repo).

### Combat unit tests

```bash
cd battle-engine
# with venv active:
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

See [HLD.md](HLD.md) for architecture, routes, BFF contracts, and what is explicitly out of scope.

## Frontend UI

The frontend is one continuous **GBA / FireRed–LeafGreen handheld experience**: Auth boots a GameBoy shell, the post-login hub and Pokedex render as green LCD screens, and battles use the classic cream-panel GBA stage. Design tokens (colors, fonts, motion) live in `frontend/src/styles/tokens.css`; shared shell primitives in `frontend/src/components/Shell/`. Guides: [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md) and [`docs/design/ANIMATION_GUIDE.md`](docs/design/ANIMATION_GUIDE.md).

- Run it with `npm run dev` (frontend on `:5173`).
- `/` is a public landing page (`frontend/src/pages/Landing/Landing.jsx`): hero brand + CTAs and a live rotating Pokémon showcase fed by `GET /pokemon`. Logged-out visitors are pointed to `/auth`, logged-in ones to `/game`; unknown routes still redirect by session.
- On the Auth screen the physical controls work: SELECT switches login/register, START or A submits, B backs out to login.
- Motion honors `prefers-reduced-motion`: boot/encounter/attack choreography is skipped while HP and text updates still happen.

## Troubleshooting

**`npm run dev` fails on the battle process**
- Run `npm run setup` so `battle-engine/.venv` exists.
- Confirm Python 3 is available (`py -3 --version` or `python3 --version`).
- Install deps manually:
  ```bash
  cd battle-engine
  py -3 -m venv .venv          # or: python3 -m venv .venv
  .venv\Scripts\activate       # Windows
  # source .venv/bin/activate  # macOS/Linux
  pip install -r requirements.txt
  ```

**Backend cannot connect to MySQL**
- Check `DB_*` in `backend/.env`.
- If using Compose MySQL, wait until healthy, then retry.
- Default Compose credentials match `backend/.env.example`.
- Fresh restore: see [`database/README.md`](database/README.md).

**CORS / API calls fail from the browser**
- Frontend should only need `VITE_API_URL` (battle via BFF).
- Backend `CORS_ORIGIN` should be your Vite origin (default `http://localhost:5173`).
- Battle `CORS_ORIGINS` should allow the backend (`http://localhost:5000`), not the browser.

**Level 1 / damage fails with 401**
- You must be logged in; battle routes require Bearer JWT.

**Port already in use**
- Change `PORT`, `BATTLE_PORT`, or Vite’s port via `VITE_DEV_PORT` in `frontend/.env`, and update matching `VITE_*` / `BATTLE_ENGINE_URL`.
- If another FastAPI app already owns `:8000`, set `BATTLE_PORT=8001` in `battle-engine/.env` and `BATTLE_ENGINE_URL=http://localhost:8001` in `backend/.env`.
- If Vite prints `Port 5173 is in use`, free that port or set `VITE_DEV_PORT` and restart.

**429 Too Many Requests on login/register**
- Auth endpoints are rate-limited. Wait a few minutes or restart the backend during local testing.

**Ctrl+C leaves a Python process running (Windows)**
- The battle launcher uses `taskkill /T` on shutdown. If a stray process remains, end the `uvicorn`/`python` process in Task Manager, or:
  ```powershell
  Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
  ```

**Orphaned / unused backend entry**
- The live server entrypoint is `backend/server.js` (single HTTP server for REST + Socket.IO).

## Contributing

1. Fork and create a feature branch.
2. Keep secrets in local `.env` files only.
3. Prefer env-based URLs/ports over hardcoded hosts.
4. Open a PR with a short summary and test notes.

## License

MIT — see the repository license file if present.
