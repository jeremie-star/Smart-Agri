# Smart Irrigation Assistant

Opinionated quickstart guide to run the full stack (backend + frontend) locally and notes for deployment.

---

## Project structure (important files)
- `backend/` – FastAPI backend (Python)
  - `backend/main.py` – App entry (development server)
  - `backend/start.sh` – simple quick-start wrapper
  - `backend/requirements.txt` – Python deps
  - `backend/alembic/` + `alembic.ini` – DB migrations
  - `backend/make_admin.py` – create admin user script
  - `backend/run_tests.sh` – run backend tests
  - `backend/docker-compose.yml`, `Dockerfile` – container options
- `frontend/` – Next.js React frontend
  - `frontend/package.json` – npm scripts
  - `frontend/public/` – static assets and icons
  - `frontend/.env.local` – local frontend env (see below)

---

## Admin user
- Phone-number: 1234567890 
- password: jeremie

---

## Requirements
- Node.js (v18+ recommended) and npm or pnpm/yarn
- Python 3.10+ and virtualenv
- PostgreSQL (if using DB) or use the configured DB URL
- Docker (optional, for containers)

---

## Environment variables
- Backend: see `backend/.env.example` for full list. Copy to `backend/.env` and fill in values.
  - Important: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `OPENWEATHER_API_KEY`, optional AI keys
- Frontend: `frontend/.env.local` (example):
  - `NEXT_PUBLIC_API_BASE_URL=https://smart-agri-hezb.onrender.com` (set to deployed API in production)
  - `NEXT_PUBLIC_MAPBOX_TOKEN=...`

Note: Next.js inlines `NEXT_PUBLIC_*` variables at build time. When deploying (Vercel), add `NEXT_PUBLIC_API_BASE_URL` to Vercel environment variables and redeploy.

---

## Quickstart - Backend (local)
1. Create and activate virtualenv
   - python -m venv .venv
   - source .venv/bin/activate
2. Install deps
   - cd backend && pip install -r requirements.txt
3. Create `.env` (copy `backend/.env.example`) and set `DATABASE_URL` (for local testing you can use sqlite or local Postgres)
4. Run migrations
   - alembic upgrade head
5. Start server
   - ./start.sh
   - or: uvicorn main:app --reload --host 0.0.0.0 --port 8000
6. Create admin user (optional)
   - python make_admin.py

Endpoints: docs at `http://localhost:8000/docs`, health at `/health`.

If port 8000 is already in use: find and kill process:
- lsof -nP -iTCP:8000 -sTCP:LISTEN
- kill <PID>

---

## Quickstart - Frontend (local)
1. cd frontend
2. Install deps
   - npm install
3. Configure `frontend/.env.local` (use local or deployed backend URL)
4. Start dev server
   - npm run dev
   - default: http://localhost:3000

If the app is deployed on Vercel and still points to `localhost`, set `NEXT_PUBLIC_API_BASE_URL` in Vercel project settings (Production / Preview / Development) and redeploy.

---

## Testing
- Backend tests: `cd backend && ./run_tests.sh` (uses `pytest`)
- Frontend: run `npm run test` if configured

---

## Docker / Production
- There are `Dockerfile` and `docker-compose.yml` files in `backend/`.
- Production-compose and nginx configs: see `backend/docker-compose.prod.yml` and `backend/nginx.prod.conf`.
- Deploy backend to Render/Heroku/other and frontend to Vercel.

Deployment notes:
- Vercel builds the frontend and needs `NEXT_PUBLIC_API_BASE_URL` at build time.
- Ensure backend `CORS_ORIGINS` includes your Vercel domain and deployed frontend domain.

---

## Common issues & debugging
- Requests failing with CORS / 401: check backend `CORS_ORIGINS` and Authorization header handling.
- Login curl tip: do not send an `Authorization` header when calling the login endpoint. Example:
  - curl -i 'https://smart-agri-hezb.onrender.com/api/auth/login' -H 'Content-Type: application/json' --data-raw '{"phone_number":"+250782516110","password":"jeremie"}'
- If requests still show `Referer: http://localhost:3000/` after deploying: the build served by Vercel was built with localhost settings. Add `NEXT_PUBLIC_API_BASE_URL` to Vercel env, rebuild and redeploy.
- If port 8000 in use: `lsof` + `kill` as above.

---

## Useful scripts
- `backend/start.sh` – start backend for development
- `backend/run_tests.sh` – run backend tests
- `backend/backup_db.sh` / `backend/restore_db.sh` – DB backup/restore
- `backend/deploy.sh` – production deployment helper

---

## Contributing
1. Create branch
2. Follow repo linting and formatting rules
3. Run tests locally
4. Open PR with description of changes

---

For further help, include relevant logs (server output, browser Network tab) and point to which environment (local / Vercel / Render) you are troubleshooting.
