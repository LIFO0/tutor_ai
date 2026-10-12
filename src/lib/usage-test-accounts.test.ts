import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { getPlanLimits, getUserLimits, isTestAccount, isTestAccountUnlimited } from "@/lib/usage-quota-config";

describe("staging test accounts", () => {
  const prev = { ...process.env };
  beforeEach(() => {
    process.env = { ...prev };
    delete process.env.TEST_ACCOUNT_EMAILS;
    delete process.env.TEST_ACCOUNT_USER_IDS;
    delete process.env.TEST_LIMIT_MULTIPLIER;
  });
  afterEach(() => {
    process.env = prev;
  });

  test("inactive when nothing set", () => {
    process.env.TEST_LIMIT_MULTIPLIER = "unlimited";
    expect(isTestAccount({ id: 1, email: "a@b.ru" })).toBe(false);
    expect(getUserLimits("free", { id: 1, email: "a@b.ru" })).toEqual(getPlanLimits("free"));
  });

  test("matches by email (case-insensitive) and id; multiplier applied", () => {
    process.env.TEST_ACCOUNT_EMAILS = " Tester@Yandex.ru ,x@y.ru";
    process.env.TEST_ACCOUNT_USER_IDS = "42";
    process.env.TEST_LIMIT_MULTIPLIER = "3";
    expect(isTestAccount({ id: 1, email: "tester@yandex.ru" })).toBe(true);
    expect(isTestAccount({ id: 42, email: "other@b.ru" })).toBe(true);
    expect(isTestAccount({ id: 7, email: "other@b.ru" })).toBe(false);
    const base = getPlanLimits("free");
    expect(getUserLimits("free", { id: 42 }).chatMessages).toBe(base.chatMessages * 3);
  });

  test("default multiplier 10, unlimited flag", () => {
    process.env.TEST_ACCOUNT_USER_IDS = "5";
    expect(getUserLimits("free", { id: 5 }).taskGenerate).toBe(getPlanLimits("free").taskGenerate * 10);
    expect(isTestAccountUnlimited({ id: 5 })).toBe(false);
    process.env.TEST_LIMIT_MULTIPLIER = "unlimited";
    expect(isTestAccountUnlimited({ id: 5 })).toBe(true);
  });
});
