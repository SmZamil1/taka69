import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    const topBalance = await prisma.user.findMany({
      where: { isBanned: false, role: "USER" },
      orderBy: { balance: "desc" },
      take: 20,
      select: { username: true, balance: true, avatar: true },
    });

    const topWinners = await prisma.bet.groupBy({
      by: ["userId"],
      where: { won: true },
      _sum: { payout: true },
      orderBy: { _sum: { payout: "desc" } },
      take: 20,
    });

    const users = await prisma.user.findMany({
      where: { id: { in: topWinners.map((t) => t.userId) } },
      select: { id: true, username: true, avatar: true },
    });
    const umap = Object.fromEntries(users.map((u) => [u.id, u]));

    return ok({
      topBalance,
      topWinners: topWinners.map((t) => ({
        username: umap[t.userId]?.username || "?",
        avatar: umap[t.userId]?.avatar,
        totalWon: t._sum.payout || 0,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
