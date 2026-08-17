export type GameCode =
  | "crash"
  | "dice"
  | "mines"
  | "wheel"
  | "slots"
  | "plinko"
  | "hilo"
  | "jili"
  | "pg"
  | "spribe"
  | "evolution"
  | "fa_chai"
  | "jdb"
  | "fortune_maya"
  | "extreme_plinko"
  | "aviator"
  | "baccarat"
  | "coinflip"
  | "keno"
  | "wingo"
  | "mystical_forest"
  | "cherry_charm"
  | "pixi_slots";

export type CrashOutcomeBucket = {
  /** Inclusive lower bound for this deterministic outcome range. */
  min: number;
  /** Inclusive upper bound for this deterministic outcome range. */
  max: number;
  /** Relative selection weight; zero-weight buckets are ignored. */
  weight: number;
};

export type CrashControlProfile = {
  /** Existing rounds finish; when false, no new betting round is created. */
  roundEnabled: boolean;
  /** Hard lower bound for generated crash points. */
  minCrashPoint: number;
  /** Hard upper bound for generated crash points. */
  maxCrashPoint: number;
  /** Optional weighted ranges selected deterministically from the round seed. */
  outcomeBuckets: CrashOutcomeBucket[];
};

export const DEFAULT_CRASH_CONTROL: CrashControlProfile = {
  roundEnabled: true,
  minCrashPoint: 1,
  maxCrashPoint: 100,
  // Empty preserves the original provably-fair distribution, while the admin
  // can opt into explicit weighted ranges without changing round metadata.
  outcomeBuckets: [],
};

export type GameLimits = {
  /** Win chance percentage 0-100. Synced with houseEdge. Admin-facing control. */
  winChancePct?: number;
  /** Deterministic crash/Aviator round and outcome controls. */
  crashControl?: CrashControlProfile;
  enabled: boolean;
  minBet: number;
  maxBet: number;
  maxWin: number;
  maxMultiplier: number;
  houseEdge: number;
  /** Chance (0-1) of a "big prize" jackpot-style boost on eligible wins */
  bigPrizeChance: number;
  /** Multiplier applied when big prize hits (capped by maxMultiplier/maxWin) */
  bigPrizeMult: number;
  rtpTarget: number;
};

export type GameConfigMap = Record<GameCode, GameLimits>;

export const DEFAULT_GAME_CONFIG: GameConfigMap = {

  crash: {
    enabled: true,
    minBet: 10,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 100,
    houseEdge: 0.05,
    bigPrizeChance: 0.001,
    bigPrizeMult: 20,
    rtpTarget: 0.92,
    crashControl: structuredClone(DEFAULT_CRASH_CONTROL),
  },
  dice: {
    enabled: true,
    minBet: 10,
    maxBet: 5000,
    maxWin: 10000,
    maxMultiplier: 10,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  mines: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 8000,
    maxMultiplier: 12,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  wheel: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 8000,
    maxMultiplier: 5,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 5,
    rtpTarget: 0.82,
  },
  slots: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 10000,
    maxMultiplier: 8,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  plinko: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 5000,
    maxMultiplier: 2,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 2,
    rtpTarget: 0.82,
  },
  hilo: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 5000,
    maxMultiplier: 5,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 5,
    rtpTarget: 0.82,
  },
  jili: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 40000,
    maxMultiplier: 8,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  pg: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 40000,
    maxMultiplier: 8,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  spribe: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 30000,
    maxMultiplier: 8,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  evolution: {
    enabled: true,
    minBet: 20,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 8,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  fa_chai: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 35000,
    maxMultiplier: 8,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  fortune_maya: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 10000,
    maxMultiplier: 50,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  extreme_plinko: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 15000,
    maxMultiplier: 100,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 100,
    rtpTarget: 0.82,
  },
  jdb: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 35000,
    maxMultiplier: 8,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  aviator: {
    enabled: true,
    minBet: 10,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 100,
    houseEdge: 0.04,
    bigPrizeChance: 0.002,
    bigPrizeMult: 25,
    rtpTarget: 0.96,
    crashControl: structuredClone(DEFAULT_CRASH_CONTROL),
  },
  baccarat: {
    enabled: true,
    minBet: 20,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 8,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 8,
    rtpTarget: 0.82,
  },
  coinflip: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 6000,
    maxMultiplier: 2,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 2,
    rtpTarget: 0.82,
  },
  keno: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 20000,
    maxMultiplier: 20,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 10,
    rtpTarget: 0.82,
  },
  mystical_forest: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 10000,
    maxMultiplier: 50,
    houseEdge: 0.12,
    bigPrizeChance: 0.002,
    bigPrizeMult: 20,
    rtpTarget: 0.82,
  },
  cherry_charm: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 10000,
    maxMultiplier: 40,
    houseEdge: 0.12,
    bigPrizeChance: 0.002,
    bigPrizeMult: 15,
    rtpTarget: 0.82,
  },
  pixi_slots: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 8000,
    maxMultiplier: 30,
    houseEdge: 0.12,
    bigPrizeChance: 0.002,
    bigPrizeMult: 12,
    rtpTarget: 0.82,
  },

  wingo: {
    enabled: true,
    minBet: 10,
    maxBet: 100000,
    maxWin: 500000,
    maxMultiplier: 9,
    houseEdge: 0.12,
    bigPrizeChance: 0.001,
    bigPrizeMult: 4.5,
    rtpTarget: 0.82,
  },
};

