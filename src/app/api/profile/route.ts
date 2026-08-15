import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        balance: true,
        vipLevel: true,
        vipExp: true,
        totalDeposit: true,
        totalBet: true,
        totalWin: true,
        totalCommission: true,
        referralCode: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    return ok(user);
  } catch (e) {
    return handleError(e);
  }
}
