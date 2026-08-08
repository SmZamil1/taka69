import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { saveScreenshotBase64, purgeExpiredUploads } from "@/lib/uploads";
import { notifyUser } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await purgeExpiredUploads().catch(() => 0);
    const { searchParams } = new URL(req.url);
    const asAdmin = searchParams.get("admin") === "1";
    const userId = searchParams.get("userId") || undefined;

    if (asAdmin) {
      await requireAdmin();
      if (userId) {
        const messages = await prisma.chatMessage.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          take: 200,
        });
        await prisma.chatMessage.updateMany({
          where: { userId, sender: "USER", read: false },
          data: { read: true },
        });
        return ok({ messages });
      }
      const recent = await prisma.chatMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { user: { select: { id: true, username: true, avatar: true } } },
      });
      const map = new Map<string, (typeof recent)[0]>();
      for (const m of recent) {
        if (!map.has(m.userId)) map.set(m.userId, m);
      }
      const unread = await prisma.chatMessage.groupBy({
        by: ["userId"],
        where: { sender: "USER", read: false },
        _count: true,
      });
      const unreadMap = Object.fromEntries(unread.map((u) => [u.userId, u._count]));
      return ok({
        threads: Array.from(map.values()).map((m) => ({
          userId: m.userId,
          username: m.user.username,
          avatar: m.user.avatar,
          lastMessage: m.message,
          lastAt: m.createdAt,
          unread: unreadMap[m.userId] || 0,
        })),
      });
    }

    const user = await requireUser();
    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return ok({ messages });
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  message: z.string().max(1000).optional().default(""),
  userId: z.string().optional(),
  image: z.string().max(3_500_000).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    if (!body.message?.trim() && !body.image) {
      return fail("Message or image required");
    }

    if (body.userId) {
      const admin = await requireAdmin();
      let imageUrl: string | undefined;
      let imageExpiresAt: Date | undefined;
      if (body.image) {
        const saved = await saveScreenshotBase64(body.image, "chat");
        imageUrl = saved.url;
        imageExpiresAt = saved.expiresAt;
      }
      const msg = await prisma.chatMessage.create({
        data: {
          userId: body.userId,
          sender: "SUPPORT",
          message: body.message || (imageUrl ? "[image]" : ""),
          imageUrl,
          imageExpiresAt,
        },
      });
      await notifyUser(body.userId, {
        titleEn: "Support reply",
        titleBn: "সাপোর্ট রিপ্লাই",
        bodyEn: (body.message || "New support message").slice(0, 120),
        bodyBn: (body.message || "নতুন সাপোর্ট মেসেজ").slice(0, 120),
        href: "/wallet",
      }).catch(() => null);
      return ok({ message: msg, by: admin.username });
    }

    const user = await requireUser();
    let imageUrl: string | undefined;
    let imageExpiresAt: Date | undefined;
    if (body.image) {
      try {
        const saved = await saveScreenshotBase64(body.image, "chat");
        imageUrl = saved.url;
        imageExpiresAt = saved.expiresAt;
      } catch (err) {
        return fail(err instanceof Error ? err.message : "Invalid image");
      }
    }
    const msg = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        sender: "USER",
        message: body.message || (imageUrl ? "[image]" : ""),
        imageUrl,
        imageExpiresAt,
      },
    });
    return ok({ message: msg });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
