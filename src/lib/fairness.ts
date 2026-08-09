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

/**
 * Fortune wheel segments — mostly 0 / ≤1.5x.
 * High labels stay for show; weighted result almost never lands there.
 */
export const WHEEL_SEGMENTS = [
  0, 1.2, 0, 1.5, 0, 1.8, 0, 2, 0, 1.2, 0, 3, 0, 1.5, 0, 5,
];

export function wheelResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { index: number; multiplier: number } {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  // ~62% lose, ~30% small (≤1.5), ~7% ~1.8-2, ~1% 3x, ~0.2% 5x
  let index: number;
  if (r < 0.62) {
    // zeros
    const zeros = [0, 2, 4, 6, 8, 10, 12, 14];
    index = zeros[Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 3) * zeros.length)];
  } else if (r < 0.92) {
    // 1.2 / 1.5
    const small = [1, 3, 9, 13];
    index = small[Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 4) * small.length)];
  } else if (r < 0.985) {
    // 1.8 / 2
    const mid = [5, 7];
    index = mid[Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 5) * mid.length)];
  } else if (r < 0.998) {
    index = 11; // 3x rare
  } else {
    index = 15; // 5x very rare
  }
  index = Math.max(0, Math.min(WHEEL_SEGMENTS.length - 1, index));
  return { index, multiplier: WHEEL_SEGMENTS[index] };
}

export const SLOT_SYMBOLS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
export const SLOT_PAYTABLE: Record<string, number> = {
  S1S1S1: 1.5,
  S2S2S2: 1.8,
  S3S3S3: 2,
  S4S4S4: 2.5,
  S5S5S5: 3,
  S6S6S6: 5,
  S7S7S7: 8,
};

export function slotsSpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): { reels: string[]; multiplier: number } {
  const rLuck = seedToFloat(serverSeed, clientSeed, nonce + 50);
  let reels: string[];
  // ~8% triple (mostly low symbols), ~18% pair feel, else miss
  if (rLuck < 0.08) {
    const bias = seedToFloat(serverSeed, clientSeed, nonce);
    // prefer low symbols for triples
    const idx = bias < 0.7 ? Math.floor(bias * 4) : Math.floor(bias * SLOT_SYMBOLS.length);
    const s = SLOT_SYMBOLS[Math.min(SLOT_SYMBOLS.length - 1, idx)];
    reels = [s, s, s];
  } else if (rLuck < 0.26) {
    const s = SLOT_SYMBOLS[Math.floor(seedToFloat(serverSeed, clientSeed, nonce) * 4)];
    const o = SLOT_SYMBOLS[Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 1) * SLOT_SYMBOLS.length)];
    const pos = Math.floor(seedToFloat(serverSeed, clientSeed, nonce + 2) * 3);
    if (pos === 0) reels = [s, s, o];
    else if (pos === 1) reels = [s, o, s];
    else reels = [o, s, s];
  } else {
    reels = [0, 1, 2].map((i) => {
      const r = seedToFloat(serverSeed, clientSeed, nonce + i);
      return SLOT_SYMBOLS[Math.floor(r * SLOT_SYMBOLS.length)];
    });
  }
  const key = reels.join("");
  let multiplier = SLOT_PAYTABLE[key] || 0;
  if (!multiplier) {
    // pairs pay tiny, rarely
    if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      const rp = seedToFloat(serverSeed, clientSeed, nonce + 60);
      if (rp < 0.35) multiplier = 1.2;
    }
  }
  return { reels, multiplier };
}

/**
 * Plinko slots — center is ~1x, edges small, high buckets rare via path bias.
 * Labels keep a couple of higher values for UI excitement only.
 */
export const PLINKO_SLOTS = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.5, 1.2, 1, 0.8, 0.6, 0.4, 0.2];

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
    // strong center bias → mostly mid/low payouts
    const center = rows / 2;
    const pull = (center - pos) / Math.max(1, rows);
    const bias = 0.5 + pull * 0.22;
    const dir = r < Math.min(0.82, Math.max(0.18, bias)) ? 0 : 1;
    path.push(dir);
    pos += dir;
  }
  // rare forced high-ish edge (~0.8%)
  const rare = seedToFloat(serverSeed, clientSeed, nonce + 900);
  if (rare < 0.004) {
    pos = rare < 0.002 ? 0 : PLINKO_SLOTS.length - 1;
  } else if (rare < 0.012) {
    // mild off-center
    pos = Math.min(PLINKO_SLOTS.length - 1, Math.max(0, pos + (rare < 0.008 ? -1 : 1)));
  }
  const slot = Math.min(PLINKO_SLOTS.length - 1, Math.max(0, pos));
  return { slot, multiplier: PLINKO_SLOTS[slot], path };
}

export function hiloCard(serverSeed: string, clientSeed: string, nonce: number): number {
  const r = seedToFloat(serverSeed, clientSeed, nonce);
  return 1 + Math.floor(r * 13);
}

/**
 * Studio / provider spins — mostly losses / ≤2x.
 * >2x is rare; big prizes are extremely rare.
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

  // ~58% lose, ~32% 1.0–1.6x, ~8% 1.6–2.0x, ~1.7% 2–3x, ~0.25% 3–5x, rest jackpot path
  let mult = 0;
  if (r < 0.58) mult = 0;
  else if (r < 0.9) mult = 1.0 + r2 * 0.6; // 1.0–1.6
  else if (r < 0.98) mult = 1.6 + r2 * 0.4; // 1.6–2.0
  else if (r < 0.997) mult = 2.0 + r2 * 1.0; // 2–3 rare
  else if (r < 0.9995) mult = 3.0 + r2 * 2.0; // 3–5 very rare
  else mult = Math.min(cfg.maxMultiplier, 5 + r2 * 5); // ultra rare

  const bigRoll = seedToFloat(serverSeed, clientSeed, nonce + 99);
  let bigPrize = false;
  // use config chance but hard-cap so it stays rare (default ~0.4%)
  const chance = Math.min(Math.max(cfg.bigPrizeChance, 0), 0.008);
  if (bigRoll < chance && mult > 0) {
    mult = Math.min(cfg.maxMultiplier, Math.max(mult, Math.min(cfg.bigPrizeMult || 8, 12)));
    bigPrize = true;
    symbols[0] = "W";
    symbols[1] = "W";
    symbols[2] = "W";
  }

  // hard soft-cap: >2x only if roll path already allowed it
  mult = Math.floor(mult * 100) / 100;
  return { multiplier: mult, bigPrize, symbols };
}

export function finalizePayout(stake: number, rawMult: number, cfg: GameLimits) {
  return applyWinCaps(stake, rawMult, cfg);
}

/**
 * Optional big-prize boost — only on existing wins, very rare, and never huge.
 * Disabled path when chance is 0.
 */
export function maybeBigPrize(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  baseMult: number,
  cfg: GameLimits
): { multiplier: number; bigPrize: boolean } {
  if (baseMult <= 0) return { multiplier: 0, bigPrize: false };
  const chance = Math.min(Math.max(cfg.bigPrizeChance, 0), 0.006);
  if (chance <= 0) return { multiplier: baseMult, bigPrize: false };
  const roll = seedToFloat(serverSeed, clientSeed, nonce + 777);
  if (roll < chance) {
    // boost modestly; still respect maxMultiplier via finalize
    const boost = Math.min(cfg.bigPrizeMult || 5, Math.max(baseMult, 3), cfg.maxMultiplier);
    return { multiplier: boost, bigPrize: true };
  }
  return { multiplier: baseMult, bigPrize: false };
}
