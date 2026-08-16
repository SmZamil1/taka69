import { prisma } from "@/lib/db";
import {
  crashPointFromSeeds,
  seedToFloat,
  generateServerSeed,
  hashServerSeed,
  finalizePayout,
} from "@/lib/fairness";
import { mergeGameConfig, normalizeCrashControl, type GameLimits } from "@/lib/game-config";
import { adjustBalance, creditWin, placeBet } from "@/lib/wallet";

/** Match slower client climb so server crash timing feels natural */
export const CRASH_GROWTH = 0.055;
export const BETTING_MS = 5000;
export const CRASHED_HOLD_MS = 2800;

export type CrashPhase = "betting" | "flying" | "crashed";

export function multAtElapsed(ms: number, growth = CRASH_GROWTH) {
  const s = Math.max(0, ms) / 1000;
  return Math.max(1, Math.floor(Math.exp(growth * s) * 100) / 100);
}

export function elapsedForMult(mult: number, growth = CRASH_GROWTH) {
  if (mult <= 1) return 0;
  return (Math.log(mult) / growth) * 1000;
}

type RoundResult = {
  mode?: string;
  phase?: CrashPhase;
  growth?: number;
  control?: ReturnType<typeof normalizeCrashControl>;
  controlHash?: string;
  distribution?: string;
  bettingEndsAt?: string;
  flyStartedAt?: string;
  crashedAt?: string;
  public?: boolean;
};

async function loadCfg(): Promise<GameLimits> {
  const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
  const merged = mergeGameConfig(config?.gameConfig);
  const raw = config?.gameConfig && typeof config.gameConfig === "object"
    ? (config.gameConfig as Record<string, unknown>)
    : {};
  const rawCrash = raw.crash && typeof raw.crash === "object" ? (raw.crash as Record<string, unknown>) : {};
  const rawAviator = raw.aviator && typeof raw.aviator === "object" ? (raw.aviator as Record<string, unknown>) : {};
  // Crash is the shared engine's primary profile; Aviator is a compatible
  // fallback for deployments that only configured the Aviator key.
  const crashControl = Object.prototype.hasOwnProperty.call(rawCrash, "crashControl")
    ? merged.crash.crashControl
    : Object.prototype.hasOwnProperty.call(rawAviator, "crashControl")
      ? merged.aviator.crashControl
      : merged.crash.crashControl;
  return { ...merged.crash, crashControl };
}

function phaseOf(round: {
  status: string;
  crashPoint: number | null;
  startedAt: Date;
  endedAt: Date | null;
  result: unknown;
}): { phase: CrashPhase; current: number; msLeft: number; flyElapsed: number } {
  const res = (round.result || {}) as RoundResult;
  const now = Date.now();

  if (round.status === "betting" || res.phase === "betting") {
    const ends = res.bettingEndsAt
      ? new Date(res.bettingEndsAt).getTime()
      : new Date(round.startedAt).getTime() + BETTING_MS;
    return {
      phase: "betting",
      current: 1,
      msLeft: Math.max(0, ends - now),
      flyElapsed: 0,
    };
  }

  if (round.status === "crashed" || res.phase === "crashed" || round.status === "completed") {
    const holdStart = res.crashedAt
      ? new Date(res.crashedAt).getTime()
      : round.endedAt
        ? new Date(round.endedAt).getTime()
        : now;
    return {
      phase: "crashed",
      current: round.crashPoint || 1,
      msLeft: Math.max(0, holdStart + CRASHED_HOLD_MS - now),
      flyElapsed: 0,
    };
  }

  // flying
  const flyStart = res.flyStartedAt
    ? new Date(res.flyStartedAt).getTime()
    : new Date(round.startedAt).getTime();
  const elapsed = Math.max(0, now - flyStart);
  const cp = round.crashPoint || 1;
  const crashMs = elapsedForMult(cp);
  if (elapsed >= crashMs) {
    return {
      phase: "crashed",
      current: cp,
      msLeft: Math.max(0, flyStart + crashMs + CRASHED_HOLD_MS - now),
      flyElapsed: crashMs,
    };
  }
  return {
    phase: "flying",
    current: multAtElapsed(elapsed),
    msLeft: crashMs - elapsed,
    flyElapsed: elapsed,
  };
}

function fairCrashPoint(cfg: GameLimits, serverSeed: string, clientSeed: string, nonce: number) {
  const point = crashPointFromSeeds(serverSeed, clientSeed, nonce, cfg.houseEdge, cfg.maxMultiplier);
  return Math.floor(Math.min(cfg.maxMultiplier, Math.max(1, point)) * 100) / 100;
}

