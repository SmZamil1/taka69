import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const grouped = await prisma.user.groupBy({
      by: ["vipLevel"],
      _count: true,
      _sum: { balance: true, totalBet: true },
    });
    const stats = grouped.map(g => ({
      level: g.vipLevel,
      count: g._count,
      totalBalance: g._sum.balance ?? 0,
      totalBet: g._sum.totalBet ?? 0,
    }));
    return ok({ stats });
  } catch (e) { return handleError(e); }
}
