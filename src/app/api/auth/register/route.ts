import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import {
  hashPassword, signToken, setAuthCookie, makeReferralCode,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const username = body.username.toLowerCase().trim();

    // Check username taken
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return fail("Username already taken", 409);

    // Find referrer
    let referredById: string | null = null;
    if (body.referralCode) {
      const ref = await prisma.user.findUnique({
        where: { referralCode: body.referralCode.toUpperCase() },
        select: { id: true },
      });
      if (ref) referredById = ref.id;
    }

    const passwordHash = await hashPassword(body.password);
    const referralCode = makeReferralCode(username);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        referralCode,
        referredById,
        balance: 0,
        vipLevel: 0,
        vipExp: 0,
      },
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
