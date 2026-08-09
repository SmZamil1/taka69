import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";
import {
  DEFAULT_GAME_CONFIG,
  DEFAULT_PAYMENT_CONFIG,
  DEFAULT_POPUP_CONFIG,
  DEFAULT_REFERRAL_CONFIG,
  mergeGameConfig,
} from "@/lib/game-config";
import { purgeExpiredUploads } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await purgeExpiredUploads().catch(() => 0);
    const config = await prisma.appConfig.upsert({
      where: { id: "main" },
      create: {
        id: "main",
        jackpot: 1_000_000,
        currency: "TK",
        gameConfig: DEFAULT_GAME_CONFIG,
        paymentConfig: DEFAULT_PAYMENT_CONFIG,
        popupConfig: DEFAULT_POPUP_CONFIG,
        referralConfig: DEFAULT_REFERRAL_CONFIG,
        banners: [
          {
            id: "welcome",
            image: "/banners/welcome.jpg",
            href: "/wallet?tab=deposit",
            titleEn: "Welcome to TAKA69",
            titleBn: "TAKA69-এ স্বাগতম",
          },
          {
            id: "crash",
            image: "/games/crash.jpg",
            href: "/games/crash",
            titleEn: "Aviator Crash",
            titleBn: "এভিয়েটর ক্র্যাশ",
          },
          {
            id: "slots",
            image: "/games/slots.jpg",
            href: "/games/slots",
            titleEn: "Neon Slots",
            titleBn: "নিয়ন স্লট",
          },
        ],
      },
      update: {},
    });
    const announcements = await prisma.announcement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const gameConfig = mergeGameConfig(config.gameConfig);
    // public-safe subset of limits
    const publicGames = Object.fromEntries(
      Object.entries(gameConfig).map(([k, v]) => [
        k,
        {
          enabled: v.enabled,
          minBet: v.minBet,
          maxBet: v.maxBet,
          maxWin: v.maxWin,
          maxMultiplier: v.maxMultiplier,
        },
      ])
    );

    return ok({
      jackpot: config.jackpot,
      maintenance: config.maintenance,
      banners: config.banners,
      announcements,
      apkUrl: config.apkUrl,
      appVersion: config.appVersion,
      paymentConfig: config.paymentConfig || DEFAULT_PAYMENT_CONFIG,
      popup: (() => {
        const raw = config.popupConfig || DEFAULT_POPUP_CONFIG;
        if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)) {
          return (raw as { items: unknown[] }).items[0] || DEFAULT_POPUP_CONFIG;
        }
        return raw;
      })(),
      popups: (() => {
        const raw = config.popupConfig as any;
        if (raw && Array.isArray(raw.items)) return raw.items;
        if (raw && Array.isArray(raw)) return raw;
        if (raw && typeof raw === "object") return [raw];
        return [DEFAULT_POPUP_CONFIG];
      })(),
      referral: {
        enabled: (config.referralConfig as { enabled?: boolean } | null)?.enabled ?? true,
        bonusAmount:
          (config.referralConfig as { bonusAmount?: number } | null)?.bonusAmount ??
          DEFAULT_REFERRAL_CONFIG.bonusAmount,
        shareTextEn:
          (config.referralConfig as { shareTextEn?: string } | null)?.shareTextEn ||
          DEFAULT_REFERRAL_CONFIG.shareTextEn,
        shareTextBn:
          (config.referralConfig as { shareTextBn?: string } | null)?.shareTextBn ||
          DEFAULT_REFERRAL_CONFIG.shareTextBn,
      },
      games: publicGames,
      appName: process.env.NEXT_PUBLIC_APP_NAME || "TAKA69",
      currency: config.currency || "TK",
    });
  } catch (e) {
    return handleError(e);
  }
}
