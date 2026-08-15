import { z } from "zod";
import { getSession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  path: z.string().max(300).optional(),
});

/** Heartbeat — keeps live visitor count accurate */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json().catch(() => ({})));
    const path = body.path || "/";
    await prisma.userPresence.upsert({
      where: { userId: user.id },
      create: { userId: user.id, path, lastSeen: new Date() },
      update: { path, lastSeen: new Date() },
    });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return ok({ online: 0 });
    const since = new Date(Date.now() - 45_000);
    const online = await prisma.userPresence.count({
      where: { lastSeen: { gte: since } },
    });
    return ok({ online });
  } catch (e) {
    return handleError(e);
  }
}
