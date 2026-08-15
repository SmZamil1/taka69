import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { mergeGameConfig } from "@/lib/game-config";

export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  action: z.enum(["spin"]).default("spin"),
});

// Fortune Maya: 5x5 grid slot game
const SYMBOLS = ["🌿", "🌸", "🪙", "💎", "🦋", "🌺", "🔮", "⭐"];
const PAYOUTS: Record<string, number[]> = {
  // 3 in a row, 4 in a row, 5 in a row
  "💎": [5, 15, 50],
  "🔮": [4, 12, 40],
  "🦋": [3, 8, 25],
  "🌺": [2, 6, 20],
  "⭐": [2, 5, 15],
  "🪙": [1.5, 4, 12],
  "🌸": [1.5, 3, 10],
  "🌿": [1, 2, 7],
};

function generateGrid(winChance: number): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < 5; r++) {
    const row: string[] = [];
    for (let c = 0; c < 5; c++) {
      row.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    }
    grid.push(row);
  }
  return grid;
}

function calcWin(grid: string[][], bet: number, winChance: number): { payout: number; lines: string[] } {
  // Adjust randomness based on winChance
  if (Math.random() > winChance) return { payout: 0, lines: [] };

  const lines: string[] = [];
  let totalMultiplier = 0;

  // Check rows
  for (const row of grid) {
    const sym = row[0];
    const count = row.filter((s) => s === sym).length;
    if (count >= 3) {
      const payouts = PAYOUTS[sym] || [1, 3, 8];
      const mult = payouts[count - 3] || 0;
      totalMultiplier += mult;
      lines.push(`${sym} x${count} row`);
    }
  }

  // Check columns
  for (let c = 0; c < 5; c++) {
    const col = grid.map((r) => r[c]);
    const sym = col[0];
    const count = col.filter((s) => s === sym).length;
    if (count >= 3) {
      const payouts = PAYOUTS[sym] || [1, 3, 8];
      const mult = payouts[count - 3] || 0;
      totalMultiplier += mult;
      lines.push(`${sym} x${count} col`);
    }
  }

  return { payout: bet * totalMultiplier, lines };
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    // Get config
    const cfg = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const gameConfig = mergeGameConfig(cfg?.gameConfig);
    const slotsCfg = gameConfig.fortune_maya || gameConfig.slots;

    if (!slotsCfg.enabled) return fail("Game is currently disabled", 503);
    if (body.amount < slotsCfg.minBet) return fail(`Minimum bet is ${slotsCfg.minBet} TK`, 400);
    if (body.amount > slotsCfg.maxBet) return fail(`Maximum bet is ${slotsCfg.maxBet} TK`, 400);

    const player = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (player.balance < body.amount) return fail("Insufficient balance", 400);

    // Prefer admin winChancePct (0-100) → 0-1, else rtpTarget/houseEdge
    const winChance =
      typeof (slotsCfg as { winChancePct?: number }).winChancePct === "number"
        ? Math.min(0.99, Math.max(0.01, Number((slotsCfg as { winChancePct?: number }).winChancePct) / 100))
        : slotsCfg.rtpTarget || Math.max(0.01, 1 - (slotsCfg.houseEdge || 0.08));
    const grid = generateGrid(winChance);
    const { payout, lines } = calcWin(grid, body.amount, winChance);
    const capped = Math.min(payout, slotsCfg.maxWin, body.amount * slotsCfg.maxMultiplier);
    const won = capped > 0;

    // Create round
    const round = await prisma.gameRound.create({
      data: {
        gameType: "SLOTS",
        serverSeed: Math.random().toString(36),
        serverSeedHash: Math.random().toString(36),
        result: { grid, lines, payout: capped },
        status: "completed",
        endedAt: new Date(),
      },
    });

    // Create bet
    await prisma.bet.create({
      data: {
        userId: user.id,
        roundId: round.id,
        gameType: "SLOTS",
        amount: body.amount,
        payout: capped,
        won,
        meta: { game: "fortune_maya", grid, lines },
      },
    });

    const net = capped - body.amount;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: { increment: net },
        totalBet: { increment: body.amount },
        totalWin: won ? { increment: capped } : undefined,
        vipExp: { increment: body.amount * 0.1 },
      },
    });

    if (won) {
      await prisma.transaction.create({
        data: { userId: user.id, type: "WIN", amount: capped, balanceAfter: player.balance + net, note: "Fortune Maya win", meta: { game: "fortune_maya", lines } },
      });
    } else {
      await prisma.transaction.create({
        data: { userId: user.id, type: "BET", amount: -body.amount, balanceAfter: player.balance - body.amount, note: "Fortune Maya spin" },
      });
    }

    return ok({ grid, lines, payout: capped, won, balance: player.balance + net });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid input", 400);
    return handleError(e);
  }
}

export async function GET() {
  try {
    const cfg = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const gameConfig = mergeGameConfig(cfg?.gameConfig);
    const slotsCfg = gameConfig.fortune_maya || gameConfig.slots;
    return ok({
      enabled: slotsCfg.enabled,
      minBet: slotsCfg.minBet,
      maxBet: slotsCfg.maxBet,
      maxWin: slotsCfg.maxWin,
      winChancePct:
        typeof (slotsCfg as { winChancePct?: number }).winChancePct === "number"
          ? (slotsCfg as { winChancePct?: number }).winChancePct
          : Math.round((slotsCfg.rtpTarget || 0.92) * 100),
      symbols: SYMBOLS,
    });
  } catch (e) {
    return handleError(e);
  }
}
