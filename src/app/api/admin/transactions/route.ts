import { requireStaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireStaffPermission("transactions");
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize") || 50)));
    const where = {
      ...(type ? { type: type as never } : {}),
      ...(q ? { OR: [{ id: { contains: q, mode: "insensitive" as const } }, { note: { contains: q, mode: "insensitive" as const } }, { reference: { contains: q, mode: "insensitive" as const } }, { user: { username: { contains: q, mode: "insensitive" as const } } }] } : {}),
    };
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { user: { select: { username: true } } } }),
      prisma.transaction.count({ where }),
    ]);
    return ok({ transactions, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) {
    return handleError(e);
  }
}
