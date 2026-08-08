import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "./db";

/** Vercel serverless FS is read-only except /tmp */
const UPLOAD_ROOT =
  process.env.UPLOAD_DIR ||
  (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "taka69-uploads")
    : path.join(process.cwd(), "public", "uploads"));

const MAX_BYTES = 2.5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function publicUploadUrl(filename: string) {
  // Served via API route (works on Vercel + local)
  return `/api/uploads/${filename}`;
}

export function uploadDiskPath(filename: string) {
  // prevent path traversal
  const safe = path.basename(filename);
  return path.join(UPLOAD_ROOT, safe);
}

export async function ensureUploadRoot() {
  await mkdir(UPLOAD_ROOT, { recursive: true });
}

export async function saveScreenshotBase64(
  dataUrl: string,
  kind: "deposit" | "chat"
): Promise<{ url: string; expiresAt: Date; filename: string }> {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Invalid image data");
  const mime = match[1].toLowerCase();
  if (!ALLOWED.has(mime)) throw new Error("Only JPG, PNG, WEBP allowed");
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > MAX_BYTES) throw new Error("Image too large (max 2.5MB)");

  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const filename = `${kind}_${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`;

  await ensureUploadRoot();
  await writeFile(uploadDiskPath(filename), buf);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.uploadAsset.create({
    data: {
      kind,
      path: filename,
      mimeType: mime,
      size: buf.length,
      expiresAt,
    },
  });

  return { url: publicUploadUrl(filename), expiresAt, filename };
}

export async function readUploadFile(filename: string): Promise<{
  buf: Buffer;
  mimeType: string;
} | null> {
  const safe = path.basename(filename);
  try {
    const buf = await readFile(uploadDiskPath(safe));
    const row = await prisma.uploadAsset.findFirst({ where: { path: safe } });
    return { buf, mimeType: row?.mimeType || "image/jpeg" };
  } catch {
    // fallback: old public/uploads path (local legacy)
    try {
      const legacy = path.join(process.cwd(), "public", "uploads", safe);
      const buf = await readFile(legacy);
      return { buf, mimeType: "image/jpeg" };
    } catch {
      return null;
    }
  }
}

export async function purgeExpiredUploads() {
  const now = new Date();
  const expired = await prisma.uploadAsset.findMany({
    where: { expiresAt: { lte: now } },
    take: 200,
  });
  for (const row of expired) {
    try {
      await unlink(uploadDiskPath(row.path));
    } catch {
      /* already gone */
    }
    await prisma.uploadAsset.delete({ where: { id: row.id } }).catch(() => null);
  }

  await prisma.walletRequest.updateMany({
    where: {
      screenshotExpiresAt: { lte: now },
      screenshotUrl: { not: null },
    },
    data: { screenshotUrl: null, screenshotExpiresAt: null },
  });

  await prisma.chatMessage.updateMany({
    where: {
      imageExpiresAt: { lte: now },
      imageUrl: { not: null },
    },
    data: { imageUrl: null, imageExpiresAt: null },
  });

  return expired.length;
}
