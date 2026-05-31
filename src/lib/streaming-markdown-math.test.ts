import { describe, expect, it } from "vitest";
import { maskIncompleteMathForStreaming } from "./streaming-markdown-math";

describe("maskIncompleteMathForStreaming", () => {
  it("leaves plain text unchanged", () => {
    expect(maskIncompleteMathForStreaming("Привет, мир.")).toBe("Привет, мир.");
  });

  it("leaves closed inline math unchanged", () => {
    const input = "Вероятность $P = \\frac{1}{2}$ равна половине.";
    expect(maskIncompleteMathForStreaming(input)).toBe(input);
  });

  it("strips trailing unclosed inline math", () => {
    expect(
      maskIncompleteMathForStreaming("Текст $P(1 \\text{ белый}) = \\frac{5 \\times "),
    ).toBe("Текст ");
  });

  it("leaves closed display math unchanged", () => {
    const input = "Блок:\n\n$$x^2 + 1$$\n\nконец.";
    expect(maskIncompleteMathForStreaming(input)).toBe(input);
  });

  it("strips trailing unclosed display math", () => {
    expect(maskIncompleteMathForStreaming("Начало $$\\frac{a}{")).toBe("Начало ");
  });

  it("handles inline math after closed display block", () => {
    const closed = "$$x$$\n\nи $y$";
    expect(maskIncompleteMathForStreaming(closed)).toBe(closed);

    const openInline = "$$x$$\n\nи $y";
    expect(maskIncompleteMathForStreaming(openInline)).toBe("$$x$$\n\nи ");
  });
});
