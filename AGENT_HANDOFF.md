# TAKA69 — Agent Handoff (current production baseline)

**Do not roll back.** This document freezes the **current** website as the only source of truth.

| Item | Value |
|------|--------|
| Live URL | https://taka69.vercel.app |
| GitHub repo | https://github.com/SmZamil1/taka69 |
| Branch | `main` only |
| Baseline commit | `13b2060ede32863ec7ea26fd76a8d62baacc4bb8` |
| Commit message | feat: full Cherry Charm build, MF wallet/layout, notification fix |
| App name | TAKA69 |
| Stack | Next.js + Prisma + Neon Postgres + Vercel |

## Rule for every future agent

1. `git pull origin main` — start from this baseline or newer on `main`.
2. **Never** deploy an older commit. **Never** force-push over `main` unless the owner explicitly orders a rollback.
3. After changes: commit → push `main` → wait Vercel **READY** → hard-refresh QA on https://taka69.vercel.app
4. Secrets live only in **Vercel Project → Settings → Environment Variables** (and owner password managers). Never commit `.env` or tokens.

## What is already live (do not rebuild unless broken)

- Cherry Charm full 3D: `/games/cherry-charm` → assets `/assets/games/cherry-charm/` (AGPL-3.0)
- Mystical Forest wallet + mobile fit: `/games/mystical-forest`
- Neon Reels image slots: `/games/pixi-slots`
- Game trash 30-day flow + admin games page
- Homepage category **image** icons (not emoji)
- Notification bottom prompt (hide when permission granted)
- Immersive game shell (no double top bar on key games)
- Aviator/crash custom UI; Unity aviator removed
- Slots wallet API: `POST /api/games/slots`

## Key paths

```
src/app/(main)/layout.tsx
src/app/(main)/games/**
src/app/admin/**
src/components/home/GameGrid.tsx
src/components/home/JackpotBar.tsx
src/components/layout/NotificationPrompt.tsx
src/lib/game-config.ts
src/lib/games-meta.ts
src/lib/wallet.ts
src/app/api/games/**
prisma/schema.prisma
public/assets/games/**
public/sw.js
.env.example
```

## Env vars the app expects (values in Vercel, not here)

Required / core:
- `DATABASE_URL` — Neon Postgres (pooled URL preferred on Vercel)
- `JWT_SECRET`
- `SETUP_SECRET`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_URL`
- `NEXT_PUBLIC_CURRENCY` / `NEXT_PUBLIC_STARTING_BALANCE` (as configured)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` (bootstrap)

Optional / features:
- `CRON_SECRET`
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (web push)
- `RESEND_API_KEY` / `EMAIL_FROM`
- `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `UPLOAD_DIR`

See `.env.example` for templates.

## Where the owner gets credentials

| Secret | Where to copy |
|--------|----------------|
| GitHub PAT | GitHub → Settings → Developer settings → Personal access tokens (repo scope). **Rotate if ever pasted in chat.** |
| Vercel token | Vercel → Account Settings → Tokens |
| Vercel project | Dashboard project for taka69.vercel.app → Settings |
| Neon DB URL | Neon Console → Project → Connection string (pooled + SSL) |
| All app env | Vercel → Project → Settings → Environment Variables (Production) |
| Admin login | Whatever was set via setup/seed / Vercel `ADMIN_*` |

## Pending product work (optional next)

1. Finish/verify admin trash-restore 30d end-to-end + ledger/admin polish
2. Full wallet audit on every `/games/*` route
3. Remaining emoji → icons sitewide
4. JackpotBar / homepage JETA7 polish
5. Import more single games only with iframe + wallet bridge

## Admin areas to know

- `/admin` — control center
- `/admin/games` — enable/disable/trash/limits
- Ledger / users / branding routes under `src/app/admin/`

## Deploy check

```bash
git clone https://github.com/SmZamil1/taka69.git
cd taka69
git checkout main
git log -1   # must be 13b2060 or newer on main
npm install
# never use old zip/backup as source of truth
```

Production always follows **GitHub `main` → Vercel production**.
