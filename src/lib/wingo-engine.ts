/**
 * WinGo Color Prediction Engine
 * Results are generated independently of the bet pool with a cryptographically
 * secure random source. Admins can pause rounds, but cannot influence outcomes.
 */

import { randomInt } from "crypto";
import type { PrismaClient } from "@prisma/client";

export type WingoGameKey = "WINGO1" | "WINGO3" | "WINGO5" | "WINGO10";

export const WINGO_FEE = 0.02; // 2% fee on bets

export const WINGO_GAMES: WingoGameKey[] = ["WINGO1", "WINGO3", "WINGO5", "WINGO10"];

const INTERVAL_MIN: Record<WingoGameKey, number> = {
  WINGO1: 1,
  WINGO3: 3,
  WINGO5: 5,
  WINGO10: 10,
};

export function wingoIntervalMs(game: WingoGameKey) {
  return INTERVAL_MIN[game] * 60 * 1000;
}

/** Map result number 0-9 to colors */
export function getColors(n: number): string[] {
  if (n === 0) return ["red", "violet"];
  if (n === 1) return ["green"];
  if (n === 2) return ["red"];
  if (n === 3) return ["green"];
  if (n === 4) return ["red"];
  if (n === 5) return ["green", "violet"];
  if (n === 6) return ["red"];
  if (n === 7) return ["green"];
  if (n === 8) return ["red"];
  if (n === 9) return ["green"];
  return [];
}

export function getSize(n: number): "big" | "small" {
  return n >= 5 ? "big" : "small";
}

/** Check if a bet wins given the result number */
export function checkWin(bet: string, result: number): boolean {
  const colors = getColors(result);
  const size = getSize(result);
  if (bet === String(result)) return true;
  if (bet === "red" && colors.includes("red")) return true;
  if (bet === "green" && colors.includes("green")) return true;
  if (bet === "violet" && colors.includes("violet")) return true;
  if (bet === "big" && size === "big") return true;
  if (bet === "small" && size === "small") return true;
  return false;
}

/** Payout multiplier for each bet type */
export function getMultiplier(bet: string): number {
  if (/^[0-9]$/.test(bet)) return 9;
  if (bet === "violet") return 4.5;
  if (bet === "red" || bet === "green") return 2;
  if (bet === "big" || bet === "small") return 2;
  return 0;
}

/** Calculate net payout after fee */
export function calcPayout(amount: number, multiplier: number): number {
  const gross = amount * multiplier;
  const fee = amount * WINGO_FEE;
  return parseFloat((gross - fee).toFixed(2));
}

/** Generate an unbiased WinGo result without reading the bet pool. */
export function generateFairWingoResult(): number {
  return randomInt(0, 10);
}

export function periodId(game: WingoGameKey): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const mins = Math.floor(now.getHours() * 60 + now.getMinutes());
  const interval = INTERVAL_MIN[game];
  const period = Math.floor(mins / interval);
  return `${y}${m}${d}${String(period).padStart(4, "0")}`;
}

export async function ensureWingoOpenRound(prisma: PrismaClient, game: WingoGameKey) {
  const open = await prisma.wingoRound.findFirst({
    where: { game, status: "open" },
    orderBy: { period: "desc" },
  });
  if (open) return open;
  const last = await prisma.wingoRound.findFirst({
    where: { game },
    orderBy: { period: "desc" },
  });
  return prisma.wingoRound.create({
    data: { game, period: (last?.period ?? 0) + 1, status: "open" },
  });
}

type WingoAdminCfg = {
  autoPlay?: boolean;
};

async function readWingoCfg(prisma: PrismaClient): Promise<WingoAdminCfg> {
  try {
    const row = await prisma.appConfig.findUnique({ where: { id: "main" } });
    const w = (row?.wingoConfig as WingoAdminCfg) || {};
    return { autoPlay: w.autoPlay !== false };
  } catch {
    return { autoPlay: true };
  }
}

/**
 * Tick one game: settle expired open round (if any), then ensure a fresh open round.
 * Safe to call from any client poll — keeps WinGo globally live without cron.
 */
export async function tickWingoGame(prisma: PrismaClient, game: WingoGameKey) {
  const cfg = await readWingoCfg(prisma);
  if (cfg.autoPlay === false) {
    return { paused: true as const };
  }

  const interval = wingoIntervalMs(game);
  const now = new Date();

  const expired = await prisma.wingoRound.findFirst({
    where: {
      game,
      status: "open",
      startedAt: { lte: new Date(now.getTime() - interval) },
    },
    include: { bets: { where: { status: "pending" } } },
  });

  let settled: { period: number; result: number } | null = null;

  if (expired) {
    // The outcome is selected independently of wagers and admin settings.
    const result = generateFairWingoResult();
    const colors = getColors(result);
    const size = getSize(result);

    for (const b of expired.bets) {
      const won = checkWin(b.bet, result);
      const mult = getMultiplier(b.bet);
      const payout = won ? calcPayout(b.amount, mult) : 0;
      await prisma.wingoBetRecord.update({
        where: { id: b.id },
        data: { won, payout, status: won ? "won" : "lost" },
      });
      if (won) {
        const userNow = await prisma.user.findUnique({
          where: { id: b.userId },
          select: { balance: true },
        });
        const newBal = (userNow?.balance ?? 0) + payout;
        await prisma.user.update({
          where: { id: b.userId },
          data: { balance: { increment: payout }, totalWin: { increment: payout } },
        });
        await prisma.transaction.create({
          data: {
            userId: b.userId,
            type: "WINGO_WIN",
            amount: payout,
            balanceAfter: newBal,
            note: `WinGo ${game} win — result ${result} (${colors.join("/")}, ${size})`,
            meta: { roundId: expired.id, result, bet: b.bet, multiplier: mult },
          },
        });
      }
    }

    await prisma.wingoRound.update({
      where: { id: expired.id },
      data: { result, status: "closed", closedAt: now },
    });
    settled = { period: expired.period, result };

  }

  const open = await ensureWingoOpenRound(prisma, game);
  return { settled, openPeriod: open.period, openId: open.id };
}

/** Tick all four WinGo intervals (global continuous chain). */
export async function tickAllWingo(prisma: PrismaClient) {
  const out: Record<string, unknown> = {};
  for (const g of WINGO_GAMES) {
    try {
      out[g] = await tickWingoGame(prisma, g);
    } catch (e) {
      out[`${g}_error`] = String(e);
    }
  }
  return out;
}
