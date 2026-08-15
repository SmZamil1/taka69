import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always return ok to prevent email enumeration
    if (!user) return ok({ sent: true });

    // Delete old tokens
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_URL || ""}/reset-password?token=${token}`;

    // Send email using Resend or SMTP
    await sendResetEmail(user.email!, user.username, resetUrl);

    return ok({ sent: true });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid email", 400);
    return handleError(e);
  }
}

async function sendResetEmail(email: string, username: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[forgot-password] Reset URL for ${email}: ${resetUrl}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "noreply@taka69.com",
      to: email,
      subject: "TAKA69 — Password Reset",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a140a;color:#fff;border-radius:16px">
          <h2 style="color:#fbbf24">🔑 Password Reset</h2>
          <p>Hi <strong>${username}</strong>,</p>
          <p>Click the button below to reset your TAKA69 password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#fbbf24;color:#064e3b;font-weight:bold;border-radius:12px;text-decoration:none">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:12px">If you didn't request this, ignore this email. Your password won't change.</p>
          <p style="color:#6b7280;font-size:12px">Link: ${resetUrl}</p>
        </div>
      `,
    }),
  }).catch(e => console.error("[forgot-password] email error:", e));
}
