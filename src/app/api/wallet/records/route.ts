import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "requests";
    const days = Math.min(90, Math.max(1, Number(searchParams.get("days") || 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (view === "bets") {
      const bets = await prisma.bet.findMany({ where: { userId: user.id, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, gameType: true, amount: true, payout: true, multiplier: true, won: true, createdAt: true } });
      return ok({ view, days, bets });
    }
    if (view === "money") {
      const transactions = await prisma.transaction.findMany({ where: { userId: user.id, createdAt: { gte: since }, type: { notIn: ["BET", "WIN", "WINGO_BET", "WINGO_WIN"] } }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, type: true, amount: true, balanceAfter: true, note: true, method: true, grossAmount: true, feeAmount: true, netAmount: true, reference: true, status: true, createdAt: true } });
      return ok({ view, days, transactions });
    }
    const requests = await prisma.walletRequest.findMany({ where: { userId: user.id, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, type: true, method: true, channel: true, amount: true, grossAmount: true, feeAmount: true, netAmount: true, status: true, trxId: true, providerRef: true, bonusAmount: true, note: true, adminNote: true, rejectionReason: true, processedAt: true, createdAt: true } });
    return ok({ view, days, requests });
  } catch (e) {
    return handleError(e);
  }
}
