# TAKA69 — Deploy Guide

Play-money social casino. **Virtual coins only. No real-money payments.**

## 1. Database (Neon free tier recommended)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the Postgres connection string
3. It looks like:
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

## 2. Vercel

1. Import the GitHub repo `SmZamil1/taka69`
2. Framework: **Next.js** (auto)
3. Environment variables:

| Name | Example |
|------|---------|
| `DATABASE_URL` | neon connection string |
| `JWT_SECRET` | long random string (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_APP_NAME` | `TAKA69` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_CURRENCY` | `TC` |
| `NEXT_PUBLIC_STARTING_BALANCE` | `10000` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | strong password |
| `ADMIN_EMAIL` | your email |

4. Deploy
5. After first deploy, run seed from your machine (or Vercel CLI):

```bash
export DATABASE_URL="..."
export JWT_SECRET="..."
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD='your-strong-password'
npm install
npx prisma db push
npm run db:seed
```

## 3. Local dev

```bash
cp .env.example .env
# edit DATABASE_URL + JWT_SECRET
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

Demo user: `demo` / `demo1234`  
Admin: values from `ADMIN_*` env

## 4. Android APK

### Option A — PWA (fastest)
On Android Chrome: open site → menu → **Add to Home screen**.

### Option B — Capacitor wrapper APK
1. Deploy web app to Vercel
2. In GitHub repo → Settings → Secrets and variables → Actions → Variables:
   - `APP_URL` = `https://your-app.vercel.app`
3. Actions → **Android APK** → Run workflow
4. Download artifact `taka69-debug-apk`

### Option C — Local Capacitor
```bash
npm install -D @capacitor/cli @capacitor/core @capacitor/android
# set server.url in capacitor.config.ts to your Vercel URL
mkdir -p www && echo '<html></html>' > www/index.html
npx cap add android
npx cap sync
npx cap open android
# Build → Build Bundle(s) / APK(s) in Android Studio
```

## 5. Admin panel

Visit `/admin` while logged in as `ADMIN` or `MODERATOR`.

- Dashboard stats
- User ban / balance adjust
- Transactions
- Jackpot + announcements

## Legal

TAKA69 ships as **entertainment with virtual currency only**.  
Do not add bKash/Nagad/card cash-in, cash-out, or real-money wagering.
