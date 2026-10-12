import { describe, expect, test } from "vitest";
import { buildSnippet, escapeLikePattern, foldForSearch, normalizeSearchQuery } from "@/lib/chat-search-query";

describe("chat search query", () => {
  test("foldForSearch lowercases Cyrillic, ё→е, keeps length", () => {
    const s = "Ёжик ПРИВЕТ\nМир";
    expect(foldForSearch(s)).toBe("ежик привет мир");
    expect(foldForSearch(s).length).toBe(s.length);
    expect(foldForSearch("İ").length).toBe(1);
  });

  test("normalizeSearchQuery", () => {
    expect(normalizeSearchQuery("  Дроби   ПЛЮС ")).toBe("дроби плюс");
    expect(normalizeSearchQuery("а")).toBeNull();
    expect(normalizeSearchQuery("   ")).toBeNull();
    expect(normalizeSearchQuery(null)).toBeNull();
    expect(normalizeSearchQuery("x".repeat(500))!.length).toBe(100);
    // wildcards are literal (matched via instr, not LIKE)
    expect(normalizeSearchQuery("50%_")).toBe("50%_");
  });

  test("escapeLikePattern", () => {
    expect(escapeLikePattern("50%_a\\b")).toBe("50\\%\\_a\\\\b");
  });

  test("buildSnippet highlights case-insensitive matches", () => {
    const parts = buildSnippet("Реши уравнение: Х + 2 = 5, где х — число", "х")!;
    expect(parts.filter((p) => p.match).map((p) => p.text)).toEqual(["Х", "х"]);
    expect(buildSnippet("нет совпадений", "кот")).toBeNull();
    const long = "слово ".repeat(50) + "Цель" + " конец".repeat(50);
    const p2 = buildSnippet(long, "цель")!;
    expect(p2[0]!.text).toBe("…");
    expect(p2.at(-1)!.text).toBe("…");
    expect(p2.find((p) => p.match)!.text).toBe("Цель");
  });
});
