import { prisma } from "@/lib/db";
import { mergeHouseRule, type HouseRuleConfig } from "@/lib/game-config";

/**
 * House rules are retained only as a legacy, read-only configuration surface.
 * Outcome generation must never be changed by wager totals or admin thresholds.
 */
export async function getHouseRule(): Promise<HouseRuleConfig> {
  try {
    const cfg = await prisma.appConfig.findUnique({ where: { id: "main" } });
    return mergeHouseRule(cfg?.houseRuleConfig);
  } catch {
    return mergeHouseRule(null);
  }
}

/** Outcome control has been intentionally removed. */
export async function shouldForceHouseLoss(gameCode?: string): Promise<{
  force: false;
  total: 0;
  threshold: number;
  rule: HouseRuleConfig;
}> {
  void gameCode;
  const rule = await getHouseRule();
  return { force: false, total: 0, threshold: rule.thresholdAmount, rule };
}
