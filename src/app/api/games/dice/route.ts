import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { diceRoll, generateServerSeed, hashServerSeed } from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  target: z.number().min(1).max(98),
  condition: z.enum(["under", "over"]),
  clientSeed: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    // payout = (100 - houseEdge) / winChance
    const houseEdge = 0.01;
    const winChance = body.condition === "under" ? body.target : 100 - body.target;
    if (winChance <= 0 || winChance >= 100) return fail("Invalid target");
    const multiplier = Math.floor(((100 - houseEdge * 100) / winChance) * 100) / 100;

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    const roll = diceRoll(serverSeed, clientSeed, nonce);

    const won =
      body.condition === "under" ? roll < body.target : roll > body.target;

    await placeBet(user.id, body.amount, `Dice ${body.condition} ${body.target}`);

    const payout = won ? Math.floor(body.amount * multiplier * 100) / 100 : 0;

    const round = await prisma.gameRound.create({
      data: {
        gameType: "DICE",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        result: { roll, target: body.target, condition: body.condition, multiplier },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: "DICE",
            amount: body.amount,
            payout,
            multiplier: won ? multiplier : 0,
            won,
            cashedOut: won,
          },
        },
      },
    });

    let balance = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).balance;
    if (payout > 0) {
      const u = await creditWin(user.id, payout, `Dice win x${multiplier}`);
      balance = u.balance;
    }

    return ok({
      roundId: round.id,
      roll,
      won,
      multiplier,
      payout,
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
