import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") === "win" ? "totalWin" : "totalBet";

    const users = await prisma.user.findMany({
      where: { isBanned: false, role: "USER" },
      orderBy: { [sort]: "desc" },
      take: 50,
      select: { username: true, totalBet: true, totalWin: true, vipLevel: true },
    });

    const players = users.map((u, i) => ({ rank: i + 1, ...u }));
    return ok({ players });
  } catch (e) { return handleError(e); }
}
