import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { safeSharp } from "@/lib/safe-image";
import { UNSUPPORTED_IMAGE_MESSAGE } from "@/lib/image-formats";
import { NextResponse } from "next/server";
import { uploadedAvatarFilenameFromUrl } from "@/lib/avatar-validation";
import { deleteAvatarFile, writeAvatarFile } from "@/lib/avatar-storage";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { getDb, schema } from "@/lib/db";

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

  const filename = `${randomUUID()}.png`;

  let png: Buffer;
  try {
    png = await safeSharp(buf).rotate().resize(256, 256, { fit: "cover" }).png().toBuffer();
  } catch {
    return jsonError(UNSUPPORTED_IMAGE_MESSAGE, 400);
  }
  await writeAvatarFile(filename, png);

  const previous = uploadedAvatarFilenameFromUrl(user.avatar);
  if (previous && previous !== filename) await deleteAvatarFile(previous);

  const url = `/uploads/avatars/${filename}?v=${Date.now()}`;

  const db = getDb();
  await db.update(schema.users).set({ avatar: url }).where(eq(schema.users.id, user.id));

  return NextResponse.json({ ok: true, avatar: url });
}
