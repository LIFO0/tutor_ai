import { describe, expect, test } from "vitest";
import { stripMathlivePlaceholdersForKatex } from "@/lib/mathlive-katex";

describe("stripMathlivePlaceholdersForKatex", () => {
  test("\\placeholder[id]{body}", () => {
    expect(stripMathlivePlaceholdersForKatex(String.raw`x+\placeholder[a]{3}`)).toBe(String.raw`x+3`);
  });

  test("\\placeholder[id][default]{body}", () => {
    expect(stripMathlivePlaceholdersForKatex(String.raw`x+\placeholder[a][7]{3}`)).toBe(String.raw`x+3`);
  });

  test("\\placeholder[id]body (simple atom)", () => {
    expect(stripMathlivePlaceholdersForKatex(String.raw`x+\placeholder[a]3`)).toBe(String.raw`x+3`);
  });
});

