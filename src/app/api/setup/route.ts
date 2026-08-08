import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { execSync } from "child_process";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * One-time production bootstrap.
 * POST /api/setup  { "secret": "<SETUP_SECRET>" }
 * - pushes Prisma schema
 * - seeds admin + demo + missions if empty
 */
export async function POST(req: Request) {
  try {
    const setupSecret = process.env.SETUP_SECRET || process.env.CRON_SECRET;
    if (!setupSecret) {
      return fail("SETUP_SECRET is not configured on the server", 503);
    }

    const body = await req.json().catch(() => ({}));
    if (body.secret !== setupSecret) {
      return fail("Invalid setup secret", 401);
    }

    // Ensure schema exists
    try {
      execSync("npx prisma db push --skip-generate --accept-data-loss=false", {
        stdio: "pipe",
        env: process.env,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "db push failed";
      // continue — tables may already exist
      console.warn("prisma db push:", msg);
    }

    const userCount = await prisma.user.count();
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const adminPass = process.env.ADMIN_PASSWORD || "ChangeMeAdmin123!";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@taka69.local";
    const starting = Number(process.env.NEXT_PUBLIC_STARTING_BALANCE || 0);

    const refCode = (name: string) =>
      name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase();

    let seeded = false;
    if (userCount === 0 || body.forceSeed === true) {
      const passwordHash = await bcrypt.hash(adminPass, 12);
      await prisma.user.upsert({
        where: { username: adminUser.toLowerCase() },
        create: {
          username: adminUser.toLowerCase(),
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
          balance: 1_000_000,
          referralCode: refCode(adminUser),
        },
        update: {
          passwordHash,
          role: "ADMIN",
          isBanned: false,
        },
      });

      await prisma.appConfig.upsert({
        where: { id: "main" },
        create: {
          id: "main",
          jackpot: 819662206,
          maintenance: false,
          banners: [
            {
              id: 1,
              titleEn: "Welcome Bonus",
              titleBn: "স্বাগতম বোনাস",
              subtitleEn: `Deposit to play with virtual TK`,
              subtitleBn: `ভার্চুয়াল TK দিয়ে খেলতে ডিপোজিট করুন`,
              color: "from-emerald-700 to-green-900",
            },
            {
              id: 2,
              titleEn: "Daily Login",
              titleBn: "দৈনিক লগইন",
              subtitleEn: "Claim 500 TK every day",
              subtitleBn: "প্রতিদিন ৫০০ টিসি নিন",
              color: "from-amber-600 to-orange-800",
            },
            {
              id: 3,
              titleEn: "Play Crash",
              titleBn: "ক্র্যাশ খেলুন",
              subtitleEn: "Cash out before it flies away",
              subtitleBn: "উড়ে যাওয়ার আগে ক্যাশ আউট করুন",
              color: "from-rose-700 to-red-950",
            },
          ],
          gameConfig: {
            crashHouseEdge: 0.03,
            diceHouseEdge: 0.01,
            minesHouseEdge: 0.01,
          },
        },
        update: {
          jackpot: 819662206,
          banners: [
            {
              id: 1,
              titleEn: "Welcome Bonus",
              titleBn: "স্বাগতম বোনাস",
              subtitleEn: `Deposit to play with virtual TK`,
              subtitleBn: `ভার্চুয়াল TK দিয়ে খেলতে ডিপোজিট করুন`,
              color: "from-emerald-700 to-green-900",
            },
            {
              id: 2,
              titleEn: "Daily Login",
              titleBn: "দৈনিক লগইন",
              subtitleEn: "Claim 500 TK every day",
              subtitleBn: "প্রতিদিন ৫০০ টিসি নিন",
              color: "from-amber-600 to-orange-800",
            },
            {
              id: 3,
              titleEn: "Play Crash",
              titleBn: "ক্র্যাশ খেলুন",
              subtitleEn: "Cash out before it flies away",
              subtitleBn: "উড়ে যাওয়ার আগে ক্যাশ আউট করুন",
              color: "from-rose-700 to-red-950",
            },
          ],
        },
      });

      const missions = [
        {
          code: "PLAY_10",
          titleEn: "Play 10 rounds",
          titleBn: "১০ রাউন্ড খেলুন",
          descriptionEn: "Place any 10 bets across games",
          descriptionBn: "যেকোনো গেমে ১০টি বেট করুন",
          target: 10,
          reward: 300,
          sortOrder: 1,
        },
        {
          code: "WIN_5",
          titleEn: "Win 5 times",
          titleBn: "৫বার জিতুন",
          descriptionEn: "Win any 5 bets",
          descriptionBn: "যেকোনো ৫টি বেট জিতুন",
          target: 5,
          reward: 500,
          sortOrder: 2,
        },
        {
          code: "CRASH_3",
          titleEn: "Crash pilot",
          titleBn: "ক্র্যাশ পাইলট",
          descriptionEn: "Play Crash 3 times",
          descriptionBn: "ক্র্যাশ ৩বার খেলুন",
          target: 3,
          reward: 250,
          sortOrder: 3,
        },
      ];

      for (const m of missions) {
        await prisma.mission.upsert({
          where: { code: m.code },
          create: m,
          update: m,
        });
      }

      const annCount = await prisma.announcement.count();
      if (annCount === 0) {
        await prisma.announcement.createMany({
          data: [
            {
              textEn: "TAKA69 is play-money only. Coins have no real-world value.",
              textBn: "TAKA69 শুধু প্লে-মানি। কয়েনের বাস্তব মূল্য নেই।",
              active: true,
            },
            {
              textEn: "Daily bonus is live — claim 500 TK from Wallet!",
              textBn: "দৈনিক বোনাস চালু — ওয়ালেট থেকে ৫০০ টিসি নিন!",
              active: true,
            },
          ],
        });
      }

      const demoHash = await bcrypt.hash("demo1234", 12);
      await prisma.user.upsert({
        where: { username: "demo" },
        create: {
          username: "demo",
          email: "demo@taka69.local",
          passwordHash: demoHash,
          role: "USER",
          balance: starting,
          referralCode: refCode("demo"),
          transactions: {
            create: {
              type: "DEPOSIT_BONUS",
              amount: starting,
              balanceAfter: starting,
              note: "Initial balance (virtual TK)",
            },
          },
        },
        update: {},
      });

      seeded = true;
    }

    const users = await prisma.user.count();
    const missions = await prisma.mission.count();
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });

    return ok({
      ready: true,
      seeded,
      users,
      missions,
      jackpot: config?.jackpot ?? 0,
      adminUsername: adminUser,
      demoUsername: "demo",
      note: "Play-money only. Change admin password after first login.",
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function GET() {
  try {
    const users = await prisma.user.count().catch(() => -1);
    return ok({
      status: users >= 0 ? "db_ok" : "db_error",
      users: users >= 0 ? users : null,
      needsSetup: users === 0,
      app: process.env.NEXT_PUBLIC_APP_NAME || "TAKA69",
    });
  } catch (e) {
    return handleError(e);
  }
}
