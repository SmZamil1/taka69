import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shouldForceHouseLoss } from "@/lib/house-rule";
import {
  generateServerSeed,
  hashServerSeed,
  minesLayout,
  minesMultiplier,
  finalizePayout,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";
import { mergeGameConfig, validateBetAmount } from "@/lib/game-config";

const startSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  mineCount: z.number().int().min(1).max(24),
  clientSeed: z.string().max(64).optional(),
});

const revealSchema = z.object({
  action: z.literal("reveal"),
  roundId: z.string(),
  tile: z.number().int().min(0).max(24),
});

const cashoutSchema = z.object({
  action: z.literal("cashout"),
  roundId: z.string(),
});

const GRID = 25;

async function loadCfg() {
  const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
  return mergeGameConfig(config?.gameConfig).mines;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const __hr = await shouldForceHouseLoss();
    const __forceHouse = __hr.force;
    const raw = await req.json();
    const cfg = await loadCfg();

    if (raw.action === "reveal") {
      const body = revealSchema.parse(raw);
      const round = await prisma.gameRound.findUnique({
        where: { id: body.roundId },
        include: { bets: { where: { userId: user.id } } },
      });
      if (!round || round.gameType !== "MINES" || round.status !== "active") {
        return fail("Invalid round", 400);
      }
      const bet = round.bets[0];
      if (!bet) return fail("No bet", 400);

      const result = round.result as {
        mines: number[];
        revealed: number[];
        mineCount: number;
        amount: number;
      };
      if (result.revealed.includes(body.tile)) return fail("Already revealed");

      const hitMine = result.mines.includes(body.tile);
      const revealed = [...result.revealed, body.tile];

      if (hitMine) {
        await prisma.gameRound.update({
          where: { id: round.id },
          data: {
            status: "completed",
            endedAt: new Date(),
            result: { ...result, revealed, busted: true },
          },
        });
        await prisma.bet.update({
          where: { id: bet.id },
          data: { won: false, payout: 0, multiplier: 0 },
        });
        const balance = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).balance;
        return ok({
          busted: true,
          mines: result.mines,
          revealed,
          payout: 0,
          balance,
        });
      }

      let mult = minesMultiplier(GRID, result.mineCount, revealed.length, cfg.houseEdge);
      mult = Math.min(mult, cfg.maxMultiplier);
      const potential = finalizePayout(result.amount, mult, cfg);
      await prisma.gameRound.update({
        where: { id: round.id },
        data: { result: { ...result, revealed, currentMult: potential.multiplier } },
      });
      await prisma.bet.update({
        where: { id: bet.id },
        data: { multiplier: potential.multiplier },
      });

      return ok({
        busted: false,
        tile: body.tile,
        revealed,
        multiplier: potential.multiplier,
        potentialPayout: potential.payout,
      });
    }

    if (raw.action === "cashout") {
      const body = cashoutSchema.parse(raw);
      const round = await prisma.gameRound.findUnique({
        where: { id: body.roundId },
        include: { bets: { where: { userId: user.id } } },
      });
      if (!round || round.status !== "active") return fail("Invalid round");
      const bet = round.bets[0];
      const result = round.result as {
        mines: number[];
        revealed: number[];
        mineCount: number;
        amount: number;
      };
      if (!result.revealed.length) return fail("Reveal at least one tile");

      let mult = minesMultiplier(GRID, result.mineCount, result.revealed.length, cfg.houseEdge);
      const capped = finalizePayout(result.amount, mult, cfg);

      await prisma.gameRound.update({
        where: { id: round.id },
        data: {
          status: "completed",
          endedAt: new Date(),
          result: {
            ...result,
            cashedOut: true,
            multiplier: capped.multiplier,
            capped: capped.capped,
          },
        },
      });
      await prisma.bet.update({
        where: { id: bet.id },
        data: {
          won: true,
          cashedOut: true,
          payout: capped.payout,
          multiplier: capped.multiplier,
        },
      });
      const u = await creditWin(user.id, capped.payout, `Mines cashout x${capped.multiplier}`);
      return ok({
        cashedOut: true,
        multiplier: capped.multiplier,
        payout: capped.payout,
        balance: u.balance,
        mines: result.mines,
        serverSeed: round.serverSeed,
      });
    }

    const body = startSchema.parse(raw);
    const err = validateBetAmount(body.amount, cfg);
    if (err) return fail(err);
    if (user.balance < body.amount) return fail("Insufficient balance");

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = body.clientSeed || user.id.slice(0, 8);
    const nonce = Date.now() % 1_000_000;
    const mines = minesLayout(serverSeed, clientSeed, nonce, GRID, body.mineCount);

    await placeBet(user.id, body.amount, `Mines x${body.mineCount}`);

    const round = await prisma.gameRound.create({
      data: {
        gameType: "MINES",
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        status: "active",
        result: {
          mines,
          revealed: [],
          mineCount: body.mineCount,
          amount: body.amount,
        },
        bets: {
          create: {
            userId: user.id,
            gameType: "MINES",
            amount: body.amount,
            payout: 0,
            won: false,
          },
        },
      },
    });

    const balance = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).balance;

    return ok({
      roundId: round.id,
      serverSeedHash,
      clientSeed,
      nonce,
      mineCount: body.mineCount,
      gridSize: GRID,
      balance,
      limits: { minBet: cfg.minBet, maxBet: cfg.maxBet, maxWin: cfg.maxWin },
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
