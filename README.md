# TAKA69

**Play-money social casino** — full-stack Next.js app, private admin, PWA + Android APK path.

> Virtual **Taka Coins (TC)** only. No real-money deposits, withdrawals, or cash gambling.

**Repo:** https://github.com/SmZamil1/taka69  

**🚀 Go live:** [docs/LIVE_SETUP.md](docs/LIVE_SETUP.md)

## Features

### Player
- Bangla + English UI (mobile-first)
- Register / login (JWT httpOnly)
- Welcome bonus · daily bonus · referrals
- **Playable games (server-settled, provably fair):**
  - Crash · Dice · Mines · Wheel · Slots
- Wallet ledger · missions · leaderboard
- Jackpot ticker · promo carousel · PWA

### Admin (`/admin`)
- Role-gated dashboard
- Users: ban / unban / adjust TC / roles
- Transactions · jackpot · announcements · maintenance

### Ops
- Vercel + Neon ready
- `POST /api/setup` one-time production seed
- GitHub Actions CI + Android APK workflow
- Capacitor config

## Live deploy (summary)

1. Create free DB on [Neon](https://neon.tech)  
2. Import this repo on [Vercel](https://vercel.com)  
3. Set env vars from `.env.example`  
4. Deploy  
5. Seed:
   ```bash
   curl -X POST "https://YOUR-APP.vercel.app/api/setup" \
     -H "Content-Type: application/json" \
     -d '{"secret":"YOUR_SETUP_SECRET"}'
   ```

Full steps → **[docs/LIVE_SETUP.md](docs/LIVE_SETUP.md)**

## Demo accounts (after seed)

| User | Password |
|------|----------|
| `demo` | `demo1234` |
| admin from env | `ADMIN_PASSWORD` |

## Stack

Next.js 14 · Tailwind · Prisma · PostgreSQL · jose JWT · bcrypt · Zustand

## Disclaimer

Entertainment / portfolio use with **virtual currency that has no cash value**.  
You must comply with local law. Do not operate real-money gambling without a licence.
