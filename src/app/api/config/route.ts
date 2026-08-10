import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    return ok({
      jackpot: config?.jackpot ?? 1000000,
      banners: config?.banners ?? null,
      announcements: config?.announcements ?? null,
      maintenance: config?.maintenance ?? false,
      currency: config?.currency ?? "TK",
    });
  } catch (e) { return handleError(e); }
}
