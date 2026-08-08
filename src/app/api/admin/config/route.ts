import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import {
  DEFAULT_GAME_CONFIG,
  DEFAULT_PAYMENT_CONFIG,
  DEFAULT_POPUP_CONFIG,
  DEFAULT_REFERRAL_CONFIG,
  mergeGameConfig,
} from "@/lib/game-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const config = await prisma.appConfig.upsert({
      where: { id: "main" },
      create: {
        id: "main",
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
        ],
      },
      update: {},
    });
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return ok({
      config: {
        ...config,
        gameConfig: mergeGameConfig(config.gameConfig),
        paymentConfig: config.paymentConfig || DEFAULT_PAYMENT_CONFIG,
        popupConfig: config.popupConfig || DEFAULT_POPUP_CONFIG,
        referralConfig: config.referralConfig || DEFAULT_REFERRAL_CONFIG,
      },
      announcements,
      defaults: {
        gameConfig: DEFAULT_GAME_CONFIG,
        paymentConfig: DEFAULT_PAYMENT_CONFIG,
        popupConfig: DEFAULT_POPUP_CONFIG,
        referralConfig: DEFAULT_REFERRAL_CONFIG,
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
  apkUrl: z.string().optional().nullable(),
  appVersion: z.string().optional(),
  currency: z.string().optional(),
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

    const data: Record<string, unknown> = {};
    if (typeof body.jackpot === "number") data.jackpot = body.jackpot;
    if (typeof body.maintenance === "boolean") data.maintenance = body.maintenance;
    if (body.banners !== undefined) data.banners = body.banners;
    if (body.gameConfig !== undefined) data.gameConfig = body.gameConfig;
    if (body.paymentConfig !== undefined) data.paymentConfig = body.paymentConfig;
    if (body.supportConfig !== undefined) data.supportConfig = body.supportConfig;
    if (body.popupConfig !== undefined) data.popupConfig = body.popupConfig;
    if (body.referralConfig !== undefined) data.referralConfig = body.referralConfig;
    if (body.apkUrl !== undefined) data.apkUrl = body.apkUrl;
    if (body.appVersion !== undefined) data.appVersion = body.appVersion;
    if (body.currency !== undefined) data.currency = body.currency;

    const config = await prisma.appConfig.upsert({
      where: { id: "main" },
      create: { id: "main", currency: "TK", ...data },
      update: data,
    });

    let announcement = null;
    if (body.announcement) {
      announcement = await prisma.announcement.create({
        data: {
          textEn: body.announcement.textEn,
          textBn: body.announcement.textBn,
          active: body.announcement.active ?? true,
        },
      });
    }

    return ok({ config, announcement });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
