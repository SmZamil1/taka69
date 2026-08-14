import { clearAuthCookie } from "@/lib/auth";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearAuthCookie();
  return ok({ loggedOut: true });
}
