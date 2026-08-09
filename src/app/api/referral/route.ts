import { requireUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { getReferralStats } from "@/lib/commission";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true, totalCommission: true },
    });
    if (!full) return fail("Not found");

    const stats = await getReferralStats(user.id);
    return ok({
      referralCode: full.referralCode,
      referralLink: `${process.env.NEXT_PUBLIC_URL || ""}/register?ref=${full.referralCode}`,
      totalCommission: full.totalCommission,
      ...stats,
    });
  } catch (e) {
    return handleError(e);
  }
}
