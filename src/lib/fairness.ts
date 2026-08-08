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
 * Hard-capped by maxMultiplier from admin config.
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

export const WHEEL_SEGMENTS = [0, 1.2, 0, 1.5, 0, 2, 0, 3, 0, 5, 0, 10, 0, 1.2, 0, 20];

export function wheelResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { index: number; multiplier: number } {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  const index = Math.floor(r * WHEEL_SEGMENTS.length);
  return { index, multiplier: WHEEL_SEGMENTS[index] };
}

// Server contract keys (not rendered as emoji in UI)
export const SLOT_SYMBOLS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
export const SLOT_PAYTABLE: Record<string, number> = {
  S1S1S1: 5,
  S2S2S2: 8,
  S3S3S3: 10,
  S4S4S4: 15,
  S5S5S5: 25,
  S6S6S6: 50,
  S7S7S7: 100,
};

export function slotsSpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { reels: string[]; multiplier: number } {
  const reels = [0, 1, 2].map((i) => {
    const r = seedToFloat(serverSeed, clientSeed, nonce + i);
    return SLOT_SYMBOLS[Math.floor(r * SLOT_SYMBOLS.length)];
  });
  const key = reels.join("");
  let multiplier = SLOT_PAYTABLE[key] || 0;
  if (!multiplier) {
    if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      multiplier = 1.5;
    }
  }
  return { reels, multiplier };
}

export const PLINKO_SLOTS = [0.2, 0.5, 1, 1.5, 3, 5, 3, 1.5, 1, 0.5, 0.2];

export function plinkoDrop(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { slot: number; multiplier: number; path: number[] } {
  const path: number[] = [];
  let pos = 0;
  for (let row = 0; row < 10; row++) {
    const r = seedToFloat(serverSeed, clientSeed, nonce + row);
    const dir = r < 0.5 ? 0 : 1;
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

/** Provider-style simple spin for Jili/PG/Spribe/etc. */
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

  let mult = 0;
  // ~rtp-weighted distribution
  if (r < 0.62) mult = 0;
  else if (r < 0.82) mult = 1.2 + r2 * 0.8;
  else if (r < 0.93) mult = 2 + r2 * 3;
  else if (r < 0.98) mult = 5 + r2 * 10;
  else mult = 15 + r2 * Math.min(40, cfg.maxMultiplier - 15);

  const bigRoll = seedToFloat(serverSeed, clientSeed, nonce + 99);
  let bigPrize = false;
  if (bigRoll < cfg.bigPrizeChance) {
    mult = Math.max(mult, cfg.bigPrizeMult);
    bigPrize = true;
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
  if (roll < cfg.bigPrizeChance) {
    return { multiplier: Math.max(baseMult, cfg.bigPrizeMult), bigPrize: true };
  }
  return { multiplier: baseMult, bigPrize: false };
}
