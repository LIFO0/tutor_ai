import { createHash, randomBytes } from "node:crypto";
import type { SchoolSubject } from "@/lib/subjects";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const SUBJECT_PREFIX: Record<SchoolSubject, string> = {
  math: "M",
  physics: "P",
  russian: "R",
};

/** Нормализация текста задачи для exact-хэша. */
export function normalizeTaskText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** sha256 нормализованного текста — exact-дедуп. */
export function contentHashOf(text: string): string {
  return createHash("sha256").update(normalizeTaskText(text)).digest("hex");
}

/**
 * «Скелет» задачи: числа/дроби -> #, убрать LaTeX-разделители и пунктуацию.
 * Задачи одного типа с разными числами дают одинаковый скелет.
 */
export function taskTemplate(text: string): string {
  let s = text.trim().toLowerCase();

  // LaTeX-разделители
  s = s.replace(/\$\$?/g, " ");
  s = s.replace(/\\\(|\\\)|\\\[|\\\]/g, " ");

  // \frac{a}{b} и смешанные дроби "2 1/3"
  s = s.replace(/\\frac\s*\{[^}]*\}\s*\{[^}]*\}/g, "#");
  s = s.replace(/\d+\s+\d+\s*\/\s*\d+/g, "#");
  s = s.replace(/\d+\s*\/\s*\d+/g, "#");

  // Десятичные (запятая и точка)
  s = s.replace(/\d+[.,]\d+/g, "#");
  s = s.replace(/\d+/g, "#");

  // Убрать пунктуацию, оставить буквы/цифры/# и пробелы
  s = s.replace(/[^\p{L}\p{N}#\s]/gu, " ");
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/** sha256 скелета — дедуп «такого же типа». */
export function templateHashOf(text: string): string {
  return createHash("sha256").update(taskTemplate(text)).digest("hex");
}

/** Шорт-код для обмена: префикс предмета + 6 символов Crockford base32. */
export function makePublicId(subject: SchoolSubject): string {
  const prefix = SUBJECT_PREFIX[subject];
  let code = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += CROCKFORD[bytes[i]! % CROCKFORD.length];
  }
  return `${prefix}-${code}`;
}
