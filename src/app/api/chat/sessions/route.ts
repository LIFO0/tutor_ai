import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import { createChatSession, listChatSessions } from "@/lib/chat";
import { isValidChatSubject, type Subject } from "@/lib/subjects";
import { quotaErrorResponse } from "@/lib/api/quota-response";
import { checkAndConsume, toQuotaUser } from "@/lib/usage-quota";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const sessions = await listChatSessions(user.id);
  return NextResponse.json({ ok: true, sessions });
}

export async function POST(req: Request) {
  const isDev = process.env.NODE_ENV !== "production";
  const t0 = Date.now();
  const userStart = Date.now();
  const user = await getCurrentUser();
  const userMs = Date.now() - userStart;
  if (!user) return jsonError("Unauthorized", 401);

  const jsonStart = Date.now();
  const body = (await req.json().catch(() => null)) as
    | { subject?: Subject; title?: string }
    | null;
  const jsonMs = Date.now() - jsonStart;
  const subject = body?.subject;
  if (!isValidChatSubject(subject)) {
    return jsonError("Invalid subject", 400);
  }

  const quota = await checkAndConsume(toQuotaUser(user), "chat_session");
  if (!quota.ok) return quotaErrorResponse(quota);

  const dbStart = Date.now();
  const sessionId = await createChatSession({
    userId: user.id,
    subject,
    title: body?.title,
  });
  const dbMs = Date.now() - dbStart;
  if (!sessionId) return jsonError("Failed to create session", 500);

  const totalMs = Date.now() - t0;
  const res = NextResponse.json({ ok: true, sessionId });
  res.headers.set("Server-Timing", `auth;dur=${userMs},json;dur=${jsonMs},db;dur=${dbMs},total;dur=${totalMs}`);
  if (isDev) {
    console.debug("[api/chat/sessions] timing", { userMs, jsonMs, dbMs, totalMs });
  }
  return res;
}

