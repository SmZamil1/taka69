import { createHash, createHmac, randomBytes } from "crypto";

/** SHA-256 hex */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashServerSeed(seed: string): string {
  return sha256(seed);
}

/** HMAC-SHA256 → float in [0, 1) */
export function seedToFloat(serverSeed: string, clientSeed: string, nonce: number): number {
  const msg = `${clientSeed}:${nonce}`;
  const hmac = createHmac("sha256", serverSeed).update(msg).digest("hex");
  // take first 13 hex chars (~52 bits) → [0,1)
  const slice = hmac.slice(0, 13);
  const int = parseInt(slice, 16);
  return int / Math.pow(16, 13);
}

/**
 * Crash point with house edge.
 * P(crash <= x) rises with edge. Default edge 3%.
 * Formula: floor( (1-edge) / (1-r) * 100 ) / 100, min 1.00
 */
export function crashPointFromSeeds(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  houseEdge = 0.03
): number {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  if (r < houseEdge) return 1.0;
  const point = (1 - houseEdge) / (1 - r);
  return Math.max(1.0, Math.floor(point * 100) / 100);
}

/** Dice: roll 0.00 – 99.99 */
export function diceRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  return Math.floor(r * 10000) / 100;
}

/** Mines: shuffle grid positions */
export function minesLayout(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gridSize: number,
  mineCount: number
): number[] {
  const indices = Array.from({ length: gridSize }, (_, i) => i);
  // Fisher-Yates with seeded floats
  for (let i = indices.length - 1; i > 0; i--) {
    const r = seedToFloat(serverSeed, clientSeed, nonce + i);
    const j = Math.floor(r * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, mineCount).sort((a, b) => a - b);
}

/** Mines multiplier for k safe reveals */
export function minesMultiplier(gridSize: number, mineCount: number, revealed: number, houseEdge = 0.01): number {
  if (revealed <= 0) return 1;
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    const safeLeft = gridSize - mineCount - i;
    const totalLeft = gridSize - i;
    mult *= totalLeft / safeLeft;
  }
  return Math.floor(mult * (1 - houseEdge) * 100) / 100;
}

/** Wheel segments multipliers */
export const WHEEL_SEGMENTS = [0, 1.2, 0, 1.5, 0, 2, 0, 3, 0, 5, 0, 10, 0, 1.2, 0, 20];

export function wheelResult(serverSeed: string, clientSeed: string, nonce: number): {
  index: number;
  multiplier: number;
} {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  const index = Math.floor(r * WHEEL_SEGMENTS.length);
  return { index, multiplier: WHEEL_SEGMENTS[index] };
}

/** Simple 3-reel slots */
export const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
export const SLOT_PAYTABLE: Record<string, number> = {
  "🍒🍒🍒": 5,
  "🍋🍋🍋": 8,
  "🍊🍊🍊": 10,
  "🍇🍇🍇": 15,
  "⭐⭐⭐": 25,
  "💎💎💎": 50,
  "7️⃣7️⃣7️⃣": 100,
};

export function slotsSpin(serverSeed: string, clientSeed: string, nonce: number): {
  reels: string[];
  multiplier: number;
} {
  const reels = [0, 1, 2].map((i) => {
    const r = seedToFloat(serverSeed, clientSeed, nonce + i);
    return SLOT_SYMBOLS[Math.floor(r * SLOT_SYMBOLS.length)];
  });
  const key = reels.join("");
  let multiplier = SLOT_PAYTABLE[key] || 0;
  // two of a kind small pay
  if (!multiplier) {
    if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      multiplier = 1.5;
    }
  }
  return { reels, multiplier };
}
