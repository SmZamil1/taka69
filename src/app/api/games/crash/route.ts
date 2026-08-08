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

const betSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  autoCashout: z.number().min(1.01).max(1000).optional(),
  clientSeed: z.string().max(64).optional(),
});

/** Instant crash round (single-player style with shared history) */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = betSchema.parse(await req.json());

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    const crashPoint = crashPointFromSeeds(serverSeed, clientSeed, nonce);

    await placeBet(user.id, body.amount, `Crash bet ${body.amount}`);

    let cashedOut = false;
    let multiplier = 0;
    let payout = 0;

    if (body.autoCashout && body.autoCashout <= crashPoint) {
      cashedOut = true;
      multiplier = body.autoCashout;
      payout = Math.floor(body.amount * multiplier * 100) / 100;
    }

    const round = await prisma.gameRound.create({
      data: {
        gameType: "CRASH",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        crashPoint,
        result: { crashPoint, autoCashout: body.autoCashout ?? null },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: "CRASH",
            amount: body.amount,
            payout,
            multiplier: cashedOut ? multiplier : crashPoint,
            cashedOut,
            won: cashedOut,
            meta: { mode: "instant" },
          },
        },
      },
      include: { bets: true },
    });

    let balance = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).balance;
    if (payout > 0) {
      const u = await creditWin(user.id, payout, `Crash win x${multiplier}`, {
        roundId: round.id,
      });
      balance = u.balance;
    }

    // bump jackpot a tiny bit from house edge portion
    await prisma.appConfig.upsert({
      where: { id: "main" },
      create: { id: "main", jackpot: 1_000_000 + body.amount * 0.01 },
      update: { jackpot: { increment: body.amount * 0.01 } },
    });

    return ok({
      roundId: round.id,
      crashPoint,
      serverSeedHash,
      serverSeed, // revealed after round (instant mode)
      clientSeed,
      nonce,
      cashedOut,
      multiplier: cashedOut ? multiplier : null,
      payout,
      balance,
      won: cashedOut,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}

export async function GET() {
  try {
    const history = await prisma.gameRound.findMany({
      where: { gameType: "CRASH" },
      orderBy: { startedAt: "desc" },
      take: 20,
      select: { id: true, crashPoint: true, startedAt: true, serverSeedHash: true },
    });
    return ok({ history });
  } catch (e) {
    return handleError(e);
  }
}
