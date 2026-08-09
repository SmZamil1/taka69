import { prisma } from "@/lib/db";

/** 3-level referral commission rates (from GOA rosesPlus logic) */
const COMMISSION_RATES = {
  bet:     [0.02, 0.01, 0.005], // L1: 2%, L2: 1%, L3: 0.5%
  deposit: [0.03, 0.015, 0.00], // L1: 3%, L2: 1.5%, L3: none
};

/**
 * Distribute commission up the referral chain (max 3 levels).
 * Called after every bet or deposit.
 */
export async function distributeCommission(
  userId: string,
  amount: number,
  sourceType: "bet" | "deposit"
) {
  const rates = COMMISSION_RATES[sourceType];
  let currentId = userId;

  for (let level = 0; level < 3; level++) {
    const user = await prisma.user.findUnique({
      where: { id: currentId },
      select: { referredById: true },
    });
    if (!user?.referredById) break;

    const referrerId = user.referredById;
    const rate = rates[level];
    if (rate === 0) { currentId = referrerId; continue; }

    const commissionAmount = parseFloat((amount * rate).toFixed(2));
    if (commissionAmount < 0.01) { currentId = referrerId; continue; }

    const referrer = await prisma.user.findUnique({
      where: { id: referrerId },
      select: { balance: true, totalCommission: true },
    });
    if (!referrer) break;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: referrerId },
        data: {
          balance: { increment: commissionAmount },
          totalCommission: { increment: commissionAmount },
        },
      }),
      prisma.commission.create({
        data: {
          earnerId: referrerId,
          sourceId: userId,
          amount: commissionAmount,
          rate,
          sourceType,
          level: level + 1,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: referrerId,
          type: "COMMISSION",
          amount: commissionAmount,
          balanceAfter: referrer.balance + commissionAmount,
          note: `L${level + 1} referral commission from ${sourceType}`,
          meta: { sourceUserId: userId, level: level + 1, rate, sourceType },
        },
      }),
    ]);

    currentId = referrerId;
  }
}

/** Get referral stats for a user */
export async function getReferralStats(userId: string) {
  const [directReferrals, commissions] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: userId },
      select: { id: true, username: true, createdAt: true, totalDeposit: true, totalBet: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.commission.findMany({
      where: { earnerId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const totalEarned = commissions.reduce((s, c) => s + c.amount, 0);
  const byLevel = [1, 2, 3].map((lvl) => {
    const levelComms = commissions.filter((c) => c.level === lvl);
    return { level: lvl, count: levelComms.length, earned: levelComms.reduce((s, c) => s + c.amount, 0) };
  });

  return { directReferrals, totalEarned, byLevel };
}
