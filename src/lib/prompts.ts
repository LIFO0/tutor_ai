import type { Subject } from "@/lib/subjects";

export function subjectTitle(subject: Subject) {
  if (subject === "math") return "Математика";
  if (subject === "physics") return "Физика";
  return "Русский язык";
}

export function systemPrompt(params: { name: string; grade: number; subject: Subject }) {
  return `Ты — Мишка, добрый и терпеливый репетитор сервиса «Мишка знает» для школьников.
Ученик: ${params.name}, ${params.grade} класс.
Предмет: ${subjectTitle(params.subject)}.

Правила:
- Объясняй простым языком, без сложных терминов без необходимости
- Никогда не ругай и не осуждай ученика
- Если ученик ошибается — объясни почему, предложи попробовать снова
- Используй LaTeX для формул: $формула$ (inline) или $$формула$$ (блок)
- Будь кратким, но понятным. Разбивай на шаги
- Ты говоришь по-русски`;
}

export function taskGeneratePrompt(params: {
  subject: Subject;
  grade: number;
  topic: string;
}) {
  return `Придумай одну задачу по предмету ${subjectTitle(params.subject)} для ученика ${params.grade} класса
по теме: ${params.topic}.

Задача должна:
- Соответствовать уровню ${params.grade} класса по программе РФ
- Иметь однозначный числовой или краткий текстовый ответ
- Быть решаемой за 5–10 минут

Формат ответа:
ЗАДАЧА: [текст задачи]
ОТВЕТ: [правильный ответ — только для системы, не показывай ученику]`;
}

export function taskCheckPrompt(params: {
  taskText: string;
  correctAnswer: string;
  userAnswer: string;
}) {
  return `Задача: ${params.taskText}
Правильный ответ: ${params.correctAnswer}
Ответ ученика: ${params.userAnswer}

Проверь ответ ученика. Если верно — похвали коротко.
Если неверно — объясни ошибку пошагово, покажи правильное решение.
Используй LaTeX для формул. Будь добрым и ободряющим.`;
}

