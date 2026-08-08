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
  | "jdb";

export type GameLimits = {
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
    bigPrizeChance: 0.02,
    bigPrizeMult: 25,
    rtpTarget: 0.97,
  },
  dice: {
    enabled: true,
    minBet: 10,
    maxBet: 5000,
    maxWin: 25000,
    maxMultiplier: 50,
    houseEdge: 0.02,
    bigPrizeChance: 0.015,
    bigPrizeMult: 20,
    rtpTarget: 0.98,
  },
  mines: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 30000,
    maxMultiplier: 40,
    houseEdge: 0.02,
    bigPrizeChance: 0.02,
    bigPrizeMult: 15,
    rtpTarget: 0.97,
  },
  wheel: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 20000,
    maxMultiplier: 20,
    houseEdge: 0.04,
    bigPrizeChance: 0.03,
    bigPrizeMult: 20,
    rtpTarget: 0.96,
  },
  slots: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 50000,
    maxMultiplier: 100,
    houseEdge: 0.05,
    bigPrizeChance: 0.01,
    bigPrizeMult: 50,
    rtpTarget: 0.95,
  },
  plinko: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 15000,
    maxMultiplier: 20,
    houseEdge: 0.03,
    bigPrizeChance: 0.02,
    bigPrizeMult: 10,
    rtpTarget: 0.97,
  },
  hilo: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 10000,
    maxMultiplier: 12,
    houseEdge: 0.02,
    bigPrizeChance: 0.01,
    bigPrizeMult: 8,
    rtpTarget: 0.98,
  },
  jili: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 40000,
    maxMultiplier: 80,
    houseEdge: 0.04,
    bigPrizeChance: 0.02,
    bigPrizeMult: 40,
    rtpTarget: 0.96,
  },
  pg: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 40000,
    maxMultiplier: 80,
    houseEdge: 0.04,
    bigPrizeChance: 0.02,
    bigPrizeMult: 40,
    rtpTarget: 0.96,
  },
  spribe: {
    enabled: true,
    minBet: 10,
    maxBet: 3000,
    maxWin: 30000,
    maxMultiplier: 50,
    houseEdge: 0.03,
    bigPrizeChance: 0.02,
    bigPrizeMult: 25,
    rtpTarget: 0.97,
  },
  evolution: {
    enabled: true,
    minBet: 20,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 30,
    houseEdge: 0.03,
    bigPrizeChance: 0.015,
    bigPrizeMult: 20,
    rtpTarget: 0.97,
  },
  fa_chai: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 35000,
    maxMultiplier: 60,
    houseEdge: 0.04,
    bigPrizeChance: 0.02,
    bigPrizeMult: 30,
    rtpTarget: 0.96,
  },
  jdb: {
    enabled: true,
    minBet: 10,
    maxBet: 2000,
    maxWin: 35000,
    maxMultiplier: 60,
    houseEdge: 0.04,
    bigPrizeChance: 0.02,
    bigPrizeMult: 30,
    rtpTarget: 0.96,
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
      logo: "/payments/bkash.svg",
      number: "01XXXXXXXXX",
      type: "Personal",
    },
    {
      id: "nagad",
      name: "Nagad",
      color: "#F15A29",
      logo: "/payments/nagad.svg",
      number: "01XXXXXXXXX",
      type: "Personal",
    },
    {
      id: "rocket",
      name: "Rocket",
      color: "#8B2C8A",
      logo: "/payments/rocket.svg",
      number: "01XXXXXXXXX",
      type: "Personal",
    },
    {
      id: "upay",
      name: "Upay",
      color: "#F9A825",
      logo: "/payments/upay.svg",
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
