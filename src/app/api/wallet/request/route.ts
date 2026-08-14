import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { notifyAdmins } from "@/lib/notify";
import { mergeGameConfig } from "@/lib/game-config";

export const dynamic = "force-dynamic";

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

    const pc = (config?.paymentConfig as Record<string, unknown>) ?? {};
    return ok({
      requests,
      paymentConfig: {
        minDeposit: (pc.minDeposit as number) ?? 100,
        minWithdraw: (pc.minWithdraw as number) ?? 200,
        maxDeposit: (pc.maxDeposit as number) ?? 100000,
        maxWithdraw: (pc.maxWithdraw as number) ?? 50000,
        noticeEn: (pc.noticeEn as string) ?? "",
        noticeBn: (pc.noticeBn as string) ?? "",
        methods: (pc.methods as unknown[]) ?? [],
      },
    });
  } catch (e) { return handleError(e); }
}

const schema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAW"]),
  method: z.string().min(1).max(30),
  amount: z.number().min(1),
  accountNo: z.string().optional(),
  accountName: z.string().optional(),
  trxId: z.string().optional(),
  screenshot: z.string().optional(), // base64
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.isBanned) return fail("Account banned");

    const body = schema.parse(await req.json());
    const { type, method, amount, accountNo, accountName, trxId, screenshot } = body;

    // Load payment config
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const pc = (config?.paymentConfig as Record<string, number>) ?? {};
    const minDep = pc.minDeposit ?? 100;
    const minWd = pc.minWithdraw ?? 200;
    const maxDep = pc.maxDeposit ?? 100000;
    const maxWd = pc.maxWithdraw ?? 50000;

    if (type === "DEPOSIT") {
      if (amount < minDep) return fail(`Minimum deposit is ${minDep} TK`);
      if (amount > maxDep) return fail(`Maximum deposit is ${maxDep} TK`);
      if (!trxId) return fail("TrxID is required");

      // Check duplicate trxId
      const dup = await prisma.walletRequest.findUnique({ where: { trxId } });
      if (dup) return fail("This TrxID has already been submitted");

      // Handle screenshot upload — store as URL or base64 reference
      let screenshotUrl: string | null = null;
      if (screenshot && screenshot.startsWith("data:image")) {
        // Store asset reference
        const asset = await prisma.uploadAsset.create({
          data: {
            kind: "wallet_screenshot",
            path: screenshot.slice(0, 100), // store truncated reference
            mimeType: screenshot.split(";")[0].split(":")[1],
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        screenshotUrl = `/api/uploads/${asset.id}`;
      }

      const request = await prisma.walletRequest.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          method,
          amount,
          trxId,
          screenshotUrl,
          status: "PENDING",
        },
      });

      await notifyAdmins({
        titleEn: "New Deposit Request",
        titleBn: "নতুন ডিপোজিট রিকোয়েস্ট",
        bodyEn: `${user.username} wants to deposit ${amount} TK via ${method}`,
        bodyBn: `${user.username} ${method} মাধ্যমে ${amount} TK ডিপোজিট করতে চান`,
        href: "/admin/wallet",
      }).catch(() => {});

      return ok({ request, message: "Deposit submitted. Admin will review shortly." });
    } else {
      if (amount < minWd) return fail(`Minimum withdraw is ${minWd} TK`);
      if (amount > maxWd) return fail(`Maximum withdraw is ${maxWd} TK`);
      if (user.balance < amount) return fail("Insufficient balance");
      if (!accountNo) return fail("Account number is required");

      // Hold balance
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      });

      const request = await prisma.walletRequest.create({
        data: {
          userId: user.id,
          type: "WITHDRAW",
          method,
          amount,
          accountNo,
          accountName: accountName || null,
          status: "PENDING",
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAW_HOLD",
          amount: -amount,
          balanceAfter: user.balance - amount,
          note: `Withdraw hold: ${amount} TK via ${method}`,
          meta: { requestId: request.id },
        },
      });

      await notifyAdmins({
        titleEn: "New Withdraw Request",
        titleBn: "নতুন উইথড্র রিকোয়েস্ট",
        bodyEn: `${user.username} wants to withdraw ${amount} TK via ${method} to ${accountNo}`,
        bodyBn: `${user.username} ${method} মাধ্যমে ${amount} TK উইথড্র করতে চান`,
        href: "/admin/wallet",
      }).catch(() => {});

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }, select: { balance: true },
      });

      return ok({ request, balance: updatedUser?.balance ?? 0, message: "Withdraw submitted. Admin will process shortly." });
    }
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
