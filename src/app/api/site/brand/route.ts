import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const DEFAULT_BRAND = {
  siteName: "TAKA69",
  logoUrl: "/icons/logo.png",
  faviconUrl: "/icons/favicon-32.png",
  telegramUrl: "https://t.me/",
  whatsappUrl: "https://wa.me/",
};

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const brand = {
      ...DEFAULT_BRAND,
      ...((config?.brandConfig as object) || {}),
    };
    const support = (config?.supportConfig as object) || {};
    return ok({
      brand,
      support,
      currency: config?.currency || "BDT",
      maintenance: !!config?.maintenance,
      appVersion: config?.appVersion || "1.0.0",
      gamesCatalog: config?.gamesCatalog || null,
    });
  } catch (e) {
    return handleError(e);
  }
}
