# Deploy

**For the full live production guide, use:**

👉 **[LIVE_SETUP.md](./LIVE_SETUP.md)** — Vercel + Neon click-by-click, seed, admin, Android APK.

## Quick links

- Repo: https://github.com/SmZamil1/taka69  
- After deploy, seed once:
  ```bash
  curl -X POST "https://YOUR-APP.vercel.app/api/setup" \
    -H "Content-Type: application/json" \
    -d '{"secret":"YOUR_SETUP_SECRET"}'
  ```

## Local (optional)

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Play-money only. No real-money gambling features.