async function createBettingRound(cfg: GameLimits) {
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const clientSeed = "global";
  const nonce = Date.now() % 1_000_000;
  const control = normalizeCrashControl(cfg.crashControl);
  const crashPoint = fairCrashPoint(cfg, serverSeed, clientSeed, nonce);
  const now = new Date();
  const bettingEndsAt = new Date(now.getTime() + BETTING_MS).toISOString();

  return prisma.gameRound.create({
    data: {
      gameType: "CRASH",
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      crashPoint,
      status: "betting",
      startedAt: now,
      result: {
        mode: "global",
        phase: "betting",
        growth: CRASH_GROWTH,
        bettingEndsAt,
        control,
        distribution: "provably-fair-v1",
        public: true,
      },
    },
  });
}

/** Advance global crash lifecycle. Safe to call often. */
export async function ensureCrashRound() {
  const cfg = await loadCfg();
  const control = normalizeCrashControl(cfg.crashControl);
  if (!cfg.enabled) {
    return { cfg, round: null as null };
  }

  // Find latest public crash round
  let round = await prisma.gameRound.findFirst({
    where: {
      gameType: "CRASH",
      status: { in: ["betting", "flying", "crashed", "active"] },
    },
    orderBy: { startedAt: "desc" },
    include: {
      bets: {
        include: { user: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
        take: 80,
      },
    },
  });
  // Prefer shared public rounds over legacy single-player "active" rounds
  if (round && round.status === "active") {
    const res = (round.result || {}) as RoundResult;
    if (!res.public) {
      // ignore legacy personal rounds
      round = await prisma.gameRound.findFirst({
        where: { gameType: "CRASH", status: { in: ["betting", "flying", "crashed"] } },
        orderBy: { startedAt: "desc" },
        include: {
          bets: {
            include: { user: { select: { id: true, username: true, avatar: true } } },
            orderBy: { createdAt: "asc" },
            take: 80,
          },
        },
      });
    }
  }

  if (!round) {
    if (!control.roundEnabled) return { cfg, round: null as null };
    const created = await createBettingRound(cfg);
    round = await prisma.gameRound.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        bets: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
          take: 80,
        },
      },
    });
    return { cfg, round };
  }

  const info = phaseOf(round);
  const res = (round.result || {}) as RoundResult;

  // betting -> flying
  if (round.status === "betting" && info.msLeft <= 0) {
    const flyStartedAt = new Date().toISOString();
    round = await prisma.gameRound.update({
      where: { id: round.id },
      data: {
        status: "flying",
        result: {
          ...res,
          phase: "flying",
          flyStartedAt,
          growth: CRASH_GROWTH,
          public: true,
        },
      },
      include: {
        bets: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
          orderBy: { createdAt: "asc" },
          take: 80,
        },
      },
    });
    return { cfg, round };
  }

  // flying -> crashed when time reached
  if (round.status === "flying" || round.status === "active") {
    const flyStart = res.flyStartedAt
      ? new Date(res.flyStartedAt).getTime()
      : new Date(round.startedAt).getTime();
    const cp = round.crashPoint || 1;
    const crashMs = elapsedForMult(cp);
    if (Date.now() - flyStart >= crashMs) {
      const crashedAt = new Date(flyStart + crashMs).toISOString();
      // mark round crashed; settle uncashed bets as losses
      await prisma.$transaction(async (tx) => {
        await tx.gameRound.update({
          where: { id: round!.id },
          data: {
            status: "crashed",
            endedAt: new Date(flyStart + crashMs),
            result: {
              ...res,
              phase: "crashed",
              crashedAt,
              public: true,
              growth: CRASH_GROWTH,
            },
          },
        });
        await tx.bet.updateMany({
          where: { roundId: round!.id, cashedOut: false },
          data: { won: false, payout: 0 },
        });
      });
      round = await prisma.gameRound.findUniqueOrThrow({
        where: { id: round.id },
        include: {
          bets: {
            include: { user: { select: { id: true, username: true, avatar: true } } },
            orderBy: { createdAt: "asc" },
            take: 80,
          },
        },
      });
      return { cfg, round };
    }
  }

  // crashed hold -> new betting round
  if (round.status === "crashed") {
    const hold = phaseOf(round);
    if (hold.msLeft <= 0) {
      // finalize as completed for history
      await prisma.gameRound.update({
        where: { id: round.id },
        data: {
          status: "completed",
          result: { ...(round.result as object), phase: "completed", public: true },
        },
      });
      if (!control.roundEnabled) return { cfg, round: null as null };
      const created = await createBettingRound(cfg);
      round = await prisma.gameRound.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          bets: {
            include: { user: { select: { id: true, username: true, avatar: true } } },
            take: 80,
          },
        },
      });
    }
  }

  return { cfg, round };
}

