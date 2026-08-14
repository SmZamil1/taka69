import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import {
  verifyPassword, signToken, setAuthCookie,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().min(1).max(30),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { username: body.username.toLowerCase().trim() },
    });

    if (!user) return fail("Invalid username or password", 401);
    if (user.isBanned) return fail("Account is banned", 403);

    const ok2 = await verifyPassword(body.password, user.passwordHash);
    if (!ok2) return fail("Invalid username or password", 401);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signToken({ id: user.id, username: user.username, role: user.role });
    await setAuthCookie(token);

    return ok({
      id: user.id,
      username: user.username,
      role: user.role,
      balance: user.balance,
      vipLevel: user.vipLevel,
      avatar: user.avatar,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
