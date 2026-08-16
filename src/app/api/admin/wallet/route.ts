import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { notifyUser } from "@/lib/notify";
import { distributeCommission } from "@/lib/commission";
import { normalizeUserBalance, normalizeWalletAmount } from "@/lib/wallet";

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
  bonusAmount: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = actionSchema.parse(await req.json());
    const { id, action, adminNote } = body;
    const bonusAmount = normalizeWalletAmount(body.bonusAmount ?? 0);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const request = await tx.walletRequest.findUnique({ where: { id } });
      if (!request) return { kind: "NOT_FOUND" as const };

      // Claim the pending request and apply all related mutations in one transaction.
      // Only one concurrent approval/rejection can update this row from PENDING.
      const claimed = await tx.walletRequest.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: action === "approve" ? "APPROVED" : "REJECTED",
          adminNote: action === "approve" ? adminNote || null : adminNote || "Rejected by admin",
          bonusAmount: action === "approve" && request.type === "DEPOSIT" ? bonusAmount : 0,
          processedBy: admin.id,
          amount: normalizeWalletAmount(request.amount),
        },
      });
      if (claimed.count !== 1) return { kind: "ALREADY" as const };

      const requestAmount = normalizeWalletAmount(request.amount);
      if (action === "approve" && request.type === "DEPOSIT") {
        const totalCredit = normalizeWalletAmount(requestAmount + bonusAmount);
        const updatedUser = await tx.user.updateMany({
          where: { id: request.userId },
          data: {
            balance: { increment: totalCredit },
            totalDeposit: { increment: requestAmount },
          },
        });
        if (updatedUser.count !== 1) throw new Error("User not found");

        const balanceAfter = await normalizeUserBalance(tx, request.userId);
        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: "DEPOSIT",
            amount: totalCredit,
            balanceAfter,
            note: `Deposit approved via ${request.method}${bonusAmount > 0 ? ` + ${bonusAmount} TK bonus` : ""}`,
            meta: { requestId: id, method: request.method, adminId: admin.id },
          },
        });

        return { kind: "PROCESSED" as const, request, requestAmount, totalCredit };
      }

      if (action === "reject" && request.type === "WITHDRAW") {
        const refunded = await tx.user.updateMany({
          where: { id: request.userId },
          data: { balance: { increment: requestAmount } },
        });
        if (refunded.count !== 1) throw new Error("User not found");

        const balanceAfter = await normalizeUserBalance(tx, request.userId);
        await tx.transaction.create({
          data: {
            userId: request.userId,
            type: "WITHDRAW_REFUND",
            amount: requestAmount,
            balanceAfter,
            note: "Withdraw rejected — balance refunded",
            meta: { requestId: id },
          },
        });
      }

      return { kind: "PROCESSED" as const, request, requestAmount, totalCredit: 0 };
    });

    if (result.kind === "NOT_FOUND") return fail("Request not found", 404);
    if (result.kind === "ALREADY") return fail("Already processed");

    const { request, requestAmount, totalCredit } = result;
    if (action === "approve" && request.type === "DEPOSIT") {
      await distributeCommission(request.userId, requestAmount, "deposit").catch(() => {});
      await notifyUser(request.userId, {
        titleEn: "Deposit Approved ✓",
        titleBn: "ডিপোজিট অনুমোদিত ✓",
        bodyEn: `${requestAmount} TK deposited${totalCredit > requestAmount ? ` + ${normalizeWalletAmount(totalCredit - requestAmount)} TK bonus` : ""}.`,
        bodyBn: `${requestAmount} TK জমা হয়েছে${totalCredit > requestAmount ? ` + ${normalizeWalletAmount(totalCredit - requestAmount)} TK বোনাস` : ""}।`,
        href: "/wallet",
      }).catch(() => {});
    } else if (action === "approve" && request.type === "WITHDRAW") {
      await notifyUser(request.userId, {
        titleEn: "Withdrawal Approved ✓",
        titleBn: "উইথড্র অনুমোদিত ✓",
        bodyEn: `${requestAmount} TK withdrawal approved via ${request.method}.`,
        bodyBn: `${requestAmount} TK উইথড্র অনুমোদিত হয়েছে।`,
        href: "/wallet",
      }).catch(() => {});
    } else {
      await notifyUser(request.userId, {
        titleEn: "Request Rejected",
        titleBn: "রিকোয়েস্ট প্রত্যাখ্যাত",
        bodyEn: `Your ${request.type.toLowerCase()} of ${requestAmount} TK was rejected. ${adminNote || ""}`,
        bodyBn: `আপনার ${requestAmount} TK ${request.type === "DEPOSIT" ? "ডিপোজিট" : "উইথড্র"} প্রত্যাখ্যাত হয়েছে।`,
        href: "/wallet",
      }).catch(() => {});
    }

    return ok({ processed: true, action });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.issues[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
