import { describe, expect, test } from "vitest";
import { isQuotaLow, quotaWarningThreshold } from "@/lib/usage-types";

describe("quota warning threshold (20%, at least 1)", () => {
  test("threshold values", () => {
    expect(quotaWarningThreshold(16)).toBe(3);
    expect(quotaWarningThreshold(50)).toBe(10);
    expect(quotaWarningThreshold(10)).toBe(2);
    expect(quotaWarningThreshold(4)).toBe(1);
    expect(quotaWarningThreshold(1)).toBe(1);
    expect(quotaWarningThreshold(0)).toBe(0);
  });

  test("isQuotaLow", () => {
    expect(isQuotaLow(10, 50)).toBe(true);
    expect(isQuotaLow(11, 50)).toBe(false);
    expect(isQuotaLow(1, 4)).toBe(true);
    expect(isQuotaLow(2, 4)).toBe(false);
    expect(isQuotaLow(0, 16)).toBe(false); // exhausted → blocked, not warning
    expect(isQuotaLow(1, 1)).toBe(true);
    expect(isQuotaLow(0, 0)).toBe(false);
  });
});
