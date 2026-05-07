import { getOptionalEnv } from "@/lib/env";

type LlmMessage = { role: "system" | "user" | "assistant"; text: string };

const API_URL =
  "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

async function* fakeStream(text: string) {
  // This is a server-side fallback "stream": keep it fast to avoid UX where
  // the UI looks frozen for long answers.
  const chunkSize = 80;
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
    // No artificial delay: the real latency is the model generation time.
  }
}

async function fetchCompletionText(params: {
  apiKey: string;
  folderId: string;
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
}) {
  const ac = new AbortController();
  const timeoutMs = 120_000;
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      signal: ac.signal,
      headers: {
        Authorization: `Api-Key ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelUri: `gpt://${params.folderId}/yandexgpt`,
        completionOptions: {
          stream: false,
          temperature: params.temperature ?? 0.3,
          maxTokens: String(params.maxTokens ?? 1200),
        },
        messages: params.messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`YandexGPT error: ${response.status} ${err}`);
    }

    const payload = (await response.json().catch(() => null)) as unknown;

  const alternatives =
    typeof payload === "object" &&
    payload !== null &&
    "result" in payload &&
    typeof (payload as { result?: unknown }).result === "object" &&
    (payload as { result?: { alternatives?: unknown } }).result !== null &&
    Array.isArray((payload as { result: { alternatives?: unknown } }).result.alternatives)
      ? ((payload as { result: { alternatives: unknown[] } }).result.alternatives as unknown[])
      : typeof payload === "object" &&
          payload !== null &&
          "alternatives" in payload &&
          Array.isArray((payload as { alternatives?: unknown }).alternatives)
        ? ((payload as { alternatives: unknown[] }).alternatives as unknown[])
        : null;

  const alt = alternatives ? alternatives[0] : null;

  const textCandidate =
    typeof alt === "object" && alt !== null && "message" in alt
      ? (alt as { message?: { text?: unknown } }).message?.text
      : undefined;

    if (typeof textCandidate === "string" && textCandidate.trim().length > 0) {
      return textCandidate;
    }

    // If API shape changed, fail loudly so UI shows a useful error.
    throw new Error(
      `YandexGPT returned no text. Payload: ${JSON.stringify(payload).slice(0, 2000)}`,
    );
  } catch (e) {
    // Make timeouts user-friendly.
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : "";
    if (name === "AbortError" || /aborted/i.test(msg)) {
      throw new Error("Ответ модели слишком долго генерируется. Попробуйте отправить вопрос ещё раз.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function extractYandexTextCandidate(payload: unknown): string | null {
  const alternatives =
    typeof payload === "object" &&
    payload !== null &&
    "result" in payload &&
    typeof (payload as { result?: unknown }).result === "object" &&
    (payload as { result?: { alternatives?: unknown } }).result !== null &&
    Array.isArray((payload as { result: { alternatives?: unknown } }).result.alternatives)
      ? ((payload as { result: { alternatives: unknown[] } }).result.alternatives as unknown[])
      : typeof payload === "object" &&
          payload !== null &&
          "alternatives" in payload &&
          Array.isArray((payload as { alternatives?: unknown }).alternatives)
        ? ((payload as { alternatives: unknown[] }).alternatives as unknown[])
        : null;

  const alt = alternatives ? alternatives[0] : null;
  const textCandidate =
    typeof alt === "object" && alt !== null && "message" in alt
      ? (alt as { message?: { text?: unknown } }).message?.text
      : undefined;

  return typeof textCandidate === "string" ? textCandidate : null;
}

async function* fetchCompletionStreamPieces(params: {
  apiKey: string;
  folderId: string;
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
}) {
  const ac = new AbortController();
  const timeoutMs = 120_000;
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      signal: ac.signal,
      headers: {
        Authorization: `Api-Key ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelUri: `gpt://${params.folderId}/yandexgpt`,
        completionOptions: {
          stream: true,
          temperature: params.temperature ?? 0.3,
          maxTokens: String(params.maxTokens ?? 1200),
        },
        messages: params.messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`YandexGPT error: ${response.status} ${err}`);
    }
    if (!response.body) throw new Error("YandexGPT stream: empty response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let lastFullText = "";
    let yielded = false;

    const handlePayload = (payload: unknown) => {
      const textCandidate = extractYandexTextCandidate(payload);
      if (!textCandidate) return null;

      // Yandex can send either a full accumulated text or a delta. Handle both.
      let piece = textCandidate;
      if (textCandidate.startsWith(lastFullText)) {
        piece = textCandidate.slice(lastFullText.length);
        lastFullText = textCandidate;
      } else {
        lastFullText += textCandidate;
      }
      return piece || null;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      while (true) {
        // Prefer SSE framing when present.
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

        // Fallback: some environments may return plain JSON per line.
        const nlIdx = buf.indexOf("\n");
        if (nlIdx === -1) break;
        const line = buf.slice(0, nlIdx).trim();
        buf = buf.slice(nlIdx + 1);
        if (!line) continue;
        if (line.startsWith("data:")) {
          // If server sends single-line `data:` without blank line, handle it.
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
      throw new Error("YandexGPT streaming produced no text pieces (parser mismatch)");
    }
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : "";
    if (name === "AbortError" || /aborted/i.test(msg)) {
      throw new Error("Ответ модели слишком долго генерируется. Попробуйте отправить вопрос ещё раз.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function completeYandexText(params: {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
}) {
  const apiKey = getOptionalEnv("YANDEX_GPT_API_KEY");
  const folderId = getOptionalEnv("YANDEX_FOLDER_ID");
  if (!apiKey || !folderId) return null;

  const text = await fetchCompletionText({
    apiKey,
    folderId,
    messages: params.messages,
    maxTokens: params.maxTokens,
    temperature: params.temperature,
  });
  return text;
}

export async function* streamYandexCompletion(params: {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
}) {
  const apiKey = getOptionalEnv("YANDEX_GPT_API_KEY");
  const folderId = getOptionalEnv("YANDEX_FOLDER_ID");

  if (!apiKey || !folderId) {
    const lastUser = [...params.messages].reverse().find((m) => m.role === "user")?.text;
    const text =
      "Сейчас я работаю в демо-режиме (не задан YANDEX_GPT_API_KEY / YANDEX_FOLDER_ID).\n\n" +
      "Но я всё равно могу помогать: пришли условие/вопрос, и я объясню шаг за шагом.\n\n" +
      (lastUser ? `Твой вопрос: “${lastUser}”` : "");
    yield* fakeStream(text);
    return;
  }

  try {
    yield* fetchCompletionStreamPieces({
      apiKey,
      folderId,
      messages: params.messages,
      maxTokens: params.maxTokens ?? 1200,
      temperature: params.temperature,
    });
  } catch {
    // Fallback: request full completion and stream it ourselves.
    const fullText = await fetchCompletionText({
      apiKey,
      folderId,
      messages: params.messages,
      maxTokens: params.maxTokens ?? 1200,
      temperature: params.temperature,
    });
    yield* fakeStream(fullText);
  }
}

