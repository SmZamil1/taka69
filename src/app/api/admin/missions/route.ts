import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/admin/missions — list all missions (including inactive) with claim counts */
export async function GET() {
  try {
    await requireAdmin();
    const missions = await prisma.mission.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { progress: { where: { claimed: true } } } },
      },
    });
    return ok({ missions });
  } catch (e) {
    return handleError(e);
  }
}

const missionSchema = z.object({
  code: z.string().min(1).max(40).regex(/^[A-Z0-9_]+$/, "Code must be UPPER_SNAKE_CASE"),
  titleEn: z.string().min(1).max(120),
  titleBn: z.string().min(1).max(120),
  descriptionEn: z.string().min(1).max(300),
  descriptionBn: z.string().min(1).max(300),
  target: z.number().int().min(1),
  reward: z.number().min(1),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

/** POST /api/admin/missions — create a new mission */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = missionSchema.parse(await req.json());
    const existing = await prisma.mission.findUnique({ where: { code: body.code } });
    if (existing) return fail("Mission code already exists", 409);
    const mission = await prisma.mission.create({ data: body });
    return ok({ mission });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}

const updateSchema = missionSchema.partial().extend({
  id: z.string().min(1),
});

/** PATCH /api/admin/missions — update an existing mission */
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const { id, ...data } = updateSchema.parse(await req.json());
    const existing = await prisma.mission.findUnique({ where: { id } });
    if (!existing) return fail("Mission not found", 404);
    if (data.code && data.code !== existing.code) {
      const clash = await prisma.mission.findUnique({ where: { code: data.code } });
      if (clash) return fail("Mission code already exists", 409);
    }
    const mission = await prisma.mission.update({ where: { id }, data });
    return ok({ mission });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}

/** DELETE /api/admin/missions?id=xxx — delete a mission and its progress */
export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return fail("id required");
    const existing = await prisma.mission.findUnique({ where: { id } });
    if (!existing) return fail("Mission not found", 404);
    await prisma.missionProgress.deleteMany({ where: { missionId: id } });
    await prisma.mission.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
