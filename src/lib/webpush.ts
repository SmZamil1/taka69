import webpush from "web-push";
import { prisma } from "./db";

/** Stable fallback VAPID pair (override with env on Vercel for production) */
const FALLBACK_PUBLIC =
  "BDJGGahFm2UuIVvBweiCChooY7estK-U3dqg5lubTJIgHy_y6e5QBw4i3lgxRt1r-kTfqkuLTxr4tunD0XAWMkw";
const FALLBACK_PRIVATE = "mbewng-zG-Y4IwVSZ4D31ovAmeTrysMlMtBAOBda4ZQ";

function getVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_PUBLIC;
  const priv = process.env.VAPID_PRIVATE_KEY || FALLBACK_PRIVATE;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@taka69.app";
  return { publicKey: pub, privateKey: priv, subject };
}

export function getVapidPublicKey(): string {
  return getVapid().publicKey;
}

export function configureWebPush() {
  const v = getVapid();
  webpush.setVapidDetails(v.subject, v.publicKey, v.privateKey);
  return v;
}

export type PushPayload = {
  title: string;
  body: string;
  href?: string;
  image?: string;
  tag?: string;
};

export async function saveUserPushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      pushEndpoint: sub.endpoint,
      pushP256dh: sub.keys.p256dh,
      pushAuth: sub.keys.auth,
    },
  });
}

export async function clearUserPushSubscription(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { pushEndpoint: null, pushP256dh: null, pushAuth: null },
  });
}

async function sendToSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
) {
  configureWebPush();
  const subscription = {
    endpoint,
    keys: { p256dh, auth },
  };
  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      href: payload.href || "/",
      image: payload.image || "",
      tag: payload.tag || "taka69",
    }),
    { TTL: 60 * 60, urgency: "high" as const }
  );
}

export async function pushToUser(userId: string, payload: PushPayload) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushEndpoint: true, pushP256dh: true, pushAuth: true },
  });
  if (!u?.pushEndpoint || !u.pushP256dh || !u.pushAuth) return { sent: false, reason: "no_sub" };
  try {
    await sendToSubscription(u.pushEndpoint, u.pushP256dh, u.pushAuth, payload);
    return { sent: true };
  } catch (e: any) {
    const status = e?.statusCode || e?.status;
    if (status === 404 || status === 410) {
      await clearUserPushSubscription(userId);
    }
    console.error("[webpush] user push failed", userId, e?.message || e);
    return { sent: false, reason: String(e?.message || e) };
  }
}

export async function pushToAll(payload: PushPayload, limit = 500) {
  const users = await prisma.user.findMany({
    where: {
      isBanned: false,
      pushEndpoint: { not: null },
      pushP256dh: { not: null },
      pushAuth: { not: null },
    },
    select: { id: true, pushEndpoint: true, pushP256dh: true, pushAuth: true },
    take: limit,
  });
  let sent = 0;
  let failed = 0;
  await Promise.all(
    users.map(async (u) => {
      try {
        await sendToSubscription(u.pushEndpoint!, u.pushP256dh!, u.pushAuth!, payload);
        sent += 1;
      } catch (e: any) {
        failed += 1;
        const status = e?.statusCode || e?.status;
        if (status === 404 || status === 410) {
          await clearUserPushSubscription(u.id).catch(() => {});
        }
      }
    })
  );
  return { sent, failed, total: users.length };
}
