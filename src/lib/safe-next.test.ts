import { describe, expect, it } from "vitest";
import { loginPathWithNext, sanitizeNextPath } from "./safe-next";

describe("sanitizeNextPath", () => {
  it("accepts same-site relative paths with query and hash", () => {
    expect(sanitizeNextPath("/support")).toBe("/support");
    expect(sanitizeNextPath("/admin/feedback")).toBe("/admin/feedback");
    expect(sanitizeNextPath("/chat/12?m=34")).toBe("/chat/12?m=34");
    expect(sanitizeNextPath("/help#faq")).toBe("/help#faq");
    expect(sanitizeNextPath("/")).toBe("/");
  });

  it("normalizes dot segments but stays on site", () => {
    expect(sanitizeNextPath("/a/../support")).toBe("/support");
    expect(sanitizeNextPath("/%2e%2e/support")).toBe("/support");
  });

  it("rejects protocol-relative and backslash tricks", () => {
    for (const bad of [
      "//evil.example",
      "//evil.example/path",
      "/\\evil.example",
      "/\\/evil.example",
      "\\\\evil.example",
      "/foo\\bar",
      "///evil.example",
    ]) {
      expect(sanitizeNextPath(bad), bad).toBeNull();
    }
  });

  it("rejects absolute URLs and schemes", () => {
    for (const bad of [
      "https://evil.example",
      "http://mishkaznaet.ru/chat",
      "javascript:alert(1)",
      "data:text/html,hi",
      "evil.example",
      "chat",
      " /chat",
    ]) {
      expect(sanitizeNextPath(bad), bad).toBeNull();
    }
  });

  it("rejects control characters and whitespace that browsers strip", () => {
    expect(sanitizeNextPath("/\t/evil.example")).toBeNull();
    expect(sanitizeNextPath("/\n/evil.example")).toBeNull();
    expect(sanitizeNextPath("/\r/evil.example")).toBeNull();
    expect(sanitizeNextPath("/ok path")).toBeNull();
    expect(sanitizeNextPath("/\u0000x")).toBeNull();
  });

  it("rejects non-strings, empty and overly long values", () => {
    expect(sanitizeNextPath(undefined)).toBeNull();
    expect(sanitizeNextPath(null)).toBeNull();
    expect(sanitizeNextPath(["/chat"])).toBeNull();
    expect(sanitizeNextPath("")).toBeNull();
    expect(sanitizeNextPath(`/${"a".repeat(3000)}`)).toBeNull();
  });

  it("rejects auth pages and API routes (no redirect loops)", () => {
    expect(sanitizeNextPath("/login")).toBeNull();
    expect(sanitizeNextPath("/login?next=/chat")).toBeNull();
    expect(sanitizeNextPath("/register")).toBeNull();
    expect(sanitizeNextPath("/api/auth/logout")).toBeNull();
  });
});

describe("loginPathWithNext", () => {
  it("encodes a safe next", () => {
    expect(loginPathWithNext("/chat/1?m=2")).toBe("/login?next=%2Fchat%2F1%3Fm%3D2");
    expect(loginPathWithNext("/support", "/register")).toBe("/register?next=%2Fsupport");
  });
  it("drops an unsafe next", () => {
    expect(loginPathWithNext("//evil.example")).toBe("/login");
  });
});
