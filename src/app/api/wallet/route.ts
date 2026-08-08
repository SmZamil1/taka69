import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustBalance } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

const DAILY_BONUS = 500;

const MONEY_TYPES = [
  "DEPOSIT",
  "WITHDRAW",
  "DEPOSIT_BONUS",
  "WITHDRAW_HOLD",
  "WITHDRAW_REFUND",
  "ADMIN_ADJUST",
  "REFERRAL_BONUS",
  "DAILY_BONUS",
  "VIP_BONUS",
  "CASHBACK",
  "CLAIM_REWARD",
  "MISSION_REWARD",
  "REFUND",
] as const;

const BET_TYPES = ["BET", "WIN"] as const;

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all"; // all | bets | money | deposits | withdraws

    let typeFilter: string[] | undefined;
    if (tab === "bets") typeFilter = [...BET_TYPES];
    else if (tab === "money") typeFilter = [...MONEY_TYPES];
    else if (tab === "deposits") typeFilter = ["DEPOSIT", "DEPOSIT_BONUS"];
    else if (tab === "withdraws") typeFilter = ["WITHDRAW", "WITHDRAW_HOLD", "WITHDRAW_REFUND"];

    const txs = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...(typeFilter ? { type: { in: typeFilter as never } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    const bets = await prisma.bet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const requests = await prisma.walletRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    return ok({
      balance: user.balance,
      currency: "TK",
      transactions: txs,
      bets,
      requests,
    });
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
    return ok({ balance: updated.balance, bonus: DAILY_BONUS, currency: "TK" });
  } catch (e) {
    return handleError(e);
  }
}
