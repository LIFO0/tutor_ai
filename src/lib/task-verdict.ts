import { answersMatchForTask } from "@/lib/answer-normalize";

export type TaskVerdict = "correct" | "incorrect" | "uncertain";

/**
 * Итоговый вердикт проверки задачи.
 * - Эталон проверен вычислением (линейное уравнение) → только детерминированное сравнение.
 * - Ответ совпал с эталоном → верно.
 * - Модель сказала correct: true → верно.
 * - Модель сказала «неверно», но её собственное решение (own_answer) совпадает с ответом ученика,
 *   а не с эталоном → эталон, вероятно, ошибочный: «uncertain» (не помечаем как ошибку).
 * - Иначе → неверно.
 */
export function decideTaskVerdict(p: {
  userAnswer: string;
  referenceAnswer: string;
  hasVerifiedReference: boolean;
  modelCorrect: boolean | null;
  modelOwnAnswer: string | null | undefined;
}): { verdict: TaskVerdict; referenceSuspect: boolean } {
  const det = answersMatchForTask(p.userAnswer, p.referenceAnswer);
  if (p.hasVerifiedReference) return { verdict: det ? "correct" : "incorrect", referenceSuspect: false };
  if (det) return { verdict: "correct", referenceSuspect: false };

  const own = p.modelOwnAnswer?.trim() || null;
  const ownMatchesUser = own ? answersMatchForTask(p.userAnswer, own) : false;
  const ownMatchesRef = own ? answersMatchForTask(own, p.referenceAnswer) : false;
  const referenceSuspect = own !== null && !ownMatchesRef;

  if (p.modelCorrect === true) return { verdict: "correct", referenceSuspect };
  if (ownMatchesUser && !ownMatchesRef) return { verdict: "uncertain", referenceSuspect: true };
  return { verdict: "incorrect", referenceSuspect };
}

/** В БД храним boolean: «uncertain» не считаем ошибкой ученика. */
export function verdictToStoredCorrect(v: TaskVerdict): boolean {
  return v !== "incorrect";
}

export const UNCERTAIN_NOTE =
  "🤔 Похоже, твой ответ верный, но он не совпал с ответом в нашей подсказке. Мы проверим эту задачу — а ты молодец!";
