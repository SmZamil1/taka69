import { z } from "zod";
import { requireUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { notifyAdmins } from "@/lib/notify";
import { calculateFee, findPaymentMethod, normalizePaymentConfig } from "@/lib/payment-config";
import { saveScreenshotBase64 } from "@/lib/uploads";

export const dynamic = "force-dynamic";

class WalletRequestValidationError extends Error {}

function normalizeAccountName(accountName?: string) {
  const normalized = accountName?.trim();
  if (!normalized || normalized.length < 2 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new WalletRequestValidationError("Account name is required");
  }
  return normalized;
}

function normalizeAccountNo(accountNo?: string) {
  const normalized = accountNo?.trim().replace(/[\s-]/g, "");
  if (!normalized || !/^\+?\d{8,20}$/.test(normalized)) {
    throw new WalletRequestValidationError("Enter a valid account number");
  }
  return normalized;
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
          id: true, type: true, method: true, channel: true, currency: true,
          amount: true, grossAmount: true, feeAmount: true, netAmount: true, status: true,
          walletCardId: true, trxId: true, providerRef: true, screenshotUrl: true, bonusAmount: true,
          note: true, adminNote: true, rejectionReason: true, processedBy: true, processedAt: true, settledAt: true,
          createdAt: true, updatedAt: true,
        },
      }),
      prisma.appConfig.findUnique({ where: { id: "main" } }),
    ]);

    return ok({ requests, paymentConfig: normalizePaymentConfig(config?.paymentConfig) });
  } catch (e) { return handleError(e); }
}

