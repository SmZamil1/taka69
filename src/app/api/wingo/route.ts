import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { checkWin, getMultiplier, calcPayout, selectHouseResult, WINGO_FEE, getColors, getSize } from "@/lib/wingo-engine";
import { addVipExp } from "@/lib/vip";
import { distributeCommission } from "@/lib/commission";

export const dynamic = "force-dynamic";

type WG = "WINGO1" | "WINGO3" | "WINGO5" | "WINGO10";
const INTERVAL: Record<WG, number> = { WINGO1: 1, WINGO3: 3, WINGO5: 5, WINGO10: 10 };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const game = (searchParams.get("game") || "WINGO1") as WG;

    // Lazy settle: if open round is past interval, settle it here (Hobby Vercel has no per-minute cron)
    {
      const intervalMs = INTERVAL[game] * 60 * 1000;
      const expired = await prisma.wingoRound.findFirst({
        where: { game, status: "open", startedAt: { lte: new Date(Date.now() - intervalMs) } },
        include: { bets: { where: { status: "pending" } } },
      });
      if (expired) {
        try {
          const { selectHouseResult, checkWin, getMultiplier, calcPayout, getColors, getSize } = await import("@/lib/wingo-engine");
          const pool: Record<string, number> = {};
          for (const b of expired.bets) pool[b.bet] = (pool[b.bet] || 0) + b.amount;
          // read less-win config
          let randomLessWin = true;
          let forceResult: number | null = null;
          try {
            const cfg = await prisma.appConfig.findUnique({ where: { id: "main" } });
            const w = ((cfg?.wingoConfig as Record<string, unknown>) || {}) as Record<string, unknown>;
            randomLessWin = w.randomLessWin !== false;
            if (typeof w.forceResult === "number") forceResult = w.forceResult as number;
          } catch { /* */ }
          const result = selectHouseResult(pool, { forceResult, randomLessWin });
          const colors = getColors(result);
          const size = getSize(result);
          for (const b of expired.bets) {
            const won = checkWin(b.bet, result);
            const mult = getMultiplier(b.bet);
            const payout = won ? calcPayout(b.amount, mult) : 0;
            await prisma.wingoBetRecord.update({ where: { id: b.id }, data: { won, payout, status: won ? "won" : "lost" } });
            if (won) {
              const userNow = await prisma.user.findUnique({ where: { id: b.userId }, select: { balance: true } });
              const newBal = (userNow?.balance ?? 0) + payout;
              await prisma.user.update({ where: { id: b.userId }, data: { balance: { increment: payout }, totalWin: { increment: payout } } });
              await prisma.transaction.create({
                data: {
                  userId: b.userId, type: "WINGO_WIN", amount: payout, balanceAfter: newBal,
                  note: `WinGo ${game} win — result ${result} (${colors.join("/")}, ${size})`,
                  meta: { roundId: expired.id, result, bet: b.bet, multiplier: mult },
                },
              });
            }
          }
          await prisma.wingoRound.update({ where: { id: expired.id }, data: { result, status: "closed", closedAt: new Date() } });
          // clear one-shot force
          try {
            const cfg = await prisma.appConfig.findUnique({ where: { id: "main" } });
            const w = { ...(((cfg?.wingoConfig as object) || {}) as object) } as Record<string, unknown>;
            if (w.forceOnce && typeof w.forceResult === "number") {
              w.forceResult = null; w.forceOnce = false;
              await prisma.appConfig.update({ where: { id: "main" }, data: { wingoConfig: w } });
            }
          } catch { /* */ }
        } catch (e) {
          console.error("[wingo lazy settle]", e);
        }
      }
    }

    // Auto-open a round if none (keeps WinGo always playing)
    let current = await prisma.wingoRound.findFirst({ where: { game, status: "open" }, orderBy: { period: "desc" } });
    if (!current) {
      const last = await prisma.wingoRound.findFirst({ where: { game }, orderBy: { period: "desc" } });
      current = await prisma.wingoRound.create({
        data: { game, period: (last?.period ?? 0) + 1, status: "open" },
      });
    }

    const history = await prisma.wingoRound.findMany({
      where: { game, status: "closed" },
      orderBy: { period: "desc" },
      take: 20,
      select: { id: true, period: true, result: true, closedAt: true },
    });

    const now = new Date();
    const interval = INTERVAL[game] * 60 * 1000;
    const elapsed = current ? now.getTime() - current.startedAt.getTime() : 0;
    const remaining = Math.max(0, interval - elapsed - 5000);

    const historyFormatted = history.map((r) => ({
      period: r.period,
      result: r.result,
      colors: r.result !== null ? getColors(r.result) : [],
      size: r.result !== null ? getSize(r.result) : null,
      closedAt: r.closedAt,
    }));

    return ok({
      current: current
        ? { id: current.id, period: current.period, startedAt: current.startedAt, remainingMs: remaining }
        : null,
      history: historyFormatted,
    });
  } catch (e) { return handleError(e); }
}

const betSchema = z.object({
  game: z.enum(["WINGO1", "WINGO3", "WINGO5", "WINGO10"]),
  bet: z.string().regex(/^([0-9]|red|green|violet|big|small)$/),
  amount: z.number().min(10).max(100000),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.isBanned) return fail("Account banned");

    const body = betSchema.parse(await req.json());
    const { game, bet, amount } = body;

    const round = await prisma.wingoRound.findFirst({
      where: { game, status: "open" },
      orderBy: { period: "desc" },
    });
    if (!round) return fail("No open round — please wait");

    const elapsed = Date.now() - round.startedAt.getTime();
    const total = INTERVAL[game] * 60 * 1000;
    if (elapsed > total - 5000) return fail("Betting is closed for this round");

    const fee = parseFloat((amount * WINGO_FEE).toFixed(2));
    const charged = parseFloat((amount + fee).toFixed(2));
    if (user.balance < charged) return fail("Insufficient balance");

    // Deduct balance
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: charged }, totalBet: { increment: amount } },
    });

    const betRecord = await prisma.wingoBetRecord.create({
      data: { userId: user.id, roundId: round.id, game, bet, amount, fee, status: "pending" },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WINGO_BET",
        amount: -charged,
        balanceAfter: user.balance - charged,
        note: `WinGo ${game} — bet ${bet} · ${amount} TK`,
        meta: { roundId: round.id, bet, amount, fee },
      },
    });

    await addVipExp(user.id, amount);
    await distributeCommission(user.id, amount, "bet");

    return ok({ bet: betRecord, charged, fee });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
