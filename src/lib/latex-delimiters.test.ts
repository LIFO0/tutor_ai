import { describe, expect, it } from "vitest";
import { normalizeLatexDelimiters } from "./latex-delimiters";

describe("normalizeLatexDelimiters", () => {
  it("leaves plain text unchanged", () => {
    expect(normalizeLatexDelimiters("Привет, мир.")).toBe("Привет, мир.");
  });

  it("converts inline \\(...\\) to $...$", () => {
    expect(normalizeLatexDelimiters("Значит, \\( k = 12 \\) бит.")).toBe(
      "Значит, $ k = 12 $ бит.",
    );
  });

  it("converts display \\[...\\] to $$...$$", () => {
    expect(normalizeLatexDelimiters("Формула: \\[ 2^k \\geq 4088 \\] конец.")).toBe(
      "Формула: $$ 2^k \\geq 4088 $$ конец.",
    );
  });

  it("handles multiline display blocks", () => {
    const input = "Блок:\n\\[\n\\frac{a}{b}\n\\]\nконец.";
    const expected = "Блок:\n$$\n\\frac{a}{b}\n$$\nконец.";
    expect(normalizeLatexDelimiters(input)).toBe(expected);
  });

  it("leaves existing $ inline math unchanged", () => {
    const input = "Вероятность $P = \\frac{1}{2}$ равна половине.";
    expect(normalizeLatexDelimiters(input)).toBe(input);
  });

  it("leaves existing $$ display math unchanged", () => {
    const input = "Блок:\n\n$$x^2 + 1$$\n\nконец.";
    expect(normalizeLatexDelimiters(input)).toBe(input);
  });

  it("leaves unmatched trailing \\[ intact for streaming guard", () => {
    const input = "Начало \\[\\frac{a}{";
    expect(normalizeLatexDelimiters(input)).toBe(input);
  });

  it("leaves unmatched trailing \\( intact for streaming guard", () => {
    const input = "Текст \\(P(1 \\text{ белый}) = \\frac{5 \\times ";
    expect(normalizeLatexDelimiters(input)).toBe(input);
  });

  it("converts multiple inline and display segments in one message", () => {
    const input =
      "Используем: \\[ 2^k \\geq 4088 \\] где \\( k = \\lceil \\log_2(4088) \\rceil \\).";
    const expected =
      "Используем: $$ 2^k \\geq 4088 $$ где $ k = \\lceil \\log_2(4088) \\rceil $.";
    expect(normalizeLatexDelimiters(input)).toBe(expected);
  });
});
