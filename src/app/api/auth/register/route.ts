import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, makeReferralCode, setAuthCookie, signToken } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { notifyUser } from "@/lib/notify";

const schema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscore only"),
  password: z.string().min(6).max(72),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7).max(20).regex(/^[+]?[0-9]+$/, "Invalid phone number").optional().or(z.literal("")),
  referralCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    // Duplicate username check
    const existing = await prisma.user.findUnique({ where: { username: body.username.toLowerCase() } });
    if (existing) return fail("Username already taken", 409);

    // Duplicate email check
    if (body.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
      if (emailExists) return fail("Email already registered", 409);
    }

    // Duplicate phone check
    if (body.phone) {
      const phoneExists = await prisma.user.findFirst({ where: { phone: body.phone } });
      if (phoneExists) return fail("Phone number already registered", 409);
    }

    // At least one contact method required
    if (!body.email && !body.phone) {
      return fail("Email or phone number is required", 400);
    }

    let referredById: string | undefined;
    let referrerUsername: string | undefined;
    if (body.referralCode) {
      const ref = await prisma.user.findUnique({ where: { referralCode: body.referralCode.toUpperCase() } });
      if (ref) { referredById = ref.id; referrerUsername = ref.username; }
    }

    const user = await prisma.user.create({
      data: {
        username: body.username.toLowerCase(),
        email: body.email ? body.email.toLowerCase() : null,
        phone: body.phone || null,
        passwordHash: await hashPassword(body.password),
        balance: 0,
        referralCode: makeReferralCode(body.username),
        referredById,
      },
    });

    if (referredById) {
      await notifyUser(referredById, {
        titleEn: "New referral signup", titleBn: "নতুন রেফারেল সাইনআপ",
        bodyEn: `${user.username} joined with your code. Bonus after their first approved deposit.`,
        bodyBn: `${user.username} আপনার কোডে যোগ দিয়েছেন।`,
        href: "/profile",
      }).catch(() => null);
    }

    await notifyUser(user.id, {
      titleEn: "Welcome to TAKA69", titleBn: "TAKA69-এ স্বাগতম",
      bodyEn: "Account ready. Deposit to start playing (virtual TK).",
      bodyBn: "অ্যাকাউন্ট প্রস্তুত। ভার্চুয়াল TK দিয়ে খেলতে ডিপোজিট করুন।",
      href: "/wallet?tab=deposit",
    }).catch(() => null);

    const token = await signToken({ id: user.id, username: user.username, role: user.role });
    await setAuthCookie(token);

    return ok({ id: user.id, username: user.username, balance: user.balance, role: user.role, referralCode: user.referralCode });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid input", 400);
    return handleError(e);
  }
}
