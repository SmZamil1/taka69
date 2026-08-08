# TAKA69

**Play-money social casino** — mobile-first web app + private admin + Android APK path.

> Virtual **Taka Coins (TC)** only. No real-money deposits, withdrawals, or cash gambling.

![stack](https://img.shields.io/badge/Next.js-14-black) ![db](https://img.shields.io/badge/Postgres-Prisma-blue) ![fair](https://img.shields.io/badge/Provably-Fair-green)

## Features

### Player
- Bangla + English UI
- Register / login (JWT httpOnly cookie)
- Welcome bonus + daily bonus + referral bonus
- **Games (all playable, server-settled, provably fair seeds):**
  - Crash (auto-cashout)
  - Dice (under/over)
  - Mines (25-tile grid)
  - Wheel
  - Slots
- Wallet ledger
- Missions + claim rewards
- Leaderboards
- Jackpot ticker + promo carousel
- PWA manifest (installable)

### Admin (`/admin`)
- Auth-gated (ADMIN / MODERATOR)
- Live stats dashboard
- User search, ban/unban, role, balance adjust
- Transaction browser
- Jackpot / maintenance / announcements

### Ops
- Vercel-ready (`vercel.json`)
- Prisma schema + seed
- GitHub Actions CI + Android APK workflow
- Capacitor config for native wrapper

## Quick start

```bash
git clone https://github.com/SmZamil1/taka69.git
cd taka69
cp .env.example .env
# set DATABASE_URL and JWT_SECRET
npm install
npx prisma db push
npm run db:seed
npm run dev
```

| Account | Password |
|---------|----------|
| `demo` | `demo1234` |
| `admin` (from env) | `ADMIN_PASSWORD` |

## Stack

- **Frontend:** Next.js 14 App Router, Tailwind, Zustand, Framer-ready
- **Backend:** Next.js Route Handlers
- **DB:** PostgreSQL + Prisma
- **Auth:** jose JWT + bcryptjs
- **Fairness:** HMAC-SHA256 server seed / client seed / nonce

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for Vercel + Neon + APK.

## Repo

https://github.com/SmZamil1/taka69

## Disclaimer

This software is for **entertainment and portfolio use** with **virtual currency that has no cash value**.  
You are responsible for complying with laws in your jurisdiction. Do not operate real-money gambling without proper licensing.
