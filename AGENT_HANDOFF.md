# TAKA69 — Agent Handoff (current production baseline)

**Do not roll back.** This document freezes the **current** website as the only source of truth.

| Item | Value |
|------|--------|
| Live URL | https://taka69.vercel.app |
| GitHub repo | https://github.com/SmZamil1/taka69 |
| Branch | `main` only |
| Baseline commit | `14a2e5f14a8e1a20d4e087ed67d8373cfc0aa054` |
| Commit message | feat: unify full site visual theme |
| App name | TAKA69 |
| Stack | Next.js + Prisma + Neon Postgres + Vercel |

## Rule for every future agent

1. `git pull origin main` — start from this baseline or newer on `main`.
2. **Never** deploy an older commit. **Never** force-push over `main` unless the owner explicitly orders a rollback.
3. After changes: commit → push `main` → wait Vercel **READY** → hard-refresh QA on https://taka69.vercel.app
4. Secrets live only in **Vercel Project → Settings → Environment Variables** (and owner password managers). Never commit `.env` or tokens.

## Current visual redesign status (August 16, 2026)

The full-site visual consistency pass is saved in commit `14a2e5f14a8e1a20d4e087ed67d8373cfc0aa054` on `main`.

- Direction: navy, icy-blue, white, and warm-gold shared theme primitives.
- Updated 40 files across auth, main layout, home, account/profile, wallet, games lobby, admin shell, navigation, overlays, drawers, support, and responsive grids.
- Preserved existing auth, wallet, mission, VIP, referral, leaderboard, support, notification, popup, and game behavior.
- Working tree was clean at handoff time. Local `main` is two commits ahead of `origin/main`; the theme commit is present locally and must be pushed before treating GitHub/Vercel as updated.
- Validation already recorded: production Next build passed; ESLint had 0 errors and 10 existing warnings; TypeScript retained only known pre-existing admin settings errors; public route smoke checks returned HTTP 200 for the documented routes.
- Remaining QA limitation: authenticated browser walkthroughs with live account data and open modal states are still pending.

### Theme commit file list

The commit changes these 40 files:

```text
src/app/(auth)/forgot-password/page.tsx
src/app/(auth)/layout.tsx
src/app/(auth)/login/page.tsx
src/app/(auth)/onboarding/page.tsx
src/app/(auth)/register/page.tsx
src/app/(auth)/reset-password/page.tsx
src/app/(main)/claim-center/page.tsx
src/app/(main)/games/keno/page.tsx
src/app/(main)/games/page.tsx
src/app/(main)/layout.tsx
src/app/(main)/page.tsx
src/app/(main)/profile/page.tsx
src/app/(main)/profile/settings/page.tsx
src/app/(main)/rebate/page.tsx
src/app/(main)/referral/page.tsx
src/app/(main)/vip/page.tsx
src/app/(main)/wallet/page.tsx
src/app/(main)/wingo/page.tsx
src/app/admin/layout.tsx
src/app/globals.css
src/app/layout.tsx
src/components/account/AccountTabs.tsx
src/components/account/AppDownloadModal.tsx
src/components/account/FloatingAccountActions.tsx
src/components/games/DepositGate.tsx
src/components/home/GameGrid.tsx
src/components/home/HeroCarousel.tsx
src/components/home/JackpotBar.tsx
src/components/home/PromoPopup.tsx
src/components/home/QuickActions.tsx
src/components/layout/BottomNav.tsx
src/components/layout/NotificationBell.tsx
src/components/layout/NotificationPrompt.tsx
src/components/layout/SideDrawer.tsx
src/components/layout/TopBar.tsx
src/components/support/SupportChat.tsx
src/components/support/SupportChoiceModal.tsx
src/components/ui/Button.tsx
src/components/ui/Input.tsx
tailwind.config.ts
```

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
