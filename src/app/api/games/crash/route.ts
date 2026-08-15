import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import {
  ensureCrashRound,
  publicState,
  placeCrashBet,
  cashOutCrashBet,
  cancelCrashBet,
  processAutoCashouts,
  CRASH_GROWTH,
} from "@/lib/crash-engine";

export const dynamic = "force-dynamic";

const betSchema = z.object({
  action: z.literal("bet"),
  amount: z.number().positive().max(1_000_000),
  panel: z.union([z.literal(1), z.literal(2)]).optional(),
  autoCashout: z.number().min(1.01).max(1000).optional(),
  clientSeed: z.string().max(64).optional(),
});

const cashSchema = z.object({
  action: z.literal("cashout"),
  betId: z.string().optional(),
  panel: z.union([z.literal(1), z.literal(2)]).optional(),
  // legacy
  roundId: z.string().optional(),
});

const cancelSchema = z.object({
  action: z.literal("cancel"),
  betId: z.string().optional(),
  panel: z.union([z.literal(1), z.literal(2)]).optional(),
});

const stateSchema = z.object({
  action: z.literal("state").optional(),
});

export async function GET() {
  try {
    await processAutoCashouts();
    const { cfg, round } = await ensureCrashRound();
    const history = await prisma.gameRound.findMany({
      where: { gameType: "CRASH", status: "completed" },
      orderBy: { startedAt: "desc" },
      take: 40,
      select: {
        id: true,
        crashPoint: true,
        startedAt: true,
        serverSeedHash: true,
      },
    });

    // optional auth for myBets
    let userId: string | undefined;
    try {
      const { getSession } = await import("@/lib/auth");
      const u = await getSession();
      userId = u?.id;
    } catch {
      /* public */
    }

    return ok({
      history,
      growth: CRASH_GROWTH,
      limits: cfg
        ? {
            minBet: cfg.minBet,
            maxBet: cfg.maxBet,
            maxWin: cfg.maxWin,
            maxMultiplier: cfg.maxMultiplier,
            enabled: cfg.enabled,
          }
        : undefined,
      live: round && cfg ? publicState(round, cfg, userId) : null,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const raw = await req.json();
    await processAutoCashouts();

    // ---- STATE / STATUS (legacy status supported) ----
    if (!raw.action || raw.action === "state" || raw.action === "status") {
      stateSchema.parse(raw.action ? raw : { action: "state" });
      const { cfg, round } = await ensureCrashRound();
      if (!round || !cfg) return fail("Game disabled", 503);
      const balance = (
        await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
      ).balance;
      return ok({
        ...publicState(round, cfg, user.id),
        balance,
      });
    }

    // ---- BET (also accept legacy start) ----
    if (raw.action === "bet" || raw.action === "start" || !raw.action) {
      // map legacy start
      const body = betSchema.parse(
        raw.action === "start" || !raw.action
          ? { action: "bet", amount: raw.amount, autoCashout: raw.autoCashout, panel: raw.panel || 1 }
          : raw
      );
      try {
        const result = await placeCrashBet({
          userId: user.id,
          amount: body.amount,
          panel: body.panel || 1,
          autoCashout: body.autoCashout,
          clientSeed: body.clientSeed,
        });
        return ok({
          okBet: true,
          betId: result.bet.id,
          balance: result.balance,
          ...result.state,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Bet failed";
        if (msg === "WAITING_NEXT_ROUND") {
          const { cfg, round } = await ensureCrashRound();
          return ok({
            waiting: true,
            message: "Waiting for next round",
            ...(round && cfg ? publicState(round, cfg, user.id) : {}),
            balance: (
              await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
            ).balance,
          });
        }
        return fail(msg, 400);
      }
    }

    // ---- CASHOUT ----
    if (raw.action === "cashout") {
      const body = cashSchema.parse(raw);
      try {
        const result = await cashOutCrashBet({
          userId: user.id,
          betId: body.betId,
          panel: body.panel || 1,
        });
        return ok({
          cashedOut: true,
          crashed: false,
          multiplier: result.multiplier,
          payout: result.payout,
          balance: result.balance,
          capped: result.capped,
          ...result.state,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Cashout failed";
        if (msg === "Already crashed") {
          const { cfg, round } = await ensureCrashRound();
          return ok({
            crashed: true,
            cashedOut: false,
            crashPoint: round?.crashPoint,
            ...(round && cfg ? publicState(round, cfg, user.id) : {}),
            balance: (
              await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
            ).balance,
          });
        }
        return fail(msg, 400);
      }
    }

    // ---- CANCEL (betting phase refund) ----
    if (raw.action === "cancel") {
      const body = cancelSchema.parse(raw);
      try {
        const result = await cancelCrashBet({
          userId: user.id,
          betId: body.betId,
          panel: body.panel || 1,
        });
        return ok({
          cancelled: true,
          balance: result.balance,
          ...result.state,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Cancel failed";
        return fail(msg, 400);
      }
    }

    return fail("Unknown action", 400);
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
