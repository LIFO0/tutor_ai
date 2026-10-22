/**
 * Детерминированная проверка эталонного ответа для линейных уравнений
 * с одной переменной (например, «3(2x − 4) − 5(x + 1) = 2x − 13»).
 * LLM иногда ошибается в знаке корня — здесь корень считается точно.
 */

type Lin = { a: number; b: number }; // a*v + b

const MINUS_RE = /[\u2212\u2012\u2013\u2014\u2015\uFE63\uFF0D]/g;

/** Приводит все варианты минуса к ASCII '-'. */
export function normalizeMinus(s: string): string {
  return s.replace(MINUS_RE, "-");
}

function prepareMath(raw: string): string {
  let s = normalizeMinus(raw);
  s = s.replace(/\$+/g, " ");
  s = s.replace(/\\left|\\right/g, "");
  s = s.replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)");
  s = s.replace(/\\cdot|\\times|×|·/g, "*");
  s = s.replace(/\\div|÷/g, "/");
  s = s.replace(/\\minus/g, "-");
  s = s.replace(/[{}]/g, (c) => (c === "{" ? "(" : ")"));
  s = s.replace(/(\d),(\d)/g, "$1.$2");
  return s;
}

class Parser {
  private i = 0;
  constructor(private s: string, private v: string) {}
  private peek() {
    while (this.s[this.i] === " ") this.i++;
    return this.s[this.i];
  }
  parse(): Lin | null {
    const r = this.expr();
    if (r === null || this.peek() !== undefined) return null;
    return r;
  }
  private expr(): Lin | null {
    let left = this.term();
    if (!left) return null;
    for (;;) {
      const c = this.peek();
      if (c !== "+" && c !== "-") return left;
      this.i++;
      const right = this.term();
      if (!right) return null;
      left = c === "+" ? { a: left.a + right.a, b: left.b + right.b } : { a: left.a - right.a, b: left.b - right.b };
    }
  }
  private term(): Lin | null {
    let left = this.unary();
    if (!left) return null;
    for (;;) {
      const c = this.peek();
      if (c === "*" || c === "/") {
        this.i++;
        const right = this.unary();
        if (!right) return null;
        left = c === "*" ? mul(left, right) : div(left, right);
      } else if (c !== undefined && (c === "(" || c === this.v || /[\d.]/.test(c))) {
        // неявное умножение: 3(…), 2x, (…)(…), x(…)
        const right = this.unary();
        if (!right) return null;
        left = mul(left, right);
      } else return left;
      if (!left) return null;
    }
  }
  private unary(): Lin | null {
    const c = this.peek();
    if (c === "-" || c === "+") {
      this.i++;
      const r = this.unary();
      return r && (c === "-" ? { a: -r.a, b: -r.b } : r);
    }
    return this.primary();
  }
  private primary(): Lin | null {
    const c = this.peek();
    if (c === "(") {
      this.i++;
      const r = this.expr();
      if (!r || this.peek() !== ")") return null;
      this.i++;
      return r;
    }
    if (c === this.v) {
      this.i++;
      return { a: 1, b: 0 };
    }
    const m = this.s.slice(this.i).match(/^(\d+(?:\.\d+)?|\.\d+)/);
    if (m) {
      this.i += m[0].length;
      return { a: 0, b: Number(m[0]) };
    }
    return null;
  }
}

function mul(x: Lin | null, y: Lin | null): Lin | null {
  if (!x || !y) return null;
  if (x.a !== 0 && y.a !== 0) return null; // нелинейное
  return { a: x.a * y.b + y.a * x.b, b: x.b * y.b };
}
function div(x: Lin | null, y: Lin | null): Lin | null {
  if (!x || !y || y.a !== 0 || y.b === 0) return null;
  return { a: x.a / y.b, b: x.b / y.b };
}

export type LinearSolution = { variable: string; root: number; equation: string };

/** Единицы измерения в тексте: признак текстовой задачи («2 км/ч», «3 часа», «5 кг»). */
const UNIT_RE =
  /(?:^|[^а-яё])(?:км|м|см|мм|дм|ч|час(?:а|ов)?|мин(?:ута|уты|ут)?|сек(?:унд[аы]?)?|кг|г|т|ц|л|мл|руб(?:л[ья]|лей)?|коп(?:е[ей]к[аи]?)?|шт|га)(?=[^а-яё]|$)|%/i;
