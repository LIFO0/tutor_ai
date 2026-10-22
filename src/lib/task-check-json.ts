/**
 * Вырезает сбалансированный JSON-объект с позиции первой «{», не считая «{»/«}»
 * внутри строк в двойных кавычках (с учётом escape).
 * Нужно, чтобы поле "feedback" могло содержать LaTeX вроде \frac{1}{2}.
 */
export function extractBalancedJsonObject(text: string, from = 0): string | null {
  const start = text.indexOf("{", from);
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
  /** Ответ, который модель получила, решив задачу сама (поле own_answer). */
  ownAnswer?: string | null;
};

const OWN_ANSWER_RE = /"own_answer"\s*:\s*(?:"((?:\\.|[^"\\])*)"|(-?\d+(?:[.,]\d+)?))/;

function readOwnAnswer(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim().slice(0, 200);
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

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

function lastMatch(text: string, re: RegExp): RegExpMatchArray | null {
  const all = [...text.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))];
  return all.length ? all[all.length - 1]! : null;
}

/**
 * Мягкое извлечение полей, если JSON.parse не сработал (обрезанный ответ и т.п.).
 * Берём ПОСЛЕДНИЕ вхождения: перед итоговым JSON модель (Gemma) может вывести черновик
 * рассуждений с теми же ключами, а ответ — всегда в конце.
 */
export function extractPartialTaskCheck(text: string): ParsedTaskCheck {
  const correctMatch = lastMatch(text, CORRECT_RE);
  const correct = correctMatch
    ? correctMatch[1]!.toLowerCase() === "true"
    : null;
  const feedbackMatch = lastMatch(text, FEEDBACK_RE);
  let feedback: string | null = null;
  if (feedbackMatch?.[1] != null) {
    try {
      feedback = JSON.parse(`"${feedbackMatch[1]}"`) as string;
    } catch {
      feedback = feedbackMatch[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }
  const own = lastMatch(text, OWN_ANSWER_RE);
  const ownAnswer = own ? readOwnAnswer(own[1] ?? own[2]) : null;
  return { correct, feedback, ...(ownAnswer ? { ownAnswer } : {}) };
}

export function parseTaskCheckModelOutput(modelRaw: string): ParsedTaskCheck {
  const trimmed = stripMarkdownJsonFence(modelRaw);
  const candidates: string[] = [];
  if (trimmed.startsWith("{")) candidates.push(trimmed);
  // Все JSON-объекты в тексте, последний — первым: если перед ответом модель вывела
  // рассуждения/черновик (Gemma: «thought …» прямо в тексте), итоговый JSON стоит в конце.
  const objects: string[] = [];
  let lastObjectEnd = -1;
  for (let from = trimmed.indexOf("{"); from !== -1; ) {
    const obj = extractBalancedJsonObject(trimmed, from);
    if (obj) {
      try {
        JSON.parse(obj);
        objects.push(obj);
        lastObjectEnd = from + obj.length;
        from = trimmed.indexOf("{", lastObjectEnd);
        continue;
      } catch {
        // не JSON (LaTeX \frac{…}{…}, обрывок черновика) — пробуем следующую «{»
      }
    }
    from = trimmed.indexOf("{", from + 1);
  }
  // Целый черновик, а за ним оборванный итоговый JSON: берём поля из хвоста, а не из черновика.
  if (lastObjectEnd !== -1 && /"feedback"\s*:/.test(trimmed.slice(lastObjectEnd))) {
    return extractPartialTaskCheck(trimmed.slice(lastObjectEnd));
  }
  for (const obj of objects.reverse()) if (!candidates.includes(obj)) candidates.push(obj);

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
      const ownAnswer =
        "own_answer" in parsed ? readOwnAnswer((parsed as { own_answer: unknown }).own_answer) : null;
      if (correct !== null || feedback !== null) return { correct, feedback, ...(ownAnswer ? { ownAnswer } : {}) };
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
  ownAnswer?: string | null;
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
      ownAnswer: parsed.ownAnswer ?? null,
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
