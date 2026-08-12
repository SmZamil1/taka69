import { z } from "zod";
import { prisma } from "@/lib/db";
import { setAuthCookie, signToken, verifyPassword } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const identifier = body.username.trim().toLowerCase();

    // Accept username, email, or phone
    let user = await prisma.user.findUnique({ where: { username: identifier } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: identifier } });
    }
    if (!user) {
      // phone lookup (strip leading zeros / spaces)
      const cleaned = identifier.replace(/\s/g, "");
      user = await prisma.user.findFirst({ where: { phone: cleaned } });
    }

    if (!user) return fail("Invalid credentials", 401);
    if (user.isBanned) return fail("Account suspended", 403);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return fail("Invalid credentials", 401);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => null);

    const token = await signToken({ id: user.id, username: user.username, role: user.role });
    await setAuthCookie(token);

    return ok({ id: user.id, username: user.username, balance: user.balance, role: user.role, referralCode: user.referralCode, avatar: user.avatar });
  } catch (e) {
    if (e instanceof z.ZodError) return fail("Invalid input", 400);
    return handleError(e);
  }
}
