import { z } from "zod";
import { requireUser, setAuthCookie, signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  username: z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscore only").optional(),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().email("Enter a valid email address").nullable().optional(),
  ),
  phone: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().regex(/^01[3-9]\d{8}$/, "Enter valid BD phone: 01XXXXXXXXX").nullable().optional(),
  ),
  avatar: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(500).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "Enter a valid image URL").nullable().optional(),
  ),
  currentPassword: z.string().min(1).optional(),
}).refine((value) => Object.keys(value).some((key) => key !== "currentPassword" && value[key as keyof typeof value] !== undefined), {
  message: "Add at least one profile change",
});

async function profileData(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      balance: true,
      vipLevel: true,
      vipExp: true,
      totalDeposit: true,
      totalBet: true,
      totalWin: true,
      totalCommission: true,
      referralCode: true,
      avatar: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function GET() {
  try {
    const session = await requireUser();
    return ok(await profileData(session.id));
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = updateSchema.parse(await req.json());
    const username = body.username === undefined ? undefined : body.username.toLowerCase();
    const email = body.email === undefined ? undefined : body.email?.toLowerCase() || null;
    const phone = body.phone === undefined ? undefined : body.phone || null;
    const avatar = body.avatar === undefined ? undefined : body.avatar || null;
    const identityChange = (username !== undefined && username !== user.username)
      || (email !== undefined && email !== user.email)
      || (phone !== undefined && phone !== user.phone);

    if (identityChange && (!body.currentPassword || !(await verifyPassword(body.currentPassword, user.passwordHash)))) {
      return fail("Current login password is required for username, email, or phone changes", 400);
    }

    if (username !== undefined) {
      const existing = await prisma.user.findFirst({ where: { username, NOT: { id: user.id } }, select: { id: true } });
      if (existing) return fail("Username already taken", 409);
    }
    if (email !== undefined && email !== null) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: user.id } }, select: { id: true } });
      if (existing) return fail("Email already registered", 409);
    }
    if (phone !== undefined && phone !== null) {
      const existing = await prisma.user.findFirst({ where: { phone, NOT: { id: user.id } }, select: { id: true } });
      if (existing) return fail("Phone number already registered", 409);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { username, email, phone, avatar },
      select: { id: true, username: true, role: true },
    });

    if (username !== undefined && username !== user.username) {
      const token = await signToken({ id: updated.id, username: updated.username, role: updated.role });
      await setAuthCookie(token);
    }

    return ok(await profileData(user.id));
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid profile data", 400);
    if (typeof e === "object" && e && "code" in e && (e as { code?: string }).code === "P2002") return fail("That profile value is already in use", 409);
    return handleError(e);
  }
}
