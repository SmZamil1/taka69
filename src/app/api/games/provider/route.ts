import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shouldForceHouseLoss } from "@/lib/house-rule";
import {
  generateServerSeed,
  hashServerSeed,
  providerSpin,
  finalizePayout,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";
import {
  mergeGameConfig,
  validateBetAmount,
  type GameCode,
} from "@/lib/game-config";
import type { GameType } from "@prisma/client";

export const dynamic = "force-dynamic";

const PROVIDERS: Record<string, { code: GameCode; gameType: GameType; label: string }> = {
  jili: { code: "jili", gameType: "JILI", label: "Jili" },
  pg: { code: "pg", gameType: "PG", label: "PG Soft" },
  spribe: { code: "spribe", gameType: "SPRIBE", label: "Spribe" },
  evolution: { code: "evolution", gameType: "EVOLUTION", label: "Evolution" },
  fa_chai: { code: "fa_chai", gameType: "FA_CHAI", label: "Fa Chai" },
  jdb: { code: "jdb", gameType: "JDB", label: "JDB" },
};

const schema = z.object({
  provider: z.enum(["jili", "pg", "spribe", "evolution", "fa_chai", "jdb"]),
  amount: z.number().positive().max(1_000_000),
  clientSeed: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const __hr = await shouldForceHouseLoss();
    const __forceHouse = __hr.force;
    const body = schema.parse(await req.json());
    const meta = PROVIDERS[body.provider];
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const cfg = mergeGameConfig(config?.gameConfig)[meta.code];
    const err = validateBetAmount(body.amount, cfg);
    if (err) return fail(err);
    if (user.balance < body.amount) return fail("Insufficient balance");

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    const spin = providerSpin(serverSeed, clientSeed, nonce, cfg);
    const capped = spin.multiplier > 0
      ? finalizePayout(body.amount, spin.multiplier, cfg)
      : { multiplier: 0, payout: 0, capped: false };

    await placeBet(user.id, body.amount, `${meta.label} spin`);
    const won = capped.payout > 0;

    await prisma.gameRound.create({
      data: {
        gameType: meta.gameType,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        result: {
          provider: body.provider,
          symbols: spin.symbols,
          multiplier: capped.multiplier,
          bigPrize: spin.bigPrize,
          capped: capped.capped,
        },
        status: "completed",
        endedAt: new Date(),
        bets: {
          create: {
            userId: user.id,
            gameType: meta.gameType,
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
      const u = await creditWin(user.id, capped.payout, `${meta.label} x${capped.multiplier}`);
      balance = u.balance;
    }

    return ok({
      provider: body.provider,
      label: meta.label,
      symbols: spin.symbols,
      multiplier: capped.multiplier,
      payout: capped.payout,
      won,
      bigPrize: spin.bigPrize,
      balance,
      serverSeed,
      serverSeedHash,
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
