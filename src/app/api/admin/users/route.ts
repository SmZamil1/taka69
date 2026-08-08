import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustBalance } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        role: true,
        isBanned: true,
        referralCode: true,
        createdAt: true,
        _count: { select: { bets: true, referrals: true } },
      },
    });
    return ok({ users });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  userId: z.string(),
  action: z.enum(["ban", "unban", "set_role", "adjust_balance"]),
  role: z.enum(["USER", "ADMIN", "MODERATOR"]).optional(),
  amount: z.number().optional(),
  note: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const target = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!target) return fail("User not found", 404);

    if (body.action === "ban") {
      await prisma.user.update({
        where: { id: body.userId },
        data: { isBanned: true },
      });
      return ok({ banned: true });
    }
    if (body.action === "unban") {
      await prisma.user.update({
        where: { id: body.userId },
        data: { isBanned: false },
      });
      return ok({ banned: false });
    }
    if (body.action === "set_role") {
      if (!body.role) return fail("role required");
      if (admin.role !== "ADMIN") return fail("Only ADMIN can change roles", 403);
      await prisma.user.update({
        where: { id: body.userId },
        data: { role: body.role },
      });
      return ok({ role: body.role });
    }
    if (body.action === "adjust_balance") {
      if (typeof body.amount !== "number") return fail("amount required");
      const u = await adjustBalance(
        body.userId,
        body.amount,
        "ADMIN_ADJUST",
        body.note || `Adjusted by ${admin.username}`
      );
      return ok({ balance: u.balance });
    }
    return fail("Unknown action");
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
