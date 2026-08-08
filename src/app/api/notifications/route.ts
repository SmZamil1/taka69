import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.notification.findMany({
      where: {
        OR: [{ userId: user.id }, { global: true }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reads: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    });

    const notifications = items.map((n) => {
      const isRead = n.userId === user.id ? n.read : n.reads.length > 0;
      return {
        id: n.id,
        titleEn: n.titleEn,
        titleBn: n.titleBn,
        bodyEn: n.bodyEn,
        bodyBn: n.bodyBn,
        href: n.href,
        imageUrl: n.imageUrl,
        global: n.global,
        createdAt: n.createdAt,
        read: isRead,
      };
    });

    const unread = notifications.filter((n) => !n.read).length;
    return ok({ notifications, unread });
  } catch (e) {
    return handleError(e);
  }
}

const postSchema = z.object({
  titleEn: z.string().min(1).max(120),
  titleBn: z.string().min(1).max(120),
  bodyEn: z.string().min(1).max(500),
  bodyBn: z.string().min(1).max(500),
  userId: z.string().optional(),
  global: z.boolean().optional(),
  href: z.string().max(300).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
});

/** Admin push — works even when app is closed (browser push + in-app) */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = postSchema.parse(await req.json());
    const isGlobal = body.global !== false && !body.userId;
    if (!isGlobal && !body.userId) return fail("userId required for personal notification");

    if (body.userId) {
      const u = await prisma.user.findUnique({ where: { id: body.userId } });
      if (!u) return fail("User not found", 404);
    }

    const row = await prisma.notification.create({
      data: {
        userId: body.userId || null,
        global: isGlobal,
        titleEn: body.titleEn,
        titleBn: body.titleBn,
        bodyEn: body.bodyEn,
        bodyBn: body.bodyBn,
        href: body.href || null,
        imageUrl: body.imageUrl || null,
        read: false,
      },
    });
    return ok({ notification: row });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));

    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      const globals = await prisma.notification.findMany({
        where: { global: true },
        select: { id: true },
        take: 100,
      });
      for (const g of globals) {
        await prisma.notificationRead.upsert({
          where: {
            userId_notificationId: {
              userId: user.id,
              notificationId: g.id,
            },
          },
          create: { userId: user.id, notificationId: g.id },
          update: {},
        });
      }
      return ok({ cleared: true });
    }

    if (body.id) {
      const n = await prisma.notification.findUnique({ where: { id: body.id } });
      if (!n) return fail("Not found", 404);
      if (n.userId === user.id) {
        await prisma.notification.update({
          where: { id: n.id },
          data: { read: true },
        });
      } else if (n.global) {
        await prisma.notificationRead.upsert({
          where: {
            userId_notificationId: {
              userId: user.id,
              notificationId: n.id,
            },
          },
          create: { userId: user.id, notificationId: n.id },
          update: {},
        });
      } else {
        return fail("Forbidden", 403);
      }
      return ok({ read: true });
    }
    return fail("id or all required");
  } catch (e) {
    return handleError(e);
  }
}
