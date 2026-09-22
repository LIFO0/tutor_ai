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
import {
  CHAT_IMAGE_MAX_INPUT_BYTES,
  deleteChatImage,
  readChatImage,
  saveChatImage,
} from "@/lib/chat-uploads";
import { normalizeMathMessageForModel } from "@/lib/math-prompt";
import { systemPrompt } from "@/lib/prompts";
import { streamCompletion, type LlmMessage } from "@/lib/llm";
import { normalizeChatSubject } from "@/lib/subjects";
import { quotaErrorResponse } from "@/lib/api/quota-response";
import { assertLlmConfigured, validateChatMessageLength } from "@/lib/llm-config";
import { checkAndConsume, toQuotaUser } from "@/lib/usage-quota";

const MAX_HISTORY_IMAGES = 3;

async function parseStreamRequest(req: Request): Promise<{
  sessionId: number;
  rawMessage: string;
  file: File | null;
} | { error: string; status: number }> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return { error: "Invalid form data", status: 400 };
    const sessionId = Number(form.get("sessionId"));
    const rawMessage = String(form.get("message") ?? "").trim();
    const fileValue = form.get("file");
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    return { sessionId, rawMessage, file };
  }

  const body = (await req.json().catch(() => null)) as
    | { sessionId?: number; message?: string }
    | null;
  return {
    sessionId: Number(body?.sessionId),
    rawMessage: body?.message?.trim() ?? "",
    file: null,
  };
}

export async function POST(req: Request) {
  const requestStartMs = Date.now();
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const llmGuard = assertLlmConfigured();
  if (llmGuard) return llmGuard;

  const parsed = await parseStreamRequest(req);
  if ("error" in parsed) return jsonError(parsed.error, parsed.status);

  const { sessionId, rawMessage, file } = parsed;
  const message = normalizeMathMessageForModel(rawMessage);
  const hasImage = Boolean(file);

  if (!Number.isInteger(sessionId)) return jsonError("Invalid sessionId", 400);
  if (!message && !hasImage) return jsonError("Empty message", 400);

  if (message) {
    const lengthError = validateChatMessageLength(message);
    if (lengthError) return jsonError(lengthError, 400);
  }

  if (file) {
    if (!file.type.startsWith("image/")) {
      return jsonError("Можно прикреплять только изображения.", 400);
    }
    if (file.size <= 0 || file.size > CHAT_IMAGE_MAX_INPUT_BYTES) {
      return jsonError("Файл слишком большой (макс. 8 МБ).", 400);
    }
  }

  const quotaUser = toQuotaUser(user);

  if (hasImage) {
    const imageQuota = await checkAndConsume(quotaUser, "chat_image");
    if (!imageQuota.ok) return quotaErrorResponse(imageQuota);
  }

  const quota = await checkAndConsume(quotaUser, "chat_message");
  if (!quota.ok) return quotaErrorResponse(quota);

  const session = await getChatSession(user.id, sessionId);
  if (!session) return jsonError("Not found", 404);

  let imageKey: string | null = null;
  let currentImageBase64: string | null = null;
  let currentImageMime: string | null = null;

  if (file) {
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const saved = await saveChatImage(buf);
      imageKey = saved.key;
      currentImageMime = saved.mimeType;
      currentImageBase64 = (await readChatImage(saved.key))?.buffer.toString("base64") ?? null;
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Не удалось сохранить изображение.", 400);
    }
  }

  const userContent = message || (imageKey ? "📷 Фото" : "");

  const beforeDbWriteMs = Date.now();
  let userMessageId: number | undefined;
  try {
    userMessageId = await addMessage({
      sessionId,
      role: "user",
      content: userContent,
      imageKey,
    });
  } catch (e) {
    if (imageKey) await deleteChatImage(imageKey);
    throw e;
  }
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
          limit: 50,
        });
        const afterCtxMs = Date.now();
        const estimateTokens = (s: string) => Math.ceil(s.length / 4);
        const maxContextTokens = 7600;
        const reserved = estimateTokens(sys) + estimateTokens(message || userContent) + 200;
        const maxHistoryTokens = Math.max(0, maxContextTokens - reserved);

        const rawHistory =
          ctx?.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            text: m.content,
            imageKey: m.imageKey,
          })) ?? [{ role: "user" as const, text: userContent, imageKey }];

        const historyRows: Array<{
          role: "user" | "assistant";
          text: string;
          imageKey: string | null;
        }> = [];
        let total = 0;
        for (let i = rawHistory.length - 1; i >= 0; i -= 1) {
          const m = rawHistory[i];
          const t = estimateTokens(m.text);
          if (historyRows.length > 0 && total + t > maxHistoryTokens) break;
          historyRows.unshift(m);
          total += t;
        }

        // Attach at most MAX_HISTORY_IMAGES images (prefer newest), skipping missing files.
        const imageSlots = new Set<number>();
        for (let i = historyRows.length - 1; i >= 0; i -= 1) {
          if (imageSlots.size >= MAX_HISTORY_IMAGES) break;
          if (historyRows[i].imageKey) imageSlots.add(i);
        }

        const history: LlmMessage[] = [];
        for (let i = 0; i < historyRows.length; i += 1) {
          const m = historyRows[i];
          const llmMsg: LlmMessage = {
            role: m.role,
            text: m.text,
          };
          if (imageSlots.has(i) && m.imageKey) {
            if (m.imageKey === imageKey && currentImageBase64 && currentImageMime) {
              llmMsg.image = { mimeType: currentImageMime, data: currentImageBase64 };
            } else {
              const fileOnDisk = await readChatImage(m.imageKey);
              if (fileOnDisk) {
                llmMsg.image = {
                  mimeType: fileOnDisk.mimeType,
                  data: fileOnDisk.buffer.toString("base64"),
                };
              } else if (!m.text.trim()) {
                llmMsg.text = "[изображение недоступно]";
              }
            }
          }
          history.push(llmMsg);
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
                has_image: Boolean(imageKey),
              })}\n\n`,
            ),
          );
        }

        if (Number.isInteger(userMessageId)) {
          controller.enqueue(
            encoder.encode(
              `event: ids\ndata: ${JSON.stringify({
                user: userMessageId,
                imageKey: imageKey ?? undefined,
              })}\n\n`,
            ),
          );
        }

        const beforeModelMs = Date.now();
        for await (const chunk of streamCompletion({
          messages: [{ role: "system", text: sys }, ...history],
          maxTokens: 2200,
          signal: req.signal,
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

        if (full.trim()) {
          await addMessage({ sessionId, role: "assistant", content: full });
        }

        let newTitle: string | null = null;
        try {
          newTitle = await maybeUpdateChatTitleInitialWindow({ userId: user.id, sessionId });
        } catch {
          // ignore
        }
        try {
          await maybeUpdateChatSubjectInitialWindow({ userId: user.id, sessionId });
        } catch {
          // ignore
        }

        if (newTitle) {
          controller.enqueue(
            encoder.encode(
              `event: session\ndata: ${JSON.stringify({ title: newTitle })}\n\n`,
            ),
          );
        }

        controller.close();
      } catch (e) {
        if (full.trim()) {
          try {
            await addMessage({ sessionId, role: "assistant", content: full });
          } catch {
            // ignore
          }
        }
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              error: e instanceof Error ? e.message : "stream error",
            })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
