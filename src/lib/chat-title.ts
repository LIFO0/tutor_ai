/**
 * Защита названий чатов от смеси алфавитов внутри слова. Модель иногда вставляет латиницу
 * в русское слово: на проде было «Праfила написания несмотря на дождь».
 *
 * Слово — непрерывная последовательность букв (\p{L}+), поэтому «Python-код», «f(x)»
 * и формулы разбиваются на отдельные слова и не трогаются; чисто латинские слова остаются.
 */

/** Латинские буквы, похожие на кириллические (и как их обычно «имела в виду» модель). */
const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: "а", c: "с", e: "е", o: "о", p: "р", x: "х", y: "у", k: "к", m: "м", t: "т", h: "н", b: "ь",
  A: "А", B: "В", C: "С", E: "Е", H: "Н", K: "К", M: "М", O: "О", P: "Р", T: "Т", X: "Х", Y: "У",
};

const CYRILLIC_RE = /\p{Script=Cyrillic}/u;
const LATIN_RE = /\p{Script=Latin}/u;
const WORD_RE = /\p{L}+/gu;

function isMixedScript(word: string): boolean {
  return CYRILLIC_RE.test(word) && LATIN_RE.test(word);
}

export type SanitizedTitle = {
  title: string;
  /** В каком-то слове остались и кириллица, и латиница (латинская буква без пары, напр. «f»). */
  stillMixed: boolean;
};

/** Заменяет латинские «двойники» в словах, где есть кириллица. */
export function fixMixedScriptWords(text: string): SanitizedTitle {
  let stillMixed = false;
  const title = text.replace(WORD_RE, (word) => {
    if (!isMixedScript(word)) return word;
    const fixed = word.replace(/[A-Za-z]/g, (ch) => LATIN_TO_CYRILLIC[ch] ?? ch);
    if (isMixedScript(fixed)) stillMixed = true;
    return fixed;
  });
  return { title, stillMixed };
}

/**
 * Название от модели: исправляем двойники; если смесь осталась — название ненадёжно,
 * возвращаем null (вызывающий берёт запасное название из первого сообщения).
 */
export function sanitizeAiChatTitle(title: string): string | null {
  const { title: fixed, stillMixed } = fixMixedScriptWords(title);
  return stillMixed ? null : fixed;
}

/** Запасное название (текст ученика): только исправляем двойники, ничего не выбрасываем. */
export function sanitizeFallbackChatTitle(title: string): string {
  return fixMixedScriptWords(title).title;
}
