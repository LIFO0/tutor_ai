import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

export const CHAT_IMAGE_MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1600;
const JPEG_QUALITY = 80;

const IMAGE_KEY_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/i;

export function isValidChatImageKey(key: string): boolean {
  return IMAGE_KEY_RE.test(key);
}

export function resolveChatUploadsDir(): string {
  if (process.env.CHAT_UPLOADS_PATH?.trim()) {
    const dir = process.env.CHAT_UPLOADS_PATH.trim();
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  if (process.env.DATABASE_PATH) {
    const dir = path.join(path.dirname(process.env.DATABASE_PATH), "chat-uploads");
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  const base =
    process.env.LOCALAPPDATA ||
    process.env.APPDATA ||
    path.join(os.homedir(), "AppData", "Local");
  const dir = path.join(base, "tutor_ai", "chat-uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function absolutePathForKey(key: string): string | null {
  if (!isValidChatImageKey(key)) return null;
  return path.join(resolveChatUploadsDir(), key);
}

export async function saveChatImage(input: Buffer): Promise<{ key: string; mimeType: "image/jpeg" }> {
  if (input.length <= 0 || input.length > CHAT_IMAGE_MAX_INPUT_BYTES) {
    throw new Error("Файл слишком большой (макс. 8 МБ).");
  }

  let jpeg: Buffer;
  try {
    jpeg = await sharp(input)
      .rotate()
      .resize({
        width: MAX_SIDE,
        height: MAX_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new Error("Не удалось обработать изображение. Загрузите JPEG, PNG или WebP.");
  }

  if (jpeg.length <= 0) {
    throw new Error("Не удалось обработать изображение.");
  }

  const key = `${randomUUID()}.jpg`;
  const outPath = absolutePathForKey(key);
  if (!outPath) throw new Error("Invalid image key");
  await fsp.writeFile(outPath, jpeg);
  return { key, mimeType: "image/jpeg" };
}

export async function readChatImage(
  key: string,
): Promise<{ buffer: Buffer; mimeType: "image/jpeg" } | null> {
  const filePath = absolutePathForKey(key);
  if (!filePath) return null;
  try {
    const buffer = await fsp.readFile(filePath);
    if (buffer.length === 0) return null;
    return { buffer, mimeType: "image/jpeg" };
  } catch {
    return null;
  }
}

export async function deleteChatImage(key: string): Promise<void> {
  const filePath = absolutePathForKey(key);
  if (!filePath) return;
  await fsp.unlink(filePath).catch(() => undefined);
}

export async function deleteChatImages(keys: Array<string | null | undefined>): Promise<void> {
  const unique = [...new Set(keys.filter((k): k is string => typeof k === "string" && k.length > 0))];
  await Promise.all(unique.map((k) => deleteChatImage(k)));
}
