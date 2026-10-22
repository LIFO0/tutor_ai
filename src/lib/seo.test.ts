import { describe, expect, it } from "vitest";
import { SITE_ORIGIN, absoluteUrl, pageSeo } from "./seo";

describe("absoluteUrl", () => {
  it("uses the bare origin for the homepage (same form as sitemap.xml)", () => {
    expect(absoluteUrl("/")).toBe(SITE_ORIGIN);
    expect(absoluteUrl("")).toBe(SITE_ORIGIN);
  });
  it("appends paths", () => {
    expect(absoluteUrl("/help")).toBe(`${SITE_ORIGIN}/help`);
    expect(absoluteUrl("pricing")).toBe(`${SITE_ORIGIN}/pricing`);
  });
});

describe("pageSeo", () => {
  it("sets canonical and og:url to the page itself", () => {
    const m = pageSeo({ path: "/privacy", title: "Политика", description: "d" });
    expect(m.alternates.canonical).toBe(`${SITE_ORIGIN}/privacy`);
    expect(m.openGraph.url).toBe(`${SITE_ORIGIN}/privacy`);
    expect(m.openGraph.title).toBe("Политика — Мишка знает");
  });
});
