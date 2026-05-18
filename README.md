# Kairos — Deployment Guide

## Requirements

- Server with Docker and Docker Compose installed
- Git repository access

## Deploy to Remote Server

### 1. Clone the repository

```bash
git clone <repo-url> && cd <repo-dir>
```

### 2. Create `.env` from example

```bash
cp .env.example .env
```

### 3. Edit `.env` — fill in real values

```
nano .env
```

Key fields to change:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `GOOGLE_REDIRECT_URL` — set to `http://YOUR_SERVER_IP/auth/callback`
- `FRONTEND_URL` — set to `http://YOUR_SERVER_IP/#`

### 4. Run deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

The app will be available at `http://YOUR_SERVER_IP` on port **80**.

## Useful commands

```bash
docker compose logs -f          # view logs
docker compose restart           # restart
docker compose down              # stop
docker compose up -d --build     # rebuild and start
```

## Local development (without Docker)

**Backend:**
```bash
cd backend
# edit backend/.env
go run ./cmd
```

**Frontend:**
```bash
cd frontend
# edit frontend/.env (VITE_BACKEND_URL=http://localhost:8060)
npm install
npm run dev
```

Frontend: `http://localhost:5173`, Backend: `http://localhost:8060`