import { z } from "zod";
import { requireStaffPermission } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { saveScreenshotBase64 } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const schema = z.object({
  dataUrl: z.string().min(20).max(4_000_000),
  kind: z.enum(["banner", "deposit", "chat"]).optional(),
});

export async function POST(req: Request) {
  try {
    await requireStaffPermission("banners");
    const body = schema.parse(await req.json());
    // reuse screenshot saver (stores under /tmp on vercel, served via /api/uploads)
    const saved = await saveScreenshotBase64(body.dataUrl, body.kind === "chat" ? "chat" : "deposit");
    return ok({ url: saved.url, expiresAt: saved.expiresAt });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.errors[0]?.message || "Invalid", 400);
    if (e instanceof Error) return fail(e.message, 400);
    return handleError(e);
  }
}