/** Сколько слов прозы допускаем вокруг уравнения: «Решите уравнение», «Найдите корень уравнения:». */
const MAX_PROSE_WORDS = 12;

/**
 * Решаем только «голую» задачу на уравнение («Решите уравнение: 3(2x − 4) = …»).
 * В текстовой задаче (лодка, скорости, единицы) уравнение в тексте — подсказка или промежуточный шаг,
 * а спрашивают может быть другое; «проверенный» эталон из него давал чистое ❌ (M-XHMK37).
 */
function isStandaloneEquationTask(prepared: string, candidates: string[]): boolean {
  let prose = prepared;
  for (const c of candidates) prose = prose.replace(c, " ");
  if (UNIT_RE.test(prose)) return false;
  const words = prose.match(/[а-яёa-z]{2,}/gi) ?? [];
  return words.length <= MAX_PROSE_WORDS;
}

/**
 * Ищет в тексте задачи ровно одно линейное уравнение с одной латинской переменной
 * и решает его. Возвращает null, если уравнение не найдено/не линейно/не однозначно.
 */
export function solveLinearEquationFromText(text: string): LinearSolution | null {
  const s = prepareMath(text);
  const candidates = s.match(/[0-9a-z+\-*/().\s]+=[0-9a-z+\-*/().\s]+/gi) ?? [];
  if (candidates.length === 0 || !isStandaloneEquationTask(s, candidates)) return null;
  const solutions: LinearSolution[] = [];
  for (const raw of candidates) {
    const eq = raw.trim().replace(/^[*/+.\s]+/, "").replace(/[.\s]+$/, "");
    // в кандидат не должны попадать куски слов: переменная — одиночная буква
    // «t1 + t2 = 3», «v2» — индексы обозначений, а не умножение t·1: такое не решаем.
    if (/[a-z]\d/i.test(eq)) continue;
    const letters = eq.match(/[a-z]+/gi) ?? [];
    if (letters.length === 0 || letters.some((w) => w.length !== 1)) continue;
    const vars = new Set(letters.map((l) => l.toLowerCase()));
    if (vars.size !== 1) continue;
    const v = [...vars][0]!;
    const [lhs, rhs] = eq.toLowerCase().split("=");
    const L = new Parser(lhs!, v).parse();
    const R = new Parser(rhs!, v).parse();
    if (!L || !R) continue;
    // «x = 7» — это значение переменной («… при x = 7», «если x = 7»), а не уравнение задачи.
    // Иначе эталон подменялся на 7 и считался «проверенным», и верный ответ получал ❌.
    const bareVar = (side: string) => side.replace(/[\s()]/g, "") === v;
    if ((bareVar(lhs!) && R.a === 0) || (bareVar(rhs!) && L.a === 0)) continue;
    const a = L.a - R.a;
    const b = R.b - L.b;
    if (Math.abs(a) < 1e-12) continue;
    solutions.push({ variable: v, root: b / a, equation: eq });
  }
  return solutions.length === 1 ? solutions[0]! : null;
}

export function formatRoot(n: number): string {
  if (Number.isInteger(n)) return String(n);
  for (let d = 2; d <= 100; d++) {
    const num = n * d;
    if (Math.abs(num - Math.round(num)) < 1e-9) return `${Math.round(num)}/${d}`;
  }
  return String(Math.round(n * 1e6) / 1e6);
}

/**
 * Возвращает проверенный эталон: для линейного уравнения — вычисленный корень,
 * иначе исходный ответ модели.
 */
export function verifiedReferenceAnswer(
  taskText: string,
  modelAnswer: string,
): { answer: string; overridden: boolean; verified: boolean } {
  const sol = solveLinearEquationFromText(taskText);
  if (!sol) return { answer: modelAnswer, overridden: false, verified: false };
  const answer = formatRoot(sol.root);
  const model = normalizeMinus(modelAnswer).replace(/\s/g, "").replace(/^[a-z]=/i, "");
  return { answer, overridden: model !== answer, verified: true };
}
