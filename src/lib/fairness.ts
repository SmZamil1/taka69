import { createHash, createHmac, randomBytes } from "crypto";
import type { GameLimits } from "./game-config";
import { applyWinCaps } from "./game-config";

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
  const slice = hmac.slice(0, 13);
  const int = parseInt(slice, 16);
  return int / Math.pow(16, 13);
}

/**
 * Aviator-style crash point.
 * Instant bust probability ≈ houseEdge; otherwise  (1-e)/(1-r).
 */
export function crashPointFromSeeds(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  houseEdge = 0.03,
  maxMultiplier = 100
): number {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  if (r < houseEdge) return 1.0;
  const point = (1 - houseEdge) / (1 - r);
  const capped = Math.min(maxMultiplier, Math.max(1.0, Math.floor(point * 100) / 100));
  return capped;
}

export function diceRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  return Math.floor(r * 10000) / 100;
}

export function minesLayout(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gridSize: number,
  mineCount: number
): number[] {
  const indices = Array.from({ length: gridSize }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const r = seedToFloat(serverSeed, clientSeed, nonce + i);
    const j = Math.floor(r * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, mineCount).sort((a, b) => a - b);
}

export function minesMultiplier(
  gridSize: number,
  mineCount: number,
  revealed: number,
  houseEdge = 0.01
): number {
  if (revealed <= 0) return 1;
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    const safeLeft = gridSize - mineCount - i;
    const totalLeft = gridSize - i;
    mult *= totalLeft / safeLeft;
  }
  return Math.floor(mult * (1 - houseEdge) * 100) / 100;
}

/** Fortune wheel — more mid prizes, rare jackpots */
export const WHEEL_SEGMENTS = [0, 1.5, 0, 2, 1.2, 3, 0, 5, 1.2, 8, 0, 12, 1.5, 2, 0, 25];

export function wheelResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { index: number; multiplier: number } {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  // weighted toward mid prizes (not pure uniform)
  let index: number;
  if (r < 0.28) index = [0, 2, 6, 10, 14][Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 3) * 5)];
  else if (r < 0.72) index = [1, 3, 4, 8, 12, 13][Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 4) * 6)];
  else if (r < 0.92) index = [5, 7, 9][Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 5) * 3)];
  else index = [11, 15][Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 6) * 2)];
  index = Math.max(0, Math.min(WHEEL_SEGMENTS.length - 1, index));
  return { index, multiplier: WHEEL_SEGMENTS[index] };
}

export const SLOT_SYMBOLS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
export const SLOT_PAYTABLE: Record<string, number> = {
  S1S1S1: 5,
  S2S2S2: 8,
  S3S3S3: 12,
  S4S4S4: 18,
  S5S5S5: 30,
  S6S6S6: 60,
  S7S7S7: 120,
};

export function slotsSpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { reels: string[]; multiplier: number } {
  const rLuck = seedToFloat(serverSeed, clientSeed, nonce + 50);
  // ~48% chance of at least a pair-ish hit feel
  let reels: string[];
  if (rLuck < 0.12) {
    // triple jackpot-ish
    const s = SLOT_SYMBOLS[Math.floor(seedToFloat(serverSeed, clientSeed, nonce) * SLOT_SYMBOLS.length)];
    reels = [s, s, s];
  } else if (rLuck < 0.42) {
    // pair
    const s = SLOT_SYMBOLS[Math.floor(seedToFloat(serverSeed, clientSeed, nonce) * 5)];
    const o = SLOT_SYMBOLS[Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 1) * SLOT_SYMBOLS.length)];
    const pos = Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 2) * 3);
    reels = [o, o, o];
    reels[pos] = s;
    if (pos === 0) reels = [s, s, o];
    if (pos === 1) reels = [s, o, s];
    if (pos === 2) reels = [o, s, s];
  } else {
    reels = [0, 1, 2].map((i) => {
      const r = seedToFloat(serverSeed, clientSeed, nonce + i);
      return SLOT_SYMBOLS[Math.floor(r * SLOT_SYMBOLS.length)];
    });
  }
  const key = reels.join("");
  let multiplier = SLOT_PAYTABLE[key] || 0;
  if (!multiplier) {
    if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      multiplier = 1.8;
    }
  }
  return { reels, multiplier };
}

/** Plinko — wider mid prizes, rare high */
export const PLINKO_SLOTS = [0.3, 0.5, 0.8, 1.2, 2, 5, 12, 5, 2, 1.2, 0.8, 0.5, 0.3];

export function plinkoDrop(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { slot: number; multiplier: number; path: number[] } {
  const path: number[] = [];
  let pos = 0;
  const rows = PLINKO_SLOTS.length - 1;
  for (let row = 0; row < rows; row++) {
    const r = seedToFloat(serverSeed, clientSeed, nonce + row);
    // slight center bias for more mid prizes
    const bias = 0.48 + (pos / Math.max(1, rows) - 0.5) * 0.08;
    const dir = r < bias ? 0 : 1;
    path.push(dir);
    pos += dir;
  }
  const slot = Math.min(PLINKO_SLOTS.length - 1, Math.max(0, pos));
  return { slot, multiplier: PLINKO_SLOTS[slot], path };
}

export function hiloCard(serverSeed: string, clientSeed: string, nonce: number): number {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  return 1 + Math.floor(r * 13);
}

/**
 * Studio / provider spins — generous small wins + rare big prizes.
 * Tuned so players often see prizes; admin caps still apply.
 */
export function providerSpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  cfg: GameLimits
): { multiplier: number; bigPrize: boolean; symbols: string[] } {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  const r2 = seedToFloat(serverSeed, clientSeed, nonce + 1);
  const symbols = ["A", "B", "C", "D", "E", "W"].map((_, i) => {
    const rr = seedToFloat(serverSeed, clientSeed, nonce + 10 + i);
    return ["A", "B", "C", "D", "E", "W"][Math.floor(rr * 6)];
  });

  // More frequent wins (~55% hit rate of some prize)
  let mult = 0;
  if (r < 0.42) mult = 0;
  else if (r < 0.68) mult = 1.2 + r2 * 1.3; // 1.2–2.5
  else if (r < 0.86) mult = 2.5 + r2 * 4.5; // 2.5–7
  else if (r < 0.95) mult = 8 + r2 * 17; // 8–25
  else mult = 20 + r2 * Math.min(80, Math.max(10, cfg.maxMultiplier - 20));

  const bigRoll = seedToFloat(serverSeed, clientSeed, nonce + 99);
  let bigPrize = false;
  const chance = Math.max(cfg.bigPrizeChance, 0.035);
  if (bigRoll < chance) {
    mult = Math.max(mult, cfg.bigPrizeMult || 40);
    bigPrize = true;
    // force wild-ish symbols
    symbols[0] = "W";
    symbols[1] = "W";
    symbols[2] = "W";
  }

  mult = Math.floor(mult * 100) / 100;
  return { multiplier: mult, bigPrize, symbols };
}

export function finalizePayout(stake: number, rawMult: number, cfg: GameLimits) {
  return applyWinCaps(stake, rawMult, cfg);
}

export function maybeBigPrize(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  baseMult: number,
  cfg: GameLimits
): { multiplier: number; bigPrize: boolean } {
  if (baseMult <= 0) return { multiplier: 0, bigPrize: false };
  const roll = seedToFloat(serverSeed, clientSeed, nonce + 777);
  const chance = Math.max(cfg.bigPrizeChance, 0.03);
  if (roll < chance) {
    return { multiplier: Math.max(baseMult, cfg.bigPrizeMult), bigPrize: true };
  }
  return { multiplier: baseMult, bigPrize: false };
}
