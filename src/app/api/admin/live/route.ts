import { requireStaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Live visitors + pending alerts for admin control center */
export async function GET() {
  try {
    await requireStaffPermission("dashboard");
    const since = new Date(Date.now() - 45_000);
    const [online, presence, pendingDeposits, pendingWithdraws, openSupport] =
      await Promise.all([
        prisma.userPresence.count({ where: { lastSeen: { gte: since } } }),
        prisma.userPresence.findMany({
          where: { lastSeen: { gte: since } },
          orderBy: { lastSeen: "desc" },
          take: 40,
          include: {
            user: { select: { id: true, username: true, role: true, balance: true } },
          },
        }),
        prisma.walletRequest.count({ where: { type: "DEPOSIT", status: "PENDING" } }),
        prisma.walletRequest.count({ where: { type: "WITHDRAW", status: "PENDING" } }),
        prisma.chatMessage.groupBy({
          by: ["userId"],
          where: { sender: "USER", read: false },
          _count: true,
        }),
      ]);

    return ok({
      online,
      visitors: presence.map((p) => ({
        userId: p.userId,
        username: p.user.username,
        role: p.user.role,
        balance: p.user.balance,
        path: p.path,
        lastSeen: p.lastSeen,
      })),
      pendingDeposits,
      pendingWithdraws,
      openSupportThreads: openSupport.length,
    });
  } catch (e) {
    return handleError(e);
  }
}
