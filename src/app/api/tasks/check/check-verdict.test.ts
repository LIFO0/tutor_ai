import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * M-XHMK37 через весь /api/tasks/check: задача про лодку, верный ответ 11,25.
 * Модель (Gemma-fallback) выводит рассуждения прямо в тексте перед JSON; в банке эталон мог быть неверным.
 */
const TASK_TEXT =
  "Турист проплыл на лодке по течению реки некоторое расстояние, а затем вернулся обратно против течения, " +
  "затратив на весь путь 3 часа. Скорость течения реки равна 2 км/ч, а собственная скорость лодки — 8 км/ч. " +
  "Найдите расстояние, которое проплыл турист в одну сторону.";

const state = vi.hoisted(() => ({
  reference: "11,25",
  replies: [] as string[],
  saved: null as null | { correct: boolean; aiFeedback: string },
}));

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: async () => ({ id: 1, email: "t@example.com", plan: "free", planExpiresAt: null }),
}));
vi.mock("@/lib/llm-config", () => ({ assertLlmConfigured: () => null }));
vi.mock("@/lib/usage-quota", () => ({
  checkAndConsume: async () => ({ ok: true }),
  toQuotaUser: (u: unknown) => u,
}));
vi.mock("@/lib/tasks", () => ({
  getTask: async () => ({ taskText: TASK_TEXT, correctAnswer: state.reference }),
  setTaskCheckResult: async (p: { correct: boolean; aiFeedback: string }) => {
    state.saved = { correct: p.correct, aiFeedback: p.aiFeedback };
  },
}));
vi.mock("@/lib/llm", () => ({
  completeOnce: async () => state.replies.shift() ?? "",
}));

const { POST } = await import("./route");

async function check(userAnswer: string) {
  const res = await POST(
    new Request("http://localhost/api/tasks/check", {
      method: "POST",
      body: JSON.stringify({ taskId: 1, userAnswer }),
    }),
  );
  return (await res.json()) as { ok: boolean; correct: boolean; verdict: string; aiFeedback: string };
}

const FEEDBACK = "Привет! Давай разберем эту задачу вместе.\nПусть $x$ км — расстояние. $\\frac{x}{10} + \\frac{x}{6} = 3$, $x = 11{,}25$.";
const FINAL_OK = JSON.stringify({ own_answer: "11.25", correct: true, feedback: FEEDBACK });
const FINAL_SAYS_WRONG = JSON.stringify({ own_answer: "11.25", correct: false, feedback: FEEDBACK });
// Рассуждения прямо в тексте: LaTeX-скобки и оборванный черновик JSON с correct:false.
const INLINE_THOUGHT =
  "thought\nSpeeds: 10 and 6, so \\frac{x}{10}+\\frac{x}{6}=3 -> x = 11.25.\n" +
  'Draft: {"own_answer": "5", "correct": false, "feedback": "Привет! Да\n';

beforeEach(() => {
  state.saved = null;
  state.replies = [];
});

describe("POST /api/tasks/check — M-XHMK37 (boat, 11,25)", () => {
  it("word problem is not «verified»: model agrees → ✅, clean feedback", async () => {
    state.reference = "11,25";
    state.replies = [INLINE_THOUGHT + FINAL_OK];
    const r = await check("11,25");
    expect(r.verdict).toBe("correct");
    expect(r.aiFeedback).toBe(FEEDBACK);
    expect(r.aiFeedback).not.toMatch(/Привет!вай|Draft|thought/);
  });

  it("wrong bank reference + model/blind solve agree with the student → 🤔, not ❌", async () => {
    state.reference = "5";
    state.replies = [INLINE_THOUGHT + FINAL_SAYS_WRONG, 'thinking… {"answer": 11.25}'];
    const r = await check("11,25");
    expect(r.verdict).toBe("uncertain");
    expect(r.correct).toBe(true);
    expect(r.aiFeedback).toContain(FEEDBACK);
  });

  it.each(["11,25", "11.25", "45/4"])("%s with the right reference → ✅", async (answer) => {
    state.reference = "45/4";
    state.replies = [FINAL_SAYS_WRONG];
    expect((await check(answer)).verdict).toBe("correct");
  });

  it("999 → ❌", async () => {
    state.reference = "11,25";
    state.replies = [JSON.stringify({ own_answer: "11.25", correct: false, feedback: "Неверно." }), '{"answer": "11.25"}'];
    expect((await check("999")).verdict).toBe("incorrect");
  });
});
