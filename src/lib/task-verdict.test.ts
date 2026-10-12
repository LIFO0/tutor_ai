import { describe, expect, it } from "vitest";
import { answersMatchForTask, stripTrailingUnits } from "@/lib/answer-normalize";
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
