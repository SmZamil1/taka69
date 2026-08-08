import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustBalance } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

const DAILY_BONUS = 500;

export async function GET() {
  try {
    const user = await requireUser();
    const txs = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok({ balance: user.balance, transactions: txs });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    if (body.action !== "daily") return fail("Unknown action");

    const now = new Date();
    if (user.lastDailyAt) {
      const last = new Date(user.lastDailyAt);
      const sameDay =
        last.getUTCFullYear() === now.getUTCFullYear() &&
        last.getUTCMonth() === now.getUTCMonth() &&
        last.getUTCDate() === now.getUTCDate();
      if (sameDay) return fail("Daily bonus already claimed today", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastDailyAt: now },
    });
    const updated = await adjustBalance(
      user.id,
      DAILY_BONUS,
      "DAILY_BONUS",
      "Daily login bonus"
    );
    return ok({ balance: updated.balance, bonus: DAILY_BONUS });
  } catch (e) {
    return handleError(e);
  }
}
