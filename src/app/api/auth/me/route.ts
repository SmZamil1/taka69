import { clearAuthCookie, requireUser } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    return ok({
      id: user.id,
      username: user.username,
      balance: user.balance,
      role: user.role,
      referralCode: user.referralCode,
      avatar: user.avatar,
      lastDailyAt: user.lastDailyAt,
      createdAt: user.createdAt,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE() {
  await clearAuthCookie();
  return ok({ loggedOut: true });
}
