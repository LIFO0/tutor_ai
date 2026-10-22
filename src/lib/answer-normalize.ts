const EPSILON = 1e-6;

/** Нормализация для строкового сравнения ответов. */
export function normalizeAnswerForCompare(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/÷|∶|:/g, "/")
    .replace(/×|·|\*/g, "*")
    .replace(/[\u2212\u2012\u2013\u2014\u2015\uFE63\uFF0D]/g, "-")
    .replace(/\\minus/g, "-")
    .replace(/,/g, ".")
    .replace(/\s*([+\-*/()])\s*/g, "$1");
}

/** Упрощает LaTeX и смешанные дроби для числовой оценки. */
export function prepareExpressionForEval(raw: string): string {
  let s = raw.trim();
  s = s.replace(/\$+/g, "");
  // Смешанное число в LaTeX: 11\frac{1}{4} = 11 + 1/4 (не умножение).
  s = s.replace(/(\d+)\s*\\d?frac\s*\{(\d+)\}\s*\{(\d+)\}/g, "($1+$2/$3)");
  s = s.replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, "($1)/($2)");
  s = s.replace(/\\dfrac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, "($1)/($2)");
  s = s.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g, "($1+$2/$3)");
  return normalizeAnswerForCompare(s);
}

type Token =
  | { type: "num"; value: number }
  | { type: "op"; value: string }
  | { type: "lparen" }
  | { type: "rparen" };

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i]!;
    if (c === " ") {
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }
    if ("+-*/".includes(c)) {
      if (c === "-" && (tokens.length === 0 || tokens[tokens.length - 1]?.type === "op" || tokens[tokens.length - 1]?.type === "lparen")) {
        const numMatch = expr.slice(i).match(/^-(\d+(?:\.\d+)?|\.\d+)/);
        if (numMatch) {
          tokens.push({ type: "num", value: Number(numMatch[0]) });
          i += numMatch[0].length;
          continue;
        }
      }
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }
    const numMatch = expr.slice(i).match(/^(\d+(?:\.\d+)?|\.\d+)/);
    if (numMatch) {
      tokens.push({ type: "num", value: Number(numMatch[1]) });
      i += numMatch[0].length;
      continue;
    }
    return null;
  }
  return tokens;
}

function applyOp(a: number, b: number, op: string): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? null : a / b;
    default:
      return null;
  }
}

function evaluateTokens(tokens: Token[]): number | null {
  const output: number[] = [];
  const ops: string[] = [];
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

  function flushOps(minPrec = 0) {
    while (ops.length > 0) {
      const top = ops[ops.length - 1]!;
      if (prec[top]! < minPrec) break;
      ops.pop();
      const b = output.pop();
      const a = output.pop();
      if (a === undefined || b === undefined) return false;
      const r = applyOp(a, b, top);
      if (r === null) return false;
      output.push(r);
    }
    return true;
  }

  for (const t of tokens) {
    if (t.type === "num") {
      output.push(t.value);
      continue;
    }
    if (t.type === "lparen") {
      ops.push("(");
      continue;
    }
    if (t.type === "rparen") {
      while (ops.length > 0 && ops[ops.length - 1] !== "(") {
        const top = ops.pop()!;
        const b = output.pop();
        const a = output.pop();
        if (a === undefined || b === undefined) return null;
        const r = applyOp(a, b, top);
        if (r === null) return null;
        output.push(r);
      }
      if (ops.pop() !== "(") return null;
      continue;
    }
    if (t.type === "op") {
      while (ops.length > 0 && ops[ops.length - 1] !== "(" && prec[ops[ops.length - 1]!]! >= prec[t.value]!) {
        const top = ops.pop()!;
        const b = output.pop();
        const a = output.pop();
        if (a === undefined || b === undefined) return null;
        const r = applyOp(a, b, top);
        if (r === null) return null;
        output.push(r);
      }
      ops.push(t.value);
    }
  }

  if (!flushOps()) return null;
  return output.length === 1 ? output[0]! : null;
}

/** Пытается вычислить простое арифметическое выражение; иначе null. */
export function tryEvaluateNumericExpression(raw: string): number | null {
  const expr = prepareExpressionForEval(raw);
  if (!expr || !/^[\d\s+\-*/().]+$/.test(expr)) return null;
  const tokens = tokenize(expr);
  if (!tokens || tokens.length === 0) return null;
  const value = evaluateTokens(tokens);
  if (value === null || !Number.isFinite(value)) return null;
  return value;
}

export function areNumericExpressionsEquivalent(a: string, b: string, epsilon = EPSILON): boolean {
  const va = tryEvaluateNumericExpression(a);
  const vb = tryEvaluateNumericExpression(b);
  if (va === null || vb === null) return false;
  return Math.abs(va - vb) <= epsilon;
}

/** Убирает префикс «x =» в ответе вида «x = −4». */
export function stripVariablePrefix(s: string): string {
  return s.replace(/^\s*\$?\s*[a-zA-Z]\s*=\s*/, "");
}

/**
 * Убирает хвостовые единицы измерения: «11,25 км/ч» → «11,25», «5 см²» → «5».
 * Единица начинается с буквы (или °/%) после числа/выражения.
 */
export function stripTrailingUnits(s: string): string {
  const m = s.trim().match(/^(.*?[\d)])\s*[a-zа-яё°%][a-zа-яё°%/.²³\s]*$/i);
  return m ? m[1]!.trim() : s.trim();
}

/**
 * «31/20 = 1,55» → ["31/20", "1,55"]: несколько записей одного и того же числа.
 * Делим только если каждая часть вычисляется и все части равны; иначе null
 * (уравнения вида «2x = 10» и несогласованные цепочки не трогаем).
 */
export function splitEquivalentForms(s: string): string[] | null {
  if (!s.includes("=")) return null;
  const parts = s.split("=").map((p) => p.trim());
  if (parts.length < 2 || parts.some((p) => !p)) return null;
  const values = parts.map((p) => tryEvaluateNumericExpression(stripTrailingUnits(p)));
  if (values.some((v) => v === null)) return null;
  const first = values[0]!;
  if (values.some((v) => Math.abs(v! - first) > EPSILON)) return null;
  return parts;
}

export function answersMatchForTask(userAnswer: string, correctAnswer: string): boolean {
  if (matchSingleForm(userAnswer, correctAnswer)) return true;
  const userForms = splitEquivalentForms(userAnswer) ?? [userAnswer];
  const refForms = splitEquivalentForms(correctAnswer) ?? [correctAnswer];
  if (userForms.length === 1 && refForms.length === 1) return false;
  return userForms.some((u) => refForms.some((c) => matchSingleForm(u, c)));
}

function matchSingleForm(userAnswer: string, correctAnswer: string): boolean {
  if (answersMatchStrict(userAnswer, correctAnswer)) return true;
  const u = stripTrailingUnits(stripVariablePrefix(userAnswer));
  const c = stripTrailingUnits(stripVariablePrefix(correctAnswer));
  if (u === userAnswer.trim() && c === correctAnswer.trim()) return false;
  return answersMatchStrict(u, c);
}

function answersMatchStrict(userAnswer: string, correctAnswer: string): boolean {
  userAnswer = stripVariablePrefix(userAnswer);
  correctAnswer = stripVariablePrefix(correctAnswer);
  const u = normalizeAnswerForCompare(userAnswer);
  const c = normalizeAnswerForCompare(correctAnswer);
  if (!c || c === "—") return false;
  if (u === c) return true;
  return areNumericExpressionsEquivalent(userAnswer, correctAnswer);
}