export function normalizeCrashControl(
  raw: unknown,
  fallback: CrashControlProfile = DEFAULT_CRASH_CONTROL
): CrashControlProfile {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fallbackMin = Math.max(1, Number(fallback.minCrashPoint) || 1);
  const fallbackMax = Math.max(fallbackMin, Number(fallback.maxCrashPoint) || 100);
  const minCrashPoint = Math.min(1000, Math.max(1, Number(r.minCrashPoint) || fallbackMin));
  const maxCrashPoint = Math.min(1000, Math.max(minCrashPoint, Number(r.maxCrashPoint) || fallbackMax));
  const rawBuckets = Array.isArray(r.outcomeBuckets) ? r.outcomeBuckets : [];
  const outcomeBuckets = rawBuckets
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const bucket = value as Record<string, unknown>;
      const rawMin = Number(bucket.min);
      const rawMax = Number(bucket.max);
      const rawWeight = Number(bucket.weight);
      if (!Number.isFinite(rawMin) || !Number.isFinite(rawMax) || !Number.isFinite(rawWeight) || rawWeight <= 0) return null;
      const min = Math.min(1000, Math.max(1, rawMin));
      const max = Math.min(1000, Math.max(min, rawMax));
      const weight = Math.min(1_000_000, Math.max(0, rawWeight));
      return { min, max, weight };
    })
    .filter((value): value is CrashOutcomeBucket => value !== null)
    .slice(0, 24);

  return {
    roundEnabled: r.roundEnabled !== false,
    minCrashPoint,
    maxCrashPoint,
    outcomeBuckets,
  };
}

export function mergeGameConfig(raw: unknown): GameConfigMap {
  const base = structuredClone(DEFAULT_GAME_CONFIG);
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, Partial<GameLimits> & { winChancePct?: number; aviatorLive?: unknown }>;
  for (const key of Object.keys(base) as GameCode[]) {
    if (obj[key] && typeof obj[key] === "object") {
      base[key] = { ...base[key], ...obj[key] } as GameLimits;
    }
    const g = base[key] as GameLimits & { winChancePct?: number };
    // Prefer explicit winChancePct from admin (persisted) over houseEdge derivation
    if (typeof g.winChancePct === "number" && Number.isFinite(g.winChancePct)) {
      const pct = Math.min(99, Math.max(1, Number(g.winChancePct)));
      g.winChancePct = pct;
      g.houseEdge = Math.round((1 - pct / 100) * 10000) / 10000;
      g.rtpTarget = Math.round((pct / 100) * 10000) / 10000;
    } else {
      // Allow full admin range 0%–99% house edge (was wrongly capped at 20% → reset UI)
      g.houseEdge = Math.min(Math.max(Number(g.houseEdge) || 0.03, 0), 0.99);
      g.winChancePct = Math.round((1 - g.houseEdge) * 100);
      g.rtpTarget = Math.min(Math.max(Number(g.rtpTarget) || 1 - g.houseEdge, 0.01), 1);
    }
    g.minBet = Math.max(1, Number(g.minBet) || 10);
    g.maxBet = Math.max(g.minBet, Number(g.maxBet) || 5000);
    g.maxWin = Math.max(g.maxBet, Number(g.maxWin) || 50000);
    g.maxMultiplier = Math.max(1.01, Number(g.maxMultiplier) || 100);
    g.bigPrizeChance = Math.min(Math.max(Number(g.bigPrizeChance) || 0, 0), 1);
    g.bigPrizeMult = Math.min(Math.max(Number(g.bigPrizeMult) || 1, 1), 1000);
    g.enabled = g.enabled !== false;
    if (key === "crash" || key === "aviator") {
      g.crashControl = normalizeCrashControl(g.crashControl, DEFAULT_CRASH_CONTROL);
    }
  }
  // Preserve unknown custom game keys from admin (coming-soon games etc.)
  for (const [k, v] of Object.entries(obj)) {
    if (!(k in base) && v && typeof v === "object") {
      (base as Record<string, unknown>)[k] = v;
    }
  }
  return base;
}

/** Cap payout by maxWin and maxMultiplier relative to stake */
export function applyWinCaps(
  stake: number,
  multiplier: number,
  cfg: GameLimits
): { multiplier: number; payout: number; capped: boolean } {
  let mult = Math.min(multiplier, cfg.maxMultiplier);
  let payout = Math.floor(stake * mult * 100) / 100;
  let capped = mult < multiplier;
  if (payout > cfg.maxWin) {
    payout = cfg.maxWin;
    mult = Math.floor((payout / stake) * 100) / 100;
    capped = true;
  }
  return { multiplier: mult, payout, capped };
}

