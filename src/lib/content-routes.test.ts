import { describe, expect, it } from "vitest";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { NOT_FOUND_REWRITE_PATH, contentNotFoundRewrites } from "./content-routes";
import { getBlogPostSlugs } from "@/data/blog/posts";
import { getMath5LessonSlugs } from "@/data/math-5/lessons";
import { getMath6LessonSlugs } from "@/data/math-6/lessons";

// Те же опции, что Next использует для custom routes (rewrites) в routes-manifest.
const matchers = contentNotFoundRewrites().map((r) => {
  expect(r.destination).toBe(NOT_FOUND_REWRITE_PATH);
  return getPathMatch(r.source, { strict: true, removeUnnamedParams: true });
});

function rewritten(pathname: string): boolean {
  return matchers.some((m) => m(pathname) !== false);
}

describe("contentNotFoundRewrites", () => {
  it("covers all three sections", () => {
    expect(contentNotFoundRewrites().map((r) => r.source.split(":")[0])).toEqual([
      "/blog/",
      "/matematika-5-klass/",
      "/matematika-6-klass/",
    ]);
  });

  it("does not touch any known slug", () => {
    for (const slug of getBlogPostSlugs()) expect(rewritten(`/blog/${slug}`)).toBe(false);
    for (const slug of getMath5LessonSlugs()) expect(rewritten(`/matematika-5-klass/${slug}`)).toBe(false);
    for (const slug of getMath6LessonSlugs()) expect(rewritten(`/matematika-6-klass/${slug}`)).toBe(false);
  });

  it("rewrites unknown slugs, including prefixes/suffixes of known ones", () => {
    const known = getBlogPostSlugs()[0];
    expect(rewritten("/blog/x")).toBe(true);
    expect(rewritten("/blog/abc")).toBe(true);
    expect(rewritten("/matematika-5-klass/xxx")).toBe(true);
    expect(rewritten("/matematika-6-klass/x")).toBe(true);
    expect(rewritten(`/blog/${known}x`)).toBe(true);
    expect(rewritten(`/blog/x${known}`)).toBe(true);
    expect(rewritten(`/blog/${known.slice(0, -1)}`)).toBe(true);
  });

  it("ignores section indexes, deeper paths and other routes", () => {
    expect(rewritten("/blog")).toBe(false);
    expect(rewritten("/blog/")).toBe(false);
    expect(rewritten("/blog/a/b")).toBe(false);
    expect(rewritten("/matematika-5-klass")).toBe(false);
    expect(rewritten("/chat/1")).toBe(false);
    expect(rewritten("/")).toBe(false);
  });
});
