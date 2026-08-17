import { z } from "zod";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(4).max(64),
  confirmPassword: z.string().min(4).max(64),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "Transaction passwords do not match",
  path: ["confirmPassword"],
});

export async function GET() {
  try {
    const user = await requireUser();
    return ok({ hasTransactionPassword: Boolean(user.transactionPasswordHash) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    if (user.transactionPasswordHash) {
      if (!body.currentPassword || !(await verifyPassword(body.currentPassword, user.transactionPasswordHash))) {
        return fail("Current transaction password is incorrect", 400);
      }
    }
    const transactionPasswordHash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { transactionPasswordHash } });
    return ok({ hasTransactionPassword: true });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
