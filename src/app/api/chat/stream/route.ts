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
  const requestStartMs = Date.now();
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

  const beforeDbWriteMs = Date.now();
  await addMessage({ sessionId, role: "user", content: message });
  await updateChatTitleIfEmpty(sessionId, message.slice(0, 40));
  const afterDbWriteMs = Date.now();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const beforePromptMs = Date.now();
        const sys = systemPrompt({
          name: user.name,
          chatName: user.chatName,
          grade: user.grade,
          subject: normalizeChatSubject(session.subject),
        });
        const afterPromptMs = Date.now();

        const beforeCtxMs = Date.now();
        const ctx = await listRecentMessagesForSession({
          userId: user.id,
          sessionId,
          // Keep context smaller to reduce latency/cost for typical short questions.
          limit: 18,
        });
        const afterCtxMs = Date.now();
        const history =
          ctx?.messages.map((m) => ({
            role: m.role,
            text: m.content,
          })) ?? [{ role: "user" as const, text: message }];

        const isDev = process.env.NODE_ENV !== "production";

        // Send a tiny initial chunk so the client knows the stream started.
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: "…" })}\n\n`));

        if (isDev) {
          controller.enqueue(
            encoder.encode(
              `event: metrics\ndata: ${JSON.stringify({
                t_request_to_handler_ms: Date.now() - requestStartMs,
                t_db_write_ms: afterDbWriteMs - beforeDbWriteMs,
                t_build_prompt_ms: afterPromptMs - beforePromptMs,
                t_load_ctx_ms: afterCtxMs - beforeCtxMs,
                message_len: message.length,
                history_messages: history.length,
              })}\n\n`,
            ),
          );
        }

        const beforeModelMs = Date.now();
        for await (const chunk of streamYandexCompletion({
          messages: [
            { role: "system", text: sys },
            ...history,
          ],
          maxTokens: 1200,
        })) {
          if (isDev && full.length === 0) {
            controller.enqueue(
              encoder.encode(
                `event: metrics\ndata: ${JSON.stringify({
                  t_time_to_first_chunk_ms: Date.now() - beforeModelMs,
                })}\n\n`,
              ),
            );
          }
          full += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: chunk })}\n\n`));
        }
        if (isDev) {
          controller.enqueue(
            encoder.encode(
              `event: metrics\ndata: ${JSON.stringify({
                t_total_model_ms: Date.now() - beforeModelMs,
                t_total_request_ms: Date.now() - requestStartMs,
                full_len: full.length,
              })}\n\n`,
            ),
          );
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

