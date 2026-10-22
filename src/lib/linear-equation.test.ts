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

/**
 * Регрессия M-XHMK37: задача про лодку (течение 2 км/ч, своя скорость 8 км/ч, всего 3 ч), ответ 11,25.
 * Из текста задачи извлекалось «уравнение» (например «t1 + t2 = 3» → t·1 + t·2 = 3 → 1),
 * эталон считался проверенным, и верный ответ получал чистое ❌ без учёта модели.
 */
describe("word problems never produce a verified reference (M-XHMK37)", () => {
  const BOAT = [
    "Лодка прошла по течению реки и обратно за 3 часа. Скорость течения 2 км/ч, собственная скорость лодки 8 км/ч. Найди расстояние.",
    "Собственная скорость лодки $v = 8$ км/ч, скорость течения $u = 2$ км/ч. Лодка проплыла расстояние $S$ по течению и вернулась обратно, затратив на весь путь $t = 3$ ч. Найдите $S$.",
    "Скорость лодки 8 км/ч, скорость течения 2 км/ч. Путь туда и обратно занял 3 часа. Составь уравнение $\\frac{x}{10} + \\frac{x}{6} = 3$ и найди x.",
    "Лодка плыла по течению (скорость 8+2=10 км/ч) и против течения (8-2=6 км/ч). Всего 3 ч. Найди расстояние в км.",
    "Скорость течения реки 2 км/ч, а собственная скорость катера 8 км/ч. На путь по течению и обратно катер затратил 3 ч. Какое расстояние (в км) проплыл катер в одну сторону?",
    "Пусть x км — расстояние. Тогда x/(8+2) + x/(8-2) = 3. Найди x.",
    "Лодка: v_л = 8 км/ч, v_т = 2 км/ч, t = 3 ч. Найдите S.",
    "Собственная скорость лодки 8 км/ч, скорость течения 2 км/ч. Время в пути 3 ч, т.е. t1 + t2 = 3. Найдите расстояние.",
    "Катер плыл по течению реки, а затем вернулся обратно. Скорость течения равна двум, собственная скорость восьми, на всё ушло три часа, x/10 + x/6 = 3. Найдите x.",
  ];

  test.each(BOAT)("%s", (text) => {
    expect(solveLinearEquationFromText(text)).toBeNull();
    expect(verifiedReferenceAnswer(text, "11,25")).toEqual({ answer: "11,25", overridden: false, verified: false });
  });

  test("indexed names like t1, t2 are not implicit multiplication", () => {
    expect(solveLinearEquationFromText("Решите: t1 + t2 = 3")).toBeNull();
  });

  test("standalone equation tasks are still solved", () => {
    expect(solveLinearEquationFromText("Решите уравнение: x/10 + x/6 = 3")?.root).toBe(11.25);
    expect(solveLinearEquationFromText("Решите уравнение и запишите ответ десятичной дробью: 0,5x + 3 = 7")?.root).toBe(8);
    expect(verifiedReferenceAnswer(TASK75, "4").answer).toBe("-4");
  });

  test.each(["11,25", "11.25", "45/4", "\\frac{45}{4}", "11 1/4", "11\\frac{1}{4}", "11,25 км"])(
    "%s equals 11,25 / 11.25 / 45/4",
    (answer) => {
      for (const ref of ["11,25", "11.25", "45/4", "11,25 км", "45/4 = 11,25"]) {
        expect(answersMatchForTask(answer, ref)).toBe(true);
      }
      expect(answersMatchForTask("999", "11,25")).toBe(false);
    },
  );
});
