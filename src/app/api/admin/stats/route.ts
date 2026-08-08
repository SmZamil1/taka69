import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const [users, bets, volume, wins, config, recentUsers, recentBets] =
      await Promise.all([
        prisma.user.count(),
        prisma.bet.count(),
        prisma.bet.aggregate({ _sum: { amount: true } }),
        prisma.bet.aggregate({ where: { won: true }, _sum: { payout: true } }),
        prisma.appConfig.findUnique({ where: { id: "main" } }),
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            username: true,
            balance: true,
            createdAt: true,
            role: true,
            isBanned: true,
          },
        }),
        prisma.bet.findMany({
          orderBy: { createdAt: "desc" },
          take: 15,
          include: { user: { select: { username: true } } },
        }),
      ]);

    const byGame = await prisma.bet.groupBy({
      by: ["gameType"],
      _count: true,
      _sum: { amount: true, payout: true },
    });

    return ok({
      users,
      bets,
      volume: volume._sum.amount || 0,
      totalPayouts: wins._sum.payout || 0,
      jackpot: config?.jackpot ?? 0,
      maintenance: config?.maintenance ?? false,
      byGame,
      recentUsers,
      recentBets,
    });
  } catch (e) {
    return handleError(e);
  }
}
