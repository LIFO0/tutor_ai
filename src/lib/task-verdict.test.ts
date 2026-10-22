import { describe, expect, it } from "vitest";
import { answersMatchForTask, splitEquivalentForms, stripTrailingUnits } from "@/lib/answer-normalize";
import { solveLinearEquationFromText, verifiedReferenceAnswer } from "@/lib/linear-equation";
import { decideTaskVerdict, verdictToStoredCorrect } from "@/lib/task-verdict";
import { parseTaskCheckModelOutput } from "@/lib/task-check-json";

describe("decimal comma and units", () => {
  it("comma/dot", () => {
    expect(answersMatchForTask("11,25", "11.25")).toBe(true);
    expect(answersMatchForTask("11.25", "11,25")).toBe(true);
  });
  it("units in reference or answer", () => {
    expect(stripTrailingUnits("11,25 км/ч")).toBe("11,25");
    expect(stripTrailingUnits("5 см²")).toBe("5");
    expect(answersMatchForTask("11,25", "11,25 км/ч")).toBe(true);
    expect(answersMatchForTask("11.25 км/ч", "11,25")).toBe(true);
    expect(answersMatchForTask("12", "11,25 км/ч")).toBe(false);
    expect(answersMatchForTask("x = 3", "3")).toBe(true);
  });
});

describe("decideTaskVerdict", () => {
  const base = { userAnswer: "11.25", hasVerifiedReference: false };
  it("matches reference", () => {
    expect(decideTaskVerdict({ ...base, referenceAnswer: "11,25", modelCorrect: false, modelOwnAnswer: null }).verdict).toBe("correct");
  });
  it("wrong reference, model says correct → correct + suspect", () => {
    const r = decideTaskVerdict({ ...base, referenceAnswer: "9", modelCorrect: true, modelOwnAnswer: "11,25" });
    expect(r).toEqual({ verdict: "correct", referenceSuspect: true });
  });
  it("wrong reference, model says incorrect but its own solution matches user → uncertain", () => {
    const r = decideTaskVerdict({ ...base, referenceAnswer: "9", modelCorrect: false, modelOwnAnswer: "11.25" });
    expect(r.verdict).toBe("uncertain");
    expect(verdictToStoredCorrect(r.verdict)).toBe(true);
  });
  it("really wrong answer", () => {
    expect(decideTaskVerdict({ ...base, userAnswer: "7", referenceAnswer: "9", modelCorrect: false, modelOwnAnswer: "9" }).verdict).toBe("incorrect");
    expect(decideTaskVerdict({ ...base, userAnswer: "7", referenceAnswer: "9", modelCorrect: null, modelOwnAnswer: null }).verdict).toBe("incorrect");
  });
  it("verified reference ignores model", () => {
    expect(decideTaskVerdict({ userAnswer: "5", referenceAnswer: "4", hasVerifiedReference: true, modelCorrect: true, modelOwnAnswer: "5" }).verdict).toBe("incorrect");
  });
});

describe("own_answer parsing", () => {
  it("json and partial", () => {
    expect(parseTaskCheckModelOutput('{"own_answer":"11,25","correct":false,"feedback":"ok"}').ownAnswer).toBe("11,25");
    expect(parseTaskCheckModelOutput('{"own_answer": 11.25, "correct": true, "feedback": "x"}').ownAnswer).toBe("11.25");
    expect(parseTaskCheckModelOutput('{"own_answer":"3","correct":true,"feedback":"обре').ownAnswer).toBe("3");
  });
});

/**
 * Регрессия M-6TAWXA: «5/(x−3) + 3/(x+3) при x = 7», ответ 31/20 = 1,55.
 * «при x = 7» принималось за линейное уравнение: эталон подменялся на 7 и считался проверенным,
 * поэтому верный ответ получал ❌ при любом мнении модели. Повторяем логику route.ts.
 */
describe("task M-6TAWXA (substitution «при x = 7» is not an equation)", () => {
  const TASKS = [
    "Найди значение выражения $\\frac{5}{x-3} + \\frac{3}{x+3}$ при $x = 7$.",
    "5/(x−3) + 3/(x+3) при x=7",
    "Вычисли 5/(x − 3) + 3/(x + 3), если x = 7.",
  ];
  const REFERENCES = ["31/20", "1,55", "31/20 = 1,55"];

  function check(task: string, reference: string, userAnswer: string, modelCorrect: boolean | null, own: string | null) {
    const verified = verifiedReferenceAnswer(task, reference);
    return decideTaskVerdict({
      userAnswer,
      referenceAnswer: verified.answer,
      hasVerifiedReference: verified.verified,
      modelCorrect,
      modelOwnAnswer: own,
    }).verdict;
  }

  it("does not treat «x = 7» as the task's equation", () => {
    for (const task of TASKS) {
      expect(solveLinearEquationFromText(task)).toBeNull();
      expect(verifiedReferenceAnswer(task, "31/20 = 1,55")).toEqual({
        answer: "31/20 = 1,55",
        overridden: false,
        verified: false,
      });
    }
  });

  it.each(["31/20", "1,55", "1.55", "1 11/20", "31/20 = 1,55"])("%s is accepted for every reference form", (answer) => {
    for (const task of TASKS) {
      for (const ref of REFERENCES) {
        // Даже если модель ошибочно сказала correct: false.
        expect(check(task, ref, answer, false, null)).toBe("correct");
        expect(check(task, ref, answer, false, "31/20")).toBe("correct");
      }
    }
  });

  it("999 is still wrong", () => {
    for (const task of TASKS) {
      for (const ref of REFERENCES) {
        expect(check(task, ref, "999", false, "31/20")).toBe("incorrect");
        expect(check(task, ref, "999", null, null)).toBe("incorrect");
      }
    }
  });

  it("model and blind solve agree with the student when the reference is unparseable → not ❌", () => {
    const task = TASKS[0]!;
    expect(check(task, "тридцать одна двадцатая", "31/20", true, "31/20")).toBe("correct");
    expect(check(task, "тридцать одна двадцатая", "31/20", false, "1,55")).toBe("uncertain");
  });

  it("linear equations still use the computed root (-4, not 4)", () => {
    const task = "Решите уравнение: 3(2x − 4) − 5(x + 1) = 2x − 13.";
    expect(check(task, "4", "-4", false, null)).toBe("correct");
    expect(check(task, "4", "4", true, "4")).toBe("incorrect");
    expect(check("Найди x, если 2x + 3 = 11", "4", "4", null, null)).toBe("correct");
    expect(solveLinearEquationFromText("Реши уравнение x − 3 = 7 при условии")?.root).toBe(10);
  });
});

describe("splitEquivalentForms", () => {
  it("splits only consistent numeric chains", () => {
    expect(splitEquivalentForms("31/20 = 1,55")).toEqual(["31/20", "1,55"]);
    expect(splitEquivalentForms("31/20 = 1,56")).toBeNull();
    expect(splitEquivalentForms("2x = 10")).toBeNull();
    expect(splitEquivalentForms("31/20")).toBeNull();
    expect(answersMatchForTask("1,56", "31/20 = 1,55")).toBe(false);
  });
});
