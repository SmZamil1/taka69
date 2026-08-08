import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustBalance, creditWin } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const requests = await prisma.walletRequest.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { username: true, balance: true, id: true } } },
    });
    return ok({ requests });
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  id: z.string(),
  action: z.enum(["approve", "reject"]),
  adminNote: z.string().max(200).optional(),
});

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await req.json());
    const row = await prisma.walletRequest.findUnique({ where: { id: body.id } });
    if (!row) return fail("Not found", 404);
    if (row.status !== "PENDING") return fail("Already processed");

    if (body.action === "reject") {
      if (row.type === "WITHDRAW") {
        // refund held amount
        await creditWin(row.userId, row.amount, "Withdraw rejected refund", {
          requestId: row.id,
        });
      }
      const updated = await prisma.walletRequest.update({
        where: { id: row.id },
        data: {
          status: "REJECTED",
          adminNote: body.adminNote,
          processedBy: admin.username,
        },
      });
      return ok({ request: updated });
    }

    // approve
    if (row.type === "DEPOSIT") {
      await adjustBalance(
        row.userId,
        row.amount,
        "DEPOSIT",
        `Deposit approved via ${row.method}`,
        { requestId: row.id, method: row.method, trxId: row.trxId }
      );
    }
    // withdraw already deducted on create
    if (row.type === "WITHDRAW") {
      await prisma.transaction.create({
        data: {
          userId: row.userId,
          type: "WITHDRAW",
          amount: -row.amount,
          balanceAfter: (
            await prisma.user.findUniqueOrThrow({ where: { id: row.userId } })
          ).balance,
          note: `Withdraw approved via ${row.method}`,
          meta: { requestId: row.id, method: row.method },
        },
      });
    }

    const updated = await prisma.walletRequest.update({
      where: { id: row.id },
      data: {
        status: "APPROVED",
        adminNote: body.adminNote,
        processedBy: admin.username,
      },
    });
    return ok({ request: updated });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
