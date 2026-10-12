import "server-only";

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { isSafeAvatarFilename } from "@/lib/avatar-validation";

/**
 * Where uploaded avatars live (outside the release / public dir).
 * 1. AVATAR_UPLOADS_PATH
 * 2. <dirname(DATABASE_PATH)>/avatars   (e.g. /var/lib/tutor-ai-staging/avatars)
 * 3. <cwd>/public/uploads/avatars       (local dev, legacy)
 *
 * Files are served by src/app/uploads/avatars/[file]/route.ts, not from public/:
 * `next start` does not serve files added to public/ after the server started.
 */
export function resolveAvatarUploadsDir(): string {
  const explicit = process.env.AVATAR_UPLOADS_PATH?.trim();
  const dir = explicit
    ? explicit
    : process.env.DATABASE_PATH
      ? path.join(path.dirname(process.env.DATABASE_PATH), "avatars")
      : legacyAvatarDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Legacy location (local dev / old releases). `turbopackIgnore` stops Turbopack from treating
 * this as a static directory asset: on staging public/uploads was a symlink pointing outside
 * the project, and tracing it crashed `next build` ("Symlink … points out of the filesystem root").
 */
function legacyAvatarDir(): string {
  // Сегменты передаются переменной, а не литералами: так путь не превращается в статическую ссылку на каталог.
  const segments: string[] = LEGACY_AVATAR_SEGMENTS.slice();
  return path.join(/* turbopackIgnore: true */ process.cwd(), ...segments);
}

const LEGACY_AVATAR_SEGMENTS = (process.env.AVATAR_LEGACY_SUBDIR ?? "public/uploads/avatars").split("/");

export async function writeAvatarFile(filename: string, data: Buffer): Promise<void> {
  if (!isSafeAvatarFilename(filename)) throw new Error("Invalid avatar filename");
  await fsp.writeFile(path.join(resolveAvatarUploadsDir(), filename), data);
}

/** Reads from the configured dir, falling back to the legacy public/uploads/avatars. */
export async function readAvatarFile(filename: string): Promise<Buffer | null> {
  if (!isSafeAvatarFilename(filename)) return null;
  for (const dir of [resolveAvatarUploadsDir(), legacyAvatarDir()]) {
    try {
      const b = await fsp.readFile(path.join(dir, filename));
      if (b.length) return b;
    } catch {
      // try next
    }
  }
  return null;
}

export async function deleteAvatarFile(filename: string): Promise<void> {
  if (!isSafeAvatarFilename(filename)) return;
  for (const dir of [resolveAvatarUploadsDir(), legacyAvatarDir()]) {
    await fsp.unlink(path.join(dir, filename)).catch(() => undefined);
  }
}