export function validateBetAmount(amount: number, cfg: GameLimits): string | null {
  if (!cfg.enabled) return "Game temporarily disabled";
  if (!Number.isFinite(amount) || amount <= 0) return "Invalid bet amount";
  if (amount < cfg.minBet) return `Minimum bet is ${cfg.minBet} TK`;
  if (amount > cfg.maxBet) return `Maximum bet is ${cfg.maxBet} TK`;
  return null;
}

export const DEFAULT_PAYMENT_CONFIG = {
  noticeEn: "Virtual play-money TK only. Admin reviews every request.",
  noticeBn: "শুধু ভার্চুয়াল প্লে-মানি TK। অ্যাডমিন প্রতিটি রিকোয়েস্ট রিভিউ করে।",
  minDeposit: 100,
  minWithdraw: 200,
  maxDeposit: 100000,
  maxWithdraw: 50000,
  withdrawFeeType: "NONE",
  withdrawFeeValue: 0,
  methods: [
    {
      id: "bkash",
      name: "bKash",
      color: "#E2136E",
      logo: "/payments/bkash.png",
      number: "01XXXXXXXXX",
      type: "Personal",
      enabled: true,
      depositEnabled: true,
      withdrawEnabled: true,
      feeType: "NONE",
      feeValue: 0,
      channels: [{ id: "standard", label: "Standard channel", bonus: 0 }],
    },
    {
      id: "nagad",
      name: "Nagad",
      color: "#F15A29",
      logo: "/payments/nagad.png",
      number: "01XXXXXXXXX",
      type: "Personal",
      enabled: true,
      depositEnabled: true,
      withdrawEnabled: true,
      feeType: "NONE",
      feeValue: 0,
      channels: [{ id: "standard", label: "Standard channel", bonus: 0 }],
    },
    {
      id: "rocket",
      name: "Rocket",
      color: "#8B2C8A",
      logo: "/payments/rocket.png",
      number: "01XXXXXXXXX",
      type: "Personal",
      enabled: true,
      depositEnabled: true,
      withdrawEnabled: true,
      feeType: "NONE",
      feeValue: 0,
      channels: [{ id: "standard", label: "Standard channel", bonus: 0 }],
    },
    {
      id: "upay",
      name: "Upay",
      color: "#F9A825",
      logo: "/payments/upay.png",
      number: "01XXXXXXXXX",
      type: "Personal",
      enabled: true,
      depositEnabled: true,
      withdrawEnabled: true,
      feeType: "NONE",
      feeValue: 0,
      channels: [{ id: "standard", label: "Standard channel", bonus: 0 }],
    },
    {
      id: "bkash-office-free",
      name: "bKash Office Free",
      color: "#E2136E",
      logo: "/payments/bkash.png",
      number: "01XXXXXXXXX",
      type: "Office Free",
      enabled: false,
      depositEnabled: true,
      withdrawEnabled: false,
      feeType: "NONE",
      feeValue: 0,
      channels: [{ id: "office", label: "Office channel", bonus: 0 }],
    },
  ],
};

export const DEFAULT_POPUP_CONFIG = {
  enabled: false,
  imageUrl: "/banners/welcome.jpg",
  href: "/promotions",
  titleEn: "Welcome offer",
  titleBn: "স্বাগতম অফার",
  bodyEn: "Deposit and get admin bonus on approval.",
  bodyBn: "ডিপোজিট করুন — অনুমোদনে অ্যাডমিন বোনাস পাবেন।",
  showOncePerSession: true,
};

export const DEFAULT_REFERRAL_CONFIG = {
  enabled: true,
  bonusAmount: 500,
  minDepositForBonus: 100,
  shareTextEn: "Play TAKA69 with my code and get started!",
  shareTextBn: "আমার কোড দিয়ে TAKA69 খেলুন!",
};


export const DEFAULT_HOUSE_RULE_CONFIG = {
  enabled: true,
  /** When cumulative open bets (all users) reach this amount, force house win / void player wins */
  thresholdAmount: 15000,
  /** Scope: "session" rolling window minutes, or 0 = current open rounds only */
  windowMinutes: 60,
  /** Apply to these game codes; empty = all */
  games: [] as string[],
};

export type HouseRuleConfig = typeof DEFAULT_HOUSE_RULE_CONFIG;

export function mergeHouseRule(raw: unknown): HouseRuleConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<HouseRuleConfig>;
  return {
    enabled: r.enabled !== false,
    thresholdAmount: typeof r.thresholdAmount === "number" ? r.thresholdAmount : DEFAULT_HOUSE_RULE_CONFIG.thresholdAmount,
    windowMinutes: typeof r.windowMinutes === "number" ? r.windowMinutes : DEFAULT_HOUSE_RULE_CONFIG.windowMinutes,
    games: Array.isArray(r.games) ? (r.games as string[]) : [],
  };
}
