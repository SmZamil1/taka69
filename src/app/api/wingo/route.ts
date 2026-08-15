import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { WINGO_FEE, getColors, getSize, tickWingoGame, tickAllWingo, wingoIntervalMs, ensureWingoOpenRound, type WingoGameKey } from "@/lib/wingo-engine";
import { addVipExp } from "@/lib/vip";
import { distributeCommission } from "@/lib/commission";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const game = (searchParams.get("game") || "WINGO1") as WingoGameKey;
    // Keep ALL intervals live globally on every poll (no cron required)
    try {
      await tickAllWingo(prisma);
    } catch (e) {
      console.error("[wingo tickAll]", e);
      try {
        await tickWingoGame(prisma, game);
      } catch (e2) {
        console.error("[wingo tick]", e2);
      }
    }

    const current = await ensureWingoOpenRound(prisma, game);

    const history = await prisma.wingoRound.findMany({
      where: { game, status: "closed" },
      orderBy: { period: "desc" },
      take: 20,
      select: { id: true, period: true, result: true, closedAt: true },
    });

    const now = new Date();
    const interval = wingoIntervalMs(game);
    const elapsed = now.getTime() - current.startedAt.getTime();
    // last 5s of interval = betting closed buffer
    const remaining = Math.max(0, interval - elapsed - 5000);

    const historyFormatted = history.map((r) => ({
      period: r.period,
      result: r.result,
      colors: r.result !== null ? getColors(r.result) : [],
      size: r.result !== null ? getSize(r.result) : null,
      closedAt: r.closedAt,
    }));

    return ok({
      current: {
        id: current.id,
        period: current.period,
        startedAt: current.startedAt,
        remainingMs: remaining,
        intervalMs: interval,
      },
      history: historyFormatted,
    });
  } catch (e) {
    return handleError(e);
  }
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

    // always ensure a live open round before accepting bets
    try {
      await tickWingoGame(prisma, game as WingoGameKey);
    } catch {
      /* */
    }
    const round = await ensureWingoOpenRound(prisma, game as WingoGameKey);
    if (!round) return fail("No open round — please wait");

    const elapsed = Date.now() - round.startedAt.getTime();
    const total = wingoIntervalMs(game as WingoGameKey);
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
