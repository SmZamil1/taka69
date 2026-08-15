/**
 * WinGo Color Prediction Engine
 * House-edge result selection with optional admin force result + low-win random mode.
 */

export type WingoGameKey = "WINGO1" | "WINGO3" | "WINGO5" | "WINGO10";

export const WINGO_FEE = 0.02; // 2% fee on bets

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
  if (/^[0-9]$/.test(bet)) return 9; // number: 9x
  if (bet === "violet") return 4.5; // violet: 4.5x
  if (bet === "red" || bet === "green") return 2; // color: 2x
  if (bet === "big" || bet === "small") return 2; // size: 2x
  return 0;
}

/** Calculate net payout after fee */
export function calcPayout(amount: number, multiplier: number): number {
  const gross = amount * multiplier;
  const fee = amount * WINGO_FEE;
  return parseFloat((gross - fee).toFixed(2));
}

export type BetPool = Record<string, number>; // bet → total wagered

const CATEGORIES: Array<{ num: number; keys: string[] }> = [
  { num: 0, keys: ["0", "red", "violet", "small"] },
  { num: 1, keys: ["1", "green", "small"] },
  { num: 2, keys: ["2", "red", "small"] },
  { num: 3, keys: ["3", "green", "small"] },
  { num: 4, keys: ["4", "red", "small"] },
  { num: 5, keys: ["5", "green", "violet", "big"] },
  { num: 6, keys: ["6", "red", "big"] },
  { num: 7, keys: ["7", "green", "big"] },
  { num: 8, keys: ["8", "red", "big"] },
  { num: 9, keys: ["9", "green", "big"] },
];

function payoutForResult(pool: BetPool, num: number): number {
  let totalPayout = 0;
  for (const [bet, wagered] of Object.entries(pool)) {
    if (checkWin(bet, num)) {
      totalPayout += wagered * getMultiplier(bet);
    }
  }
  return totalPayout;
}

/**
 * House-edge result selection.
 * - Always prefers lower house payout (less win for players)
 * - With randomness: weighted toward cheapest outcomes (~70% cheapest tier)
 * - forceResult: admin override 0-9 when set
 */
export function selectHouseResult(
  pool: BetPool,
  opts?: { forceResult?: number | null; randomLessWin?: boolean }
): number {
  const force = opts?.forceResult;
  if (typeof force === "number" && force >= 0 && force <= 9 && Number.isInteger(force)) {
    return force;
  }

  const scored = CATEGORIES.map((cat) => ({
    num: cat.num,
    payout: payoutForResult(pool, cat.num),
  })).sort((a, b) => a.payout - b.payout);

  // No bets → pure random
  const totalWagered = Object.values(pool).reduce((s, v) => s + v, 0);
  if (totalWagered <= 0) {
    return Math.floor(Math.random() * 10);
  }

  const randomLessWin = opts?.randomLessWin !== false;

  if (!randomLessWin) {
    return scored[0]?.num ?? Math.floor(Math.random() * 10);
  }

  // Weighted random among low-payout outcomes (less win)
  // Top 3 cheapest get most weight; still some noise so not fully deterministic
  const cheap = scored.slice(0, 4);
  const weights = [0.45, 0.28, 0.17, 0.1];
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < cheap.length; i++) {
    acc += weights[i] ?? 0.05;
    if (r <= acc) return cheap[i].num;
  }
  return cheap[0]?.num ?? Math.floor(Math.random() * 10);
}

export function periodId(game: WingoGameKey): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const mins = Math.floor(now.getHours() * 60 + now.getMinutes());
  const interval = game === "WINGO1" ? 1 : game === "WINGO3" ? 3 : game === "WINGO5" ? 5 : 10;
  const period = Math.floor(mins / interval);
  return `${y}${m}${d}${String(period).padStart(4, "0")}`;
}
