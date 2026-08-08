import { prisma } from "./db";
import type { TxType, Prisma } from "@prisma/client";

export async function adjustBalance(
  userId: string,
  amount: number,
  type: TxType,
  note?: string,
  meta?: Prisma.InputJsonValue
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    const next = user.balance + amount;
    if (next < -0.0001) throw new Error("Insufficient balance");
    const updated = await tx.user.update({
      where: { id: userId },
      data: { balance: Math.round(next * 100) / 100 },
    });
    await tx.transaction.create({
      data: {
        userId,
        type,
        amount,
        balanceAfter: updated.balance,
        note,
        meta: meta ?? undefined,
      },
    });
    return updated;
  });
}

export async function placeBet(userId: string, amount: number, note?: string) {
  if (amount <= 0) throw new Error("Invalid bet amount");
  return adjustBalance(userId, -amount, "BET", note);
}

export async function creditWin(userId: string, amount: number, note?: string, meta?: Prisma.InputJsonValue) {
  if (amount <= 0) return prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return adjustBalance(userId, amount, "WIN", note, meta);
}
