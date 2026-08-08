import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  crashPointFromSeeds,
  generateServerSeed,
  hashServerSeed,
  finalizePayout,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";
import { mergeGameConfig, validateBetAmount } from "@/lib/game-config";

export const dynamic = "force-dynamic";

/** Aviator-like growth: mult = e^(rate * seconds) — ~2x around 3s */
const GROWTH = 0.23;

function multAtElapsed(ms: number) {
  const s = Math.max(0, ms) / 1000;
  return Math.max(1, Math.floor(Math.exp(GROWTH * s) * 100) / 100);
}

function elapsedForMult(mult: number) {
  if (mult <= 1) return 0;
  return (Math.log(mult) / GROWTH) * 1000;
}

async function loadCrashCfg() {
  const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
  return mergeGameConfig(config?.gameConfig).crash;
}

const startSchema = z.object({
  action: z.literal("start").optional(),
  amount: z.number().positive().max(1_000_000),
  autoCashout: z.number().min(1.01).max(1000).optional(),
  clientSeed: z.string().max(64).optional(),
});

const cashSchema = z.object({
  action: z.literal("cashout"),
  roundId: z.string(),
});

const statusSchema = z.object({
  action: z.literal("status"),
  roundId: z.string(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const raw = await req.json();
    const cfg = await loadCrashCfg();

    // ---- CASHOUT ----
    if (raw.action === "cashout") {
      const body = cashSchema.parse(raw);
      const round = await prisma.gameRound.findUnique({
        where: { id: body.roundId },
        include: { bets: { where: { userId: user.id } } },
      });
      if (!round || round.gameType !== "CRASH") return fail("Round not found", 404);
      if (round.status !== "active") return fail("Round already finished", 400);
      const bet = round.bets[0];
      if (!bet) return fail("No bet", 400);
      if (bet.cashedOut) return fail("Already cashed out", 400);

      const crashPoint = round.crashPoint || 1;
      const elapsed = Date.now() - new Date(round.startedAt).getTime();
      let current = multAtElapsed(elapsed);

      if (current >= crashPoint) {
        // already crashed
        await prisma.gameRound.update({
          where: { id: round.id },
          data: {
            status: "completed",
            endedAt: new Date(),
            result: { ...(round.result as object), crashed: true },
          },
        });
        await prisma.bet.update({
          where: { id: bet.id },
          data: { won: false, payout: 0, cashedOut: false },
        });
        const balance = (
          await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
        ).balance;
        return ok({
          crashed: true,
          crashPoint,
          current: crashPoint,
          balance,
          serverSeed: round.serverSeed,
          serverSeedHash: round.serverSeedHash,
        });
      }

      const capped = finalizePayout(bet.amount, current, cfg);
      const payout = capped.payout;
      const mult = capped.multiplier;

      await prisma.$transaction(async (tx) => {
        await tx.bet.update({
          where: { id: bet.id },
          data: {
            cashedOut: true,
            won: true,
            payout,
            multiplier: mult,
          },
        });
        await tx.gameRound.update({
          where: { id: round.id },
          data: {
            status: "completed",
            endedAt: new Date(),
            result: {
              ...(round.result as object),
              cashedOutAt: mult,
              capped: capped.capped,
            },
          },
        });
      });

      const updated = await creditWin(user.id, payout, `Crash cashout ${mult}x`, {
        roundId: round.id,
        multiplier: mult,
      });

      return ok({
        crashed: false,
        cashedOut: true,
        multiplier: mult,
        payout,
        crashPoint,
        balance: updated.balance,
        serverSeed: round.serverSeed,
        serverSeedHash: round.serverSeedHash,
        capped: capped.capped,
      });
    }

    // ---- STATUS ----
    if (raw.action === "status") {
      const body = statusSchema.parse(raw);
      const round = await prisma.gameRound.findUnique({
        where: { id: body.roundId },
        include: { bets: { where: { userId: user.id } } },
      });
      if (!round) return fail("Round not found", 404);
      const bet = round.bets[0];
      const elapsed = Date.now() - new Date(round.startedAt).getTime();
      const crashPoint = round.crashPoint || 1;
      let current = multAtElapsed(elapsed);
      const crashed = current >= crashPoint || round.status === "completed";
      if (crashed && round.status === "active") {
        current = crashPoint;
        await prisma.gameRound.update({
          where: { id: round.id },
          data: { status: "completed", endedAt: new Date() },
        });
        if (bet && !bet.cashedOut) {
          await prisma.bet.update({
            where: { id: bet.id },
            data: { won: false, payout: 0 },
          });
        }
      }
      const balance = (
        await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
      ).balance;

      const done = round.status === "completed" || crashed || bet?.cashedOut;
      return ok({
        status: done ? "completed" : "active",
        current: Math.min(current, crashPoint),
        crashed: crashed && !bet?.cashedOut,
        cashedOut: !!bet?.cashedOut,
        crashPoint: done ? crashPoint : undefined,
        payout: bet?.payout || 0,
        balance,
        serverSeed: done ? round.serverSeed : undefined,
        serverSeedHash: round.serverSeedHash,
      });
    }

    // ---- START ----
    const body = startSchema.parse(raw);
    const betErr = validateBetAmount(body.amount, cfg);
    if (betErr) return fail(betErr);
    if (user.balance < body.amount) return fail("Insufficient balance");

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    let crashPoint = crashPointFromSeeds(
      serverSeed,
      clientSeed,
      nonce,
      cfg.houseEdge,
      cfg.maxMultiplier
    );

    // optional admin big-prize boost (rare high crash)
    if (Math.random() < cfg.bigPrizeChance) {
      crashPoint = Math.min(
        cfg.maxMultiplier,
        Math.max(crashPoint, cfg.bigPrizeMult)
      );
    }

    // Auto mode: resolve immediately server-side
    if (body.autoCashout) {
      const autoAt = Math.min(body.autoCashout, cfg.maxMultiplier);
      const won = autoAt < crashPoint;
      await placeBet(user.id, body.amount, "Crash bet (auto)");
      const capped = won ? finalizePayout(body.amount, autoAt, cfg) : { multiplier: 0, payout: 0, capped: false };

      const round = await prisma.gameRound.create({
        data: {
          gameType: "CRASH",
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce,
          crashPoint,
          status: "completed",
          endedAt: new Date(),
          result: {
            mode: "auto",
            autoCashout: autoAt,
            won,
            multiplier: capped.multiplier,
          },
          bets: {
            create: {
              userId: user.id,
              gameType: "CRASH",
              amount: body.amount,
              payout: capped.payout,
              multiplier: won ? capped.multiplier : null,
              cashedOut: won,
              won,
            },
          },
        },
      });

      let balance = (
        await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
      ).balance;
      if (won && capped.payout > 0) {
        const u = await creditWin(user.id, capped.payout, `Crash auto ${capped.multiplier}x`, {
          roundId: round.id,
        });
        balance = u.balance;
      }

      return ok({
        mode: "auto",
        roundId: round.id,
        won,
        crashPoint,
        multiplier: won ? capped.multiplier : null,
        payout: capped.payout,
        balance,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
      });
    }

    // Live mode
    await placeBet(user.id, body.amount, "Crash bet");
    const round = await prisma.gameRound.create({
      data: {
        gameType: "CRASH",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        crashPoint,
        status: "active",
        result: { mode: "live", growth: GROWTH },
        bets: {
          create: {
            userId: user.id,
            gameType: "CRASH",
            amount: body.amount,
            payout: 0,
            won: false,
          },
        },
      },
    });

    const balance = (
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    ).balance;

    // schedule end marker via crash duration (client also polls)
    const crashMs = elapsedForMult(crashPoint);

    return ok({
      mode: "live",
      roundId: round.id,
      serverSeedHash,
      clientSeed,
      nonce,
      balance,
      growth: GROWTH,
      startedAt: round.startedAt,
      autoCashout: body.autoCashout ?? null,
      // hint only — not crash point
      maxFlightMs: Math.min(crashMs + 5000, 120_000),
      limits: {
        minBet: cfg.minBet,
        maxBet: cfg.maxBet,
        maxWin: cfg.maxWin,
        maxMultiplier: cfg.maxMultiplier,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}

export async function GET() {
  try {
    const history = await prisma.gameRound.findMany({
      where: { gameType: "CRASH", status: "completed" },
      orderBy: { startedAt: "desc" },
      take: 30,
      select: {
        id: true,
        crashPoint: true,
        startedAt: true,
        serverSeedHash: true,
      },
    });
    const cfg = await loadCrashCfg();
    return ok({
      history,
      growth: GROWTH,
      limits: {
        minBet: cfg.minBet,
        maxBet: cfg.maxBet,
        maxWin: cfg.maxWin,
        maxMultiplier: cfg.maxMultiplier,
        enabled: cfg.enabled,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
