import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateServerSeed, hashServerSeed, hiloCard } from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  guess: z.enum(["higher", "lower", "same"]),
  current: z.number().int().min(1).max(13).optional(),
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

    const current = body.current ?? hiloCard(serverSeed, clientSeed, nonce - 1);
    const next = hiloCard(serverSeed, clientSeed, nonce);

    let won = false;
    if (body.guess === "higher") won = next > current;
    if (body.guess === "lower") won = next < current;
    if (body.guess === "same") won = next === current;

    const multiplier = body.guess === "same" ? 12 : 1.9;

    await placeBet(user.id, body.amount, `HiLo ${body.guess}`);
    const payout = won ? Math.floor(body.amount * multiplier * 100) / 100 : 0;

    await prisma.gameRound.create({
      data: {
        gameType: "HILO",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        result: { current, next, guess: body.guess, multiplier },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: "HILO",
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
      const u = await creditWin(user.id, payout, `HiLo x${multiplier}`);
      balance = u.balance;
    }

    return ok({
      current,
      next,
      guess: body.guess,
      won,
      multiplier: won ? multiplier : 0,
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
