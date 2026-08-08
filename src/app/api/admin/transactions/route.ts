import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const txs = await prisma.transaction.findMany({
      where: type ? { type: type as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { username: true } } },
    });
    return ok({ transactions: txs });
  } catch (e) {
    return handleError(e);
  }
}
