import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      role: true,
      balance: true,
      vipLevel: true,
      avatar: true,
      isBanned: true,
      permissions: true,
    },
  });

  if (!user || user.isBanned) return fail("Unauthorized", 401);

  const permissions = Array.isArray(user.permissions)
    ? (user.permissions as string[])
    : null;

  return ok({
    id: user.id,
    username: user.username,
    role: user.role,
    balance: user.balance,
    vipLevel: user.vipLevel,
    avatar: user.avatar,
    permissions,
  });
}
