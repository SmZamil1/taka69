import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const config = await prisma.appConfig.upsert({
      where: { id: "main" },
      create: { id: "main", jackpot: 1_000_000 },
      update: {},
    });
    const announcements = await prisma.announcement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return ok({
      jackpot: config.jackpot,
      maintenance: config.maintenance,
      banners: config.banners,
      announcements,
      appName: process.env.NEXT_PUBLIC_APP_NAME || "TAKA69",
      currency: process.env.NEXT_PUBLIC_CURRENCY || "TC",
    });
  } catch (e) {
    return handleError(e);
  }
}
