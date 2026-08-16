import { prisma } from "./db";
import type { Prisma, TxType } from "@prisma/client";

export function normalizeWalletAmount(amount: number) {
  if (!Number.isFinite(amount)) throw new Error("Invalid amount");
  const rounded = Math.round(amount * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export async function normalizeUserBalance(tx: Prisma.TransactionClient, userId: string) {
  const current = await tx.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });
  if (!current) throw new Error("User not found");

  const balance = normalizeWalletAmount(current.balance);
  if (balance === current.balance) return balance;

  const normalized = await tx.user.update({
    where: { id: userId },
    data: { balance },
    select: { balance: true },
  });
  return normalized.balance;
}

export async function adjustBalance(
  userId: string,
  amount: number,
  type: TxType,
  note?: string,
  meta?: Prisma.InputJsonValue
) {
  const normalizedAmount = normalizeWalletAmount(amount);
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedCount = await tx.user.updateMany({
      where: {
        id: userId,
        ...(normalizedAmount < 0 ? { balance: { gte: -normalizedAmount } } : {}),
      },
      data: {
        balance: normalizedAmount < 0
          ? { decrement: -normalizedAmount }
          : { increment: normalizedAmount },
      },
    });

    if (updatedCount.count !== 1) {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new Error("User not found");
      throw new Error("Insufficient balance");
    }

    const balanceAfter = await normalizeUserBalance(tx, userId);
    await tx.transaction.create({
      data: {
        userId,
        type,
        amount: normalizedAmount,
        balanceAfter,
        note,
        meta: meta ?? undefined,
      },
    });

    return tx.user.findUniqueOrThrow({ where: { id: userId } });
  });
}

export async function placeBet(userId: string, amount: number, note?: string) {
  const normalizedAmount = normalizeWalletAmount(amount);
  if (normalizedAmount <= 0) throw new Error("Invalid bet amount");
  return adjustBalance(userId, -normalizedAmount, "BET", note);
}

export async function creditWin(userId: string, amount: number, note?: string, meta?: Prisma.InputJsonValue) {
  const normalizedAmount = normalizeWalletAmount(amount);
  if (normalizedAmount <= 0) return prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return adjustBalance(userId, normalizedAmount, "WIN", note, meta);
}
