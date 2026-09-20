import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LLM_UNAVAILABLE_MESSAGE } from "@/lib/chat-limits";
import {
  completeGeminiText,
  extractGeminiText,
  mapGeminiHttpError,
  streamGeminiCompletion,
  toGeminiRequest,
} from "@/lib/gemini";

const MSG_RATE_LIMIT =
  "Сейчас слишком много запросов к ИИ. Подождите минуту и попробуйте снова.";
const MSG_SAFETY =
  "Не удалось сформировать ответ по этому запросу. Переформулируйте вопрос.";
const MSG_TIMEOUT =
  "Ответ модели слишком долго генерируется. Попробуйте отправить вопрос ещё раз.";

function jsonResponse(body: unknown, init?: { status?: number; ok?: boolean }) {
  const status = init?.status ?? 200;
  return {
      ok: init?.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    body: null as ReadableStream<Uint8Array> | null,
  };
}

function sseResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[i]));
      i += 1;
    },
  });
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => "",
    body: stream,
  };
}

describe("toGeminiRequest / extractGeminiText / mapGeminiHttpError", () => {
  test("maps system to systemInstruction and assistant to model", () => {
    const body = toGeminiRequest(
      [
        { role: "system", text: "Be a tutor" },
        { role: "user", text: "Hi" },
        { role: "assistant", text: "Hello" },
        { role: "user", text: "2+2?" },
      ],
      { maxTokens: 100, temperature: 0.1 },
    );
    expect(body.systemInstruction).toEqual({ parts: [{ text: "Be a tutor" }] });
    expect(body.contents).toEqual([
      { role: "user", parts: [{ text: "Hi" }] },
      { role: "model", parts: [{ text: "Hello" }] },
      { role: "user", parts: [{ text: "2+2?" }] },
    ]);
    expect(body.generationConfig).toEqual({ temperature: 0.1, maxOutputTokens: 100 });
  });

  test("joins multiple text parts", () => {
    const text = extractGeminiText({
      candidates: [{ content: { parts: [{ text: "A" }, { text: "B" }] } }],
    });
    expect(text).toBe("AB");
  });

  test("maps 429 to rate limit message", () => {
    expect(mapGeminiHttpError(429, "").message).toBe(MSG_RATE_LIMIT);
  });

  test("maps 404 to access message (no generic fallback retry)", () => {
    expect(mapGeminiHttpError(404, "not found").message).toBe(
      "Проблема с доступом к ИИ. Проверьте настройки сервиса или попробуйте позже.",
    );
  });

  test("drops leading assistant turns so contents start with user", () => {
    const body = toGeminiRequest([
      { role: "assistant", text: "orphan reply" },
      { role: "user", text: "next question" },
      { role: "assistant", text: "answer" },
      { role: "user", text: "follow-up" },
    ]);
    expect(body.contents[0].role).toBe("user");
    expect(body.contents[0].parts[0].text).toBe("next question");
    expect(body.contents.at(-1)?.role).toBe("user");
  });

  test("skips empty texts and keeps title-style trailing user turn last", () => {
    const body = toGeminiRequest([
      { role: "system", text: "Title rules" },
      { role: "user", text: "Hi" },
      { role: "assistant", text: "Hello" },
      { role: "user", text: "   " },
      { role: "user", text: "Сгенерируй тему чата по правилам выше. Верни только тему одной строкой." },
    ]);
    expect(body.contents).toEqual([
      { role: "user", parts: [{ text: "Hi" }] },
      { role: "model", parts: [{ text: "Hello" }] },
      {
        role: "user",
        parts: [{ text: "Сгенерируй тему чата по правилам выше. Верни только тему одной строкой." }],
      },
    ]);
    expect(body.contents.at(-1)?.role).toBe("user");
  });
});

