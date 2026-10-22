import { describe, expect, it } from "vitest";
import { softBreaksToHardBreaks } from "./plain-text-breaks";

describe("softBreaksToHardBreaks", () => {
  it("turns single newlines between steps into hard breaks", () => {
    expect(softBreaksToHardBreaks("Шаг 1: a\nШаг 2: b\nОтвет: 3")).toBe(
      "Шаг 1: a  \nШаг 2: b  \nОтвет: 3",
    );
  });

  it("keeps paragraph breaks and normalizes CRLF", () => {
    expect(softBreaksToHardBreaks("Неверно.\n\nШаг 1: a\r\nШаг 2: b")).toBe(
      "Неверно.\n\nШаг 1: a  \nШаг 2: b",
    );
  });

  it("leaves single-line text unchanged", () => {
    expect(softBreaksToHardBreaks("Молодец! $\\frac{1}{2}$")).toBe("Молодец! $\\frac{1}{2}$");
  });
});
