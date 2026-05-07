import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/current-user";
import {
  addMessage,
  getChatSession,
  listRecentMessagesForSession,
  maybeUpdateChatSubjectInitialWindow,
  maybeUpdateChatTitleInitialWindow,
} from "@/lib/chat";
import { normalizeMathMessageForModel } from "@/lib/math-prompt";
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
  const rawMessage = body?.message?.trim() ?? "";
  const message = normalizeMathMessageForModel(rawMessage);

  if (!Number.isInteger(sessionId)) return jsonError("Invalid sessionId", 400);
  if (!message) return jsonError("Empty message", 400);

  const session = await getChatSession(user.id, sessionId);
  if (!session) return jsonError("Not found", 404);

  const beforeDbWriteMs = Date.now();
  await addMessage({ sessionId, role: "user", content: message });
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
          // Load a wider window; we'll trim by token budget below.
          limit: 50,
        });
        const afterCtxMs = Date.now();
        const estimateTokens = (s: string) => Math.ceil(s.length / 4);
        const maxContextTokens = 7600;
        const reserved = estimateTokens(sys) + estimateTokens(message) + 200;
        const maxHistoryTokens = Math.max(0, maxContextTokens - reserved);

        const rawHistory =
          ctx?.messages.map((m) => ({
            role: m.role,
            text: m.content,
          })) ?? [{ role: "user" as const, text: message }];

        // Build from the tail until we hit the token budget.
        const history: Array<{ role: "user" | "assistant"; text: string }> = [];
        let total = 0;
        for (let i = rawHistory.length - 1; i >= 0; i -= 1) {
          const m = rawHistory[i];
          const t = estimateTokens(m.text);
          if (history.length > 0 && total + t > maxHistoryTokens) break;
          history.unshift(m);
          total += t;
        }

        const isDev = process.env.NODE_ENV !== "production";

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
          maxTokens: 2200,
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
        // Auto-title in the initial window, based on the dialog context.
        // Best-effort: ignore failures so chat streaming never breaks.
        try {
          await maybeUpdateChatTitleInitialWindow({ userId: user.id, sessionId });
        } catch {
          // ignore
        }
        // Auto-subject in the initial window (free -> math/russian/physics).
        try {
          await maybeUpdateChatSubjectInitialWindow({ userId: user.id, sessionId });
        } catch {
          // ignore
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

