import { completeGeminiText, streamGeminiCompletion, type LlmMessage } from "@/lib/gemini";

export type { LlmMessage };

export async function completeOnce(params: {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}) {
  const text = await completeGeminiText(params);
  if (text === null) {
    // Dev without key: keep previous behaviour of a local stub via stream demo.
    let out = "";
    for await (const chunk of streamGeminiCompletion(params)) out += chunk;
    return out;
  }
  return text;
}

export async function* streamCompletion(params: {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}) {
  yield* streamGeminiCompletion(params);
}

/** Non-stream completion; returns null when Gemini is not configured (heuristics fallback). */
export async function completeText(params: {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}) {
  return completeGeminiText(params);
}
