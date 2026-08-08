import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateServerSeed,
  hashServerSeed,
  minesLayout,
  minesMultiplier,
} from "@/lib/fairness";
import { creditWin, placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

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

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const raw = await req.json();

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

      const mult = minesMultiplier(GRID, result.mineCount, revealed.length);
      await prisma.gameRound.update({
        where: { id: round.id },
        data: { result: { ...result, revealed, currentMult: mult } },
      });
      await prisma.bet.update({
        where: { id: bet.id },
        data: { multiplier: mult },
      });

      return ok({
        busted: false,
        tile: body.tile,
        revealed,
        multiplier: mult,
        potentialPayout: Math.floor(result.amount * mult * 100) / 100,
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

      const mult = minesMultiplier(GRID, result.mineCount, result.revealed.length);
      const payout = Math.floor(result.amount * mult * 100) / 100;

      await prisma.gameRound.update({
        where: { id: round.id },
        data: {
          status: "completed",
          endedAt: new Date(),
          serverSeed: round.serverSeed, // already stored
          result: { ...result, cashedOut: true, multiplier: mult },
        },
      });
      await prisma.bet.update({
        where: { id: bet.id },
        data: { won: true, cashedOut: true, payout, multiplier: mult },
      });
      const u = await creditWin(user.id, payout, `Mines cashout x${mult}`);
      return ok({
        cashedOut: true,
        multiplier: mult,
        payout,
        balance: u.balance,
        mines: result.mines,
        serverSeed: round.serverSeed,
      });
    }

    // start new game
    const body = startSchema.parse(raw);
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
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
