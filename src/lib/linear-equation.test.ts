import { describe, expect, test } from "vitest";
import { formatRoot, solveLinearEquationFromText, verifiedReferenceAnswer } from "@/lib/linear-equation";
import { answersMatchForTask, normalizeAnswerForCompare } from "@/lib/answer-normalize";

const TASK75 = "Решите уравнение: 3(2x − 4) − 5(x + 1) = 2x − 13.";

describe("solveLinearEquationFromText", () => {
  test("task 75: root is -4 (unicode minus, implicit multiplication)", () => {
    expect(solveLinearEquationFromText(TASK75)?.root).toBe(-4);
  });
  test("LaTeX form", () => {
    expect(solveLinearEquationFromText("Найдите корень $3\\left(2x-4\\right)-5(x+1)=2x-13$")?.root).toBe(-4);
  });
  test("fractional root", () => {
    expect(formatRoot(solveLinearEquationFromText("Решите 2y + 1 = 0")!.root)).toBe("-1/2");
  });
  test("non-linear / no equation -> null", () => {
    expect(solveLinearEquationFromText("Решите x(x+1) = 6")).toBeNull();
    expect(solveLinearEquationFromText("Сколько будет 2 + 2?")).toBeNull();
  });
});

describe("verifiedReferenceAnswer", () => {
  test("overrides wrong LLM answer 4 with -4", () => {
    expect(verifiedReferenceAnswer(TASK75, "4")).toEqual({ answer: "-4", overridden: true, verified: true });
  });
  test("keeps correct answer with unicode minus / x= prefix", () => {
    expect(verifiedReferenceAnswer(TASK75, "x = −4").overridden).toBe(false);
  });
  test("non-equation task untouched", () => {
    expect(verifiedReferenceAnswer("Сколько будет 2 + 2?", "4")).toEqual({ answer: "4", overridden: false, verified: false });
  });
});

describe("minus normalization in answer check", () => {
  test.each(["-4", "−4", "–4", "－4", "x = −4", "x=-4", "\\minus4"])("%s matches -4", (a) => {
    expect(answersMatchForTask(a, "-4")).toBe(true);
  });
  test("4 does not match -4", () => {
    expect(answersMatchForTask("4", "-4")).toBe(false);
    expect(answersMatchForTask("−4", "4")).toBe(false);
  });
  test("normalize U+2212", () => {
    expect(normalizeAnswerForCompare("\u22124")).toBe("-4");
  });
});