const schema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAW"]),
  method: z.string().trim().min(1).max(50),
  channel: z.string().trim().min(1).max(50).optional(),
  amount: z.number().finite().min(1),
  cardId: z.string().trim().min(1).max(100).optional(),
  accountNo: z.string().trim().max(40).optional(),
  accountName: z.string().trim().max(100).optional(),
  trxId: z.string().trim().max(100).optional(),
  transactionPassword: z.string().min(1).max(64).optional(),
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
  screenshot: z.string().max(4_000_000).optional(), // base64 data URL; persisted by saveScreenshotBase64
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.isBanned) return fail("Account banned");

    const body = schema.parse(await req.json());
    const { type, method, cardId, channel, amount, accountNo, accountName, trxId, screenshot, transactionPassword, idempotencyKey } = body;

    if (idempotencyKey) {
      const existingRequest = await prisma.walletRequest.findUnique({ where: { idempotencyKey } });
      if (existingRequest) {
        if (existingRequest.userId !== user.id) return fail("This submission key is already in use", 409);
        return ok({ request: existingRequest, message: "This request was already submitted." });
      }
    }

    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const paymentConfig = normalizePaymentConfig(config?.paymentConfig);
    const configuredMethod = findPaymentMethod(method, paymentConfig.methods, type === "DEPOSIT" ? "deposit" : "withdraw");
    if (!configuredMethod) return fail(type === "DEPOSIT" ? "Selected deposit method is unavailable" : "Selected withdrawal method is unavailable");
    const selectedChannel = configuredMethod.channels.find((item) => item.id === channel || item.label.toLowerCase() === String(channel || "").toLowerCase());
    if (channel && !selectedChannel) return fail("Selected payment channel is unavailable", 400);

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
          channel: selectedChannel?.label || channel || null,
          currency: "BDT",
          amount,
          grossAmount: amount,
          feeAmount: 0,
          netAmount: amount,
          idempotencyKey: idempotencyKey || undefined,
          trxId,
          screenshotUrl,
          screenshotExpiresAt,
          note: channel ? `Payment channel: ${selectedChannel?.label || channel}` : null,
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

      return ok({ request, message: "Deposit submitted. Admin will review shortly.", fee: 0, netAmount: amount });
    }

    if (!user.transactionPasswordHash) return fail("Set a transaction password before withdrawing", 400);
    if (!transactionPassword || !(await verifyPassword(transactionPassword, user.transactionPasswordHash))) {
      return fail("Transaction password is incorrect", 400);
    }
    if (amount < paymentConfig.minWithdraw) return fail(`Minimum withdraw is ${paymentConfig.minWithdraw} TK`);
    if (amount > paymentConfig.maxWithdraw) return fail(`Maximum withdraw is ${paymentConfig.maxWithdraw} TK`);
    const fee = calculateFee(amount, configuredMethod, paymentConfig);
    const holdAmount = Number((amount + fee).toFixed(2));

    let normalizedAccountName = "";
    let normalizedAccountNo = "";
    if (!cardId) {
      try {
        normalizedAccountName = normalizeAccountName(accountName);
        normalizedAccountNo = normalizeAccountNo(accountNo);
      } catch (error) {
        return fail(error instanceof Error ? error.message : "Invalid withdrawal account", 400);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (cardId) {
        const card = await tx.walletCard.findFirst({
          where: { id: cardId, userId: user.id },
          select: { method: true, accountNo: true, accountName: true, status: true },
        });
        if (!card) throw new WalletRequestValidationError("Saved wallet account not found. Bind it again before withdrawing");
        if (card.status !== "ACTIVE" && card.status !== "VERIFIED") throw new WalletRequestValidationError("This wallet account is not available for withdrawal");
        const cardMethod = card.method.trim().toLowerCase();
        const configuredMethodId = configuredMethod.id.trim().toLowerCase();
        const configuredMethodName = configuredMethod.name.trim().toLowerCase();
        if (cardMethod !== configuredMethodId && cardMethod !== configuredMethodName) {
          throw new WalletRequestValidationError("That saved wallet account is not valid for the selected payment method");
        }
        normalizedAccountNo = normalizeAccountNo(card.accountNo);
        normalizedAccountName = normalizeAccountName(card.accountName || accountName);
      }

      // The predicate makes the debit and balance check one atomic database operation.
      const held = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: holdAmount } },
        data: { balance: { decrement: holdAmount } },
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
          channel: selectedChannel?.label || channel || null,
          currency: "BDT",
          amount,
          grossAmount: holdAmount,
          feeAmount: fee,
          netAmount: amount,
          walletCardId: cardId || undefined,
          idempotencyKey: idempotencyKey || undefined,
          accountNo: normalizedAccountNo,
          accountName: normalizedAccountName,
          status: "PENDING",
          note: channel ? `Payment channel: ${selectedChannel?.label || channel}` : `Withdrawal fee: ${fee.toFixed(2)} TK`,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAW_HOLD",
          amount: -holdAmount,
          balanceAfter: updatedUser.balance,
          walletRequestId: request.id,
          method: configuredMethod.id,
          grossAmount: holdAmount,
          feeAmount: fee,
          netAmount: amount,
          status: "HELD",
          note: `Withdraw hold: ${amount} TK + ${fee.toFixed(2)} TK fee via ${configuredMethod.name}${channel ? ` (${selectedChannel?.label || channel})` : ""}`,
          meta: { requestId: request.id, method: configuredMethod.id, channel: selectedChannel?.label || channel || null, requestedAmount: amount, fee, holdAmount, payoutAmount: amount },
        },
      });

      if (cardId) await tx.walletCard.update({ where: { id: cardId }, data: { lastUsedAt: new Date() } });
      return { request, balance: updatedUser.balance };
    });

    await notifyAdmins({
      titleEn: "New Withdraw Request",
      titleBn: "নতুন উইথড্র রিকোয়েস্ট",
      bodyEn: `${user.username} wants to withdraw ${amount} TK via ${configuredMethod.name} to ${normalizedAccountNo}`,
      bodyBn: `${user.username} ${configuredMethod.name} মাধ্যমে ${normalizedAccountNo} নম্বরে ${amount} TK উইথড্র করতে চান`,
      href: "/admin/wallet",
    }).catch(() => {});

    return ok({ request: result.request, balance: result.balance, fee, netAmount: amount, holdAmount, message: "Withdraw submitted. Admin will process shortly." });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    if (e instanceof WalletRequestValidationError) return fail(e.message, 400);
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return fail("This wallet request was already submitted", 409);
    }
    return handleError(e);
  }
}
