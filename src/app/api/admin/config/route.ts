import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const config = await prisma.appConfig.upsert({
      where: { id: "main" },
      create: { id: "main" },
      update: {},
    });
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return ok({ config, announcements });
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  jackpot: z.number().optional(),
  maintenance: z.boolean().optional(),
  banners: z.any().optional(),
  gameConfig: z.any().optional(),
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

    const config = await prisma.appConfig.upsert({
      where: { id: "main" },
      create: { id: "main", ...data },
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
