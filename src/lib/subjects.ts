import type { LucideIcon } from "lucide-react";
import { Atom, BookMarked, Sigma, Sparkles } from "lucide-react";

/** Три предмета для чатов и заданий (жёсткая программа). */
export type SchoolSubject = "math" | "physics" | "russian";

/** Свободная тема: предмет в промпте определяется по вопросу. */
export type FlexSubject = "free";

export type Subject = SchoolSubject | FlexSubject;

export type SubjectMeta = {
  key: Subject;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const SCHOOL_SUBJECTS: SubjectMeta[] = [
  {
    key: "math",
    title: "Математика",
    description: "Дроби, уравнения, функции, геометрия и многое другое.",
    icon: Sigma,
  },
  {
    key: "physics",
    title: "Физика",
    description: "Механика, электричество, оптика — с понятными примерами.",
    icon: Atom,
  },
  {
    key: "russian",
    title: "Русский язык",
    description: "Орфография и пунктуация — без стресса и спешки.",
    icon: BookMarked,
  },
];

export const FLEX_SUBJECTS: SubjectMeta[] = [
  {
    key: "free",
    title: "Свободная тема",
    description: "Мишка сам определит по вопросу, о чём речь, и ответит уместно.",
    icon: Sparkles,
  },
];

/** Все варианты для главной и списка чатов (свободная тема первая — и по умолчанию). */
export const CHAT_SUBJECTS: SubjectMeta[] = [...FLEX_SUBJECTS, ...SCHOOL_SUBJECTS];

export const DEFAULT_CHAT_SUBJECT: FlexSubject = "free";

/** Только школьные предметы — для заданий и выбора темы задачи. */
export const SUBJECTS = SCHOOL_SUBJECTS;

const CHAT_KEYS = new Set(CHAT_SUBJECTS.map((s) => s.key));

/** Старые чаты могли сохранить mixed | general | creative — в промпте обрабатываем как free. */
const LEGACY_FLEX_KEYS = new Set(["mixed", "general", "creative"]);

export function isValidChatSubject(value: unknown): value is Subject {
  return typeof value === "string" && CHAT_KEYS.has(value as Subject);
}

/** Для ответа модели: неизвестные и устаревшие ключи → free. */
export function normalizeChatSubject(value: string): Subject {
  if (LEGACY_FLEX_KEYS.has(value)) return "free";
  if (isValidChatSubject(value)) return value;
  return "free";
}

export function isSchoolSubject(value: unknown): value is SchoolSubject {
  return value === "math" || value === "physics" || value === "russian";
}
