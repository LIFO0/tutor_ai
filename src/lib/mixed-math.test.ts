import { describe, expect, test } from "vitest";
import { parseMixedLatex, serializeSegments } from "@/lib/mixed-math";

describe("mixed-math", () => {
  test("roundtrip with plain text", () => {
    const s = "hello";
    expect(serializeSegments(parseMixedLatex(s))).toBe(s);
  });

  test("parses inline math", () => {
    const s = "a $x^2$ b";
    const segs = parseMixedLatex(s);
    expect(segs).toEqual([
      { type: "text", text: "a " },
      { type: "math", latex: "x^2", display: "$" },
      { type: "text", text: " b" },
    ]);
    expect(serializeSegments(segs)).toBe(s);
  });

  test("parses display math", () => {
    const s = "a $$x^2$$ b";
    const segs = parseMixedLatex(s);
    expect(segs).toEqual([
      { type: "text", text: "a " },
      { type: "math", latex: "x^2", display: "$$" },
      { type: "text", text: " b" },
    ]);
    expect(serializeSegments(segs)).toBe(s);
  });

  test("unclosed delimiter is kept as text", () => {
    const s = "a $x^2 b";
    expect(serializeSegments(parseMixedLatex(s))).toBe(s);
  });

  test("mixes multiple segments", () => {
    const s = "A $x$ and $$y$$ end";
    expect(serializeSegments(parseMixedLatex(s))).toBe(s);
  });
});

