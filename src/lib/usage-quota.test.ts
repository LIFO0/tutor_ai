import { describe, expect, test, beforeEach, afterEach } from "vitest";
import {
  getMoscowDateString,
  getPlanLimits,
  getQuotaResetsAt,
  isQuotaExemptByEmail,
  resolveEffectivePlan,
} from "@/lib/usage-quota-config";

describe("usage-quota helpers", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env = { ...prev };
    delete process.env.USAGE_QUOTA_EXEMPT_EMAILS;
    delete process.env.USAGE_FREE_CHAT_PER_DAY;
  });

  afterEach(() => {
    process.env = prev;
  });

  test("getMoscowDateString returns YYYY-MM-DD", () => {
    expect(getMoscowDateString(new Date("2026-05-16T12:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("getQuotaResetsAt is ISO in the future", () => {
    const resets = new Date(getQuotaResetsAt());
    expect(resets.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  test("isQuotaExemptByEmail is case-insensitive", () => {
    process.env.USAGE_QUOTA_EXEMPT_EMAILS = "Admin@Yandex.RU";
    expect(isQuotaExemptByEmail("admin@yandex.ru")).toBe(true);
    expect(isQuotaExemptByEmail("other@test.ru")).toBe(false);
  });

  test("resolveEffectivePlan downgrades expired plus", () => {
    expect(
      resolveEffectivePlan({
        plan: "plus",
        planExpiresAt: "2020-01-01T00:00:00.000Z",
      }),
    ).toBe("free");
    expect(
      resolveEffectivePlan({
        plan: "plus",
        planExpiresAt: "2099-01-01T00:00:00.000Z",
      }),
    ).toBe("plus");
  });

  test("getPlanLimits free defaults", () => {
    const limits = getPlanLimits("free");
    expect(limits.chatMessages).toBe(16);
    expect(limits.taskGenerate).toBe(4);
    expect(limits.taskCheck).toBe(6);
    expect(limits.chatSessions).toBe(10);
  });

  test("getPlanLimits respects env override", () => {
    process.env.USAGE_FREE_CHAT_PER_DAY = "20";
    expect(getPlanLimits("free").chatMessages).toBe(20);
  });
});