export function publicState(
  round: NonNullable<Awaited<ReturnType<typeof ensureCrashRound>>["round"]>,
  cfg: GameLimits,
  userId?: string
) {
  const info = phaseOf(round);
  const res = (round.result || {}) as RoundResult;
  const myBets = userId
    ? round.bets.filter((b) => b.userId === userId)
    : [];

  // Never leak crash point while flying/betting
  const revealCrash = info.phase === "crashed";

  return {
    roundId: round.id,
    phase: info.phase,
    current: info.current,
    msLeft: info.msLeft,
    growth: CRASH_GROWTH,
    bettingMs: BETTING_MS,
    serverSeedHash: round.serverSeedHash,
    serverSeed: revealCrash ? round.serverSeed : undefined,
    crashPoint: revealCrash ? round.crashPoint : undefined,
    flyStartedAt: res.flyStartedAt || null,
    bettingEndsAt: res.bettingEndsAt || null,
    crashedAt: res.crashedAt || null,
    startedAt: round.startedAt,
    limits: {
      minBet: cfg.minBet,
      maxBet: cfg.maxBet,
      maxWin: cfg.maxWin,
      maxMultiplier: cfg.maxMultiplier,
      enabled: cfg.enabled,
      roundEnabled: normalizeCrashControl(cfg.crashControl).roundEnabled,
      houseEdge: cfg.houseEdge,
      rtp: cfg.rtpTarget,
      distribution: res.distribution || "provably-fair-v1",
    },
    players: round.bets.map((b) => {
      const meta = (b.meta || {}) as { panel?: number; autoCashout?: number };
      return {
        id: b.id,
        userId: b.userId,
        name: b.user?.username || "player",
        amount: b.amount,
        cashedOut: b.cashedOut,
        multiplier: b.multiplier,
        payout: b.payout,
        panel: meta.panel || 1,
        autoCashout: meta.autoCashout,
      };
    }),
    myBets: myBets.map((b) => {
      const meta = (b.meta || {}) as { panel?: number; autoCashout?: number };
      return {
        id: b.id,
        amount: b.amount,
        cashedOut: b.cashedOut,
        multiplier: b.multiplier,
        payout: b.payout,
        panel: meta.panel || 1,
        autoCashout: meta.autoCashout || null,
        won: b.won,
      };
    }),
  };
}

export async function placeCrashBet(opts: {
  userId: string;
  amount: number;
  panel?: number;
  autoCashout?: number;
  clientSeed?: string;
}) {
  const { cfg, round } = await ensureCrashRound();
  if (!round) throw new Error("Game disabled");
  if (!cfg.enabled) throw new Error("Game temporarily disabled");
  if (opts.amount < cfg.minBet) throw new Error(`Minimum bet is ${cfg.minBet} TK`);
  if (opts.amount > cfg.maxBet) throw new Error(`Maximum bet is ${cfg.maxBet} TK`);

  const info = phaseOf(round);
  if (info.phase !== "betting") {
    const err = new Error("WAITING_NEXT_ROUND");
    (err as Error & { code: string }).code = "WAITING_NEXT_ROUND";
    throw err;
  }

  const panel = opts.panel === 2 ? 2 : 1;
  const existing = round.bets.find((b) => {
    const meta = (b.meta || {}) as { panel?: number };
    return b.userId === opts.userId && (meta.panel || 1) === panel && !b.cashedOut;
  });
  // allow only one open bet per panel
  if (existing && existing.payout === 0 && !existing.cashedOut) {
    throw new Error("Already bet on this panel");
  }

  await placeBet(opts.userId, opts.amount, `Crash bet P${panel}`);
  const bet = await prisma.bet.create({
    data: {
      userId: opts.userId,
      roundId: round.id,
      gameType: "CRASH",
      amount: opts.amount,
      payout: 0,
      won: false,
      cashedOut: false,
      meta: {
        panel,
        autoCashout: opts.autoCashout || null,
        clientSeed: opts.clientSeed || null,
      },
    },
  });

  const balance = (await prisma.user.findUniqueOrThrow({ where: { id: opts.userId } })).balance;
  const refreshed = await ensureCrashRound();
  return {
    bet,
    balance,
    state: publicState(refreshed.round!, refreshed.cfg, opts.userId),
  };
}

