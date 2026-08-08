import { prisma } from "./db";

export async function notifyUser(
  userId: string,
  payload: {
    titleEn: string;
    titleBn: string;
    bodyEn: string;
    bodyBn: string;
    href?: string;
  }
) {
  return prisma.notification.create({
    data: {
      userId,
      global: false,
      titleEn: payload.titleEn,
      titleBn: payload.titleBn,
      bodyEn: payload.bodyEn,
      bodyBn: payload.bodyBn,
      href: payload.href,
      read: false,
    },
  });
}

export async function notifyGlobal(payload: {
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  href?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: null,
      global: true,
      titleEn: payload.titleEn,
      titleBn: payload.titleBn,
      bodyEn: payload.bodyEn,
      bodyBn: payload.bodyBn,
      href: payload.href,
      read: false,
    },
  });
}

/** Notify all ADMIN / MODERATOR / SUPPORT accounts */
export async function notifyAdmins(payload: {
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  href?: string;
}) {
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
      read: false,
    })),
  });
  return admins.length;
}
