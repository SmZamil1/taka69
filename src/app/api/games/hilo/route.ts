import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shouldForceHouseLoss } from "@/lib/house-rule";
import {
  generateServerSeed,
  hashServerSeed,
  hiloCard,
  finalizePayout,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";
import { mergeGameConfig, validateBetAmount } from "@/lib/game-config";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  guess: z.enum(["higher", "lower", "same"]),
  current: z.number().int().min(1).max(13).optional(),
  clientSeed: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const __hr = await shouldForceHouseLoss();
    const __forceHouse = __hr.force;
    const body = schema.parse(await req.json());
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const cfg = mergeGameConfig(config?.gameConfig).hilo;
    const err = validateBetAmount(body.amount, cfg);
    if (err) return fail(err);
    if (user.balance < body.amount) return fail("Insufficient balance");

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

    let multiplier = body.guess === "same" ? 12 : 1.9;
    multiplier = Math.min(multiplier, cfg.maxMultiplier);

    await placeBet(user.id, body.amount, `HiLo ${body.guess}`);
    const capped = won
      ? finalizePayout(body.amount, multiplier, cfg)
      : { multiplier: 0, payout: 0, capped: false };

    await prisma.gameRound.create({
      data: {
        gameType: "HILO",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        result: {
          current,
          next,
          guess: body.guess,
          multiplier: capped.multiplier,
          capped: capped.capped,
        },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: "HILO",
            amount: body.amount,
            payout: capped.payout,
            multiplier: (!__forceHouse && won) ? capped.multiplier : 0,
            won,
            cashedOut: won,
          },
        },
      },
    });

    let balance = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).balance;
    if (capped.payout > 0) {
      const u = await creditWin(user.id, capped.payout, `HiLo x${capped.multiplier}`);
      balance = u.balance;
    }

    return ok({
      current,
      next,
      guess: body.guess,
      won,
      multiplier: (!__forceHouse && won) ? capped.multiplier : 0,
      payout: capped.payout,
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
