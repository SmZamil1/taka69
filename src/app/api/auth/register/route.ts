import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  makeReferralCode,
  setAuthCookie,
  signToken,
} from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscore only"),
  password: z.string().min(6).max(72),
  email: z.string().email().optional().or(z.literal("")),
  referralCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.user.findUnique({
      where: { username: body.username.toLowerCase() },
    });
    if (existing) return fail("Username already taken", 409);

    let referredById: string | undefined;
    if (body.referralCode) {
      const ref = await prisma.user.findUnique({
        where: { referralCode: body.referralCode.toUpperCase() },
      });
      if (ref) referredById = ref.id;
    }

    const starting = Number(process.env.NEXT_PUBLIC_STARTING_BALANCE || 10000);
    const user = await prisma.user.create({
      data: {
        username: body.username.toLowerCase(),
        email: body.email || null,
        passwordHash: await hashPassword(body.password),
        balance: starting,
        referralCode: makeReferralCode(body.username),
        referredById,
        transactions: {
          create: {
            type: "DEPOSIT_BONUS",
            amount: starting,
            balanceAfter: starting,
            note: "Welcome bonus (play money)",
          },
        },
      },
    });

    if (referredById) {
      const { adjustBalance } = await import("@/lib/wallet");
      await adjustBalance(referredById, 500, "REFERRAL_BONUS", `Referral: ${user.username}`);
    }

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
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid input", 400);
    return handleError(e);
  }
}
