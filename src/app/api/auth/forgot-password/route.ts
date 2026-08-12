import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import crypto from "crypto";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return ok({ message: "If that email exists, a reset link has been sent." });
    }

    // Delete old tokens for this email
    await prisma.passwordReset.deleteMany({ where: { email: email.toLowerCase() } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: { email: email.toLowerCase(), token, expiresAt },
    });

    // Build reset link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://taka69.vercel.app";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send via notify system (email notification)
    try {
      const { notifyUser } = await import("@/lib/notify");
      await notifyUser(user.id, {
        titleEn: "Password Reset Request",
        titleBn: "পাসওয়ার্ড রিসেট অনুরোধ",
        bodyEn: `Click to reset your password (expires in 1 hour): ${resetLink}`,
        bodyBn: `পাসওয়ার্ড রিসেট করতে ক্লিক করুন (১ ঘণ্টায় মেয়াদ শেষ): ${resetLink}`,
        href: resetLink,
      });
    } catch (_) { /* email send failure should not expose error */ }

    return ok({ message: "If that email exists, a reset link has been sent." });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid email", 400);
    return handleError(e);
  }
}