describe("completeGeminiText / streamGeminiCompletion", () => {
  const prev = { ...process.env };
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env = { ...prev };
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_MODEL;
    process.env.NODE_ENV = "test";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env = prev;
    vi.unstubAllGlobals();
  });

  test("shapes request with api key header and model id", async () => {
    process.env.GEMINI_MODEL = "gemini-3.6-flash-lite";
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "ok" }] } }],
      }),
    );

    await completeGeminiText({
      messages: [
        { role: "system", text: "sys" },
        { role: "user", text: "q" },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/models/gemini-3.6-flash-lite:generateContent");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    const parsed = JSON.parse(String(init.body)) as ReturnType<typeof toGeminiRequest>;
    expect(parsed.systemInstruction?.parts[0].text).toBe("sys");
    expect(parsed.contents[0].role).toBe("user");
  });

  test("complete returns joined candidate text", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "Hello " }, { text: "world" }] } }],
      }),
    );
    const text = await completeGeminiText({
      messages: [{ role: "user", text: "hi" }],
    });
    expect(text).toBe("Hello world");
  });

  test("complete throws on SAFETY finish", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ finishReason: "SAFETY", content: { parts: [] } }],
      }),
    );
    await expect(
      completeGeminiText({ messages: [{ role: "user", text: "bad" }] }),
    ).rejects.toThrow(MSG_SAFETY);
  });

  test("complete throws friendly message on HTTP 429", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "quota" }, { status: 429, ok: false }));
    await expect(
      completeGeminiText({ messages: [{ role: "user", text: "hi" }] }),
    ).rejects.toThrow(MSG_RATE_LIMIT);
  });

  test("stream 404 does not fall back to a second generateContent call", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "missing" }, { status: 404, ok: false }));

    await expect(async () => {
      for await (const chunk of streamGeminiCompletion({
        messages: [{ role: "user", text: "hi" }],
      })) {
        void chunk;
      }
    }).rejects.toThrow("Проблема с доступом к ИИ");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("stream yields SSE data pieces in order", async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "Раз" }] } }] })}\n\n`,
        `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "Два" }] } }] })}\n\n`,
      ]),
    );

    const out: string[] = [];
    for await (const chunk of streamGeminiCompletion({
      messages: [{ role: "user", text: "hi" }],
    })) {
      out.push(chunk);
    }
    expect(out).toEqual(["Раз", "Два"]);
  });

  test("empty stream falls back to generateContent", async () => {
    fetchMock
      .mockResolvedValueOnce(sseResponse([`data: ${JSON.stringify({ candidates: [] })}\n\n`]))
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ content: { parts: [{ text: "fallback-full" }] } }],
        }),
      );

    const out: string[] = [];
    for await (const chunk of streamGeminiCompletion({
      messages: [{ role: "user", text: "hi" }],
      maxTokens: 50,
    })) {
      out.push(chunk);
    }
    expect(out.join("")).toBe("fallback-full");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const streamUrl = fetchMock.mock.calls[0][0] as string;
    const completeUrl = fetchMock.mock.calls[1][0] as string;
    expect(streamUrl).toContain("streamGenerateContent");
    expect(completeUrl).toContain("generateContent");
  });

  test("demo mode without key does not call fetch", async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.NODE_ENV = "development";

    const out: string[] = [];
    for await (const chunk of streamGeminiCompletion({
      messages: [{ role: "user", text: "вопрос" }],
    })) {
      out.push(chunk);
    }
    const text = out.join("");
    expect(text).toContain("демо-режиме");
    expect(text).toContain("GEMINI_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("production without key throws LLM_UNAVAILABLE_MESSAGE", async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.NODE_ENV = "production";

    await expect(async () => {
      for await (const chunk of streamGeminiCompletion({
        messages: [{ role: "user", text: "hi" }],
      })) {
        void chunk;
      }
    }).rejects.toThrow(LLM_UNAVAILABLE_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("AbortError without client abort becomes timeout message", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    fetchMock.mockRejectedValueOnce(err);

    await expect(
      completeGeminiText({ messages: [{ role: "user", text: "hi" }] }),
    ).rejects.toThrow(MSG_TIMEOUT);
  });

  test("completeGeminiText returns null when key missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const text = await completeGeminiText({
      messages: [{ role: "user", text: "hi" }],
    });
    expect(text).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
