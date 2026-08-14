import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: q ? { username: { contains: q, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, username: true, balance: true, role: true,
        isBanned: true, createdAt: true, vipLevel: true, vipExp: true,
        totalDeposit: true, totalBet: true, totalCommission: true, referralCode: true,
        _count: { select: { referrals: true } },
      },
    });

    return ok({ users });
  } catch (e) { return handleError(e); }
}

const patchSchema = z.object({
  id: z.string().min(1),
  isBanned: z.boolean().optional(),
  role: z.enum(["USER", "MODERATOR", "SUPPORT", "ADMIN"]).optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const { id, ...data } = patchSchema.parse(await req.json());
    const user = await prisma.user.update({ where: { id }, data });
    return ok({ user: { id: user.id, username: user.username, isBanned: user.isBanned, role: user.role } });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
