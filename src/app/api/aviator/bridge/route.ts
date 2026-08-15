import { requireUser, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { z } from "zod";
import {
  ensureCrashRound,
  publicState,
  placeCrashBet,
  cashOutCrashBet,
  processAutoCashouts,
} from "@/lib/crash-engine";

export const dynamic = "force-dynamic";

/** GET — balance + live crash state for Aviator iframe */
export async function GET() {
  try {
    await processAutoCashouts().catch(() => {});
    const session = await getSession();
    let balance: number | null = null;
    let username: string | null = null;
    if (session?.id) {
      const u = await prisma.user.findUnique({
        where: { id: session.id },
        select: { balance: true, username: true, isBanned: true },
      });
      if (u && !u.isBanned) {
        balance = u.balance;
        username = u.username;
      }
    }

    const { cfg, round } = await ensureCrashRound();
    const live = round && cfg ? publicState(round, cfg, session?.id) : null;

    return ok({
      balance,
      username,
      loggedIn: !!session?.id,
      live,
      limits: cfg
        ? { minBet: cfg.minBet, maxBet: cfg.maxBet, maxWin: cfg.maxWin, maxMultiplier: cfg.maxMultiplier }
        : { minBet: 10, maxBet: 5000, maxWin: 50000, maxMultiplier: 100 },
    });
  } catch (e) {
    return handleError(e);
  }
}

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("bet"),
    amount: z.number().positive().max(1_000_000),
    autoCashout: z.number().min(1.01).max(1000).optional(),
    panel: z.union([z.literal(1), z.literal(2)]).optional(),
  }),
  z.object({
    action: z.literal("cashout"),
    betId: z.string().optional(),
    panel: z.union([z.literal(1), z.literal(2)]).optional(),
  }),
  z.object({
    action: z.literal("state"),
  }),
]);

/** POST — place bet / cashout using real wallet */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.isBanned) return fail("Account banned", 403);

    const body = postSchema.parse(await req.json());
    await processAutoCashouts().catch(() => {});

    if (body.action === "state") {
      const { cfg, round } = await ensureCrashRound();
      const fresh = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });
      return ok({
        balance: fresh?.balance ?? user.balance,
        live: round && cfg ? publicState(round, cfg, user.id) : null,
      });
    }

    if (body.action === "bet") {
      const result = await placeCrashBet({
        userId: user.id,
        amount: body.amount,
        autoCashout: body.autoCashout,
        panel: body.panel ?? 1,
      });
      const fresh = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });
      return ok({ ...result, balance: fresh?.balance ?? 0 });
    }

    if (body.action === "cashout") {
      const result = await cashOutCrashBet({
        userId: user.id,
        betId: body.betId,
        panel: body.panel ?? 1,
      });
      const fresh = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });
      return ok({ ...result, balance: fresh?.balance ?? 0 });
    }

    return fail("Unknown action");
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    if (e instanceof Error) return fail(e.message, 400);
    return handleError(e);
  }
}
