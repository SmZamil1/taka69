import { z } from "zod";
import { requireUser, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { placeBet, creditWin } from "@/lib/wallet";

export const dynamic = "force-dynamic";

/** Shared wallet bridge for HTML5 slot games (Fortune Maya, etc.) */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return ok({ loggedIn: false, balance: 0, currency: "BDT", currencySymbol: "৳" });
    }
    const u = await prisma.user.findUnique({
      where: { id: session.id },
      select: { balance: true, username: true, isBanned: true },
    });
    if (!u || u.isBanned) {
      return ok({ loggedIn: false, balance: 0, currency: "BDT", currencySymbol: "৳" });
    }
    return ok({
      loggedIn: true,
      balance: u.balance,
      username: u.username,
      currency: "BDT",
      currencySymbol: "৳",
    });
  } catch (e) {
    return handleError(e);
  }
}

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("bet"),
    amount: z.number().positive().max(1_000_000),
    game: z.string().max(64).optional(),
  }),
  z.object({
    action: z.literal("win"),
    amount: z.number().min(0).max(5_000_000),
    game: z.string().max(64).optional(),
    meta: z.record(z.unknown()).optional(),
  }),
  z.object({
    action: z.literal("state"),
  }),
]);

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.isBanned) return fail("Account banned", 403);
    const body = postSchema.parse(await req.json());
    const game = ("game" in body && body.game) || "slots";

    if (body.action === "state") {
      const fresh = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { balance: true },
      });
      return ok({
        balance: fresh.balance,
        currency: "BDT",
        currencySymbol: "৳",
      });
    }

    if (body.action === "bet") {
      const updated = await placeBet(user.id, body.amount, `${game} spin`);
      return ok({
        balance: updated.balance,
        currency: "BDT",
        currencySymbol: "৳",
      });
    }

    if (body.action === "win") {
      const updated = await creditWin(
        user.id,
        body.amount,
        `${game} win`,
        (body.meta as object) || undefined
      );
      return ok({
        balance: updated.balance,
        currency: "BDT",
        currencySymbol: "৳",
      });
    }

    return fail("Unknown action");
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    if (e instanceof Error) return fail(e.message, 400);
    return handleError(e);
  }
}
