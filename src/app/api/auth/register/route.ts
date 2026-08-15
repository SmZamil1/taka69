import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { hashPassword, signToken, setAuthCookie, makeReferralCode } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscore only"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Enter valid BD phone: 01XXXXXXXXX")
      .optional()
      .or(z.literal("")),
    referralCode: z.string().optional(),
  })
  .refine((d) => !!(d.email && d.email.trim()) || !!(d.phone && d.phone.trim()), {
    message: "Email or phone is required",
    path: ["email"],
  });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const username = body.username.toLowerCase().trim();
    const email = body.email?.trim().toLowerCase() || null;
    const phone = body.phone?.trim() || null;

    if (!email && !phone) return fail("Email or phone is required", 400);

    const existUser = await prisma.user.findUnique({ where: { username } });
    if (existUser) return fail("Username already taken", 409);

    if (email) {
      const existEmail = await prisma.user.findUnique({ where: { email } });
      if (existEmail) return fail("Email already registered", 409);
    }

    if (phone) {
      const existPhone = await prisma.user.findUnique({ where: { phone } });
      if (existPhone) return fail("Phone number already registered", 409);
    }

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
      data: { username, email, phone, passwordHash, referralCode, referredById, balance: 0 },
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
