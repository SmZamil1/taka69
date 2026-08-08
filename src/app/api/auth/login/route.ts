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
    const user = await prisma.user.findUnique({
      where: { username: body.username.toLowerCase() },
    });
    if (!user) return fail("Invalid credentials", 401);
    if (user.isBanned) return fail("Account suspended", 403);
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return fail("Invalid credentials", 401);

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });
    await setAuthCookie(token);

    return ok({
      id: user.id,
      username: user.username,
      balance: user.balance,
      role: user.role,
      referralCode: user.referralCode,
      avatar: user.avatar,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail("Invalid input", 400);
    return handleError(e);
  }
}
