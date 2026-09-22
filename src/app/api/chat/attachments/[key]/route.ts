import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { findOwnedMessageByImageKey } from "@/lib/chat";
import { isValidChatImageKey, readChatImage } from "@/lib/chat-uploads";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  if (!isValidChatImageKey(key)) return jsonError("Not found", 404);

  const owned = await findOwnedMessageByImageKey(user.id, key);
  if (!owned) return jsonError("Not found", 404);

  const file = await readChatImage(key);
  if (!file) return jsonError("Not found", 404);

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
