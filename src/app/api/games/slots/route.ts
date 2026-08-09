import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateServerSeed,
  hashServerSeed,
  slotsSpin,
  SLOT_SYMBOLS,
  SLOT_PAYTABLE,
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
    const cfg = mergeGameConfig(config?.gameConfig).slots;
    const err = validateBetAmount(body.amount, cfg);
    if (err) return fail(err);
    if (user.balance < body.amount) return fail("Insufficient balance");

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    let { reels, multiplier } = slotsSpin(serverSeed, clientSeed, nonce);
    const boost = { bigPrize: false };

    await placeBet(user.id, body.amount, "Slots spin");
    const won = multiplier > 0;
    const capped = won ? finalizePayout(body.amount, multiplier, cfg) : { multiplier: 0, payout: 0, capped: false };

    await prisma.gameRound.create({
      data: {
        gameType: "SLOTS",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        result: { reels, multiplier: capped.multiplier, bigPrize: boost.bigPrize, capped: capped.capped },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: "SLOTS",
            amount: body.amount,
            payout: capped.payout,
            multiplier: capped.multiplier,
            won,
            cashedOut: won,
          },
        },
      },
    });

    let balance = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).balance;
    if (capped.payout > 0) {
      const u = await creditWin(user.id, capped.payout, `Slots x${capped.multiplier}`);
      balance = u.balance;
    }

    return ok({
      reels,
      multiplier: capped.multiplier,
      payout: capped.payout,
      won,
      bigPrize: boost.bigPrize,
      balance,
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      symbols: SLOT_SYMBOLS,
      paytable: SLOT_PAYTABLE,
      limits: { minBet: cfg.minBet, maxBet: cfg.maxBet, maxWin: cfg.maxWin },
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
