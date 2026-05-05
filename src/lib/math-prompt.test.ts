import { describe, expect, test } from "vitest";
import { normalizeMathMessageForModel } from "@/lib/math-prompt";

describe("normalizeMathMessageForModel", () => {
  test("no dollars: returns input as-is", () => {
    expect(normalizeMathMessageForModel("hello")).toBe("hello");
  });

  test("strips MathLive placeholders inside inline math", () => {
    const s = "Solve $\\log_{\\placeholder[base]{}}\\placeholder[arg]{}$ please";
    expect(normalizeMathMessageForModel(s)).toBe("Solve $\\log_{}{}$ please");
  });

  test("strips MathLive placeholders inside display math", () => {
    const s = "Eq: $$\\frac{\\placeholder[num]{}}{\\placeholder[den]{}}$$ end";
    expect(normalizeMathMessageForModel(s)).toBe("Eq: $$\\frac{}{}$$ end");
  });

  test("does not touch text outside math blocks", () => {
    const s = "\\placeholder[outside] should stay, but $\\placeholder[in]{}$ should not";
    expect(normalizeMathMessageForModel(s)).toBe("\\placeholder[outside] should stay, but ${}$ should not");
  });
});

