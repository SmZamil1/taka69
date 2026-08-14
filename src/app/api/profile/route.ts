import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        totalDeposit: true, totalBet: true, totalWin: true,
        totalCommission: true, referralCode: true, vipLevel: true, vipExp: true,
      },
    });
    return ok(full ?? {});
  } catch (e) { return handleError(e); }
}
