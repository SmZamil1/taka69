import { prisma } from "@/lib/db";

export const VIP_LEVELS = [
  { id: 0, nameEn: "Bronze",   nameBn: "ব্রোঞ্জ",   minExp: 0,      dailyBonus: 0,    weeklyBonus: 0,    rebateRate: 0,    withdrawLimit: 20000  },
  { id: 1, nameEn: "Silver",   nameBn: "সিলভার",   minExp: 1000,   dailyBonus: 50,   weeklyBonus: 200,  rebateRate: 0.5,  withdrawLimit: 30000  },
  { id: 2, nameEn: "Gold",     nameBn: "গোল্ড",    minExp: 5000,   dailyBonus: 150,  weeklyBonus: 600,  rebateRate: 1.0,  withdrawLimit: 50000  },
  { id: 3, nameEn: "Platinum", nameBn: "প্লাটিনাম", minExp: 20000,  dailyBonus: 400,  weeklyBonus: 1500, rebateRate: 1.5,  withdrawLimit: 100000 },
  { id: 4, nameEn: "Diamond",  nameBn: "ডায়মন্ড",  minExp: 80000,  dailyBonus: 1000, weeklyBonus: 4000, rebateRate: 2.0,  withdrawLimit: 200000 },
  { id: 5, nameEn: "Legend",   nameBn: "লিজেন্ড",  minExp: 300000, dailyBonus: 3000, weeklyBonus: 12000,rebateRate: 3.0,  withdrawLimit: 500000 },
];

export async function addVipExp(userId: string, betAmount: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vipExp: true, vipLevel: true, balance: true },
    });
    if (!user) return;

    const newExp = user.vipExp + betAmount;
    const newLevel = VIP_LEVELS.filter((v) => newExp >= v.minExp).pop()?.id ?? 0;
    const levelUp = newLevel > user.vipLevel;

    await prisma.user.update({
      where: { id: userId },
      data: { vipExp: newExp, vipLevel: newLevel },
    });

    if (levelUp) {
      const lvl = VIP_LEVELS[newLevel];
      const bonus = lvl.dailyBonus * 5;
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: bonus } },
      });
      await prisma.transaction.create({
        data: {
          userId,
          type: "VIP_BONUS",
          amount: bonus,
          balanceAfter: user.balance + bonus,
          note: `VIP Level Up to ${lvl.nameEn}`,
          meta: { vipLevel: newLevel },
        },
      });
      return { levelUp: true, newLevel, bonus };
    }
    return { levelUp: false, newLevel };
  } catch {
    // Non-fatal — don't break the game if VIP update fails
    return null;
  }
}

export async function claimVipDailyBonus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vipLevel: true, balance: true, lastDailyAt: true },
  });
  if (!user) throw new Error("User not found");

  const lvl = VIP_LEVELS[user.vipLevel];
  if (!lvl || lvl.dailyBonus === 0) throw new Error("No daily bonus at your VIP level");

  const now = new Date();
  if (user.lastDailyAt) {
    const diff = now.getTime() - user.lastDailyAt.getTime();
    if (diff < 20 * 60 * 60 * 1000) throw new Error("Already claimed today");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { balance: { increment: lvl.dailyBonus }, lastDailyAt: now },
  });
  await prisma.transaction.create({
    data: {
      userId,
      type: "VIP_BONUS",
      amount: lvl.dailyBonus,
      balanceAfter: user.balance + lvl.dailyBonus,
      note: `VIP ${lvl.nameEn} daily bonus`,
      meta: { vipLevel: user.vipLevel },
    },
  });

  return { bonus: lvl.dailyBonus, nextAt: new Date(now.getTime() + 20 * 60 * 60 * 1000) };
}
