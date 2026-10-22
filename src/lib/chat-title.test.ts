import { describe, expect, it } from "vitest";
import { fixMixedScriptWords, sanitizeAiChatTitle, sanitizeFallbackChatTitle } from "./chat-title";

describe("sanitizeAiChatTitle", () => {
  it("drops a title with a Latin letter that has no Cyrillic twin (prod case)", () => {
    expect(sanitizeAiChatTitle("Праfила написания несмотря на дождь")).toBeNull();
  });

  it("replaces Latin homoglyphs inside Cyrillic words", () => {
    // «о» в «Сложение» и «р» в «дробей» — латинские
    expect(sanitizeAiChatTitle("Слoжение дpобей")).toBe("Сложение дробей");
    expect(sanitizeAiChatTitle("ЗAДАЧА НA ДВИЖЕНИЕ")).toBe("ЗАДАЧА НА ДВИЖЕНИЕ");
    expect(sanitizeAiChatTitle("Teорема Пифагора")).toBe("Теорема Пифагора");
  });

  it("leaves pure-Latin words, formulas and hyphenated mixes alone", () => {
    expect(sanitizeAiChatTitle("Циклы в Python")).toBe("Циклы в Python");
    expect(sanitizeAiChatTitle("Функция f(x) = x^2")).toBe("Функция f(x) = x^2");
    expect(sanitizeAiChatTitle("Python-код для ЕГЭ")).toBe("Python-код для ЕГЭ");
    expect(sanitizeAiChatTitle("Present Simple")).toBe("Present Simple");
    expect(sanitizeAiChatTitle("Теги HTML и CSS")).toBe("Теги HTML и CSS");
  });

  it("keeps clean Russian titles unchanged", () => {
    expect(sanitizeAiChatTitle("Правила написания не с глаголами")).toBe(
      "Правила написания не с глаголами",
    );
  });
});

describe("sanitizeFallbackChatTitle", () => {
  it("fixes homoglyphs but never drops the user's text", () => {
    expect(sanitizeFallbackChatTitle("Помогu с задачей")).toBe("Помогu с задачей");
    expect(sanitizeFallbackChatTitle("Пoмоги с задачей")).toBe("Помоги с задачей");
    expect(sanitizeFallbackChatTitle("Найди f(x) в Python и HTML")).toBe("Найди f(x) в Python и HTML");
  });
});

describe("fixMixedScriptWords", () => {
  it("reports words that stay mixed", () => {
    expect(fixMixedScriptWords("Праfила").stillMixed).toBe(true);
    expect(fixMixedScriptWords("Прaвила").stillMixed).toBe(false);
  });
});
