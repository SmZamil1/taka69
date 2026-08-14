import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { selectHouseResult, checkWin, getMultiplier, calcPayout, getColors, getSize } from "@/lib/wingo-engine";

export const dynamic = "force-dynamic";

type WG = "WINGO1" | "WINGO3" | "WINGO5" | "WINGO10";
const GAMES: WG[] = ["WINGO1", "WINGO3", "WINGO5", "WINGO10"];
const INTERVAL: Record<WG, number> = { WINGO1: 1, WINGO3: 3, WINGO5: 5, WINGO10: 10 };

export async function GET(req: Request) {
  // Allow cron secret OR admin auth
  const cronSecret = req.headers.get("x-cron-secret");
  const envSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret !== envSecret) {
    try { await requireAdmin(); } catch { return fail("Unauthorized", 401); }
  }

  const results: Record<string, unknown> = {};

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

        const result = selectHouseResult(pool);
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
            const userNow = await prisma.user.findUnique({ where: { id: b.userId }, select: { balance: true } });
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

        results[game] = { settled: expiredRound.period, result, colors, size, bets: expiredRound.bets.length };
      }

      // Open a new round if none exists
      const openRound = await prisma.wingoRound.findFirst({ where: { game, status: "open" } });
      if (!openRound) {
        const lastRound = await prisma.wingoRound.findFirst({ where: { game }, orderBy: { period: "desc" } });
        const nextPeriod = (lastRound?.period ?? 0) + 1;
        await prisma.wingoRound.create({ data: { game, period: nextPeriod, status: "open" } });
        results[`${game}_new`] = nextPeriod;
      }
    } catch (err) {
      results[`${game}_error`] = String(err);
    }
  }

  return ok({ results, ts: new Date().toISOString() });
}
