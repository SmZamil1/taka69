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
