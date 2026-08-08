import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { placeBet } from "@/lib/wallet";
import { fail, handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAW"]),
  method: z.enum(["bkash", "nagad", "rocket", "upay"]),
  amount: z.number().positive().max(1_000_000),
  accountName: z.string().max(80).optional(),
  accountNo: z.string().max(40).optional(),
  trxId: z.string().max(80).optional(),
  note: z.string().max(200).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const requests = await prisma.walletRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const config = await prisma.appConfig.findUnique({ where: { id: "main" } });
    return ok({
      requests,
      paymentConfig: config?.paymentConfig || {
        noticeEn: "Virtual TC only. Requests are reviewed by admin. No real money moves.",
        noticeBn: "শুধু ভার্চুয়াল TC। অ্যাডমিন রিভিউ করে। আসল টাকা যায় না।",
        minDeposit: 100,
        minWithdraw: 200,
        methods: ["bkash", "nagad", "rocket", "upay"],
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    if (body.type === "WITHDRAW") {
      if (!body.accountNo) return fail("Account number required for withdraw");
      if (user.balance < body.amount) return fail("Insufficient balance");
      // hold funds
      await placeBet(user.id, body.amount, `Withdraw hold ${body.method}`);
    }

    if (body.type === "DEPOSIT" && !body.trxId) {
      return fail("Transaction ID required for deposit request");
    }

    const row = await prisma.walletRequest.create({
      data: {
        userId: user.id,
        type: body.type,
        method: body.method,
        amount: body.amount,
        accountName: body.accountName,
        accountNo: body.accountNo,
        trxId: body.trxId,
        note: body.note,
        status: "PENDING",
      },
    });

    const balance = (
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    ).balance;

    return ok({
      request: row,
      balance,
      message:
        body.type === "DEPOSIT"
          ? "Deposit request submitted for admin review (virtual TC)"
          : "Withdraw request submitted — amount held pending review (virtual TC)",
    });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    return handleError(e);
  }
}
