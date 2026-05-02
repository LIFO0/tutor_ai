import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { deleteChatSession, listMessages } from "@/lib/chat";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { sessionId } = await params;
  const id = Number(sessionId);
  if (!Number.isInteger(id)) return jsonError("Invalid session id", 400);

  const data = await listMessages(user.id, id);
  if (!data) return jsonError("Not found", 404);

  return NextResponse.json({ ok: true, session: data.session, messages: data.messages });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { sessionId } = await params;
  const id = Number(sessionId);
  if (!Number.isInteger(id)) return jsonError("Invalid session id", 400);

  const ok = await deleteChatSession(user.id, id);
  if (!ok) return jsonError("Not found", 404);

  return NextResponse.json({ ok: true });
}

