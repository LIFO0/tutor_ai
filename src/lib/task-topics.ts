import type { SchoolSubject } from "@/lib/subjects";

export type TopicEntry = {
  key: string;
  title: string;
  aliases: string[];
};

export const TOPIC_VOCAB: Record<SchoolSubject, TopicEntry[]> = {
  math: [
    { key: "fractions", title: "Дроби", aliases: ["дроби", "дробь", "смешанные дроби", "обыкновенные дроби"] },
    { key: "equations", title: "Уравнения", aliases: ["уравнения", "уравнение", "линейные уравнения", "квадратные уравнения"] },
    { key: "geometry", title: "Геометрия", aliases: ["геометрия", "треугольник", "площадь", "периметр", "окружность"] },
    { key: "functions", title: "Функции", aliases: ["функции", "функция", "график", "парабола"] },
    { key: "percentages", title: "Проценты", aliases: ["проценты", "процент", "скидка", "наценка"] },
    { key: "powers", title: "Степени", aliases: ["степени", "степень", "корень", "квадратный корень"] },
    { key: "algebra", title: "Алгебра", aliases: ["алгебра", "выражения", "многочлен", "формулы"] },
    { key: "arithmetic", title: "Арифметика", aliases: ["арифметика", "сложение", "вычитание", "умножение", "деление"] },
  ],
  physics: [
    { key: "mechanics", title: "Механика", aliases: ["механика", "скорость", "ускорение", "сила", "ньютон"] },
    { key: "electricity", title: "Электричество", aliases: ["электричество", "ток", "напряжение", "сопротивление", "закон ома", "ом"] },
    { key: "optics", title: "Оптика", aliases: ["оптика", "свет", "линза", "отражение", "преломление"] },
    { key: "thermodynamics", title: "Теплота", aliases: ["теплота", "температура", "теплообмен", "калориметрия"] },
    { key: "kinematics", title: "Кинематика", aliases: ["кинематика", "движение", "путь", "время"] },
  ],
  russian: [
    { key: "spelling", title: "Орфография", aliases: ["орфография", "правописание", "безударная гласная", "приставки"] },
    { key: "punctuation", title: "Пунктуация", aliases: ["пунктуация", "запятая", "тире", "двоеточие"] },
    { key: "participles", title: "Причастия", aliases: ["причастия", "причастие", "деепричастия", "деепричастие"] },
    { key: "morphology", title: "Морфология", aliases: ["морфология", "части речи", "окончания", "склонение"] },
    { key: "syntax", title: "Синтаксис", aliases: ["синтаксис", "предложение", "сложное предложение", "однородные члены"] },
  ],
};

/** Детерминированная нормализация свободного текста темы. */
export function normalizeTopicText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Матч по aliases -> канонический ключ; fallback = topicNorm. */
export function resolveTopicKey(subject: SchoolSubject, raw: string): { topicKey: string; topicNorm: string } {
  const topicNorm = normalizeTopicText(raw);
  if (!topicNorm) return { topicKey: "other", topicNorm: "other" };

  const vocab = TOPIC_VOCAB[subject];
  for (const entry of vocab) {
    for (const alias of entry.aliases) {
      const normAlias = normalizeTopicText(alias);
      if (topicNorm === normAlias || topicNorm.includes(normAlias) || normAlias.includes(topicNorm)) {
        return { topicKey: entry.key, topicNorm };
      }
    }
  }

  return { topicKey: topicNorm, topicNorm };
}

export function isValidTopicKey(subject: SchoolSubject, key: string): boolean {
  const norm = normalizeTopicText(key);
  if (!norm) return false;
  const vocab = TOPIC_VOCAB[subject];
  if (vocab.some((e) => e.key === key)) return true;
  // fallback-ключи (нормализованный текст) тоже допустимы
  return norm.length > 0 && norm.length <= 80;
}

export function topicKeysForSubject(subject: SchoolSubject): string[] {
  return TOPIC_VOCAB[subject].map((e) => e.key);
}

export function topicKeyTitle(subject: SchoolSubject, key: string): string {
  const entry = TOPIC_VOCAB[subject].find((e) => e.key === key);
  return entry?.title ?? key;
}
