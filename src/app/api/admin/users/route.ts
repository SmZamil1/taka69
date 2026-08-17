import { z } from "zod";
import { requireAdmin, requireStaffPermission, type StaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireStaffPermission("users");

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: q ? { username: { contains: q, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        username: true,
        balance: true,
        role: true,
        isBanned: true,
        createdAt: true,
        vipLevel: true,
        vipExp: true,
        totalDeposit: true,
        totalBet: true,
        totalCommission: true,
        referralCode: true,
        permissions: true,
        _count: { select: { referrals: true } },
      },
    });

    return ok({ users });
  } catch (e) {
    return handleError(e);
  }
}

const STAFF_PERMISSIONS: StaffPermission[] = [
  "dashboard", "users", "wallet", "moderation", "support", "games", "wingo", "banners",
  "missions", "vip", "notifications", "promotions", "transactions", "reports", "settings", "system",
];

const patchSchema = z.object({
  id: z.string().min(1),
  isBanned: z.boolean().optional(),
  role: z.enum(["USER", "MODERATOR", "SUPPORT", "ADMIN"]).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function PATCH(req: Request) {
  try {
    const admin = await requireStaffPermission("users");

    const body = patchSchema.parse(await req.json());
    const target = await prisma.user.findUnique({ where: { id: body.id }, select: { id: true, role: true } });
    if (!target) return fail("User not found", 404);
    if (target.id === admin.id && (body.isBanned === true || body.role === "USER")) {
      return fail("You cannot lock or demote your own account", 400);
    }
    const roleOrPermissionChange = body.role !== undefined || body.permissions !== undefined;
    if (roleOrPermissionChange && admin.role !== "ADMIN") {
      return fail("Only ADMIN can change staff roles or permissions", 403);
    }
    if (body.permissions !== undefined) {
      const invalid = body.permissions.filter((permission) => !STAFF_PERMISSIONS.includes(permission as StaffPermission));
      if (invalid.length) return fail(`Unknown permission: ${invalid[0]}`, 400);
    }
    const data: Prisma.UserUpdateInput = {};
    if (typeof body.isBanned === "boolean") data.isBanned = body.isBanned;
    if (body.role) data.role = body.role;
    // allow empty array to clear custom perms (fall back to role defaults)
    if (body.permissions !== undefined) {
      data.permissions = body.permissions as Prisma.InputJsonValue;
    }

    const user = await prisma.user.update({ where: { id: body.id }, data });
    return ok({
      user: {
        id: user.id,
        username: user.username,
        isBanned: user.isBanned,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
