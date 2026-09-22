import { LLM_UNAVAILABLE_MESSAGE } from "@/lib/chat-limits";
import { getOptionalEnv } from "@/lib/env";

export type LlmImagePart = { mimeType: string; data: string };

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  text: string;
  /** Base64 image payload for multimodal user turns. */
  image?: LlmImagePart;
};

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const MSG_ACCESS =
  "Проблема с доступом к ИИ. Проверьте настройки сервиса или попробуйте позже.";
const MSG_RATE_LIMIT =
  "Сейчас слишком много запросов к ИИ. Подождите минуту и попробуйте снова.";
const MSG_SAFETY =
  "Не удалось сформировать ответ по этому запросу. Переформулируйте вопрос.";
const MSG_UNAVAILABLE = "Сервис ИИ временно недоступен. Попробуйте позже.";
const MSG_TIMEOUT =
  "Ответ модели слишком долго генерируется. Попробуйте отправить вопрос ещё раз.";

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getGeminiModel(): string {
  return getOptionalEnv("GEMINI_MODEL")?.trim() || DEFAULT_MODEL;
}

function mergeAbortSignals(external?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const ac = new AbortController();
  const timeoutMs = 120_000;
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const onExternalAbort = () => ac.abort();
  if (external) {
    if (external.aborted) ac.abort();
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }
  return {
    signal: ac.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (external) external.removeEventListener("abort", onExternalAbort);
    },
  };
}

async function* fakeStream(text: string) {
  const chunkSize = 80;
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export type GeminiRequestBody = {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: GeminiContent[];
  generationConfig: { temperature: number; maxOutputTokens: number };
};

/** Exported for unit tests. */
export function toGeminiRequest(
  messages: LlmMessage[],
  opts?: { maxTokens?: number; temperature?: number },
): GeminiRequestBody {
  const systemParts = messages.filter((m) => m.role === "system").map((m) => m.text.trim()).filter(Boolean);
  const contents: GeminiContent[] = [];

  for (const m of messages) {
    if (m.role === "system") continue;
    const text = typeof m.text === "string" ? m.text : "";
    const hasImage = Boolean(m.image?.data && m.image.mimeType);
    const trimmed = text.trim();
    if (!trimmed && !hasImage) continue;

    const role = m.role === "assistant" ? "model" : "user";
    const parts: GeminiPart[] = [];
    if (hasImage && m.image) {
      parts.push({
        inlineData: { mimeType: m.image.mimeType, data: m.image.data },
      });
    }
    if (trimmed) {
      parts.push({ text: trimmed });
    } else if (hasImage) {
      parts.push({ text: "Посмотри на изображение и помоги с заданием." });
    }

    const last = contents[contents.length - 1];
    // Do not merge turns that include images — keep multimodal parts intact.
    if (last && last.role === role && !hasImage && last.parts.every((p) => "text" in p)) {
      const textPart = last.parts.find((p): p is { text: string } => "text" in p);
      if (textPart) textPart.text += `\n${trimmed}`;
      else last.parts.push({ text: trimmed });
    } else {
      contents.push({ role, parts });
    }
  }

  // Gemini multi-turn must start with a user turn.
  while (contents.length > 0 && contents[0].role === "model") {
    contents.shift();
  }

  const body: GeminiRequestBody = {
    contents,
    generationConfig: {
      temperature: opts?.temperature ?? 0.3,
      maxOutputTokens: opts?.maxTokens ?? 1200,
    },
  };

  if (systemParts.length > 0) {
    body.systemInstruction = { parts: [{ text: systemParts.join("\n\n") }] };
  }

  return body;
}

function candidateFinishReason(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const first = candidates[0];
  if (typeof first !== "object" || first === null) return null;
  const reason = (first as { finishReason?: unknown }).finishReason;
  return typeof reason === "string" ? reason : null;
}

/** Exported for unit tests. */
export function extractGeminiText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const first = candidates[0];
  if (typeof first !== "object" || first === null) return null;
  const content = (first as { content?: unknown }).content;
  if (typeof content !== "object" || content === null) return null;
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return null;

  const texts: string[] = [];
  for (const part of parts) {
    if (typeof part === "object" && part !== null && typeof (part as { text?: unknown }).text === "string") {
      texts.push((part as { text: string }).text);
    }
  }
  if (texts.length === 0) return null;
  return texts.join("");
}

