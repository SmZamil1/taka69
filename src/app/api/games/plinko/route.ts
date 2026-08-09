import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateServerSeed,
  hashServerSeed,
  plinkoDrop,
  PLINKO_SLOTS,
  finalizePayout,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";
import { mergeGameConfig, validateBetAmount } from "@/lib/game-config";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  clientSeed: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const cfg = mergeGameConfig(config?.gameConfig).plinko;
    const err = validateBetAmount(body.amount, cfg);
    if (err) return fail(err);
    if (user.balance < body.amount) return fail("Insufficient balance");

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    let { slot, multiplier, path } = plinkoDrop(serverSeed, clientSeed, nonce);
    const boost = { bigPrize: false };

    await placeBet(user.id, body.amount, "Plinko drop");
    const capped = multiplier > 0
      ? finalizePayout(body.amount, multiplier, cfg)
      : { multiplier: 0, payout: 0, capped: false };

    await prisma.gameRound.create({
      data: {
        gameType: "PLINKO",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        result: {
          slot,
          multiplier: capped.multiplier,
          path,
          slots: PLINKO_SLOTS,
          bigPrize: boost.bigPrize,
          capped: capped.capped,
        },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: "PLINKO",
            amount: body.amount,
            payout: capped.payout,
            multiplier: capped.multiplier,
            won: capped.payout > body.amount,
            cashedOut: capped.payout > 0,
          },
        },
      },
    });

    let balance = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).balance;
    if (capped.payout > 0) {
      const u = await creditWin(user.id, capped.payout, `Plinko x${capped.multiplier}`);
      balance = u.balance;
    }

    return ok({
      slot,
      multiplier: capped.multiplier,
      path,
      slots: PLINKO_SLOTS,
      payout: capped.payout,
      won: capped.payout > body.amount,
      bigPrize: boost.bigPrize,
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
