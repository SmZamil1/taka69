import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const reports = [];

    for (let i = 0; i < 14; i++) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const [newUsers, bets, volume, payouts, deposits, withdraws] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.bet.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.bet.aggregate({ where: { createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
        prisma.bet.aggregate({ where: { createdAt: { gte: start, lte: end }, won: true }, _sum: { payout: true } }),
        prisma.walletRequest.aggregate({ where: { type: "DEPOSIT", status: "APPROVED", createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
        prisma.walletRequest.aggregate({ where: { type: "WITHDRAW", status: "APPROVED", createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
      ]);

      const vol = volume._sum.amount || 0;
      const pay = payouts._sum.payout || 0;
      reports.push({
        date: start.toISOString().split("T")[0],
        newUsers,
        deposits: deposits._sum.amount || 0,
        withdraws: withdraws._sum.amount || 0,
        bets,
        volume: vol,
        payouts: pay,
        profit: vol - pay,
      });
    }

    return ok({ reports });
  } catch (e) { return handleError(e); }
}
