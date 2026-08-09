import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const rounds = await prisma.wingoRound.findMany({
      orderBy: { startedAt: "desc" },
      take: 100,
      include: { _count: { select: { bets: true } } },
    });
    return ok({ rounds });
  } catch (e) { return handleError(e); }
}
