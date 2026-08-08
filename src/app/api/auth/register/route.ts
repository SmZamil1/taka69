import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  makeReferralCode,
  setAuthCookie,
  signToken,
} from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import {
  DEFAULT_REFERRAL_CONFIG,
} from "@/lib/game-config";
import { notifyUser } from "@/lib/notify";

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
    let referrerUsername: string | undefined;
    if (body.referralCode) {
      const ref = await prisma.user.findUnique({
        where: { referralCode: body.referralCode.toUpperCase() },
      });
      if (ref) {
        referredById = ref.id;
        referrerUsername = ref.username;
      }
    }

    // No signup bonus — balance starts at 0. Deposit bonus is granted by admin on approval.
    const user = await prisma.user.create({
      data: {
        username: body.username.toLowerCase(),
        email: body.email || null,
        passwordHash: await hashPassword(body.password),
        balance: 0,
        referralCode: makeReferralCode(body.username),
        referredById,
      },
    });

    // Referral bonus is paid after first approved deposit (see admin wallet), not on signup.
    // Still notify referrer that someone joined with their code.
    if (referredById) {
      await notifyUser(referredById, {
        titleEn: "New referral signup",
        titleBn: "নতুন রেফারেল সাইনআপ",
        bodyEn: `${user.username} joined with your code. Bonus after their first approved deposit.`,
        bodyBn: `${user.username} আপনার কোডে যোগ দিয়েছেন। প্রথম অনুমোদিত ডিপোজিটের পর বোনাস।`,
        href: "/profile",
      }).catch(() => null);
    }

    await notifyUser(user.id, {
      titleEn: "Welcome to TAKA69",
      titleBn: "TAKA69-এ স্বাগতম",
      bodyEn: referredById
        ? `Account ready. Referred by ${referrerUsername}. Deposit to start playing (virtual TK).`
        : "Account ready. Deposit to start playing with virtual TK.",
      bodyBn: referredById
        ? `অ্যাকাউন্ট প্রস্তুত। ${referrerUsername} রেফার করেছেন। খেলতে ডিপোজিট করুন (ভার্চুয়াল TK)।`
        : "অ্যাকাউন্ট প্রস্তুত। ভার্চুয়াল TK দিয়ে খেলতে ডিপোজিট করুন।",
      href: "/wallet?tab=deposit",
    }).catch(() => null);

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
