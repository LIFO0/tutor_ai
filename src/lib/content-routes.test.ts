import { describe, expect, it } from "vitest";
import { isUnknownContentSlug } from "./content-routes";
import { getBlogPostSlugs } from "@/data/blog/posts";
import { getMath5LessonSlugs } from "@/data/math-5/lessons";

describe("isUnknownContentSlug", () => {
  it("passes known slugs", () => {
    expect(isUnknownContentSlug(`/blog/${getBlogPostSlugs()[0]}`)).toBe(false);
    expect(isUnknownContentSlug(`/matematika-5-klass/${getMath5LessonSlugs()[0]}`)).toBe(false);
  });

  it("flags unknown slugs", () => {
    expect(isUnknownContentSlug("/blog/x")).toBe(true);
    expect(isUnknownContentSlug("/matematika-6-klass/x")).toBe(true);
    expect(isUnknownContentSlug("/blog/%E0%A4%A")).toBe(true);
  });

  it("ignores other paths and section indexes", () => {
    expect(isUnknownContentSlug("/blog")).toBe(false);
    expect(isUnknownContentSlug("/blog/")).toBe(false);
    expect(isUnknownContentSlug("/blog/a/b")).toBe(false);
    expect(isUnknownContentSlug("/chat/1")).toBe(false);
    expect(isUnknownContentSlug("/")).toBe(false);
  });
});
