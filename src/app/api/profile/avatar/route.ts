import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Invalid form data", 400);

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Missing file", 400);
  if (!file.type.startsWith("image/")) return jsonError("File must be an image", 400);
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return jsonError("Файл слишком большой (макс. 2MB).", 400);
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Store in public/ so it can be served statically.
  const outDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await fs.mkdir(outDir, { recursive: true });
  const filename = `user-${user.id}.png`;
  const outPath = path.join(outDir, filename);

  // Normalize to a square PNG; UI clips to circle.
  const png = await sharp(buf)
    .resize(256, 256, { fit: "cover" })
    .png()
    .toBuffer();
  await fs.writeFile(outPath, png);

  // Bust browser cache when user re-uploads.
  const url = `/uploads/avatars/${filename}?v=${Date.now()}`;
  return NextResponse.json({ ok: true, avatar: url });
}

