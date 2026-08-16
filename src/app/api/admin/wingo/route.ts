import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

type WingoCfg = { autoPlay: boolean };

function normalizeCfg(raw: unknown): WingoCfg {
  const w = raw && typeof raw === "object" ? (raw as { autoPlay?: unknown }) : {};
  return { autoPlay: w.autoPlay !== false };
}

async function readCfg(): Promise<WingoCfg> {
  const row = await prisma.appConfig.findUnique({ where: { id: "main" } });
  return normalizeCfg(row?.wingoConfig);
}

async function writeCfg(cfg: WingoCfg) {
  await prisma.appConfig.upsert({
    where: { id: "main" },
    create: { id: "main", wingoConfig: cfg },
    update: { wingoConfig: cfg },
  });
}

export async function GET() {
  try {
    await requireAdmin();
    const cfg = await readCfg();
    const rounds = await prisma.wingoRound.findMany({
      orderBy: { startedAt: "desc" },
      take: 100,
      include: { _count: { select: { bets: true } } },
    });
    const open = await prisma.wingoRound.findMany({
      where: { status: "open" },
      orderBy: { game: "asc" },
    });
    return ok({ rounds, open, config: cfg });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({ autoPlay: z.boolean().optional() }).strict();

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const cfg = await readCfg();
    const next = { autoPlay: body.autoPlay ?? cfg.autoPlay };
    await writeCfg(next);
    return ok({ config: next });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
