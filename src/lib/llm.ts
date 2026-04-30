import { streamYandexCompletion } from "@/lib/yandex-gpt";

export async function completeOnce(params: {
  messages: Array<{ role: "system" | "user" | "assistant"; text: string }>;
  maxTokens?: number;
  temperature?: number;
}) {
  let out = "";
  for await (const chunk of streamYandexCompletion(params)) out += chunk;
  return out;
}

