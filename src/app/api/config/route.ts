import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";
import {
  DEFAULT_POPUP_CONFIG,
  DEFAULT_PAYMENT_CONFIG,
  DEFAULT_REFERRAL_CONFIG,
  mergeGameConfig,
} from "@/lib/game-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });

    // Support both popupConfig JSON and legacy announcements
    let popups: unknown = config?.popupConfig ?? null;
    if (!popups && DEFAULT_POPUP_CONFIG) {
      popups = DEFAULT_POPUP_CONFIG;
    }

    // Normalize single popup object → array for PromoPopup
    if (popups && typeof popups === "object" && !Array.isArray(popups)) {
      const o = popups as Record<string, unknown>;
      if (o.enabled !== undefined || o.titleEn || o.imageUrl) {
        popups = [o];
      } else if (Array.isArray(o.items)) {
        popups = o.items;
      }
    }

    // If still empty, seed a default welcome popup so launch popups show
    if (!popups || (Array.isArray(popups) && popups.length === 0)) {
      popups = [
        {
          id: "welcome_default",
          enabled: true,
          imageUrl: "/banners/welcome.jpg",
          href: "/wallet?tab=deposit",
          titleEn: "Welcome to TAKA69",
          titleBn: "TAKA69-এ স্বাগতম",
          bodyEn: "Deposit and play with virtual BDT. First deposit bonus on admin approval.",
          bodyBn: "ডিপোজিট করুন এবং ভার্চুয়াল BDT দিয়ে খেলুন। প্রথম জমায় অ্যাডমিন বোনাস।",
          showOncePerSession: true,
        },
      ];
    }

    // Trash box: hide games still within 30-day retention
    const brand = (config?.brandConfig as Record<string, unknown> | null) || {};
    const rawTrash = Array.isArray(brand.trashedGames) ? (brand.trashedGames as unknown[]) : [];
    const now = Date.now();
    const trashedGames = rawTrash
      .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
      .filter((x): x is Record<string, unknown> => !!x && typeof x.code === "string")
      .filter((x) => {
        const purgeAt = x.purgeAt ? new Date(String(x.purgeAt)).getTime() : 0;
        return !purgeAt || purgeAt > now;
      })
      .map((x) => ({
        code: String(x.code),
        name: String(x.name || x.code),
        trashedAt: x.trashedAt ? String(x.trashedAt) : null,
        purgeAt: x.purgeAt ? String(x.purgeAt) : null,
      }));

    return ok({
      jackpot: config?.jackpot ?? 1000000,
      banners: config?.banners ?? null,
      announcements: config?.announcements ?? null,
      maintenance: config?.maintenance ?? false,
      currency: config?.currency ?? "BDT",
      popup: popups,
      popups,
      popupConfig: config?.popupConfig ?? popups,
      paymentConfig: config?.paymentConfig ?? DEFAULT_PAYMENT_CONFIG,
      referralConfig: config?.referralConfig ?? DEFAULT_REFERRAL_CONFIG,
      gameConfig: mergeGameConfig(config?.gameConfig),
      gamesCatalog: config?.gamesCatalog ?? null,
      trashedGames,
      googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    });
  } catch (e) {
    return handleError(e);
  }
}
