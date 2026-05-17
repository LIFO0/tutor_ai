const EPSILON = 1e-6;

/** Нормализация для строкового сравнения ответов. */
export function normalizeAnswerForCompare(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/÷|∶|:/g, "/")
    .replace(/×|·|\*/g, "*")
    .replace(/−|–|—/g, "-")
    .replace(/,/g, ".")
    .replace(/\s*([+\-*/()])\s*/g, "$1");
}

/** Упрощает LaTeX и смешанные дроби для числовой оценки. */
export function prepareExpressionForEval(raw: string): string {
  let s = raw.trim();
  s = s.replace(/\$+/g, "");
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

export function answersMatchForTask(userAnswer: string, correctAnswer: string): boolean {
  const u = normalizeAnswerForCompare(userAnswer);
  const c = normalizeAnswerForCompare(correctAnswer);
  if (!c || c === "—") return false;
  if (u === c) return true;
  return areNumericExpressionsEquivalent(userAnswer, correctAnswer);
}
