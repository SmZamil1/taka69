import { z } from "zod";
import { requireStaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireStaffPermission("wallet");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const cards = await prisma.walletCard.findMany({
      where: status && ["ACTIVE", "PENDING", "VERIFIED", "REJECTED", "BLOCKED"].includes(status) ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, username: true, balance: true } } },
    });
    return ok({ cards });
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  id: z.string().min(1),
  action: z.enum(["verify", "reject", "block", "activate"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(req: Request) {
  try {
    const admin = await requireStaffPermission("wallet");
    const body = schema.parse(await req.json());
    const data = body.action === "verify"
      ? { status: "VERIFIED" as const, verifiedAt: new Date(), verifiedBy: admin.id, rejectionReason: null }
      : body.action === "reject"
        ? { status: "REJECTED" as const, rejectionReason: body.reason || "Rejected by admin" }
        : body.action === "block"
          ? { status: "BLOCKED" as const, rejectionReason: body.reason || "Blocked by admin" }
          : { status: "ACTIVE" as const, rejectionReason: null };
    const card = await prisma.walletCard.update({ where: { id: body.id }, data });
    return ok({ card });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
