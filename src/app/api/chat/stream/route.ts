import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import {
  addMessage,
  getChatSession,
  listRecentMessagesForSession,
  updateChatTitleIfEmpty,
} from "@/lib/chat";
import { systemPrompt } from "@/lib/prompts";
import { streamYandexCompletion } from "@/lib/yandex-gpt";
import { normalizeChatSubject } from "@/lib/subjects";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await req.json().catch(() => null)) as
    | { sessionId?: number; message?: string }
    | null;
  const sessionId = Number(body?.sessionId);
  const message = body?.message?.trim() ?? "";

  if (!Number.isInteger(sessionId)) return jsonError("Invalid sessionId", 400);
  if (!message) return jsonError("Empty message", 400);

  const session = await getChatSession(user.id, sessionId);
  if (!session) return jsonError("Not found", 404);

  await addMessage({ sessionId, role: "user", content: message });
  await updateChatTitleIfEmpty(sessionId, message.slice(0, 40));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const sys = systemPrompt({
          name: user.name,
          chatName: user.chatName,
          grade: user.grade,
          subject: normalizeChatSubject(session.subject),
        });

        const ctx = await listRecentMessagesForSession({
          userId: user.id,
          sessionId,
          limit: 24,
        });
        const history =
          ctx?.messages.map((m) => ({
            role: m.role,
            text: m.content,
          })) ?? [{ role: "user" as const, text: message }];

        for await (const chunk of streamYandexCompletion({
          messages: [
            { role: "system", text: sys },
            ...history,
          ],
        })) {
          full += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              error: e instanceof Error ? e.message : "stream error",
            })}\n\n`,
          ),
        );
        controller.close();
      } finally {
        if (full.trim()) {
          await addMessage({ sessionId, role: "assistant", content: full });
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

