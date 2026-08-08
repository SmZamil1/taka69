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
