# TAKA69 — Gaming Platform

## New Features (Latest Update)

### 🔐 Enhanced Authentication
- **Register** with **Email OR Phone Number** (toggle between both)
- **Login** with **username, email, OR phone number**
- **Duplicate prevention**: same email/phone can't register twice
- **Forgot Password**: enter email → receive reset link
- **Reset Password**: secure token-based, expires in 1 hour

### 🎮 New Games Added
- **Fortune Maya** — 5×5 grid slot game with symbol matching
- **Extreme Plinko** — 16-row Plinko with Low/Medium/High risk modes

### ⚙️ Admin Control Center
- **Game Control** (`/admin/games`): 
  - Per-game **win chance slider (0%–100%)**
  - Toggle games on/off instantly
  - Set min/max bet, max win, max multiplier
  - Big prize jackpot boost control
  - Live overview of all games
- **System Control** (`/admin/system`):
  - Maintenance mode toggle
  - Jackpot amount
  - Payment rules (min/max deposit & withdrawal, fees, bonuses)
  - Referral commission rates (3 levels)
  - App version & APK URL

## Database Migration

Run `prisma/migrations/add_password_reset/migration.sql` on your database, then:

```bash
npx prisma generate
npx prisma db push
```

## Environment Variables Needed

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_here
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Stack
- Next.js 14 (App Router)
- Prisma + PostgreSQL
- Tailwind CSS
- TypeScript
