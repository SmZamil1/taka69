import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { mergeGameConfig } from "@/lib/game-config";

export const dynamic = "force-dynamic";

const ROWS = 16;
// Multipliers for each slot (0 = leftmost) in a 16-row plinko
const MULTIPLIERS = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  risk: z.enum(["low", "medium", "high"]).default("medium"),
  rows: z.number().min(8).max(16).default(16).optional(),
});

function simulateDrop(risk: string, winChance: number): { path: number[]; slot: number; multiplier: number } {
  let pos = 0;
  const path: number[] = [0];
  // Bias based on risk and winChance
  const centerBias = risk === "low" ? 0.6 : risk === "medium" ? 0.5 : 0.4;
  const winBias = winChance < 0.5 ? -0.05 : 0.05; // tilt toward center for higher win chance

  for (let i = 0; i < ROWS; i++) {
    const goRight = Math.random() < (0.5 + (pos < ROWS / 2 ? 0.02 : -0.02)); // slight center pull
    if (goRight) pos++;
    path.push(pos);
  }

  const slot = Math.max(0, Math.min(MULTIPLIERS.length - 1, pos));

  // Apply risk multiplier scaling
  let mult = MULTIPLIERS[slot];
  if (risk === "low") mult = Math.min(mult, 10);
  if (risk === "medium") mult = Math.min(mult, 50);

  return { path, slot, multiplier: mult };
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const cfg = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const gameConfig = mergeGameConfig(cfg?.gameConfig);
    const plinkoCfg = gameConfig.extreme_plinko || gameConfig.plinko;

    if (!plinkoCfg.enabled) return fail("Plinko is currently disabled", 503);
    if (body.amount < plinkoCfg.minBet) return fail(`Minimum bet is ${plinkoCfg.minBet} TK`, 400);
    if (body.amount > plinkoCfg.maxBet) return fail(`Maximum bet is ${plinkoCfg.maxBet} TK`, 400);

    const player = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (player.balance < body.amount) return fail("Insufficient balance", 400);

    const winChance =
      typeof (plinkoCfg as { winChancePct?: number }).winChancePct === "number"
        ? Math.min(0.99, Math.max(0.01, Number((plinkoCfg as { winChancePct?: number }).winChancePct) / 100))
        : plinkoCfg.rtpTarget || 0.93;
    const { path, slot, multiplier } = simulateDrop(body.risk, winChance);
    const rawPayout = body.amount * multiplier;
    const capped = Math.min(rawPayout, plinkoCfg.maxWin, body.amount * plinkoCfg.maxMultiplier);
    const won = capped > body.amount;

    const round = await prisma.gameRound.create({
      data: {
        gameType: "PLINKO",
        serverSeed: Math.random().toString(36),
        serverSeedHash: Math.random().toString(36),
        result: { path, slot, multiplier, risk: body.risk },
        status: "completed",
        endedAt: new Date(),
      },
    });

    await prisma.bet.create({
      data: {
        userId: user.id,
        roundId: round.id,
        gameType: "PLINKO",
        amount: body.amount,
        payout: capped,
        multiplier,
        won,
        meta: { path, slot, risk: body.risk },
      },
    });

    const net = capped - body.amount;
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { increment: net }, totalBet: { increment: body.amount }, totalWin: won ? { increment: capped } : undefined, vipExp: { increment: body.amount * 0.1 } },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: won ? "WIN" : "BET",
        amount: won ? capped : -body.amount,
        balanceAfter: player.balance + net,
        note: `Extreme Plinko ${body.risk} risk`,
        meta: { slot, multiplier },
      },
    });

    return ok({ path, slot, multiplier, payout: capped, won, balance: player.balance + net });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid input", 400);
    return handleError(e);
  }
}

export async function GET() {
  try {
    const cfg = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const gameConfig = mergeGameConfig(cfg?.gameConfig);
    const plinkoCfg = gameConfig.extreme_plinko || gameConfig.plinko;
    return ok({ enabled: plinkoCfg.enabled, minBet: plinkoCfg.minBet, maxBet: plinkoCfg.maxBet, multipliers: MULTIPLIERS, rows: ROWS });
  } catch (e) {
    return handleError(e);
  }
}
