import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { hashPassword, signToken, setAuthCookie, makeReferralCode } from "@/lib/auth";

export const dynamic = "force-dynamic";

type GooglePayload = {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  aud?: string;
};

async function verifyGoogleIdToken(idToken: string): Promise<GooglePayload | null> {
  // tokeninfo endpoint (simple; production can use google-auth-library)
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as GooglePayload;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  // Google must explicitly confirm ownership of the returned email address.
  const emailVerified = data.email_verified === true || data.email_verified === "true";
  if (!emailVerified) return null;
  // If an audience is configured, require an exact match (including presence).
  if (clientId && data.aud !== clientId) return null;
  if (!data.sub) return null;
  return data;
}

function usernameFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 14);
  return base.length >= 3 ? base : `user${randomBytes(3).toString("hex")}`;
}

export async function POST(req: Request) {
  try {
    const body = z
      .object({
        idToken: z.string().min(20),
        referralCode: z.string().optional(),
      })
      .parse(await req.json());

    const payload = await verifyGoogleIdToken(body.idToken);
    if (!payload) return fail("Invalid Google token", 401);

    const email = (payload.email || "").toLowerCase().trim();
    if (!email) return fail("Google account has no email", 400);

    // Never silently link a Google identity to an existing local account by email.
    // There is no persisted Google subject in the current schema, so an email match
    // is ambiguous and must be resolved by signing in with the existing method.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return fail(
        "An account with this email already exists. Sign in with your password first; Google sign-in will not link accounts automatically.",
        409
      );
    }

    // Create placeholder username; onboarding will set final username + phone.
    let username = usernameFromEmail(email);
    let n = 0;
    while (await prisma.user.findUnique({ where: { username } })) {
      n += 1;
      username = `${usernameFromEmail(email)}${n}`.slice(0, 20);
    }

    let referredById: string | null = null;
    if (body.referralCode) {
      const ref = await prisma.user.findUnique({
        where: { referralCode: body.referralCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (ref) referredById = ref.id;
    }

    const passwordHash = await hashPassword(randomBytes(24).toString("hex"));
    const referralCode = makeReferralCode(username);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone: null,
        passwordHash,
        referralCode,
        referredById,
        balance: 0,
        avatar: payload.picture || null,
        isVerified: true,
      },
    });

    if (user.isBanned) return fail("Account banned", 403);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signToken({ id: user.id, username: user.username, role: user.role });
    await setAuthCookie(token);

    const needsOnboarding = !user.phone;

    return ok({
      id: user.id,
      username: user.username,
      role: user.role,
      balance: user.balance,
      vipLevel: user.vipLevel,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      needsOnboarding,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
