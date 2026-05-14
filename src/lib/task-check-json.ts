/**
 * Вырезает сбалансированный JSON-объект с позиции первой «{», не считая «{»/«}»
 * внутри строк в двойных кавычках (с учётом escape).
 * Нужно, чтобы поле "feedback" могло содержать LaTeX вроде \frac{1}{2}.
 */
export function extractBalancedJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export type ParsedTaskCheck = {
  correct: boolean | null;
  feedback: string | null;
};

export function parseTaskCheckModelOutput(modelRaw: string): ParsedTaskCheck {
  const trimmed = modelRaw.trim();
  const candidates: string[] = [];
  if (trimmed.startsWith("{")) candidates.push(trimmed);
  const extracted = extractBalancedJsonObject(trimmed);
  if (extracted && !candidates.includes(extracted)) candidates.push(extracted);

  for (const jsonStr of candidates) {
    try {
      const parsed = JSON.parse(jsonStr) as unknown;
      if (typeof parsed !== "object" || parsed === null) continue;
      const correct =
        "correct" in parsed && typeof (parsed as { correct: unknown }).correct === "boolean"
          ? (parsed as { correct: boolean }).correct
          : null;
      const feedback =
        "feedback" in parsed && typeof (parsed as { feedback: unknown }).feedback === "string"
          ? (parsed as { feedback: string }).feedback
          : null;
      if (correct !== null || feedback !== null) return { correct, feedback };
    } catch {
      continue;
    }
  }
  return { correct: null, feedback: null };
}

/** Если в БД/UI попал целиком JSON проверки — показываем только текст feedback. */
export function normalizeStoredTaskFeedback(text: string): string {
  const { feedback } = parseTaskCheckModelOutput(text);
  return feedback?.trim() ? feedback.trim() : text;
}
