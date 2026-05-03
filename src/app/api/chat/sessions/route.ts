import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { createChatSession, listChatSessions } from "@/lib/chat";
import { isValidChatSubject, type Subject } from "@/lib/subjects";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const sessions = await listChatSessions(user.id);
  return NextResponse.json({ ok: true, sessions });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as
    | { subject?: Subject; title?: string }
    | null;
  const subject = body?.subject;
  if (!isValidChatSubject(subject)) {
    return jsonError("Invalid subject", 400);
  }

  const sessionId = await createChatSession({
    userId: user.id,
    subject,
    title: body?.title,
  });
  if (!sessionId) return jsonError("Failed to create session", 500);

  return NextResponse.json({ ok: true, sessionId });
}

