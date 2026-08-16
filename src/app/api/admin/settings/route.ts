import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";
import { DEFAULT_PAYMENT_CONFIG } from "@/lib/game-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const pc = (config?.paymentConfig as Record<string, unknown>) ?? DEFAULT_PAYMENT_CONFIG;
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
        methods: (pc.methods as unknown[]) ?? DEFAULT_PAYMENT_CONFIG.methods,
      },
    });
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json() as Record<string, unknown>;
    await prisma.appConfig.upsert({
      where: { id: "main" },
      create: {
        id: "main",
        maintenance: (body.maintenance as boolean) ?? false,
        jackpot: (body.jackpot as number) ?? 1000000,
        currency: (body.currency as string) ?? "BDT",
        paymentConfig: (body.paymentConfig as object) ?? DEFAULT_PAYMENT_CONFIG,
      },
      update: {
        maintenance: (body.maintenance as boolean) ?? false,
        jackpot: (body.jackpot as number) ?? 1000000,
        paymentConfig: (body.paymentConfig as object) ?? DEFAULT_PAYMENT_CONFIG,
        ...(body.currency ? { currency: body.currency as string } : {}),
      },
    });
    return ok({ saved: true });
  } catch (e) { return handleError(e); }
}