/** Exported for unit tests. */
export function mapGeminiHttpError(status: number, body: string): Error {
  if (status === 429) return new Error(MSG_RATE_LIMIT);
  // 404: treat as known access error so stream path does not double-fetch via fallback.
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return new Error(MSG_ACCESS);
  }
  if (status >= 500) return new Error(MSG_UNAVAILABLE);
  const snippet = body.trim().slice(0, 200);
  return new Error(snippet ? `Gemini error: ${status} ${snippet}` : `Gemini error: ${status}`);
}

function throwIfNoText(payload: unknown): string {
  const finish = candidateFinishReason(payload);
  if (finish === "SAFETY" || finish === "BLOCKED" || finish === "PROHIBITED_CONTENT") {
    throw new Error(MSG_SAFETY);
  }
  const text = extractGeminiText(payload);
  if (typeof text === "string" && text.trim().length > 0) return text;

  const promptFeedback =
    typeof payload === "object" &&
    payload !== null &&
    "promptFeedback" in payload &&
    typeof (payload as { promptFeedback?: unknown }).promptFeedback === "object" &&
    (payload as { promptFeedback?: { blockReason?: unknown } }).promptFeedback !== null
      ? (payload as { promptFeedback: { blockReason?: unknown } }).promptFeedback
      : null;
  if (promptFeedback?.blockReason || finish) throw new Error(MSG_SAFETY);
  throw new Error(MSG_SAFETY);
}

function remapAbort(e: unknown, external?: AbortSignal): never {
  const name = e instanceof Error ? e.name : "";
  const msg = e instanceof Error ? e.message : "";
  if (name === "AbortError" || /aborted/i.test(msg)) {
    if (external?.aborted) throw e;
    throw new Error(MSG_TIMEOUT);
  }
  throw e;
}

function endpoint(model: string, action: "generateContent" | "streamGenerateContent"): string {
  const base = `${API_BASE}/${encodeURIComponent(model)}:${action}`;
  return action === "streamGenerateContent" ? `${base}?alt=sse` : base;
}

