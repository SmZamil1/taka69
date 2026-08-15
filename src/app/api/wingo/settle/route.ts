import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import {
  tickAllWingo,
  ensureWingoOpenRound,
  WINGO_GAMES,
  type WingoGameKey,
} from "@/lib/wingo-engine";

export const dynamic = "force-dynamic";

/**
 * Cron / admin settle endpoint.
 * On Vercel Hobby, client polls also call tickAllWingo via GET /api/wingo.
 */
export async function GET(req: Request) {
  const cronSecret = req.headers.get("x-cron-secret");
  const envSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret !== envSecret) {
    try {
      await requireAdmin();
    } catch {
      return fail("Unauthorized", 401);
    }
  }

  try {
    const results = await tickAllWingo(prisma);
    return ok({ results, ts: new Date().toISOString() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    if (body.action === "ensure_rounds") {
      const created: string[] = [];
      for (const game of WINGO_GAMES) {
        const open = await ensureWingoOpenRound(prisma, game as WingoGameKey);
        created.push(`${game}:${open.period}`);
      }
      return ok({ created });
    }
    if (body.action === "tick") {
      const results = await tickAllWingo(prisma);
      return ok({ results });
    }
    return fail("Unknown action", 400);
  } catch (e) {
    return handleError(e);
  }
}
