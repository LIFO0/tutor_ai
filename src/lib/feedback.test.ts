import { describe, expect, test } from "vitest";
import { isAdminEmail, validateFeedback } from "@/lib/feedback";

describe("validateFeedback", () => {
  test("ok with trimmed text", () => {
    expect(validateFeedback({ topic: "bug", text: "  Кнопка не работает  " })).toEqual({
      ok: true,
      topic: "bug",
      text: "Кнопка не работает",
    });
  });
  test("bad topic", () => {
    expect(validateFeedback({ topic: "hack", text: "привет мир" }).ok).toBe(false);
    expect(validateFeedback({ topic: undefined, text: "привет мир" }).ok).toBe(false);
  });
  test("text length", () => {
    expect(validateFeedback({ topic: "idea", text: "  ой " }).ok).toBe(false);
    expect(validateFeedback({ topic: "idea", text: 42 }).ok).toBe(false);
    expect(validateFeedback({ topic: "idea", text: "а".repeat(3001) }).ok).toBe(false);
    expect(validateFeedback({ topic: "idea", text: "а".repeat(3000) }).ok).toBe(true);
  });
  test("screenshot limits", () => {
    const base = { topic: "bug", text: "сломалось" };
    expect(validateFeedback({ ...base, screenshot: { size: 1000, type: "image/png" } }).ok).toBe(true);
    expect(validateFeedback({ ...base, screenshot: { size: 1000, type: "image/gif" } }).ok).toBe(false);
    expect(validateFeedback({ ...base, screenshot: { size: 1000, type: "application/pdf" } }).ok).toBe(false);
    expect(validateFeedback({ ...base, screenshot: { size: 5 * 1024 * 1024 + 1, type: "image/jpeg" } }).ok).toBe(false);
    expect(validateFeedback({ ...base, screenshot: { size: 0, type: "" } }).ok).toBe(true);
  });
});

describe("isAdminEmail", () => {
  test("matches case-insensitively, empty list = nobody", () => {
    expect(isAdminEmail("Admin@Yandex.ru", " admin@yandex.ru , x@y.ru")).toBe(true);
    expect(isAdminEmail("other@yandex.ru", "admin@yandex.ru")).toBe(false);
    expect(isAdminEmail("admin@yandex.ru", "")).toBe(false);
    expect(isAdminEmail("admin@yandex.ru", undefined)).toBe(false);
    expect(isAdminEmail(null, "admin@yandex.ru")).toBe(false);
  });
});
