import {
  CHAT_SUBJECTS,
  normalizeChatSubject,
  type Subject,
  isSchoolSubject,
} from "@/lib/subjects";

/** Подпись предмета в UI; устаревшие ключи в БД показываем как свободную тему. */
export function subjectTitle(subject: string) {
  const key = normalizeChatSubject(subject);
  return CHAT_SUBJECTS.find((s) => s.key === key)?.title ?? subject;
}

function subjectModeForPrompt(subject: Subject): string {
  if (isSchoolSubject(subject)) {
    return `Предмет: ${subjectTitle(subject)}. Веди себя как репетитор именно по этому предмету.`;
  }
  return "Режим: свободная тема. Конкретный предмет не зафиксирован — по тексту вопроса ученика сам определи, о чём речь (математика, русский, физика, другое или смешанное), и отвечай уместно на уровне {{GRADE}} класса. Если вопрос общий, отвечай как дружелюбный наставник.";
}

export function systemPrompt(params: {
  name: string;
  chatName?: string | null;
  grade: number;
  subject: Subject;
}) {
  const address = (params.chatName?.trim() || params.name).trim();
  const mode = subjectModeForPrompt(params.subject).replace(
    "{{GRADE}}",
    String(params.grade),
  );
  return `Ты — Мишка, добрый и терпеливый репетитор сервиса «Мишка знает» для школьников.
Ученик: ${address}, ${params.grade} класс.
${mode}

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

