import { prisma } from "./db";
import { pushToAll, pushToUser } from "./webpush";

type Payload = {
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  href?: string;
  imageUrl?: string;
};

async function firePush(userId: string | null, global: boolean, payload: Payload, tag?: string) {
  const p = {
    title: payload.titleEn,
    body: payload.bodyEn,
    href: payload.href || "/",
    image: payload.imageUrl || "",
    tag: tag || "taka69",
  };
  try {
    if (global) await pushToAll(p);
    else if (userId) await pushToUser(userId, p);
  } catch (e) {
    console.error("[notify] push failed", e);
  }
}

export async function notifyUser(userId: string, payload: Payload) {
  const row = await prisma.notification.create({
    data: {
      userId,
      global: false,
      titleEn: payload.titleEn,
      titleBn: payload.titleBn,
      bodyEn: payload.bodyEn,
      bodyBn: payload.bodyBn,
      href: payload.href,
      imageUrl: payload.imageUrl,
      read: false,
    },
  });
  await firePush(userId, false, payload, row.id);
  return row;
}

export async function notifyGlobal(payload: Payload) {
  const row = await prisma.notification.create({
    data: {
      userId: null,
      global: true,
      titleEn: payload.titleEn,
      titleBn: payload.titleBn,
      bodyEn: payload.bodyEn,
      bodyBn: payload.bodyBn,
      href: payload.href,
      imageUrl: payload.imageUrl,
      read: false,
    },
  });
  await firePush(null, true, payload, row.id);
  return row;
}

/** Notify all ADMIN / MODERATOR / SUPPORT accounts */
export async function notifyAdmins(payload: Payload) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MODERATOR", "SUPPORT"] }, isBanned: false },
    select: { id: true },
  });
  if (!admins.length) return 0;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      global: false,
      titleEn: payload.titleEn,
      titleBn: payload.titleBn,
      bodyEn: payload.bodyEn,
      bodyBn: payload.bodyBn,
      href: payload.href || "/admin/wallet",
      imageUrl: payload.imageUrl,
      read: false,
    })),
  });
  await Promise.all(
    admins.map((a) =>
      firePush(
        a.id,
        false,
        { ...payload, href: payload.href || "/admin/wallet" },
        `admin-${a.id}`
      )
    )
  );
  return admins.length;
}
