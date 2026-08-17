import { z } from "zod";
import { requireStaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { notifyGlobal } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStaffPermission("promotions");
    const promos = await prisma.notification.findMany({
      where: { global: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, titleEn: true, titleBn: true, bodyEn: true, bodyBn: true, href: true, createdAt: true },
    });
    return ok({ promos });
  } catch (e) { return handleError(e); }
}

const schema = z.object({
  titleEn: z.string().min(1).max(120),
  titleBn: z.string().optional().default(""),
  bodyEn: z.string().min(1).max(500),
  bodyBn: z.string().optional().default(""),
  href: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await requireStaffPermission("promotions");
    const body = schema.parse(await req.json());
    const promo = await notifyGlobal({
      titleEn: body.titleEn,
      titleBn: body.titleBn || body.titleEn,
      bodyEn: body.bodyEn,
      bodyBn: body.bodyBn || body.bodyEn,
      href: body.href || "/",
    });
    return ok({ promo });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireStaffPermission("promotions");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return fail("id required");
    await prisma.notificationRead.deleteMany({ where: { notificationId: id } });
    await prisma.notification.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return handleError(e); }
}
