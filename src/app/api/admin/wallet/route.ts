import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustBalance, creditWin } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";
import { notifyUser } from "@/lib/notify";
import {
  DEFAULT_REFERRAL_CONFIG,
} from "@/lib/game-config";
import { purgeExpiredUploads } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    await purgeExpiredUploads().catch(() => 0);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const requests = await prisma.walletRequest.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            username: true,
            balance: true,
            id: true,
            referredById: true,
          },
        },
      },
    });
    return ok({ requests });
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  id: z.string(),
  action: z.enum(["approve", "reject"]),
  adminNote: z.string().max(200).optional(),
  /** Bonus TK granted on deposit approval (admin-controlled) */
  bonusAmount: z.number().min(0).max(1_000_000).optional(),
});

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await req.json());
    const row = await prisma.walletRequest.findUnique({
      where: { id: body.id },
      include: { user: true },
    });
    if (!row) return fail("Not found", 404);
    if (row.status !== "PENDING") return fail("Already processed");

    if (body.action === "reject") {
      if (row.type === "WITHDRAW") {
        await creditWin(row.userId, row.amount, "Withdraw rejected refund", {
          requestId: row.id,
        });
      }
      const updated = await prisma.walletRequest.update({
        where: { id: row.id },
        data: {
          status: "REJECTED",
          adminNote: body.adminNote,
          processedBy: admin.username,
        },
      });

      await notifyUser(row.userId, {
        titleEn: row.type === "DEPOSIT" ? "Deposit rejected" : "Withdraw rejected",
        titleBn: row.type === "DEPOSIT" ? "ডিপোজিট বাতিল" : "উইথড্র বাতিল",
        bodyEn:
          body.adminNote ||
          (row.type === "DEPOSIT"
            ? "Your deposit request was rejected."
            : "Your withdraw was rejected and funds returned."),
        bodyBn:
          body.adminNote ||
          (row.type === "DEPOSIT"
            ? "আপনার ডিপোজিট রিকোয়েস্ট বাতিল হয়েছে।"
            : "উইথড্র বাতিল — টাকা ফেরত দেওয়া হয়েছে।"),
        href: "/wallet",
      }).catch(() => null);

      return ok({ request: updated });
    }

    // approve
    const bonus = body.bonusAmount || 0;

    if (row.type === "DEPOSIT") {
      await adjustBalance(
        row.userId,
        row.amount,
        "DEPOSIT",
        `Deposit approved via ${row.method}`,
        { requestId: row.id, method: row.method, trxId: row.trxId }
      );

      if (bonus > 0) {
        await adjustBalance(
          row.userId,
          bonus,
          "DEPOSIT_BONUS",
          `Deposit bonus by admin ${admin.username}`,
          { requestId: row.id, bonus }
        );
      }

      // Referral bonus on first approved deposit only
      if (row.user.referredById) {
        const priorDeposits = await prisma.walletRequest.count({
          where: {
            userId: row.userId,
            type: "DEPOSIT",
            status: "APPROVED",
            id: { not: row.id },
          },
        });
        if (priorDeposits === 0) {
          const cfgRow = await prisma.appConfig.findUnique({ where: { id: "main" } });
          const refCfg = {
            ...DEFAULT_REFERRAL_CONFIG,
            ...((cfgRow?.referralConfig as object) || {}),
          };
          if (refCfg.enabled && row.amount >= (refCfg.minDepositForBonus || 0)) {
            await adjustBalance(
              row.user.referredById,
              refCfg.bonusAmount,
              "REFERRAL_BONUS",
              `Referral bonus: ${row.user.username} first deposit`,
              { fromUserId: row.userId, requestId: row.id }
            );
            await notifyUser(row.user.referredById, {
              titleEn: "Referral bonus credited",
              titleBn: "রেফারেল বোনাস জমা",
              bodyEn: `+${refCfg.bonusAmount} TK for ${row.user.username}'s first deposit.`,
              bodyBn: `${row.user.username}-এর প্রথম ডিপোজিটে +${refCfg.bonusAmount} TK।`,
              href: "/wallet",
            }).catch(() => null);
          }
        }
      }

      await notifyUser(row.userId, {
        titleEn: "Deposit approved",
        titleBn: "ডিপোজিট অনুমোদিত",
        bodyEn:
          bonus > 0
            ? `+${row.amount} TK credited + ${bonus} TK bonus.`
            : `+${row.amount} TK credited to your wallet.`,
        bodyBn:
          bonus > 0
            ? `+${row.amount} TK জমা + ${bonus} TK বোনাস।`
            : `ওয়ালেটে +${row.amount} TK জমা হয়েছে।`,
        href: "/wallet",
      }).catch(() => null);
    }

    if (row.type === "WITHDRAW") {
      await prisma.transaction.create({
        data: {
          userId: row.userId,
          type: "WITHDRAW",
          amount: -row.amount,
          balanceAfter: (
            await prisma.user.findUniqueOrThrow({ where: { id: row.userId } })
          ).balance,
          note: `Withdraw approved via ${row.method}`,
          meta: { requestId: row.id, method: row.method },
        },
      });
      await notifyUser(row.userId, {
        titleEn: "Withdraw approved",
        titleBn: "উইথড্র অনুমোদিত",
        bodyEn: `${row.amount} TK withdraw approved via ${row.method}.`,
        bodyBn: `${row.method} দিয়ে ${row.amount} TK উইথড্র অনুমোদিত।`,
        href: "/wallet",
      }).catch(() => null);
    }

    const updated = await prisma.walletRequest.update({
      where: { id: row.id },
      data: {
        status: "APPROVED",
        adminNote: body.adminNote,
        bonusAmount: bonus,
        processedBy: admin.username,
      },
    });
    return ok({ request: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
