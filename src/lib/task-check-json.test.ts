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
