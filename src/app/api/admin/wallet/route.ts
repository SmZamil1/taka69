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
  bonusAmount: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = actionSchema.parse(await req.json());
    const { id, action, adminNote, bonusAmount = 0 } = body;

    const request = await prisma.walletRequest.findUnique({
      where: { id }, include: { user: true },
    });
    if (!request) return fail("Request not found", 404);
    if (request.status !== "PENDING") return fail("Already processed");

    if (action === "approve") {
      if (request.type === "DEPOSIT") {
        const totalCredit = request.amount + bonusAmount;
        const userNow = await prisma.user.findUnique({ where: { id: request.userId }, select: { balance: true } });
        const newBal = (userNow?.balance ?? 0) + totalCredit;

        await prisma.walletRequest.update({
          where: { id },
          data: { status: "APPROVED", adminNote: adminNote || null, bonusAmount, processedBy: admin.id },
        });
        await prisma.user.update({
          where: { id: request.userId },
          data: { balance: { increment: totalCredit }, totalDeposit: { increment: request.amount } },
        });
        await prisma.transaction.create({
          data: {
            userId: request.userId,
            type: "DEPOSIT",
            amount: totalCredit,
            balanceAfter: newBal,
            note: `Deposit approved via ${request.method}${bonusAmount > 0 ? ` + ${bonusAmount} TK bonus` : ""}`,
            meta: { requestId: id, method: request.method, adminId: admin.id },
          },
        });

        await distributeCommission(request.userId, request.amount, "deposit").catch(() => {});
        await notifyUser(request.userId, {
          titleEn: "Deposit Approved ✓",
          titleBn: "ডিপোজিট অনুমোদিত ✓",
          bodyEn: `${request.amount} TK deposited${bonusAmount > 0 ? ` + ${bonusAmount} TK bonus` : ""}.`,
          bodyBn: `${request.amount} TK জমা হয়েছে${bonusAmount > 0 ? ` + ${bonusAmount} TK বোনাস` : ""}।`,
          href: "/wallet",
        }).catch(() => {});

      } else {
        // WITHDRAW approve — balance already held on request creation
        await prisma.walletRequest.update({
          where: { id },
          data: { status: "APPROVED", adminNote: adminNote || null, processedBy: admin.id },
        });
        await notifyUser(request.userId, {
          titleEn: "Withdrawal Approved ✓",
          titleBn: "উইথড্র অনুমোদিত ✓",
          bodyEn: `${request.amount} TK withdrawal approved via ${request.method}.`,
          bodyBn: `${request.amount} TK উইথড্র অনুমোদিত হয়েছে।`,
          href: "/wallet",
        }).catch(() => {});
      }
    } else {
      // Reject — refund balance if withdraw
      await prisma.walletRequest.update({
        where: { id },
        data: { status: "REJECTED", adminNote: adminNote || "Rejected by admin", processedBy: admin.id },
      });

      if (request.type === "WITHDRAW") {
        // Refund held balance
        const userNow = await prisma.user.findUnique({ where: { id: request.userId }, select: { balance: true } });
        const newBal = (userNow?.balance ?? 0) + request.amount;
        await prisma.user.update({ where: { id: request.userId }, data: { balance: { increment: request.amount } } });
        await prisma.transaction.create({
          data: {
            userId: request.userId,
            type: "WITHDRAW_REFUND",
            amount: request.amount,
            balanceAfter: newBal,
            note: "Withdraw rejected — balance refunded",
            meta: { requestId: id },
          },
        });
      }

      await notifyUser(request.userId, {
        titleEn: "Request Rejected",
        titleBn: "রিকোয়েস্ট প্রত্যাখ্যাত",
        bodyEn: `Your ${request.type.toLowerCase()} of ${request.amount} TK was rejected. ${adminNote || ""}`,
        bodyBn: `আপনার ${request.amount} TK ${request.type === "DEPOSIT" ? "ডিপোজিট" : "উইথড্র"} প্রত্যাখ্যাত হয়েছে।`,
        href: "/wallet",
      }).catch(() => {});
    }

    return ok({ processed: true, action });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
