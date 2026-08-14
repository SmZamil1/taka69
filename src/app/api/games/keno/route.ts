import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { addVipExp } from "@/lib/vip";
import { distributeCommission } from "@/lib/commission";

export const dynamic = "force-dynamic";

const schema = z.object({
  numbers: z.array(z.number().int().min(1).max(40)).min(1).max(10),
  amount: z.number().min(10).max(10000),
});

const PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3.7 }, 2: { 2: 13 }, 3: { 2: 1.8, 3: 45 },
  4: { 2: 1.4, 3: 4.5, 4: 140 }, 5: { 3: 2.2, 4: 13, 5: 470 },
  6: { 3: 1.4, 4: 4.5, 5: 45, 6: 1400 }, 7: { 4: 2.8, 5: 18, 6: 90, 7: 4500 },
  8: { 4: 1.8, 5: 9, 6: 45, 7: 450, 8: 9000 },
  9: { 5: 4.5, 6: 18, 7: 90, 8: 900, 9: 22000 },
  10: { 5: 2.8, 6: 9, 7: 45, 8: 450, 9: 4500, 10: 45000 },
};

function getMultiplier(picked: number, matched: number): number {
  const row = PAYOUTS[picked];
  if (!row) return 0;
  const keys = Object.keys(row).map(Number).sort((a, b) => b - a);
  for (const k of keys) { if (matched >= k) return row[k]; }
  return 0;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.isBanned) return fail("Account banned");
    const body = schema.parse(await req.json());
    const { numbers, amount } = body;
    if (user.balance < amount) return fail("Insufficient balance");

    // Draw 20 from 1-40
    const pool = Array.from({ length: 40 }, (_, i) => i + 1);
    const drawn: number[] = [];
    while (drawn.length < 20) {
      const idx = Math.floor(Math.random() * pool.length);
      drawn.push(pool.splice(idx, 1)[0]);
    }

    const matched = numbers.filter(n => drawn.includes(n)).length;
    const mult = getMultiplier(numbers.length, matched);
    const payout = mult > 0 ? parseFloat((amount * mult).toFixed(2)) : 0;
    const profit = payout - amount;

    const userNow = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });
    const newBal = (userNow?.balance ?? 0) + profit;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: { increment: profit },
        totalBet: { increment: amount },
        ...(payout > 0 ? { totalWin: { increment: payout } } : {}),
      },
    });
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: payout > 0 ? "WIN" : "BET",
        amount: profit,
        balanceAfter: newBal,
        note: `Keno: ${numbers.length} pick, ${matched} match, ${mult}x`,
        meta: { numbers, drawn, matched, multiplier: mult },
      },
    });

    await addVipExp(user.id, amount);
    await distributeCommission(user.id, amount, "bet");

    return ok({ drawn, matched, multiplier: mult, payout, won: payout > 0 });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
