import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
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
    const admin = await requireAdmin();
    const { userId, amount, note } = schema.parse(await req.json());

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return fail("User not found", 404);

    const newBalance = target.balance + amount;
    if (newBalance < 0) return fail("Would result in negative balance");

    const [user] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { balance: newBalance } }),
      prisma.transaction.create({
        data: {
          userId,
          type: "ADMIN_ADJUST",
          amount,
          balanceAfter: newBalance,
          note: note || `Admin adjustment by ${admin.username}`,
          meta: { adminId: admin.id, adminUsername: admin.username },
        },
      }),
    ]);

    return ok({ newBalance: user.balance, adjusted: amount });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