async function fetchCompletionText(params: {
  apiKey: string;
  model: string;
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}) {
  const { signal, cleanup } = mergeAbortSignals(params.signal);
  try {
    const response = await fetch(endpoint(params.model, "generateContent"), {
      method: "POST",
      signal,
      headers: {
        "x-goog-api-key": params.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        toGeminiRequest(params.messages, {
          maxTokens: params.maxTokens,
          temperature: params.temperature,
        }),
      ),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      console.error("[gemini] generateContent failed", response.status, err.trim().slice(0, 500));
      throw mapGeminiHttpError(response.status, err);
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    return throwIfNoText(payload);
  } catch (e) {
    remapAbort(e, params.signal);
  } finally {
    cleanup();
  }
}

async function* fetchCompletionStreamPieces(params: {
  apiKey: string;
  model: string;
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}) {
  const { signal, cleanup } = mergeAbortSignals(params.signal);
  try {
    const response = await fetch(endpoint(params.model, "streamGenerateContent"), {
      method: "POST",
      signal,
      headers: {
        "x-goog-api-key": params.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        toGeminiRequest(params.messages, {
          maxTokens: params.maxTokens,
          temperature: params.temperature,
        }),
      ),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      console.error("[gemini] streamGenerateContent failed", response.status, err.trim().slice(0, 500));
      throw mapGeminiHttpError(response.status, err);
    }
    if (!response.body) throw new Error("Gemini stream: empty response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let yielded = false;
    let sawSafety = false;

    const handlePayload = (payload: unknown): string | null => {
      const finish = candidateFinishReason(payload);
      if (finish === "SAFETY" || finish === "BLOCKED" || finish === "PROHIBITED_CONTENT") {
        sawSafety = true;
      }
      const textCandidate = extractGeminiText(payload);
      return textCandidate && textCandidate.length > 0 ? textCandidate : null;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      while (true) {
        const sseIdx = buf.indexOf("\n\n");
        if (sseIdx !== -1) {
          const block = buf.slice(0, sseIdx);
          buf = buf.slice(sseIdx + 2);

          const lines = block.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice("data:".length).trim();
            if (!data || data === "[DONE]") continue;

            let payload: unknown;
            try {
              payload = JSON.parse(data);
            } catch {
              continue;
            }
            const piece = handlePayload(payload);
            if (piece) {
              yielded = true;
              yield piece;
            }
          }
          continue;
        }

        const nlIdx = buf.indexOf("\n");
        if (nlIdx === -1) break;
        const line = buf.slice(0, nlIdx).trim();
        buf = buf.slice(nlIdx + 1);
        if (!line) continue;
        if (line.startsWith("data:")) {
          const data = line.slice("data:".length).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const payload = JSON.parse(data) as unknown;
            const piece = handlePayload(payload);
            if (piece) {
              yielded = true;
              yield piece;
            }
          } catch {
            continue;
          }
          continue;
        }
        if (!line.startsWith("{") && !line.startsWith("[")) continue;
        try {
          const payload = JSON.parse(line) as unknown;
          const piece = handlePayload(payload);
          if (piece) {
            yielded = true;
            yield piece;
          }
        } catch {
          continue;
        }
      }
    }

    if (!yielded) {
      if (params.signal?.aborted) return;
      if (sawSafety) throw new Error(MSG_SAFETY);
      throw new Error("Gemini streaming produced no text pieces (parser mismatch)");
    }
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : "";
    if (name === "AbortError" || /aborted/i.test(msg)) {
      if (params.signal?.aborted) return;
      throw new Error(MSG_TIMEOUT);
    }
    throw e;
  } finally {
    cleanup();
  }
}

export async function completeGeminiText(params: {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}) {
  const apiKey = getOptionalEnv("GEMINI_API_KEY");
  if (!apiKey) return null;

  return fetchCompletionText({
    apiKey,
    model: getGeminiModel(),
    messages: params.messages,
    maxTokens: params.maxTokens,
    temperature: params.temperature,
    signal: params.signal,
  });
}

export async function* streamGeminiCompletion(params: {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}) {
  const apiKey = getOptionalEnv("GEMINI_API_KEY");

  if (!apiKey) {
    if (isProductionRuntime()) {
      throw new Error(LLM_UNAVAILABLE_MESSAGE);
    }
    const lastUser = [...params.messages].reverse().find((m) => m.role === "user")?.text;
    const text =
      "Сейчас я работаю в демо-режиме (не задан GEMINI_API_KEY).\n\n" +
      "Но я всё равно могу помогать: пришли условие/вопрос, и я объясню шаг за шагом.\n\n" +
      (lastUser ? `Твой вопрос: “${lastUser}”` : "");
    yield* fakeStream(text);
    return;
  }

  const model = getGeminiModel();

  try {
    yield* fetchCompletionStreamPieces({
      apiKey,
      model,
      messages: params.messages,
      maxTokens: params.maxTokens ?? 1200,
      temperature: params.temperature,
      signal: params.signal,
    });
  } catch (e) {
    if (params.signal?.aborted) return;
    // Known user-facing errors: rethrow without fallback.
    if (e instanceof Error) {
      if (
        e.message === MSG_RATE_LIMIT ||
        e.message === MSG_ACCESS ||
        e.message === MSG_SAFETY ||
        e.message === MSG_UNAVAILABLE ||
        e.message === MSG_TIMEOUT ||
        e.message === LLM_UNAVAILABLE_MESSAGE
      ) {
        throw e;
      }
    }
    // Fallback: request full completion and stream it ourselves.
    const fullText = await fetchCompletionText({
      apiKey,
      model,
      messages: params.messages,
      maxTokens: params.maxTokens ?? 1200,
      temperature: params.temperature,
      signal: params.signal,
    });
    if (params.signal?.aborted) return;
    yield* fakeStream(fullText);
  }
}
