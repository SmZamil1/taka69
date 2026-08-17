import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();

    const [transactions, bets] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true, type: true, amount: true,
          balanceAfter: true, note: true, method: true, grossAmount: true,
          feeAmount: true, netAmount: true, reference: true, status: true, createdAt: true,
        },
      }),
      prisma.bet.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, gameType: true, amount: true,
          payout: true, multiplier: true, won: true, createdAt: true,
        },
      }),
    ]);

    return ok({ transactions, bets, balance: user.balance });
  } catch (e) { return handleError(e); }
}
