# Docker

## Quick start

1. Copy `backend/.env.example` to `backend/.env` and fill in payment/email/OAuth values as needed.
2. From the repo root:

```bash
docker compose up --build
```

3. Open **http://localhost:8080** (nginx serves the React app and proxies `/api` to Django).

Optional demo data on first boot:

```bash
SEED_DATABASE=1 docker compose up --build
```

## Services

| Service   | Role                          |
|-----------|-------------------------------|
| `backend` | Django API on port 8000 (internal) |
| `frontend`| nginx + static Vite build on **8080** |

SQLite is stored in the Docker volume `backend_data` at `/data/db.sqlite3`.

## Local dev (without Docker)

- Backend: `cd backend && python manage.py runserver`
- Frontend: `cd frontend && npm run dev` (uses `http://127.0.0.1:8000/api` by default)