export async function cashOutCrashBet(opts: { userId: string; betId?: string; panel?: number }) {
  // Cashout must always work while plane is flying (house rule only affects crash point / new bets)
  const { cfg, round } = await ensureCrashRound();
  if (!round) throw new Error("No round");
  const info = phaseOf(round);
  if (info.phase !== "flying") {
    if (info.phase === "crashed") throw new Error("Already crashed");
    throw new Error("Not flying");
  }

  const panel = opts.panel === 2 ? 2 : 1;
  const bet =
    round.bets.find((b) => {
      if (b.userId !== opts.userId) return false;
      if (opts.betId) return b.id === opts.betId;
      const meta = (b.meta || {}) as { panel?: number };
      return (meta.panel || 1) === panel;
    }) || null;

  if (!bet) throw new Error("No bet");
  if (bet.cashedOut) throw new Error("Already cashed out");

  // re-check crash with precise time
  const res = (round.result || {}) as RoundResult;
  const flyStart = res.flyStartedAt
    ? new Date(res.flyStartedAt).getTime()
    : new Date(round.startedAt).getTime();
  const elapsed = Date.now() - flyStart;
  const cp = round.crashPoint || 1;
  if (elapsed >= elapsedForMult(cp)) {
    // crashed
    await ensureCrashRound();
    throw new Error("Already crashed");
  }

  let current = multAtElapsed(elapsed);
  const meta = (bet.meta || {}) as { autoCashout?: number };
  if (meta.autoCashout && current > meta.autoCashout) {
    current = meta.autoCashout;
  }

  const capped = finalizePayout(bet.amount, current, cfg);
  await prisma.bet.update({
    where: { id: bet.id },
    data: {
      cashedOut: true,
      won: true,
      payout: capped.payout,
      multiplier: capped.multiplier,
    },
  });
  const updated = await creditWin(opts.userId, capped.payout, `Crash cashout ${capped.multiplier}x`, {
    roundId: round.id,
    betId: bet.id,
    multiplier: capped.multiplier,
  });

  const refreshed = await ensureCrashRound();
  return {
    multiplier: capped.multiplier,
    payout: capped.payout,
    balance: updated.balance,
    capped: capped.capped,
    state: publicState(refreshed.round!, refreshed.cfg, opts.userId),
  };
}

/** Cancel an open bet during betting phase (refund). */
export async function cancelCrashBet(opts: {
  userId: string;
  betId?: string;
  panel?: number;
}) {
  const { cfg, round } = await ensureCrashRound();
  if (!round) throw new Error("No round");
  const info = phaseOf(round);
  if (info.phase !== "betting") throw new Error("Can only cancel during betting");

  const panel = opts.panel === 2 ? 2 : 1;
  const bet =
    round.bets.find((b) => {
      if (b.userId !== opts.userId) return false;
      if (b.cashedOut || b.payout > 0) return false;
      if (opts.betId) return b.id === opts.betId;
      const meta = (b.meta || {}) as { panel?: number };
      return (meta.panel || 1) === panel;
    }) || null;

  if (!bet) throw new Error("No open bet");

  // soft-delete / mark cancelled
  await prisma.bet.update({
    where: { id: bet.id },
    data: {
      cashedOut: true,
      won: false,
      payout: 0,
      multiplier: null,
      meta: {
        ...((bet.meta || {}) as object),
        cancelled: true,
        cancelledAt: new Date().toISOString(),
      },
    },
  });

  // refund stake
  const updated = await adjustBalance(
    opts.userId,
    bet.amount,
    "REFUND",
    `Crash bet cancel P${panel}`,
    { betId: bet.id, roundId: round.id }
  );

  const refreshed = await ensureCrashRound();
  return {
    cancelled: true,
    balance: updated.balance,
    state: publicState(refreshed.round!, refreshed.cfg, opts.userId),
  };
}

/** Auto-cashout processing for flying round */
export async function processAutoCashouts() {
  const { cfg, round } = await ensureCrashRound();
  if (!round || round.status !== "flying") return;
  const info = phaseOf(round);
  if (info.phase !== "flying") return;

  for (const bet of round.bets) {
    if (bet.cashedOut) continue;
    const meta = (bet.meta || {}) as { autoCashout?: number; cancelled?: boolean };
    if (meta.cancelled) continue;
    if (!meta.autoCashout || meta.autoCashout < 1.01) continue;
    // small epsilon so we fire slightly early and never miss the target
    if (info.current + 0.02 >= meta.autoCashout) {
      try {
        await cashOutCrashBet({ userId: bet.userId, betId: bet.id });
      } catch {
        /* already crashed or raced */
      }
    }
  }
  void cfg;
}