import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const cardSchema = z.object({
  method: z.string().trim().min(1).max(30),
  accountNo: z.string().trim().min(5).max(32),
  accountName: z.string().trim().max(80).optional(),
});

function maskAccount(accountNo: string) {
  if (accountNo.length <= 4) return accountNo;
  return `${accountNo.slice(0, 3)}••••${accountNo.slice(-3)}`;
}

function serializeCard(card: { id: string; method: string; label: string; accountNo: string; accountName: string | null; createdAt: Date }) {
  return {
    id: card.id,
    method: card.method,
    label: card.label,
    accountNo: maskAccount(card.accountNo),
    accountName: card.accountName,
    createdAt: card.createdAt,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const cards = await prisma.walletCard.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, method: true, label: true, accountNo: true, accountName: true, createdAt: true },
    });
    return ok({ cards: cards.map(serializeCard) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = cardSchema.parse(await req.json());
    const accountNo = body.accountNo.replace(/[\s-]/g, "");
    const label = body.method.slice(0, 1).toUpperCase() + body.method.slice(1).toLowerCase();

    const existing = await prisma.walletCard.findUnique({
      where: { userId_method_accountNo: { userId: user.id, method: body.method.toLowerCase(), accountNo } },
      select: { id: true },
    });
    if (existing) return fail("This wallet account is already added", 409);

    const card = await prisma.walletCard.create({
      data: {
        userId: user.id,
        method: body.method.toLowerCase(),
        label,
        accountNo,
        accountName: body.accountName?.trim() || null,
      },
      select: { id: true, method: true, label: true, accountNo: true, accountName: true, createdAt: true },
    });
    return ok({ card: serializeCard(card) }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return fail("Card id is required", 400);

    const result = await prisma.walletCard.deleteMany({ where: { id, userId: user.id } });
    if (!result.count) return fail("Wallet card not found", 404);
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
}
