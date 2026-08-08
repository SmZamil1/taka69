import { prisma } from "./db";

type Payload = {
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  href?: string;
  imageUrl?: string;
};

export async function notifyUser(userId: string, payload: Payload) {
  return prisma.notification.create({
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
}

export async function notifyGlobal(payload: Payload) {
  return prisma.notification.create({
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
  return admins.length;
}
