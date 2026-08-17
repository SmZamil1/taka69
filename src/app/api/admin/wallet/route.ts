import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { notifyUser } from "@/lib/notify";
import { distributeCommission } from "@/lib/commission";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "DEPOSIT";
    const status = searchParams.get("status") || "PENDING";

    const requests = await prisma.walletRequest.findMany({
      where: {
        type: type as "DEPOSIT" | "WITHDRAW",
        ...(status !== "ALL" ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, username: true, balance: true } } },
    });

    return ok({ requests });
  } catch (e) { return handleError(e); }
}

const actionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  adminNote: z.string().optional(),
  rejectionReason: z.string().max(500).optional(),
  providerRef: z.string().max(120).optional(),
  bonusAmount: z.number().min(0).optional(),
});

function readHeldAmount(meta: unknown, fallback: number) {
  if (!meta || typeof meta !== "object") return fallback;
  const value = Number((meta as Record<string, unknown>).holdAmount);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = actionSchema.parse(await req.json());
    const { id, action, adminNote, rejectionReason, providerRef, bonusAmount = 0 } = body;

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.walletRequest.findUnique({ where: { id } });
      if (!request) throw new Error("Request not found");
      if (request.status !== "PENDING") throw new Error("Already processed");

      if (action === "approve") {
        if (request.type === "DEPOSIT") {
          const totalCredit = request.amount + bonusAmount;
          const updated = await tx.user.updateMany({
            where: { id: request.userId },
            data: { balance: { increment: totalCredit }, totalDeposit: { increment: request.amount } },
          });
          if (updated.count !== 1) throw new Error("User account not found");
          const userNow = await tx.user.findUniqueOrThrow({ where: { id: request.userId }, select: { balance: true } });

          await tx.walletRequest.update({
            where: { id, status: "PENDING" },
            data: { status: "APPROVED", adminNote: adminNote || null, bonusAmount, providerRef: providerRef || null, processedBy: admin.id, processedAt: new Date(), settledAt: new Date() },
          });
          await tx.transaction.create({
            data: {
              userId: request.userId,
              type: "DEPOSIT",
              amount: totalCredit,
              balanceAfter: userNow.balance,
              walletRequestId: id,
              method: request.method,
              grossAmount: request.amount,
              feeAmount: 0,
              netAmount: totalCredit,
              adminId: admin.id,
              reference: providerRef || request.trxId || id,
              status: "SETTLED",
              note: `Deposit approved via ${request.method}${bonusAmount > 0 ? ` + ${bonusAmount} TK bonus` : ""}`,
              meta: { requestId: id, method: request.method, adminId: admin.id },
            },
          });

          return { request, username: "", totalCredit, balance: userNow.balance };
        }

        // The original request creation already debited WITHDRAW_HOLD. This final
        // entry records settlement without debiting the user's balance a second time.
        await tx.walletRequest.update({
          where: { id, status: "PENDING" },
          data: { status: "APPROVED", adminNote: adminNote || null, providerRef: providerRef || null, processedBy: admin.id, processedAt: new Date(), settledAt: new Date() },
        });
        const userNow = await tx.user.findUniqueOrThrow({ where: { id: request.userId }, select: { balance: true, username: true } });
        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: "WITHDRAW",
            amount: 0,
            balanceAfter: userNow.balance,
            walletRequestId: id,
            method: request.method,
            grossAmount: request.grossAmount || request.amount,
            feeAmount: request.feeAmount,
            netAmount: request.netAmount || request.amount,
            adminId: admin.id,
            reference: providerRef || request.providerRef || id,
            status: "SETTLED",
            note: `Withdrawal settled via ${request.method}; amount already held`,
            meta: { requestId: id, method: request.method, payoutAmount: request.amount, adminId: admin.id },
          },
        });
        return { request, username: userNow.username, totalCredit: 0, balance: userNow.balance };
      }

      let balance = 0;
      let username = "";
      let refundAmount = 0;
      if (request.type === "WITHDRAW") {
        const hold = await tx.transaction.findFirst({
          where: { userId: request.userId, type: "WITHDRAW_HOLD", meta: { path: ["requestId"], equals: id } },
          orderBy: { createdAt: "desc" },
          select: { amount: true, meta: true },
        });
        refundAmount = readHeldAmount(hold?.meta, Math.abs(hold?.amount ?? request.amount));
        const updated = await tx.user.updateMany({
          where: { id: request.userId },
          data: { balance: { increment: refundAmount } },
        });
        if (updated.count !== 1) throw new Error("User account not found");
        const userNow = await tx.user.findUniqueOrThrow({ where: { id: request.userId }, select: { balance: true, username: true } });
        balance = userNow.balance;
        username = userNow.username;
      } else {
        const userNow = await tx.user.findUniqueOrThrow({ where: { id: request.userId }, select: { balance: true, username: true } });
        balance = userNow.balance;
        username = userNow.username;
      }

      await tx.walletRequest.update({
        where: { id, status: "PENDING" },
        data: { status: "REJECTED", adminNote: adminNote || rejectionReason || "Rejected by admin", rejectionReason: rejectionReason || adminNote || "Rejected by admin", providerRef: providerRef || null, processedBy: admin.id, processedAt: new Date() },
      });

      if (request.type === "WITHDRAW") {
        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: "WITHDRAW_REFUND",
            amount: refundAmount,
            balanceAfter: balance,
            walletRequestId: id,
            method: request.method,
            grossAmount: refundAmount,
            feeAmount: 0,
            netAmount: refundAmount,
            adminId: admin.id,
            reference: id,
            status: "REFUNDED",
            note: `Withdraw rejected - ${refundAmount.toFixed(2)} TK hold refunded`,
            meta: { requestId: id, refundAmount, adminId: admin.id },
          },
        });
      }

      return { request, username, totalCredit: 0, balance, refundAmount };
    });

    if (result.request.type === "DEPOSIT" && action === "approve") {
      await distributeCommission(result.request.userId, result.request.amount, "deposit").catch(() => {});
      await notifyUser(result.request.userId, {
        titleEn: "Deposit Approved ✓",
        titleBn: "ডিপোজিট অনুমোদিত ✓",
        bodyEn: `${result.request.amount} TK deposited${bonusAmount > 0 ? ` + ${bonusAmount} TK bonus` : ""}.`,
        bodyBn: `${result.request.amount} TK জমা হয়েছে${bonusAmount > 0 ? ` + ${bonusAmount} TK বোনাস` : ""}।`,
        href: "/wallet",
      }).catch(() => {});
    } else if (result.request.type === "WITHDRAW" && action === "approve") {
      await notifyUser(result.request.userId, {
        titleEn: "Withdrawal Approved ✓",
        titleBn: "উইথড্র অনুমোদিত ✓",
        bodyEn: `${result.request.amount} TK withdrawal approved via ${result.request.method}.`,
        bodyBn: `${result.request.amount} TK উইথড্র অনুমোদিত হয়েছে।`,
        href: "/wallet",
      }).catch(() => {});
    } else {
      await notifyUser(result.request.userId, {
        titleEn: "Request Rejected",
        titleBn: "রিকোয়েস্ট প্রত্যাখ্যাত",
        bodyEn: `Your ${result.request.type.toLowerCase()} of ${result.request.amount} TK was rejected. ${rejectionReason || adminNote || ""}`,
        bodyBn: `আপনার ${result.request.amount} TK ${result.request.type === "DEPOSIT" ? "ডিপোজিট" : "উইথড্র"} প্রত্যাখ্যাত হয়েছে।`,
        href: "/wallet",
      }).catch(() => {});
    }

    return ok({ processed: true, action, balance: result.balance, refundAmount: result.refundAmount || 0 });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    if (e instanceof Error && (e.message === "Request not found" || e.message === "Already processed")) return fail(e.message, e.message === "Request not found" ? 404 : 409);
    return handleError(e);
  }
}
