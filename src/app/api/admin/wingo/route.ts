import { z } from "zod";
import { requireStaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import {
  selectHouseResult,
  checkWin,
  getMultiplier,
  calcPayout,
  getColors,
  getSize,
} from "@/lib/wingo-engine";

export const dynamic = "force-dynamic";

type WingoCfg = {
  autoPlay: boolean;
  randomLessWin: boolean;
  forceResult: number | null;
  forceOnce: boolean;
};

const DEFAULT_CFG: WingoCfg = {
  autoPlay: true,
  randomLessWin: true,
  forceResult: null,
  forceOnce: false,
};

async function readCfg(): Promise<WingoCfg> {
  const row = await prisma.appConfig.findUnique({ where: { id: "main" } });
  const w = ((row?.wingoConfig as Partial<WingoCfg>) || {}) as Partial<WingoCfg>;
  return {
    autoPlay: w.autoPlay !== false,
    randomLessWin: w.randomLessWin !== false,
    forceResult: typeof w.forceResult === "number" ? w.forceResult : null,
    forceOnce: !!w.forceOnce,
  };
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
    await requireStaffPermission("wingo");
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

const patchSchema = z.object({
  autoPlay: z.boolean().optional(),
  randomLessWin: z.boolean().optional(),
  forceResult: z.number().int().min(0).max(9).nullable().optional(),
  forceOnce: z.boolean().optional(),
  settleNow: z
    .object({
      game: z.enum(["WINGO1", "WINGO3", "WINGO5", "WINGO10"]),
      result: z.number().int().min(0).max(9).optional(),
    })
    .optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireStaffPermission("wingo");
    const body = patchSchema.parse(await req.json());
    const cfg = await readCfg();

    const next: WingoCfg = {
      autoPlay: body.autoPlay ?? cfg.autoPlay,
      randomLessWin: body.randomLessWin ?? cfg.randomLessWin,
      forceResult: body.forceResult !== undefined ? body.forceResult : cfg.forceResult,
      forceOnce: body.forceOnce ?? cfg.forceOnce,
    };

    await writeCfg(next);

    let settle: unknown = null;
    if (body.settleNow) {
      const game = body.settleNow.game;
      const openRound = await prisma.wingoRound.findFirst({
        where: { game, status: "open" },
        include: { bets: { where: { status: "pending" } } },
        orderBy: { period: "desc" },
      });
      if (openRound) {
        const pool: Record<string, number> = {};
        for (const b of openRound.bets) pool[b.bet] = (pool[b.bet] || 0) + b.amount;
        const result =
          typeof body.settleNow.result === "number"
            ? body.settleNow.result
            : selectHouseResult(pool, {
                forceResult: next.forceResult,
                randomLessWin: next.randomLessWin,
              });
        const colors = getColors(result);
        const size = getSize(result);
        for (const b of openRound.bets) {
          const won = checkWin(b.bet, result);
          const mult = getMultiplier(b.bet);
          const payout = won ? calcPayout(b.amount, mult) : 0;
          await prisma.wingoBetRecord.update({
            where: { id: b.id },
            data: { won, payout, status: won ? "won" : "lost" },
          });
          if (won) {
            const userNow = await prisma.user.findUnique({
              where: { id: b.userId },
              select: { balance: true },
            });
            const newBal = (userNow?.balance ?? 0) + payout;
            await prisma.user.update({
              where: { id: b.userId },
              data: { balance: { increment: payout }, totalWin: { increment: payout } },
            });
            await prisma.transaction.create({
              data: {
                userId: b.userId,
                type: "WINGO_WIN",
                amount: payout,
                balanceAfter: newBal,
                note: `WinGo ${game} win — result ${result}`,
                meta: { roundId: openRound.id, result, bet: b.bet },
              },
            });
          }
        }
        await prisma.wingoRound.update({
          where: { id: openRound.id },
          data: { result, status: "closed", closedAt: new Date() },
        });
        const last = await prisma.wingoRound.findFirst({
          where: { game },
          orderBy: { period: "desc" },
        });
        await prisma.wingoRound.create({
          data: { game, period: (last?.period ?? openRound.period) + 1, status: "open" },
        });
        settle = { game, result, colors, size, bets: openRound.bets.length };
        if (next.forceOnce) {
          next.forceResult = null;
          next.forceOnce = false;
          await writeCfg(next);
        }
      }
    }

    return ok({ config: next, settle });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
