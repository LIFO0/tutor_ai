import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LLM_UNAVAILABLE_MESSAGE, MAX_CHAT_MESSAGE_CHARS } from "@/lib/chat-limits";

describe("llm-config", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env = { ...prev };
    delete process.env.GEMINI_API_KEY;
    process.env.JWT_SECRET = "x".repeat(32);
    vi.resetModules();
  });

  afterEach(() => {
    process.env = prev;
    vi.resetModules();
  });

  test("isLlmConfigured reflects GEMINI_API_KEY", async () => {
    process.env.NODE_ENV = "test";
    let mod = await import("@/lib/llm-config");
    expect(mod.isLlmConfigured()).toBe(false);

    process.env.GEMINI_API_KEY = "key";
    vi.resetModules();
    mod = await import("@/lib/llm-config");
    expect(mod.isLlmConfigured()).toBe(true);
  });

  test("assertLlmConfigured returns 503 in production without key", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.GEMINI_API_KEY;
    const mod = await import("@/lib/llm-config");
    const res = mod.assertLlmConfigured();
    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
    const body = (await res!.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe(LLM_UNAVAILABLE_MESSAGE);
  });

  test("assertLlmConfigured returns null when configured in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.GEMINI_API_KEY = "key";
    const mod = await import("@/lib/llm-config");
    expect(mod.assertLlmConfigured()).toBeNull();
  });

  test("validateChatMessageLength", async () => {
    const mod = await import("@/lib/llm-config");
    expect(mod.validateChatMessageLength("ok")).toBeNull();
    const long = "a".repeat(MAX_CHAT_MESSAGE_CHARS + 1);
    expect(mod.validateChatMessageLength(long)).toContain(String(MAX_CHAT_MESSAGE_CHARS));
  });
});
