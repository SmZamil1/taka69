# TAKA69 — Live Production

## Live website
- **Site:** https://taka69.vercel.app
- **Admin:** https://taka69.vercel.app/admin
- **GitHub:** https://github.com/SmZamil1/taka69
- **Vercel project:** https://vercel.com/smmorshedzamil-7130s-projects/taka69

## Accounts (after seed)
| User | Password | Role |
|------|----------|------|
| `demo` | `demo1234` | player |
| `admin` | *(set in Vercel env `ADMIN_PASSWORD`)* | admin |

> Admin password was generated at deploy time and stored in Vercel Project → Settings → Environment Variables → `ADMIN_PASSWORD`.

## Verified systems
- Home UI `200`
- Auth login/register
- Wallet / daily bonus APIs
- Crash game settlement
- Admin stats panel
- Neon Postgres schema + seed
- PWA manifest

## One-time seed (already done)
```bash
curl -X POST "https://taka69.vercel.app/api/setup" \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SETUP_SECRET"}'
```

## Android
1. Open https://taka69.vercel.app in Chrome → Add to Home screen  
2. Or set GitHub Actions variable `APP_URL=https://taka69.vercel.app` and run **Android APK** workflow

Play-money only. Virtual TC has no cash value.
