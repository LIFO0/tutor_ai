import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { deleteMessagesFrom } from "@/lib/chat";

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as
    | { sessionId?: number; fromId?: number }
    | null;
  const sessionId = Number(body?.sessionId);
  const fromId = Number(body?.fromId);

  if (!Number.isInteger(sessionId)) return jsonError("Invalid sessionId", 400);
  if (!Number.isInteger(fromId)) return jsonError("Invalid fromId", 400);

  const ok = await deleteMessagesFrom(user.id, sessionId, fromId);
  if (!ok) return jsonError("Not found", 404);

  return NextResponse.json({ ok: true });
}
