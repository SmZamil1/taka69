import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "./db";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 2.5 * 1024 * 1024; // 2.5MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function publicUploadUrl(filename: string) {
  return `/uploads/${filename}`;
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
  await mkdir(UPLOAD_ROOT, { recursive: true });
  await writeFile(path.join(UPLOAD_ROOT, filename), buf);

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

export async function purgeExpiredUploads() {
  const now = new Date();
  const expired = await prisma.uploadAsset.findMany({
    where: { expiresAt: { lte: now } },
    take: 200,
  });
  for (const row of expired) {
    try {
      await unlink(path.join(UPLOAD_ROOT, row.path));
    } catch {
      /* already gone */
    }
    await prisma.uploadAsset.delete({ where: { id: row.id } }).catch(() => null);
  }

  // Clear expired screenshot refs on wallet requests
  await prisma.walletRequest.updateMany({
    where: {
      screenshotExpiresAt: { lte: now },
      screenshotUrl: { not: null },
    },
    data: { screenshotUrl: null, screenshotExpiresAt: null },
  });

  // Clear expired chat images
  await prisma.chatMessage.updateMany({
    where: {
      imageExpiresAt: { lte: now },
      imageUrl: { not: null },
    },
    data: { imageUrl: null, imageExpiresAt: null },
  });

  return expired.length;
}
