#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env — edit DATABASE_URL and JWT_SECRET"
fi

npm install
npx prisma generate
npx prisma db push
npm run db:seed
echo "Done. Run: npm run dev"
