import { requireStaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";
import { DEFAULT_PAYMENT_CONFIG } from "@/lib/game-config";
import { normalizePaymentConfig } from "@/lib/payment-config";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStaffPermission("settings");
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const pc = normalizePaymentConfig(config?.paymentConfig ?? DEFAULT_PAYMENT_CONFIG);
    return ok({
      maintenance: config?.maintenance ?? false,
      jackpot: config?.jackpot ?? 1000000,
      currency: config?.currency ?? "BDT",
      paymentConfig: {
        minDeposit: (pc.minDeposit as number) ?? 100,
        minWithdraw: (pc.minWithdraw as number) ?? 200,
        maxDeposit: (pc.maxDeposit as number) ?? 100000,
        maxWithdraw: (pc.maxWithdraw as number) ?? 50000,
        noticeEn: (pc.noticeEn as string) ?? "",
        noticeBn: (pc.noticeBn as string) ?? "",
        withdrawFeeType: pc.withdrawFeeType,
        withdrawFeeValue: pc.withdrawFeeValue,
        methods: pc.methods,
      },
    });
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    await requireStaffPermission("settings");
    const body = await req.json() as Record<string, unknown>;
    await prisma.appConfig.upsert({
      where: { id: "main" },
      create: {
        id: "main",
        maintenance: (body.maintenance as boolean) ?? false,
        jackpot: (body.jackpot as number) ?? 1000000,
        currency: (body.currency as string) ?? "BDT",
        paymentConfig: normalizePaymentConfig(body.paymentConfig ?? DEFAULT_PAYMENT_CONFIG) as unknown as Prisma.InputJsonValue,
        houseRuleConfig: (body.houseRuleConfig as object) ?? undefined,
      },
      update: {
        maintenance: (body.maintenance as boolean) ?? false,
        jackpot: (body.jackpot as number) ?? 1000000,
        paymentConfig: normalizePaymentConfig(body.paymentConfig ?? DEFAULT_PAYMENT_CONFIG) as unknown as Prisma.InputJsonValue,
        ...(body.houseRuleConfig ? { houseRuleConfig: body.houseRuleConfig as object } : {}),
        ...(body.currency ? { currency: body.currency as string } : {}),
      },
    });
    return ok({ saved: true });
  } catch (e) { return handleError(e); }
}
