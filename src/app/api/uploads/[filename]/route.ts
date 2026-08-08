import { NextRequest } from "next/server";
import { readUploadFile } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: { filename: string } }
) {
  const filename = ctx.params.filename;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return new Response("Bad request", { status: 400 });
  }

  const file = await readUploadFile(filename);
  if (!file) return new Response("Not found", { status: 404 });

  const bytes = new Uint8Array(file.buf);
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(bytes.byteLength),
    },
  });
}
