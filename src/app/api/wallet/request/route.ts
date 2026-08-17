import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { notifyAdmins } from "@/lib/notify";
import { DEFAULT_PAYMENT_CONFIG } from "@/lib/game-config";
import { saveScreenshotBase64 } from "@/lib/uploads";

export const dynamic = "force-dynamic";

type PaymentMethod = {
  id: string;
  name: string;
  number: string;
  enabled: boolean;
  [key: string]: unknown;
};

function normalizePaymentMethods(raw: unknown): PaymentMethod[] {
  const source = raw === undefined ? DEFAULT_PAYMENT_CONFIG.methods : raw;
  if (!Array.isArray(source)) return [];

  return source
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const item = value as Record<string, unknown>;
      const id = String(item.id || "").trim();
      const name = String(item.name || id).trim();
      const number = String(item.number || "").trim();
      if (!id || !name) return null;
      return { ...item, id, name, number, enabled: item.enabled !== false };
    })
    .filter((value): value is PaymentMethod => value !== null);
}

function readPaymentConfig(raw: unknown) {
  const pc = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    minDeposit: Number.isFinite(Number(pc.minDeposit)) ? Number(pc.minDeposit) : 100,
    minWithdraw: Number.isFinite(Number(pc.minWithdraw)) ? Number(pc.minWithdraw) : 200,
    maxDeposit: Number.isFinite(Number(pc.maxDeposit)) ? Number(pc.maxDeposit) : 100000,
    maxWithdraw: Number.isFinite(Number(pc.maxWithdraw)) ? Number(pc.maxWithdraw) : 50000,
    noticeEn: typeof pc.noticeEn === "string" ? pc.noticeEn : "",
    noticeBn: typeof pc.noticeBn === "string" ? pc.noticeBn : "",
    methods: normalizePaymentMethods(pc.methods),
  };
}

function findPaymentMethod(method: string, methods: PaymentMethod[]) {
  const wanted = method.trim().toLowerCase();
  return methods.find((item) => item.id.toLowerCase() === wanted || item.name.toLowerCase() === wanted);
}

export async function GET() {
  try {
    const user = await requireUser();

    const [requests, config] = await Promise.all([
      prisma.walletRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, type: true, method: true, amount: true, status: true,
          trxId: true, screenshotUrl: true, bonusAmount: true,
          note: true, adminNote: true, createdAt: true,
        },
      }),
      prisma.appConfig.findUnique({ where: { id: "main" } }),
    ]);

    return ok({ requests, paymentConfig: readPaymentConfig(config?.paymentConfig) });
  } catch (e) { return handleError(e); }
}

const schema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAW"]),
  method: z.string().trim().min(1).max(50),
  channel: z.string().trim().min(1).max(50).optional(),
  amount: z.number().finite().min(1),
  accountNo: z.string().trim().max(40).optional(),
  accountName: z.string().trim().max(100).optional(),
  trxId: z.string().trim().max(100).optional(),
  screenshot: z.string().max(4_000_000).optional(), // base64 data URL; persisted by saveScreenshotBase64
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.isBanned) return fail("Account banned");

    const body = schema.parse(await req.json());
    const { type, method, channel, amount, accountNo, accountName, trxId, screenshot } = body;

    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const paymentConfig = readPaymentConfig(config?.paymentConfig);
    const configuredMethod = findPaymentMethod(method, paymentConfig.methods.filter((item) => item.enabled));
    if (!configuredMethod) return fail("Selected payment method is unavailable");

    if (type === "DEPOSIT") {
      if (amount < paymentConfig.minDeposit) return fail(`Minimum deposit is ${paymentConfig.minDeposit} TK`);
      if (amount > paymentConfig.maxDeposit) return fail(`Maximum deposit is ${paymentConfig.maxDeposit} TK`);
      if (!trxId) return fail("TrxID is required");

      const dup = await prisma.walletRequest.findUnique({ where: { trxId } });
      if (dup) return fail("This TrxID has already been submitted");

      let screenshotUrl: string | null = null;
      let screenshotExpiresAt: Date | null = null;
      if (screenshot) {
        const saved = await saveScreenshotBase64(screenshot, "deposit");
        screenshotUrl = saved.url;
        screenshotExpiresAt = saved.expiresAt;
      }

      const request = await prisma.walletRequest.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          method: configuredMethod.id,
          amount,
          trxId,
          screenshotUrl,
          screenshotExpiresAt,
          note: channel ? `Payment channel: ${channel}` : null,
          status: "PENDING",
        },
      });

      await notifyAdmins({
        titleEn: "New Deposit Request",
        titleBn: "নতুন ডিপোজিট রিকোয়েস্ট",
        bodyEn: `${user.username} wants to deposit ${amount} TK via ${configuredMethod.name}${channel ? ` (${channel})` : ""}`,
        bodyBn: `${user.username} ${configuredMethod.name} মাধ্যমে ${amount} TK ডিপোজিট করতে চান`,
        href: "/admin/wallet",
      }).catch(() => {});

      return ok({ request, message: "Deposit submitted. Admin will review shortly." });
    }

    if (amount < paymentConfig.minWithdraw) return fail(`Minimum withdraw is ${paymentConfig.minWithdraw} TK`);
    if (amount > paymentConfig.maxWithdraw) return fail(`Maximum withdraw is ${paymentConfig.maxWithdraw} TK`);

    const normalizedAccountName = accountName?.trim();
    if (!normalizedAccountName || normalizedAccountName.length < 2 || /[\u0000-\u001f\u007f]/.test(normalizedAccountName)) {
      return fail("Account name is required");
    }

    const normalizedAccountNo = accountNo?.trim().replace(/[\s-]/g, "");
    if (!normalizedAccountNo || !/^\+?\d{8,20}$/.test(normalizedAccountNo)) {
      return fail("Enter a valid account number");
    }

    const result = await prisma.$transaction(async (tx) => {
      // The predicate makes the debit and balance check one atomic database operation.
      const held = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (held.count !== 1) throw new Error("Insufficient balance");

      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { balance: true },
      });
      const request = await tx.walletRequest.create({
        data: {
          userId: user.id,
          type: "WITHDRAW",
          method: configuredMethod.id,
          amount,
          accountNo: normalizedAccountNo,
          accountName: normalizedAccountName,
          status: "PENDING",
          note: channel ? `Payment channel: ${channel}` : null,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAW_HOLD",
          amount: -amount,
          balanceAfter: updatedUser.balance,
          note: `Withdraw hold: ${amount} TK via ${configuredMethod.name}${channel ? ` (${channel})` : ""}`,
          meta: { requestId: request.id, method: configuredMethod.id, channel: channel || null },
        },
      });

      return { request, balance: updatedUser.balance };
    });

    await notifyAdmins({
      titleEn: "New Withdraw Request",
      titleBn: "নতুন উইথড্র রিকোয়েস্ট",
      bodyEn: `${user.username} wants to withdraw ${amount} TK via ${configuredMethod.name} to ${normalizedAccountNo}`,
      bodyBn: `${user.username} ${configuredMethod.name} মাধ্যমে ${normalizedAccountNo} নম্বরে ${amount} TK উইথড্র করতে চান`,
      href: "/admin/wallet",
    }).catch(() => {});

    return ok({ request: result.request, balance: result.balance, message: "Withdraw submitted. Admin will process shortly." });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
