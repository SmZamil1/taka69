import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shouldForceHouseLoss } from "@/lib/house-rule";
import { ok, fail, handleError } from "@/lib/api";
import { addVipExp } from "@/lib/vip";
import { distributeCommission } from "@/lib/commission";
import { mergeGameConfig } from "@/lib/game-config";

export const dynamic = "force-dynamic";

const schema = z.object({
  numbers: z.array(z.number().int().min(1).max(40)).min(1).max(10),
  amount: z.number().min(10).max(10000),
});

/** Reduced payout table — house-favored vs classic keno */
const PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 2.4 },
  2: { 2: 6.5 },
  3: { 2: 1.2, 3: 18 },
  4: { 2: 1.05, 3: 2.4, 4: 45 },
  5: { 3: 1.4, 4: 5.5, 5: 120 },
  6: { 3: 1.1, 4: 2.4, 5: 16, 6: 280 },
  7: { 4: 1.6, 5: 7, 6: 28, 7: 700 },
  8: { 4: 1.2, 5: 3.5, 6: 14, 7: 90, 8: 1400 },
  9: { 5: 2.0, 6: 7, 7: 28, 8: 180, 9: 2800 },
  10: { 5: 1.4, 6: 3.5, 7: 14, 8: 90, 9: 700, 10: 5000 },
};

function getMultiplier(picked: number, matched: number): number {
  const row = PAYOUTS[picked];
  if (!row) return 0;
  const keys = Object.keys(row)
    .map(Number)
    .sort((a, b) => b - a);
  for (const k of keys) {
    if (matched >= k) return row[k];
  }
  return 0;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const __hr = await shouldForceHouseLoss();
    const __forceHouse = __hr.force;
    if (user.isBanned) return fail("Account banned");
    const body = schema.parse(await req.json());
    const { numbers, amount } = body;
    if (user.balance < amount) return fail("Insufficient balance");

    const cfgRow = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const gcfg = mergeGameConfig(cfgRow?.gameConfig);
    // keno uses dice-like edge if no dedicated key
    const edge =
      (gcfg as Record<string, { houseEdge?: number }>).keno?.houseEdge ??
      gcfg.dice?.houseEdge ??
      0.12;

    // Draw 20 from 1-40
    const pool = Array.from({ length: 40 }, (_, i) => i + 1);
    const drawn: number[] = [];
    while (drawn.length < 20) {
      const idx = Math.floor(Math.random() * pool.length);
      drawn.push(pool.splice(idx, 1)[0]);
    }

    let matched = numbers.filter((n) => drawn.includes(n)).length;

    // Force fewer matches under house pressure / edge
    if (__forceHouse && matched > 0) {
      matched = Math.max(0, matched - 1 - Math.floor(Math.random() * 2));
    } else if (Math.random() < edge && matched > 0) {
      // occasionally shave a match so prizes hit less often
      matched = Math.max(0, matched - 1);
    }

    let mult = getMultiplier(numbers.length, matched);
    // apply edge as payout haircut
    if (mult > 0) mult = Math.max(0, parseFloat((mult * (1 - edge * 0.35)).toFixed(2)));

    const payout = mult > 0 ? parseFloat((amount * mult).toFixed(2)) : 0;
    // net change: -stake + payout
    const profit = payout - amount;

    const userNow = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });
    const newBal = (userNow?.balance ?? 0) + profit;
    if (newBal < 0) return fail("Insufficient balance");

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

    return ok({
      drawn,
      matched,
      multiplier: mult,
      payout,
      balance: newBal,
      won: payout > 0,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
