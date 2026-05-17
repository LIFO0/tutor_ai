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

/** Убирает markdown-ограждение ```json ... ``` вокруг ответа модели. */
export function stripMarkdownJsonFence(text: string): string {
  let s = text.trim();
  const fullFence = s.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fullFence) return fullFence[1]!.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/i, "");
    s = s.replace(/\n?```\s*$/i, "");
  }
  return s.trim();
}

const CORRECT_RE = /"correct"\s*:\s*(true|false)/i;
const FEEDBACK_RE = /"feedback"\s*:\s*"((?:\\.|[^"\\])*)(?:"|$)/;

/** Мягкое извлечение полей, если JSON.parse не сработал (обрезанный ответ и т.п.). */
export function extractPartialTaskCheck(text: string): ParsedTaskCheck {
  const correctMatch = text.match(CORRECT_RE);
  const correct = correctMatch
    ? correctMatch[1]!.toLowerCase() === "true"
    : null;
  const feedbackMatch = text.match(FEEDBACK_RE);
  let feedback: string | null = null;
  if (feedbackMatch?.[1] != null) {
    try {
      feedback = JSON.parse(`"${feedbackMatch[1]}"`) as string;
    } catch {
      feedback = feedbackMatch[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }
  return { correct, feedback };
}

export function parseTaskCheckModelOutput(modelRaw: string): ParsedTaskCheck {
  const trimmed = stripMarkdownJsonFence(modelRaw);
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
  return extractPartialTaskCheck(trimmed);
}

function looksLikeTaskCheckJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith("{") && /"feedback"\s*:/.test(t);
}

export const TASK_CHECK_PARSE_FALLBACK =
  "Не удалось сформировать разбор. Попробуйте проверить ещё раз.";

export type ResolvedTaskCheck = {
  correct: boolean | null;
  feedbackText: string;
  parseOk: boolean;
};

/** Превращает сырой ответ модели в безопасный для UI текст и флаг correct. */
export function resolveTaskCheckResult(modelRaw: string): ResolvedTaskCheck {
  const stripped = stripMarkdownJsonFence(modelRaw);
  const parsed = parseTaskCheckModelOutput(stripped);

  if (parsed.feedback?.trim()) {
    return {
      correct: parsed.correct,
      feedbackText: parsed.feedback.trim(),
      parseOk: true,
    };
  }

  if (looksLikeTaskCheckJson(stripped)) {
    return {
      correct: parsed.correct,
      feedbackText: TASK_CHECK_PARSE_FALLBACK,
      parseOk: false,
    };
  }

  const plain = stripped.trim();
  if (plain.length > 0) {
    return {
      correct: parsed.correct,
      feedbackText: plain,
      parseOk: parsed.correct !== null,
    };
  }

  return {
    correct: parsed.correct,
    feedbackText: TASK_CHECK_PARSE_FALLBACK,
    parseOk: false,
  };
}

/** Если в БД/UI попал целиком JSON проверки — показываем только текст feedback. */
export function normalizeStoredTaskFeedback(text: string): string {
  if (!text.trim()) return text;
  const { feedbackText } = resolveTaskCheckResult(text);
  return feedbackText;
}
