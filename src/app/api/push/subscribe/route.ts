import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import {
  clearUserPushSubscription,
  getVapidPublicKey,
  saveUserPushSubscription,
  configureWebPush,
} from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    configureWebPush();
    return ok({ publicKey: getVapidPublicKey() });
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    await saveUserPushSubscription(user.id, body);
    return ok({ subscribed: true });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await clearUserPushSubscription(user.id);
    return ok({ unsubscribed: true });
  } catch (e) {
    return handleError(e);
  }
}
