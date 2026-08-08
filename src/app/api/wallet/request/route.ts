import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";
import { DEFAULT_PAYMENT_CONFIG } from "@/lib/game-config";
import { saveScreenshotBase64, purgeExpiredUploads } from "@/lib/uploads";
import { notifyUser } from "@/lib/notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAW"]),
  method: z.enum(["bkash", "nagad", "rocket", "upay"]),
  amount: z.number().positive().max(1_000_000),
  accountName: z.string().max(80).optional(),
  accountNo: z.string().max(40).optional(),
  trxId: z.string().max(80).optional(),
  note: z.string().max(200).optional(),
  screenshot: z.string().max(3_500_000).optional(), // base64 data URL
});

export async function GET() {
  try {
    const user = await requireUser();
    await purgeExpiredUploads().catch(() => 0);
    const requests = await prisma.walletRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const paymentConfig = (config?.paymentConfig as object) || DEFAULT_PAYMENT_CONFIG;
    return ok({
      requests,
      paymentConfig,
      currency: config?.currency || "TK",
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const pay = {
      ...DEFAULT_PAYMENT_CONFIG,
      ...((config?.paymentConfig as object) || {}),
    } as typeof DEFAULT_PAYMENT_CONFIG;

    if (body.type === "DEPOSIT") {
      if (body.amount < (pay.minDeposit || 100)) {
        return fail(`Minimum deposit is ${pay.minDeposit || 100} TK`);
      }
      if (body.amount > (pay.maxDeposit || 100000)) {
        return fail(`Maximum deposit is ${pay.maxDeposit || 100000} TK`);
      }
      const trxId = (body.trxId || "").trim();
      if (!trxId) return fail("Transaction ID (TrxID) required for deposit");
      if (!body.screenshot) return fail("Payment screenshot required");

      const existing = await prisma.walletRequest.findFirst({
        where: { trxId: { equals: trxId, mode: "insensitive" } },
      });
      if (existing) return fail("This TrxID was already submitted", 409);

      let screenshotUrl: string | undefined;
      let screenshotExpiresAt: Date | undefined;
      try {
        const saved = await saveScreenshotBase64(body.screenshot, "deposit");
        screenshotUrl = saved.url;
        screenshotExpiresAt = saved.expiresAt;
      } catch (err) {
        return fail(err instanceof Error ? err.message : "Invalid screenshot");
      }

      const row = await prisma.walletRequest.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          method: body.method,
          amount: body.amount,
          accountName: body.accountName,
          accountNo: body.accountNo,
          trxId,
          screenshotUrl,
          screenshotExpiresAt,
          note: body.note,
          status: "PENDING",
        },
      });

      await notifyUser(user.id, {
        titleEn: "Deposit submitted",
        titleBn: "ডিপোজিট জমা হয়েছে",
        bodyEn: `${body.amount} TK via ${body.method.toUpperCase()} is pending admin review.`,
        bodyBn: `${body.method.toUpperCase()} দিয়ে ${body.amount} TK অ্যাডমিন রিভিউতে আছে।`,
        href: "/wallet?tab=history",
      }).catch(() => null);

      return ok({
        request: row,
        balance: user.balance,
        message: "Deposit request submitted for admin review",
      });
    }

    // WITHDRAW
    if (body.amount < (pay.minWithdraw || 200)) {
      return fail(`Minimum withdraw is ${pay.minWithdraw || 200} TK`);
    }
    if (body.amount > (pay.maxWithdraw || 50000)) {
      return fail(`Maximum withdraw is ${pay.maxWithdraw || 50000} TK`);
    }
    if (!body.accountNo) return fail("Account number required for withdraw");
    if (user.balance < body.amount) return fail("Insufficient balance");

    // hold funds
    await placeBet(user.id, body.amount, `Withdraw hold ${body.method}`);

    const row = await prisma.walletRequest.create({
      data: {
        userId: user.id,
        type: "WITHDRAW",
        method: body.method,
        amount: body.amount,
        accountName: body.accountName,
        accountNo: body.accountNo,
        note: body.note,
        status: "PENDING",
      },
    });

    const balance = (
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    ).balance;

    await notifyUser(user.id, {
      titleEn: "Withdraw submitted",
      titleBn: "উইথড্র জমা হয়েছে",
      bodyEn: `${body.amount} TK held pending admin review.`,
      bodyBn: `${body.amount} TK হোল্ডে আছে — অ্যাডমিন রিভিউ চলছে।`,
      href: "/wallet?tab=history",
    }).catch(() => null);

    return ok({
      request: row,
      balance,
      message: "Withdraw request submitted — amount held pending review",
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    // unique trxId race
    if (String(e).includes("Unique constraint") || String((e as { code?: string }).code) === "P2002") {
      return fail("This TrxID was already submitted", 409);
    }
    return handleError(e);
  }
}
