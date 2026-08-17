import { z } from "zod";
import { requireStaffPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string().min(1),
  amount: z.number().refine(n => n !== 0, "Amount cannot be 0"),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireStaffPermission("users");
    if (admin.role !== "ADMIN") return fail("Only ADMIN can adjust balances", 403);
    const { userId, amount, note } = schema.parse(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (!target) throw new Error("User not found");
      const newBalance = target.balance + amount;
      if (newBalance < 0) throw new Error("Would result in negative balance");
      await tx.user.update({ where: { id: userId }, data: { balance: { increment: amount } } });
      await tx.transaction.create({
        data: {
          userId,
          type: "ADMIN_ADJUST",
          amount,
          balanceAfter: newBalance,
          adminId: admin.id,
          reference: `ADMIN-${Date.now()}`,
          status: "SETTLED",
          note: note || `Admin adjustment by ${admin.username}`,
          meta: { adminId: admin.id, adminUsername: admin.username },
        },
      });
      return { newBalance };
    });
    return ok({ newBalance: result.newBalance, adjusted: amount });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
