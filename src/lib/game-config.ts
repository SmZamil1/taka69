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
  | "wingo";

export type GameLimits = {
  /** Win chance percentage 0-100. Synced with houseEdge. Admin-facing control. */
  winChancePct?: number;
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
    houseEdge: 0.03,
    bigPrizeChance: 0.002,
    bigPrizeMult: 25,
    rtpTarget: 0.97,
  },
  dice: {
    enabled: true,
    minBet: 10,
    maxBet: 5000,
    maxWin: 10000,
    maxMultiplier: 10,
    houseEdge: 0.03,
    bigPrizeChance: 0.003,
    bigPrizeMult: 8,
    rtpTarget: 0.95,
  },
  mines: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 8000,
    maxMultiplier: 12,
    houseEdge: 0.03,
    bigPrizeChance: 0.003,
    bigPrizeMult: 8,
    rtpTarget: 0.95,
  },
  wheel: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 8000,
    maxMultiplier: 5,
    houseEdge: 0.06,
    bigPrizeChance: 0.003,
    bigPrizeMult: 5,
    rtpTarget: 0.92,
  },
  slots: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 10000,
    maxMultiplier: 8,
    houseEdge: 0.06,
    bigPrizeChance: 0.003,
    bigPrizeMult: 8,
    rtpTarget: 0.92,
  },
  plinko: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 5000,
    maxMultiplier: 2,
    houseEdge: 0.05,
    bigPrizeChance: 0.002,
    bigPrizeMult: 2,
    rtpTarget: 0.93,
  },
  hilo: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 5000,
    maxMultiplier: 5,
    houseEdge: 0.03,
    bigPrizeChance: 0.002,
    bigPrizeMult: 5,
    rtpTarget: 0.95,
  },
  jili: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 40000,
    maxMultiplier: 8,
    houseEdge: 0.04,
    bigPrizeChance: 0.004,
    bigPrizeMult: 8,
    rtpTarget: 0.96,
  },
  pg: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 40000,
    maxMultiplier: 8,
    houseEdge: 0.04,
    bigPrizeChance: 0.004,
    bigPrizeMult: 8,
    rtpTarget: 0.96,
  },
  spribe: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 30000,
    maxMultiplier: 8,
    houseEdge: 0.03,
    bigPrizeChance: 0.004,
    bigPrizeMult: 8,
    rtpTarget: 0.97,
  },
  evolution: {
    enabled: true,
    minBet: 20,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 8,
    houseEdge: 0.03,
    bigPrizeChance: 0.004,
    bigPrizeMult: 8,
    rtpTarget: 0.97,
  },
  fa_chai: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 35000,
    maxMultiplier: 8,
    houseEdge: 0.04,
    bigPrizeChance: 0.004,
    bigPrizeMult: 8,
    rtpTarget: 0.96,
  },
  fortune_maya: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 10000,
    maxMultiplier: 50,
    houseEdge: 0.06,
    bigPrizeChance: 0.003,
    bigPrizeMult: 8,
    rtpTarget: 0.94,
  },
  extreme_plinko: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 15000,
    maxMultiplier: 100,
    houseEdge: 0.05,
    bigPrizeChance: 0.002,
    bigPrizeMult: 100,
    rtpTarget: 0.95,
  },
  jdb: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 35000,
    maxMultiplier: 8,
    houseEdge: 0.04,
    bigPrizeChance: 0.004,
    bigPrizeMult: 8,
    rtpTarget: 0.96,
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
  },
  baccarat: {
    enabled: true,
    minBet: 20,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 8,
    houseEdge: 0.03,
    bigPrizeChance: 0.003,
    bigPrizeMult: 8,
    rtpTarget: 0.97,
  },
  coinflip: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 6000,
    maxMultiplier: 2,
    houseEdge: 0.03,
    bigPrizeChance: 0.002,
    bigPrizeMult: 2,
    rtpTarget: 0.97,
  },
  keno: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 20000,
    maxMultiplier: 20,
    houseEdge: 0.05,
    bigPrizeChance: 0.002,
    bigPrizeMult: 10,
    rtpTarget: 0.95,
  },
  wingo: {
    enabled: true,
    minBet: 10,
    maxBet: 100000,
    maxWin: 500000,
    maxMultiplier: 9,
    houseEdge: 0.08,
    bigPrizeChance: 0.001,
    bigPrizeMult: 4.5,
    rtpTarget: 0.92,
  },
};

export function mergeGameConfig(raw: unknown): GameConfigMap {
  const base = structuredClone(DEFAULT_GAME_CONFIG);
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, Partial<GameLimits>>;
  for (const key of Object.keys(base) as GameCode[]) {
    if (obj[key] && typeof obj[key] === "object") {
      base[key] = { ...base[key], ...obj[key] };
    }
    // Safety clamps — house keeps control, players rarely see >2x outside crash
    const g = base[key];
    g.bigPrizeChance = Math.min(Math.max(Number(g.bigPrizeChance) || 0, 0), key === "crash" ? 0.01 : 0.008);
    g.bigPrizeMult = Math.min(Math.max(Number(g.bigPrizeMult) || 1, 1), key === "crash" ? 50 : 12);
    if (key === "plinko") {
      g.maxMultiplier = Math.min(g.maxMultiplier, 2);
    } else if (key === "wheel" || key === "hilo") {
      g.maxMultiplier = Math.min(g.maxMultiplier, 5);
    } else if (key !== "crash") {
      g.maxMultiplier = Math.min(g.maxMultiplier, 10);
    }
    g.houseEdge = Math.min(Math.max(Number(g.houseEdge) || 0.03, 0.01), 0.2);
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
  methods: [
    {
      id: "bkash",
      name: "bKash",
      color: "#E2136E",
      logo: "/payments/bkash.png",
      number: "01XXXXXXXXX",
      type: "Personal",
    },
    {
      id: "nagad",
      name: "Nagad",
      color: "#F15A29",
      logo: "/payments/nagad.png",
      number: "01XXXXXXXXX",
      type: "Personal",
    },
    {
      id: "rocket",
      name: "Rocket",
      color: "#8B2C8A",
      logo: "/payments/rocket.png",
      number: "01XXXXXXXXX",
      type: "Personal",
    },
    {
      id: "upay",
      name: "Upay",
      color: "#F9A825",
      logo: "/payments/upay.png",
      number: "01XXXXXXXXX",
      type: "Personal",
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
