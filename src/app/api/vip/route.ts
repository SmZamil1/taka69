import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { VIP_LEVELS, claimVipDailyBonus } from "@/lib/vip";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { vipLevel: true, vipExp: true, totalBet: true, totalDeposit: true, lastDailyAt: true },
    });
    if (!full) return fail("Not found", 404);

    const currentLevel = VIP_LEVELS[full.vipLevel] ?? VIP_LEVELS[0];
    const nextLevel = VIP_LEVELS[full.vipLevel + 1] ?? null;
    const expProgress = nextLevel
      ? ((full.vipExp - currentLevel.minExp) / (nextLevel.minExp - currentLevel.minExp)) * 100
      : 100;

    const canClaimDaily =
      !full.lastDailyAt ||
      Date.now() - full.lastDailyAt.getTime() >= 20 * 60 * 60 * 1000;

    return ok({
      vipLevel: full.vipLevel,
      vipExp: full.vipExp,
      expProgress: Math.min(100, parseFloat(expProgress.toFixed(1))),
      currentLevel,
      nextLevel,
      canClaimDaily,
      levels: VIP_LEVELS,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));

    if (body.action === "claim_daily") {
      const result = await claimVipDailyBonus(user.id);
      return ok(result);
    }

    return fail("Unknown action");
  } catch (e) {
    return handleError(e);
  }
}
