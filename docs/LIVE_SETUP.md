# TAKA69 — Live Web Setup (Final)

Full production launch on **Vercel + Neon** in ~10 minutes.  
**Play-money only** (virtual TC). No real deposits/withdrawals.

Repo: https://github.com/SmZamil1/taka69

---

## What you get live

| URL | Purpose |
|-----|---------|
| `https://YOUR-APP.vercel.app/` | Player site (BN/EN) |
| `/login` `/register` | Auth |
| `/games/crash` `/dice` `/mines` `/wheel` `/slots` | Playable games |
| `/wallet` | Balance + daily bonus + ledger |
| `/rewards` | Missions, leaderboard, invite |
| `/admin` | Private admin panel |
| `POST /api/setup` | One-time DB seed |

Demo after setup: **`demo` / `demo1234`**  
Admin: your `ADMIN_USERNAME` / `ADMIN_PASSWORD`

---

## Step 1 — Free Postgres (Neon)

1. Open https://console.neon.tech → sign up / log in  
2. **Create project** → name `taka69` → region close to you (e.g. Singapore)  
3. After create, open **Dashboard → Connection details**  
4. Copy **connection string** (URI), looks like:
   ```
   postgresql://neondb_owner:xxxx@ep-cool-name-a1b2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Keep this as `DATABASE_URL`

---

## Step 2 — Generate secrets

On any computer (or https://generate-secret.vercel.app/48):

```bash
openssl rand -base64 48   # → JWT_SECRET
openssl rand -base64 32   # → SETUP_SECRET
```

Pick a strong admin password (save it).

---

## Step 3 — Deploy on Vercel (live web)

1. Open https://vercel.com → log in with **GitHub**  
2. **Add New… → Project**  
3. Import **`SmZamil1/taka69`**  
   - If not listed: GitHub → grant Vercel access to `taka69`  
4. Framework Preset: **Next.js** (auto)  
5. **Environment Variables** — add all of these (Production + Preview):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon URI from Step 1 |
| `JWT_SECRET` | from Step 2 |
| `SETUP_SECRET` | from Step 2 |
| `NEXT_PUBLIC_APP_NAME` | `TAKA69` |
| `NEXT_PUBLIC_APP_URL` | leave blank first deploy, then set to your `*.vercel.app` URL |
| `NEXT_PUBLIC_CURRENCY` | `TC` |
| `NEXT_PUBLIC_STARTING_BALANCE` | `10000` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | your strong password |
| `ADMIN_EMAIL` | your email |

6. Click **Deploy**  
7. Wait until build succeeds (Prisma generates + `db push` + Next build)  
8. Copy the live URL, e.g. `https://taka69-xxx.vercel.app`  
9. Vercel → Project → **Settings → Environment Variables** → set  
   `NEXT_PUBLIC_APP_URL` = that URL → **Redeploy** (Deployments → … → Redeploy)

---

## Step 4 — Seed the live database (one command)

Replace URL + secret:

```bash
curl -X POST "https://YOUR-APP.vercel.app/api/setup" \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SETUP_SECRET"}'
```

Expected JSON includes `"ready": true` and `"seeded": true`.

Check health:

```bash
curl "https://YOUR-APP.vercel.app/api/setup"
```

---

## Step 5 — Smoke test (full system)

1. Open live URL → home (carousel, jackpot, games)  
2. **Register** a new user → get 10,000 TC  
3. Play **Crash**, **Dice**, **Mines**, **Wheel**, **Slots**  
4. **Wallet** → claim daily 500 TC  
5. **Rewards** → missions progress  
6. Login as **admin** → open `/admin`  
   - Dashboard stats  
   - Users → adjust TC / ban  
   - Settings → jackpot / announcement  
7. Logout admin → confirm `/admin` blocked for normal users  

---

## Step 6 — Android (after web is live)

### Fast (PWA)
Android Chrome → open site → **Add to Home screen**

### APK via GitHub Actions
1. GitHub repo → **Settings → Secrets and variables → Actions → Variables**  
2. New variable: `APP_URL` = `https://YOUR-APP.vercel.app`  
3. **Actions → Android APK → Run workflow**  
4. Download artifact `taka69-debug-apk`  
5. Install on phone (allow unknown sources)

---

## Custom domain (optional)

Vercel → Project → **Settings → Domains** → add `taka69.com` (or any domain) → set DNS as shown → update `NEXT_PUBLIC_APP_URL`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Prisma | Confirm `DATABASE_URL` is set for Production |
| `/api/setup` 401 | Wrong `SETUP_SECRET` |
| `/api/setup` 503 | Add `SETUP_SECRET` env and redeploy |
| Login works but games fail | Open Vercel **Functions** logs; usually DB URL / SSL |
| Admin 403 | User role not ADMIN — re-run setup with `"forceSeed": true` **only if you accept resetting seed users** |
| Blank page | Hard refresh; check Deployment logs |

Force re-seed (careful):

```bash
curl -X POST "https://YOUR-APP.vercel.app/api/setup" \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SETUP_SECRET","forceSeed":true}'
```

---

## Security checklist

- [ ] Changed default `ADMIN_PASSWORD`  
- [ ] Long `JWT_SECRET` + `SETUP_SECRET`  
- [ ] Do **not** commit `.env`  
- [ ] Revoke any GitHub PAT pasted in chat  
- [ ] Remember: **no real-money payments** in this codebase  

---

## Architecture (live)

```
Browser / PWA / APK
        │
        ▼
   Vercel (Next.js 14)
   ├─ App Router UI
   ├─ API routes (auth, games, wallet, admin, setup)
   └─ JWT httpOnly cookie
        │
        ▼
   Neon Postgres (Prisma)
```

Games settle on the server with provably-fair seeds (HMAC-SHA256).

---

## Support accounts after seed

| User | Password | Role |
|------|----------|------|
| `demo` | `demo1234` | player |
| `ADMIN_USERNAME` | `ADMIN_PASSWORD` | admin |

---

**Legal:** TAKA69 is entertainment with virtual currency only. Coins have **zero cash value**. Do not add real payment rails.
