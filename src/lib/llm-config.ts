import "server-only";

import { NextResponse } from "next/server";
import { getOptionalEnv } from "@/lib/env";
import { LLM_UNAVAILABLE_MESSAGE, MAX_CHAT_MESSAGE_CHARS } from "@/lib/chat-limits";

export { LLM_UNAVAILABLE_MESSAGE, MAX_CHAT_MESSAGE_CHARS };

let productionEnvChecked = false;

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isYandexLlmConfigured(): boolean {
  return Boolean(getOptionalEnv("YANDEX_GPT_API_KEY") && getOptionalEnv("YANDEX_FOLDER_ID"));
}

export function assertProductionEnv(): void {
  if (!isProductionRuntime() || productionEnvChecked) return;

  const secret = process.env.JWT_SECRET ?? "";
  if (secret.length < 32 || /change-me/i.test(secret)) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters and not a placeholder in production.",
    );
  }

  productionEnvChecked = true;
}

export function llmUnavailableResponse() {
  return NextResponse.json(
    { ok: false, error: LLM_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

export function assertYandexLlmConfigured(): NextResponse | null {
  assertProductionEnv();
  if (isProductionRuntime() && !isYandexLlmConfigured()) {
    return llmUnavailableResponse();
  }
  return null;
}

export function validateChatMessageLength(message: string): string | null {
  if (message.length <= MAX_CHAT_MESSAGE_CHARS) return null;
  return `Сообщение слишком длинное (максимум ${MAX_CHAT_MESSAGE_CHARS} символов).`;
}
