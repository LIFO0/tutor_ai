import { NextResponse } from "next/server";
import { isSafeAvatarFilename } from "@/lib/avatar-validation";
import { readAvatarFile } from "@/lib/avatar-storage";

/**
 * Serves uploaded avatars from AVATAR_UPLOADS_PATH (see avatar-storage.ts).
 * Keeps existing DB URLs (/uploads/avatars/<file>.png?v=…) working.
 * Filenames are random UUIDs, so public access matches the old public/ behaviour.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const name = decodeURIComponent(file);
  if (!isSafeAvatarFilename(name)) return new NextResponse("Not found", { status: 404 });
  const buf = await readAvatarFile(name);
  if (!buf) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      // URL carries ?v=<timestamp>; a new upload gets a new filename anyway.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
