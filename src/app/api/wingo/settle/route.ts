import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { selectHouseResult, checkWin, getMultiplier, calcPayout, getColors, getSize } from "@/lib/wingo-engine";

export const dynamic = "force-dynamic";

type WG = "WINGO1" | "WINGO3" | "WINGO5" | "WINGO10";
const GAMES: WG[] = ["WINGO1", "WINGO3", "WINGO5", "WINGO10"];
const INTERVAL: Record<WG, number> = { WINGO1: 1, WINGO3: 3, WINGO5: 5, WINGO10: 10 };

/**
 * GET /api/wingo/settle — called by Vercel cron every minute
 * Settles expired rounds and opens new ones.
 */
export async function GET(req: Request) {
  // Allow cron secret OR admin auth
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    try { await requireAdmin(); } catch { return fail("Unauthorized", 401); }
  }

  const results: Record<string, unknown> = {};

  for (const game of GAMES) {
    try {
      const interval = INTERVAL[game] * 60 * 1000;
      const now = new Date();

      // Find open round past its end time
      const expiredRound = await prisma.wingoRound.findFirst({
        where: {
          game,
          status: "open",
          startedAt: { lte: new Date(now.getTime() - interval) },
        },
        include: { bets: { where: { status: "pending" } } },
      });

      if (expiredRound) {
        // Build bet pool
        const pool: Record<string, number> = {};
        for (const b of expiredRound.bets) {
          pool[b.bet] = (pool[b.bet] || 0) + b.amount;
        }

        // House-edge result selection
        const result = selectHouseResult(pool);
        const colors = getColors(result);
        const size = getSize(result);

        // Settle all bets
        let totalPayout = 0;
        for (const b of expiredRound.bets) {
          const won = checkWin(b.bet, result);
          const mult = getMultiplier(b.bet);
          const payout = won ? calcPayout(b.amount, mult) : 0;
          totalPayout += payout;

          await prisma.$transaction([
            prisma.wingoBetRecord.update({
              where: { id: b.id },
              data: { won, payout, status: won ? "won" : "lost" },
            }),
            ...(won
              ? [
                  prisma.user.update({
                    where: { id: b.userId },
                    data: { balance: { increment: payout }, totalWin: { increment: payout } },
                  }),
                  prisma.transaction.create({
                    data: {
                      userId: b.userId,
                      type: "WINGO_WIN",
                      amount: payout,
                      balanceAfter: 0, // approximation; real balance set above
                      note: `WinGo ${game} win — result ${result} (${colors.join("/")}, ${size})`,
                      meta: { roundId: expiredRound.id, result, bet: b.bet, multiplier: mult },
                    },
                  }),
                ]
              : []),
          ]);
        }

        // Close round + set result
        await prisma.wingoRound.update({
          where: { id: expiredRound.id },
          data: { result, status: "closed", closedAt: now },
        });

        results[game] = { settled: expiredRound.period, result, colors, size, totalPayout, bets: expiredRound.bets.length };
      }

      // Open a new round if none open
      const openRound = await prisma.wingoRound.findFirst({
        where: { game, status: "open" },
      });

      if (!openRound) {
        const lastRound = await prisma.wingoRound.findFirst({
          where: { game },
          orderBy: { period: "desc" },
        });
        const nextPeriod = (lastRound?.period ?? 0) + 1;
        await prisma.wingoRound.create({
          data: { game, period: nextPeriod, status: "open" },
        });
        results[`${game}_new_period`] = nextPeriod;
      }
    } catch (err) {
      results[`${game}_error`] = String(err);
    }
  }

  return ok({ results, ts: new Date().toISOString() });
}
