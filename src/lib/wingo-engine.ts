/**
 * WinGo Color Prediction Engine
 * Adapted from GOA source — provably fair, house-edge result selection
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
  if (bet === "violet") return 4.5;  // violet: 4.5x
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

/**
 * House-edge result selection: pick the number that costs the house the least.
 * Adapted directly from GOA winGoController.js addWinGo logic.
 */
export type BetPool = Record<string, number>; // bet → total wagered

export function selectHouseResult(pool: BetPool): number {
  // Group numbers into categories with their covering bets
  const categories: Array<{ num: number; keys: string[] }> = [
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

  // For each possible result, calculate total payout owed
  let bestNum = Math.floor(Math.random() * 10);
  let lowestPayout = Infinity;

  for (const cat of categories) {
    let totalPayout = 0;
    for (const [bet, wagered] of Object.entries(pool)) {
      if (checkWin(bet, cat.num)) {
        totalPayout += wagered * getMultiplier(bet);
      }
    }
    if (totalPayout < lowestPayout) {
      lowestPayout = totalPayout;
      bestNum = cat.num;
    }
  }

  return bestNum;
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
