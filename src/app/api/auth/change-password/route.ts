import { z } from "zod";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirmPassword: z.string().min(8),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) return fail("Current login password is incorrect", 400);
    if (await verifyPassword(body.newPassword, user.passwordHash)) return fail("Choose a different new password", 400);
    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return ok({ changed: true });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid password", 400);
    return handleError(e);
  }
}
