import { requireStaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStaffPermission("dashboard");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [users, newUsersToday, bets, volume, wins, config,
           recentUsers, recentBets, pendingDeposits, pendingWithdraws, byGame] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.bet.count(),
      prisma.bet.aggregate({ _sum: { amount: true } }),
      prisma.bet.aggregate({ where: { won: true }, _sum: { payout: true } }),
      prisma.appConfig.findUnique({ where: { id: "main" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" }, take: 10,
        select: { id: true, username: true, balance: true, createdAt: true, role: true, isBanned: true, vipLevel: true },
      }),
      prisma.bet.findMany({
        orderBy: { createdAt: "desc" }, take: 15,
        include: { user: { select: { username: true } } },
      }),
      prisma.walletRequest.count({ where: { type: "DEPOSIT", status: "PENDING" } }),
      prisma.walletRequest.count({ where: { type: "WITHDRAW", status: "PENDING" } }),
      prisma.bet.groupBy({ by: ["gameType"], _count: true, _sum: { amount: true, payout: true } }),
    ]);

    return ok({
      users, newUsersToday, bets,
      volume: volume._sum.amount ?? 0,
      totalPayouts: wins._sum.payout ?? 0,
      jackpot: config?.jackpot ?? 0,
      maintenance: config?.maintenance ?? false,
      pendingDeposits, pendingWithdraws,
      byGame, recentUsers, recentBets,
    });
  } catch (e) { return handleError(e); }
}
