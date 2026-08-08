import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustBalance } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const missions = await prisma.mission.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        progress: { where: { userId: user.id } },
      },
    });

    // auto-update progress from bets
    const betCount = await prisma.bet.count({ where: { userId: user.id } });
    const winCount = await prisma.bet.count({ where: { userId: user.id, won: true } });

    const mapped = [];
    for (const m of missions) {
      let p = m.progress[0];
      let value = p?.progress ?? 0;
      if (m.code === "PLAY_10") value = Math.min(betCount, m.target);
      if (m.code === "WIN_5") value = Math.min(winCount, m.target);
      if (m.code === "CRASH_3") {
        value = Math.min(
          await prisma.bet.count({ where: { userId: user.id, gameType: "CRASH" } }),
          m.target
        );
      }
      if (!p) {
        p = await prisma.missionProgress.create({
          data: {
            userId: user.id,
            missionId: m.id,
            progress: value,
            completed: value >= m.target,
          },
        });
      } else if (p.progress !== value) {
        p = await prisma.missionProgress.update({
          where: { id: p.id },
          data: { progress: value, completed: value >= m.target },
        });
      }
      mapped.push({
        id: m.id,
        code: m.code,
        titleEn: m.titleEn,
        titleBn: m.titleBn,
        descriptionEn: m.descriptionEn,
        descriptionBn: m.descriptionBn,
        target: m.target,
        reward: m.reward,
        progress: p.progress,
        completed: p.completed,
        claimed: p.claimed,
      });
    }
    return ok({ missions: mapped });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { missionId } = await req.json();
    if (!missionId) return fail("missionId required");

    const prog = await prisma.missionProgress.findUnique({
      where: { userId_missionId: { userId: user.id, missionId } },
      include: { mission: true },
    });
    if (!prog) return fail("Mission not found", 404);
    if (!prog.completed) return fail("Not completed yet");
    if (prog.claimed) return fail("Already claimed");

    await prisma.missionProgress.update({
      where: { id: prog.id },
      data: { claimed: true },
    });
    const u = await adjustBalance(
      user.id,
      prog.mission.reward,
      "MISSION_REWARD",
      `Mission: ${prog.mission.code}`
    );
    return ok({ balance: u.balance, reward: prog.mission.reward });
  } catch (e) {
    return handleError(e);
  }
}
