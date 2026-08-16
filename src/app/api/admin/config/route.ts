import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import {
  DEFAULT_GAME_CONFIG,
  DEFAULT_PAYMENT_CONFIG,
  DEFAULT_POPUP_CONFIG,
  DEFAULT_REFERRAL_CONFIG,
  DEFAULT_HOUSE_RULE_CONFIG,
  mergeGameConfig,
  mergeHouseRule,
} from "@/lib/game-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const config = await prisma.appConfig.upsert({
      where: { id: "main" },
      create: {
        id: "main",
        currency: "BDT",
        gameConfig: DEFAULT_GAME_CONFIG,
        paymentConfig: DEFAULT_PAYMENT_CONFIG,
        popupConfig: DEFAULT_POPUP_CONFIG,
        referralConfig: DEFAULT_REFERRAL_CONFIG,
        houseRuleConfig: DEFAULT_HOUSE_RULE_CONFIG,
        banners: [
          {
            id: "welcome",
            image: "/banners/welcome.jpg",
            href: "/wallet?tab=deposit",
            titleEn: "Welcome to TAKA69",
            titleBn: "TAKA69-এ স্বাগতম",
          },
        ],
      },
      update: {},
    });
    let announcements: { id: string; textEn: string; textBn: string; active: boolean; createdAt: Date }[] = [];
    try {
      announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    } catch {
      announcements = [];
    }
    return ok({
      config: {
        ...config,
        currency: config.currency || "BDT",
        gameConfig: mergeGameConfig(config.gameConfig),
        paymentConfig: config.paymentConfig || DEFAULT_PAYMENT_CONFIG,
        popupConfig: config.popupConfig || DEFAULT_POPUP_CONFIG,
        referralConfig: config.referralConfig || DEFAULT_REFERRAL_CONFIG,
        houseRuleConfig: mergeHouseRule(config.houseRuleConfig),
        brandConfig: config.brandConfig || {
          siteName: "TAKA69",
          logoUrl: "/icons/logo.png",
          faviconUrl: "/icons/favicon-32.png",
          telegramUrl: "https://t.me/",
          whatsappUrl: "https://wa.me/",
        },
        gamesCatalog: config.gamesCatalog || null,
        supportConfig: config.supportConfig || null,
      },
      announcements,
      defaults: {
        gameConfig: DEFAULT_GAME_CONFIG,
        paymentConfig: DEFAULT_PAYMENT_CONFIG,
        popupConfig: DEFAULT_POPUP_CONFIG,
        referralConfig: DEFAULT_REFERRAL_CONFIG,
        houseRuleConfig: DEFAULT_HOUSE_RULE_CONFIG,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  jackpot: z.number().optional(),
  maintenance: z.boolean().optional(),
  banners: z.any().optional(),
  gameConfig: z.any().optional(),
  paymentConfig: z.any().optional(),
  supportConfig: z.any().optional(),
  popupConfig: z.any().optional(),
  referralConfig: z.any().optional(),
  houseRuleConfig: z.any().optional(),
  brandConfig: z.any().optional(),
  gamesCatalog: z.any().optional(),
  wingoConfig: z.any().optional(),
  vipConfig: z.any().optional(),
  apkUrl: z.string().optional().nullable(),
  appVersion: z.string().optional(),
  currency: z.string().optional(),
  /** Trash / restore games (30-day junk box stored in brandConfig.trashedGames) */
  trashGame: z
    .object({
      code: z.string().min(1),
      name: z.string().optional(),
    })
    .optional(),
  restoreGame: z
    .object({
      code: z.string().min(1),
    })
    .optional(),
  announcement: z
    .object({
      textEn: z.string(),
      textBn: z.string(),
      active: z.boolean().optional(),
    })
    .optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());

    const existing = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const data: Record<string, unknown> = {};
    if (typeof body.jackpot === "number") data.jackpot = body.jackpot;
    if (typeof body.maintenance === "boolean") data.maintenance = body.maintenance;
    if (body.banners !== undefined) data.banners = body.banners;
    if (body.gameConfig !== undefined) data.gameConfig = body.gameConfig;
    if (body.paymentConfig !== undefined) data.paymentConfig = body.paymentConfig;
    if (body.supportConfig !== undefined) data.supportConfig = body.supportConfig;
    if (body.popupConfig !== undefined) data.popupConfig = body.popupConfig;
    if (body.referralConfig !== undefined) data.referralConfig = body.referralConfig;
    if (body.houseRuleConfig !== undefined) data.houseRuleConfig = body.houseRuleConfig;
    if (body.brandConfig !== undefined) data.brandConfig = body.brandConfig;
    if (body.gamesCatalog !== undefined) data.gamesCatalog = body.gamesCatalog;
    if (body.wingoConfig !== undefined) data.wingoConfig = body.wingoConfig;
    if (body.vipConfig !== undefined) data.vipConfig = body.vipConfig;
    if (body.apkUrl !== undefined) data.apkUrl = body.apkUrl;
    if (body.appVersion !== undefined) data.appVersion = body.appVersion;
    if (body.currency !== undefined) data.currency = body.currency;

    // --- Trash / restore (30 days) ---
    if (body.trashGame || body.restoreGame) {
      const brand = {
        ...(((existing?.brandConfig as object) || {}) as Record<string, unknown>),
        ...(((data.brandConfig as object) || {}) as Record<string, unknown>),
      };
      let trash = Array.isArray(brand.trashedGames)
        ? ([...brand.trashedGames] as Record<string, unknown>[])
        : [];
      const now = Date.now();
      // drop expired
      trash = trash.filter((x) => {
        const purgeAt = x?.purgeAt ? new Date(String(x.purgeAt)).getTime() : 0;
        return !purgeAt || purgeAt > now;
      });

      if (body.trashGame) {
        const code = body.trashGame.code;
        trash = trash.filter((x) => String(x.code) !== code);
        const purgeAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
        trash.push({
          code,
          name: body.trashGame.name || code,
          trashedAt: new Date(now).toISOString(),
          purgeAt,
        });
        // also hide in catalog + disable gameConfig
        const catalog = {
          ...(((existing?.gamesCatalog as object) || {}) as Record<string, unknown>),
          ...(((data.gamesCatalog as object) || {}) as Record<string, unknown>),
        };
        const prev = (catalog[code] as Record<string, unknown>) || {};
        catalog[code] = { ...prev, enabled: false };
        data.gamesCatalog = catalog;

        const gcfg = {
          ...(((existing?.gameConfig as object) || {}) as Record<string, unknown>),
          ...(((data.gameConfig as object) || {}) as Record<string, unknown>),
        };
        const gprev = (gcfg[code] as Record<string, unknown>) || {};
        gcfg[code] = { ...gprev, enabled: false };
        data.gameConfig = gcfg;
      }

      if (body.restoreGame) {
        const code = body.restoreGame.code;
        trash = trash.filter((x) => String(x.code) !== code);
        const catalog = {
          ...(((existing?.gamesCatalog as object) || {}) as Record<string, unknown>),
          ...(((data.gamesCatalog as object) || {}) as Record<string, unknown>),
        };
        const prev = (catalog[code] as Record<string, unknown>) || {};
        catalog[code] = { ...prev, enabled: true };
        data.gamesCatalog = catalog;

        const gcfg = {
          ...(((existing?.gameConfig as object) || {}) as Record<string, unknown>),
          ...(((data.gameConfig as object) || {}) as Record<string, unknown>),
        };
        const gprev = (gcfg[code] as Record<string, unknown>) || {};
        gcfg[code] = { ...gprev, enabled: true };
        data.gameConfig = gcfg;
      }

      brand.trashedGames = trash;
      data.brandConfig = brand;
    }

    const config = await prisma.appConfig.upsert({
      where: { id: "main" },
      create: { id: "main", currency: "BDT", ...data },
      update: data,
    });

    let announcement = null;
    if (body.announcement) {
      try {
        announcement = await prisma.announcement.create({
          data: {
            textEn: body.announcement.textEn,
            textBn: body.announcement.textBn,
            active: body.announcement.active ?? true,
          },
        });
      } catch (e) {
        console.error("[admin/config] announcement", e);
      }
    }

    return ok({ config, announcement });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
