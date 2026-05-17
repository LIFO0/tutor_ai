import { describe, expect, test } from "vitest";
import {
  answersMatchForTask,
  areNumericExpressionsEquivalent,
  normalizeAnswerForCompare,
  tryEvaluateNumericExpression,
} from "@/lib/answer-normalize";

describe("normalizeAnswerForCompare", () => {
  test("normalizes division operators", () => {
    expect(normalizeAnswerForCompare("6÷9+1")).toBe("6/9+1");
  });
});

describe("tryEvaluateNumericExpression", () => {
  test("evaluates 6÷9+1", () => {
    const v = tryEvaluateNumericExpression("6÷9+1");
    expect(v).not.toBeNull();
    expect(v!).toBeCloseTo(5 / 3, 6);
  });

  test("evaluates 5/3", () => {
    expect(tryEvaluateNumericExpression("5/3")).toBeCloseTo(5 / 3, 6);
  });
});

describe("areNumericExpressionsEquivalent", () => {
  test("6÷9+1 equals 5/3", () => {
    expect(areNumericExpressionsEquivalent("6÷9+1", "5/3")).toBe(true);
  });

  test("different values are not equivalent", () => {
    expect(areNumericExpressionsEquivalent("2+2", "5")).toBe(false);
  });
});

describe("answersMatchForTask", () => {
  test("string match with spaces", () => {
    expect(answersMatchForTask(" 5/3 ", "5/3")).toBe(true);
  });

  test("numeric equivalence", () => {
    expect(answersMatchForTask("6÷9+1", "5/3")).toBe(true);
  });

  test("ignores placeholder answer", () => {
    expect(answersMatchForTask("1", "—")).toBe(false);
  });
});
