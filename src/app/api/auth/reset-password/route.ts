import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  confirmPassword: z.string().min(1),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const { token, password } = schema.parse(await req.json());

    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset) return fail("Invalid or expired reset link", 400);
    if (reset.used) return fail("This reset link has already been used", 400);
    if (reset.expiresAt < new Date()) return fail("Reset link has expired. Please request a new one.", 400);

    // Find user by email or phone
    let user = null;
    if (reset.email) {
      user = await prisma.user.findUnique({ where: { email: reset.email } });
    } else if (reset.phone) {
      user = await prisma.user.findFirst({ where: { phone: reset.phone } });
    }

    if (!user) return fail("User not found", 404);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.passwordReset.update({
        where: { token },
        data: { used: true },
      }),
    ]);

    return ok({ message: "Password updated successfully. You can now login." });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid input", 400);
    return handleError(e);
  }
}
