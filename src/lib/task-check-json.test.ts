import { describe, expect, test } from "vitest";
import {
  normalizeStoredTaskFeedback,
  parseTaskCheckModelOutput,
  resolveTaskCheckResult,
  stripMarkdownJsonFence,
  TASK_CHECK_PARSE_FALLBACK,
} from "@/lib/task-check-json";

describe("stripMarkdownJsonFence", () => {
  test("removes json code fence", () => {
    const raw = '```json\n{ "correct": true, "feedback": "ok" }\n```';
    expect(stripMarkdownJsonFence(raw)).toBe('{ "correct": true, "feedback": "ok" }');
  });
});

describe("parseTaskCheckModelOutput", () => {
  test("parses valid JSON", () => {
    const raw = '{ "correct": true, "feedback": "Молодец!" }';
    expect(parseTaskCheckModelOutput(raw)).toEqual({
      correct: true,
      feedback: "Молодец!",
    });
  });

  test("parses JSON with LaTeX in feedback", () => {
    const raw =
      '{ "correct": false, "feedback": "Шаг: $\\\\frac{1}{2}$ и ещё \\\\frac{3}{4}$" }';
    const parsed = parseTaskCheckModelOutput(raw);
    expect(parsed.correct).toBe(false);
    expect(parsed.feedback).toContain("\\frac");
  });

  test("extracts from markdown fence", () => {
    const raw = '```json\n{ "correct": false, "feedback": "Ошибка" }\n```';
    expect(parseTaskCheckModelOutput(raw).feedback).toBe("Ошибка");
  });

  test("partial extract on truncated JSON", () => {
    const raw =
      '{ "correct": false, "feedback": "К сожалению, твой ответ неверен. Давай разберём решение пошагово:\\n\\n1. Сна';
    const parsed = parseTaskCheckModelOutput(raw);
    expect(parsed.correct).toBe(false);
    expect(parsed.feedback).toContain("Сна");
  });
});

describe("resolveTaskCheckResult", () => {
  test("returns feedback text only for valid JSON", () => {
    const raw = '{ "correct": false, "feedback": "Попробуй ещё раз." }';
    const r = resolveTaskCheckResult(raw);
    expect(r.parseOk).toBe(true);
    expect(r.feedbackText).toBe("Попробуй ещё раз.");
    expect(r.feedbackText).not.toContain('"correct"');
  });

  test("never returns raw JSON on parse failure", () => {
    const raw = '{ "correct": false, "feedback": "';
    const r = resolveTaskCheckResult(raw);
    expect(r.parseOk).toBe(false);
    expect(r.feedbackText).toBe(TASK_CHECK_PARSE_FALLBACK);
  });

  test("uses partial feedback when truncated", () => {
    const raw =
      '{ "correct": false, "feedback": "К сожалению, твой ответ неверен. Давай разберём решение пошагово:\\n\\n1. Сна';
    const r = resolveTaskCheckResult(raw);
    expect(r.feedbackText).toContain("Сна");
    expect(r.feedbackText).not.toMatch(/^\s*\{/);
  });
});

describe("normalizeStoredTaskFeedback", () => {
  test("unwraps stored JSON blob", () => {
    const stored =
      '{\n  "correct": false,\n  "feedback": "К сожалению, твой ответ неверен."\n}';
    expect(normalizeStoredTaskFeedback(stored)).toBe("К сожалению, твой ответ неверен.");
  });
});

describe("reasoning text before the final JSON (Gemma inline thoughts)", () => {
  const FINAL = JSON.stringify({ own_answer: "11.25", correct: true, feedback: "Привет! Давай разберем эту задачу вместе." });

  test("takes the last JSON object, not LaTeX braces or a draft", () => {
    const raw = 'thought\n\\frac{x}{10}+\\frac{x}{6}=3\nDraft: {"correct": false, "feedback": "Черновик"}\n' + FINAL;
    expect(parseTaskCheckModelOutput(raw)).toEqual({
      correct: true,
      feedback: "Привет! Давай разберем эту задачу вместе.",
      ownAnswer: "11.25",
    });
  });

  test("truncated draft before the final JSON", () => {
    const raw = 'thought \\frac{1}{2} Draft: {"own_answer": "5", "correct": false, "feedback": "Привет! Да\n' + FINAL;
    const r = resolveTaskCheckResult(raw);
    expect(r.correct).toBe(true);
    expect(r.feedbackText).toBe("Привет! Давай разберем эту задачу вместе.");
  });

  test("full draft followed by a truncated final JSON uses the tail", () => {
    const raw =
      '{"own_answer": "5", "correct": false, "feedback": "Черновик"}\n' +
      '{"own_answer": 11.25, "correct": true, "feedback": "Привет! Давай разберем';
    const parsed = parseTaskCheckModelOutput(raw);
    expect(parsed.correct).toBe(true);
    expect(parsed.ownAnswer).toBe("11.25");
    expect(parsed.feedback).toBe("Привет! Давай разберем");
  });
});
