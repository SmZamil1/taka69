import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  crashPointFromSeeds,
  generateServerSeed,
  hashServerSeed,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Growth: mult = e^(rate * seconds), rate chosen so ~2x at ~3s */
const GROWTH = 0.23;

function multAtElapsed(ms: number) {
  const s = Math.max(0, ms) / 1000;
  return Math.max(1, Math.floor(Math.exp(GROWTH * s) * 100) / 100);
}

function elapsedForMult(mult: number) {
  if (mult <= 1) return 0;
  return (Math.log(mult) / GROWTH) * 1000;
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
      const current = multAtElapsed(elapsed);

      if (current >= crashPoint) {
        // flew away
        await prisma.gameRound.update({
          where: { id: round.id },
          data: {
            status: "completed",
            endedAt: new Date(),
            result: {
              ...(round.result as object),
              busted: true,
              finalMult: crashPoint,
            },
          },
        });
        await prisma.bet.update({
          where: { id: bet.id },
          data: { won: false, payout: 0, multiplier: crashPoint, cashedOut: false },
        });
        const balance = (
          await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
        ).balance;
        return ok({
          crashed: true,
          crashPoint,
          multiplier: crashPoint,
          payout: 0,
          balance,
          won: false,
          serverSeed: round.serverSeed,
          serverSeedHash: round.serverSeedHash,
        });
      }

      const multiplier = current;
      const payout = Math.floor(bet.amount * multiplier * 100) / 100;

      await prisma.gameRound.update({
        where: { id: round.id },
        data: {
          status: "completed",
          endedAt: new Date(),
          result: {
            ...(round.result as object),
            cashedOutAt: multiplier,
            crashPoint,
          },
        },
      });
      await prisma.bet.update({
        where: { id: bet.id },
        data: {
          won: true,
          cashedOut: true,
          payout,
          multiplier,
        },
      });
      const u = await creditWin(user.id, payout, `Crash cashout x${multiplier}`, {
        roundId: round.id,
      });

      return ok({
        crashed: false,
        cashedOut: true,
        crashPoint, // reveal after cashout
        multiplier,
        payout,
        balance: u.balance,
        won: true,
        serverSeed: round.serverSeed,
        serverSeedHash: round.serverSeedHash,
      });
    }

    // ---- STATUS ----
    if (raw.action === "status") {
      const body = statusSchema.parse(raw);
      const round = await prisma.gameRound.findUnique({
        where: { id: body.roundId },
        include: { bets: { where: { userId: user.id } } },
      });
      if (!round) return fail("Not found", 404);
      const crashPoint = round.crashPoint || 1;
      const elapsed = Date.now() - new Date(round.startedAt).getTime();
      let current = multAtElapsed(elapsed);
      let crashed = false;

      if (round.status === "active" && current >= crashPoint) {
        crashed = true;
        current = crashPoint;
        const bet = round.bets[0];
        await prisma.gameRound.update({
          where: { id: round.id },
          data: {
            status: "completed",
            endedAt: new Date(),
            result: { ...(round.result as object), busted: true, finalMult: crashPoint },
          },
        });
        if (bet && !bet.cashedOut) {
          await prisma.bet.update({
            where: { id: bet.id },
            data: { won: false, payout: 0, multiplier: crashPoint },
          });
        }
      } else if (round.status !== "active") {
        crashed = !(round.bets[0]?.cashedOut);
        current = round.bets[0]?.cashedOut
          ? round.bets[0].multiplier || crashPoint
          : crashPoint;
      }

      const balance = (
        await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
      ).balance;

      return ok({
        status: crashed || round.status !== "active" ? "completed" : "active",
        current,
        crashed: crashed || (round.status === "completed" && !round.bets[0]?.cashedOut),
        cashedOut: !!round.bets[0]?.cashedOut,
        crashPoint:
          crashed || round.status !== "active" ? crashPoint : undefined,
        payout: round.bets[0]?.payout || 0,
        balance,
        serverSeed:
          crashed || round.status !== "active" ? round.serverSeed : undefined,
        serverSeedHash: round.serverSeedHash,
        growth: GROWTH,
      });
    }

    // ---- START ----
    const body = startSchema.parse(raw);
    // cancel any leftover active crash for this user
    const active = await prisma.gameRound.findMany({
      where: {
        gameType: "CRASH",
        status: "active",
        bets: { some: { userId: user.id } },
      },
      include: { bets: true },
    });
    for (const r of active) {
      await prisma.gameRound.update({
        where: { id: r.id },
        data: { status: "completed", endedAt: new Date() },
      });
    }

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    const crashPoint = crashPointFromSeeds(serverSeed, clientSeed, nonce);

    await placeBet(user.id, body.amount, `Crash bet ${body.amount}`);

    // auto cashout handled during status/cashout via client; store preference
    const round = await prisma.gameRound.create({
      data: {
        gameType: "CRASH",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        crashPoint,
        status: "active",
        result: {
          autoCashout: body.autoCashout ?? null,
          growth: GROWTH,
          mode: "live",
        },
        bets: {
          create: {
            userId: user.id,
            gameType: "CRASH",
            amount: body.amount,
            payout: 0,
            won: false,
            cashedOut: false,
            meta: { autoCashout: body.autoCashout ?? null },
          },
        },
      },
    });

    await prisma.appConfig.upsert({
      where: { id: "main" },
      create: { id: "main", jackpot: 1_000_000 + body.amount * 0.01 },
      update: { jackpot: { increment: body.amount * 0.01 } },
    });

    const balance = (
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    ).balance;

    // If auto cashout is set and crash is below it, client will see crash via status.
    // If auto is set and reachable, client should call cashout near that mult — also
    // we can resolve instantly server-side for reliability:
    if (body.autoCashout && body.autoCashout <= crashPoint) {
      // schedule conceptually: resolve immediately at auto mult (instant path)
      const multiplier = body.autoCashout;
      const payout = Math.floor(body.amount * multiplier * 100) / 100;
      await prisma.gameRound.update({
        where: { id: round.id },
        data: {
          status: "completed",
          endedAt: new Date(),
          result: {
            autoCashout: body.autoCashout,
            cashedOutAt: multiplier,
            crashPoint,
            mode: "auto",
          },
        },
      });
      const bet = await prisma.bet.findFirst({
        where: { roundId: round.id, userId: user.id },
      });
      if (bet) {
        await prisma.bet.update({
          where: { id: bet.id },
          data: { won: true, cashedOut: true, payout, multiplier },
        });
      }
      const u = await creditWin(user.id, payout, `Crash auto x${multiplier}`, {
        roundId: round.id,
      });
      return ok({
        mode: "auto",
        roundId: round.id,
        crashPoint,
        serverSeedHash,
        serverSeed,
        clientSeed,
        nonce,
        cashedOut: true,
        multiplier,
        payout,
        balance: u.balance,
        won: true,
        growth: GROWTH,
        startedAt: round.startedAt,
      });
    }

    return ok({
      mode: "live",
      roundId: round.id,
      // DO NOT send crashPoint while active
      serverSeedHash,
      clientSeed,
      nonce,
      balance,
      growth: GROWTH,
      startedAt: round.startedAt,
      autoCashout: body.autoCashout ?? null,
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
    return ok({ history, growth: GROWTH });
  } catch (e) {
    return handleError(e);
  }
}
