import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  login: z.string().min(1), // username, email, or phone
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const login = body.login.trim().toLowerCase();

    // Find by username, email, or phone
    let user = await prisma.user.findUnique({ where: { username: login } });
    if (!user && login.includes("@")) {
      user = await prisma.user.findUnique({ where: { email: login } });
    }
    if (!user && /^01[3-9]\d{8}$/.test(body.login.trim())) {
      user = await prisma.user.findUnique({ where: { phone: body.login.trim() } });
    }

    if (!user) return fail("Invalid credentials", 401);
    if (user.isBanned) return fail("Account banned", 403);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return fail("Invalid credentials", 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = await signToken({ id: user.id, username: user.username, role: user.role });
    await setAuthCookie(token);

    return ok({ id: user.id, username: user.username, role: user.role, balance: user.balance, vipLevel: user.vipLevel, avatar: user.avatar });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
