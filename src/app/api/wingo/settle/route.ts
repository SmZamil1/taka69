import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { selectHouseResult, checkWin, getMultiplier, calcPayout, getColors, getSize } from "@/lib/wingo-engine";

export const dynamic = "force-dynamic";

type WG = "WINGO1" | "WINGO3" | "WINGO5" | "WINGO10";
const GAMES: WG[] = ["WINGO1", "WINGO3", "WINGO5", "WINGO10"];
const INTERVAL: Record<WG, number> = { WINGO1: 1, WINGO3: 3, WINGO5: 5, WINGO10: 10 };

type WingoAdminCfg = {
  autoPlay?: boolean;
  randomLessWin?: boolean;
  forceResult?: number | null;
  forceOnce?: boolean;
};

async function getWingoConfig(): Promise<WingoAdminCfg> {
  try {
    const row = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const w = ((row?.wingoConfig as WingoAdminCfg) || {}) as WingoAdminCfg;
    return {
      autoPlay: w.autoPlay !== false,
      randomLessWin: w.randomLessWin !== false,
      forceResult: typeof w.forceResult === "number" ? w.forceResult : null,
      forceOnce: !!w.forceOnce,
    };
  } catch {
    return { autoPlay: true, randomLessWin: true, forceResult: null, forceOnce: false };
  }
}

async function clearForceIfOnce(cfg: WingoAdminCfg) {
  if (!cfg.forceOnce || cfg.forceResult === null || cfg.forceResult === undefined) return;
  try {
    const next = { ...cfg, forceResult: null, forceOnce: false };
    await prisma.appConfig.upsert({
      where: { id: "main" },
      create: { id: "main", wingoConfig: next },
      update: { wingoConfig: next },
    });
  } catch (e) {
    console.error("[wingo settle] clear force failed", e);
  }
}

export async function GET(req: Request) {
  const cronSecret = req.headers.get("x-cron-secret");
  const envSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret !== envSecret) {
    try {
      await requireAdmin();
    } catch {
      return fail("Unauthorized", 401);
    }
  }

  const cfg = await getWingoConfig();
  const results: Record<string, unknown> = { config: cfg };

  if (cfg.autoPlay === false) {
    return ok({ results: { paused: true, ...results }, ts: new Date().toISOString() });
  }

  let usedForce = false;

  for (const game of GAMES) {
    try {
      const interval = INTERVAL[game] * 60 * 1000;
      const now = new Date();

      const expiredRound = await prisma.wingoRound.findFirst({
        where: {
          game,
          status: "open",
          startedAt: { lte: new Date(now.getTime() - interval) },
        },
        include: { bets: { where: { status: "pending" } } },
      });

      if (expiredRound) {
        const pool: Record<string, number> = {};
        for (const b of expiredRound.bets) {
          pool[b.bet] = (pool[b.bet] || 0) + b.amount;
        }

        const force =
          !usedForce && typeof cfg.forceResult === "number" ? cfg.forceResult : null;
        if (force !== null) usedForce = true;

        const result = selectHouseResult(pool, {
          forceResult: force,
          randomLessWin: cfg.randomLessWin !== false,
        });
        const colors = getColors(result);
        const size = getSize(result);

        for (const b of expiredRound.bets) {
          const won = checkWin(b.bet, result);
          const mult = getMultiplier(b.bet);
          const payout = won ? calcPayout(b.amount, mult) : 0;

          await prisma.wingoBetRecord.update({
            where: { id: b.id },
            data: { won, payout, status: won ? "won" : "lost" },
          });

          if (won) {
            const userNow = await prisma.user.findUnique({
              where: { id: b.userId },
              select: { balance: true },
            });
            const newBal = (userNow?.balance ?? 0) + payout;
            await prisma.user.update({
              where: { id: b.userId },
              data: { balance: { increment: payout }, totalWin: { increment: payout } },
            });
            await prisma.transaction.create({
              data: {
                userId: b.userId,
                type: "WINGO_WIN",
                amount: payout,
                balanceAfter: newBal,
                note: `WinGo ${game} win — result ${result} (${colors.join("/")}, ${size})`,
                meta: { roundId: expiredRound.id, result, bet: b.bet, multiplier: mult },
              },
            });
          }
        }

        await prisma.wingoRound.update({
          where: { id: expiredRound.id },
          data: { result, status: "closed", closedAt: now },
        });

        results[game] = {
          settled: expiredRound.period,
          result,
          colors,
          size,
          bets: expiredRound.bets.length,
          forced: force !== null,
        };
      }

      // Always keep an open round so the game auto-plays continuously
      const openRound = await prisma.wingoRound.findFirst({ where: { game, status: "open" } });
      if (!openRound) {
        const lastRound = await prisma.wingoRound.findFirst({
          where: { game },
          orderBy: { period: "desc" },
        });
        const nextPeriod = (lastRound?.period ?? 0) + 1;
        await prisma.wingoRound.create({
          data: { game, period: nextPeriod, status: "open" },
        });
        results[`${game}_new`] = nextPeriod;
      }
    } catch (err) {
      results[`${game}_error`] = String(err);
    }
  }

  if (usedForce) await clearForceIfOnce(cfg);

  return ok({ results, ts: new Date().toISOString() });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    if (body.action === "ensure_rounds") {
      const created: string[] = [];
      for (const game of GAMES) {
        const open = await prisma.wingoRound.findFirst({ where: { game, status: "open" } });
        if (!open) {
          const last = await prisma.wingoRound.findFirst({
            where: { game },
            orderBy: { period: "desc" },
          });
          const period = (last?.period ?? 0) + 1;
          await prisma.wingoRound.create({ data: { game, period, status: "open" } });
          created.push(`${game}:${period}`);
        }
      }
      return ok({ created });
    }
    return GET(req);
  } catch (e) {
    return handleError(e);
  }
}
