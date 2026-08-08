import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateServerSeed,
  hashServerSeed,
  wheelResult,
  WHEEL_SEGMENTS,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  clientSeed: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    const { index, multiplier } = wheelResult(serverSeed, clientSeed, nonce);

    await placeBet(user.id, body.amount, "Wheel spin");
    const won = multiplier > 0;
    const payout = won ? Math.floor(body.amount * multiplier * 100) / 100 : 0;

    const round = await prisma.gameRound.create({
      data: {
        gameType: "WHEEL",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        result: { index, multiplier, segments: WHEEL_SEGMENTS },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: "WHEEL",
            amount: body.amount,
            payout,
            multiplier,
            won,
            cashedOut: won,
          },
        },
      },
    });

    let balance = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).balance;
    if (payout > 0) {
      const u = await creditWin(user.id, payout, `Wheel x${multiplier}`);
      balance = u.balance;
    }

    return ok({
      roundId: round.id,
      index,
      multiplier,
      segments: WHEEL_SEGMENTS,
      payout,
      won,
      balance,
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
