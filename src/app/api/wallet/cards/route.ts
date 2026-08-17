import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { DEFAULT_PAYMENT_CONFIG } from "@/lib/game-config";
import { normalizePaymentConfig, findPaymentMethod } from "@/lib/payment-config";

export const dynamic = "force-dynamic";

const MAX_WALLET_CARDS = 4;

const cardSchema = z.object({
  method: z.string().trim().min(1).max(30),
  accountNo: z.string().trim().min(1).max(32),
  accountName: z.string().trim().max(80).optional(),
});

function normalizeMethod(method: string) {
  const normalized = method.trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,30}$/.test(normalized)) throw new Error("Choose a valid payment method");
  return normalized;
}

function normalizeAccountNo(accountNo: string) {
  const normalized = accountNo.trim().replace(/[\s-]/g, "");
  if (!/^\+?\d{8,20}$/.test(normalized)) throw new Error("Enter a valid account number");
  return normalized;
}

function normalizeAccountName(accountName?: string) {
  const normalized = accountName?.trim() || null;
  if (normalized && /[\u0000-\u001f\u007f]/.test(normalized)) throw new Error("Enter a valid account name");
  return normalized;
}

function configuredMethodMatches(method: string, raw: unknown) {
  const source = raw === undefined ? DEFAULT_PAYMENT_CONFIG.methods : raw;
  if (!Array.isArray(source)) return false;
  const wanted = method.toLowerCase();
  return source.some((value) => {
    if (!value || typeof value !== "object") return false;
    const item = value as Record<string, unknown>;
    if (item.enabled === false) return false;
    return wanted === String(item.id || "").trim().toLowerCase() || wanted === String(item.name || "").trim().toLowerCase();
  });
}

function maskAccount(accountNo: string) {
  if (accountNo.length <= 4) return accountNo;
  return `${accountNo.slice(0, 3)}••••${accountNo.slice(-3)}`;
}

function serializeCard(card: { id: string; method: string; label: string; accountNo: string; accountName: string | null; status: string; isDefault: boolean; verifiedAt: Date | null; rejectionReason: string | null; lastUsedAt: Date | null; createdAt: Date }) {
  return {
    id: card.id,
    method: card.method,
    label: card.label,
    accountNo: maskAccount(card.accountNo),
    accountName: card.accountName,
    status: card.status,
    isDefault: card.isDefault,
    verifiedAt: card.verifiedAt,
    rejectionReason: card.rejectionReason,
    lastUsedAt: card.lastUsedAt,
    createdAt: card.createdAt,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const cards = await prisma.walletCard.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, method: true, label: true, accountNo: true, accountName: true, status: true, isDefault: true, verifiedAt: true, rejectionReason: true, lastUsedAt: true, createdAt: true },
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
    let method: string;
    let accountNo: string;
    let accountName: string | null;
    try {
      method = normalizeMethod(body.method);
      accountNo = normalizeAccountNo(body.accountNo);
      accountName = normalizeAccountName(body.accountName);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Invalid wallet account", 400);
    }
    const config = await prisma.appConfig.findUnique({ where: { id: "main" }, select: { paymentConfig: true } });
    const paymentConfig = normalizePaymentConfig(config?.paymentConfig);
    const configuredMethod = findPaymentMethod(method, paymentConfig.methods, "withdraw");
    if (!configuredMethod) return fail("Selected withdrawal method is unavailable", 400);
    method = configuredMethod.id;
    const label = configuredMethod.name;

    const existing = await prisma.walletCard.findUnique({
      where: { userId_method_accountNo: { userId: user.id, method, accountNo } },
      select: { id: true },
    });
    if (existing) return fail("This wallet account is already added", 409);

    const cardCount = await prisma.walletCard.count({ where: { userId: user.id } });
    if (cardCount >= MAX_WALLET_CARDS) return fail(`You can bind up to ${MAX_WALLET_CARDS} wallet accounts`, 400);

    const card = await prisma.walletCard.create({
      data: {
        userId: user.id,
        method,
        label,
        accountNo,
        accountName,
        status: "PENDING",
        isDefault: false,
      },
      select: { id: true, method: true, label: true, accountNo: true, accountName: true, status: true, isDefault: true, verifiedAt: true, rejectionReason: true, lastUsedAt: true, createdAt: true },
    });
    return ok({ card: serializeCard(card) }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return fail("This wallet account is already added", 409);
    }
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
