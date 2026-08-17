import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { requireUser, setAuthCookie, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscore only"),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Enter valid BD phone: 01XXXXXXXXX"),
});

/** Complete profile after Google sign-in (username + phone required). */
export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const body = schema.parse(await req.json());
    const username = body.username.toLowerCase().trim();
    const phone = body.phone.trim();

    if (username !== session.username) {
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken && taken.id !== session.id) return fail("Username already taken", 409);
    }

    const phoneTaken = await prisma.user.findUnique({ where: { phone } });
    if (phoneTaken && phoneTaken.id !== session.id) {
      return fail("Phone number already registered", 409);
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: { username, phone },
      select: {
        id: true,
        username: true,
        role: true,
        balance: true,
        vipLevel: true,
        avatar: true,
        email: true,
        phone: true,
      },
    });

    const token = await signToken({ id: user.id, username: user.username, role: user.role });
    await setAuthCookie(token);

    return ok({ ...user, needsOnboarding: false });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
