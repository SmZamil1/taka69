import { prisma } from "@/lib/db";
import { mergeHouseRule, type HouseRuleConfig } from "@/lib/game-config";

export async function getHouseRule(): Promise<HouseRuleConfig> {
  try {
    const cfg = await prisma.appConfig.findUnique({ where: { id: "main" } });
    return mergeHouseRule(cfg?.houseRuleConfig);
  } catch {
    return mergeHouseRule(null);
  }
}

/**
 * Sum of recent player bets across the platform (or open wingo + game bets).
 * Used to trigger "force house" when total crosses admin threshold.
 */
export async function getRecentTotalBets(windowMinutes: number): Promise<number> {
  const since =
    windowMinutes > 0
      ? new Date(Date.now() - windowMinutes * 60 * 1000)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [betAgg, wingoAgg] = await Promise.all([
    prisma.bet.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.wingoBetRecord.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { amount: true },
    }),
  ]);

  return (betAgg._sum.amount || 0) + (wingoAgg._sum.amount || 0);
}

/** Returns true if house should force-loss all player bets (threshold crossed). */
export async function shouldForceHouseLoss(gameCode?: string): Promise<{
  force: boolean;
  total: number;
  threshold: number;
  rule: HouseRuleConfig;
}> {
  const rule = await getHouseRule();
  if (!rule.enabled || rule.thresholdAmount <= 0) {
    return { force: false, total: 0, threshold: rule.thresholdAmount, rule };
  }
  if (rule.games?.length && gameCode && !rule.games.includes(gameCode)) {
    return { force: false, total: 0, threshold: rule.thresholdAmount, rule };
  }
  const total = await getRecentTotalBets(rule.windowMinutes || 60);
  return {
    force: total >= rule.thresholdAmount,
    total,
    threshold: rule.thresholdAmount,
    rule,
  };
}
