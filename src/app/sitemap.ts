import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";
import { blogPosts } from "@/data/blog/posts";
import { math5Lessons } from "@/data/math-5/lessons";
import { math6Lessons } from "@/data/math-6/lessons";

const DEFAULT_ORIGIN = "https://mishkaznaet.ru";

function getSiteOrigin(): string {
  return getAppOrigin() ?? DEFAULT_ORIGIN;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${origin}/`,
      lastModified: new Date("2026-06-18"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${origin}/repetitor-po-matematike`,
      lastModified: new Date("2026-06-18"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${origin}/repetitor-po-fizike`,
      lastModified: new Date("2026-06-18"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${origin}/repetitor-po-russkomu-yazyku`,
      lastModified: new Date("2026-06-18"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${origin}/podgotovka-k-oge`,
      lastModified: new Date("2026-06-18"),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${origin}/podgotovka-k-ege`,
      lastModified: new Date("2026-06-18"),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${origin}/blog`,
      lastModified: new Date("2026-09-11"),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${origin}/matematika-5-klass`,
      lastModified: new Date("2026-09-22"),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${origin}/matematika-6-klass`,
      lastModified: new Date("2026-09-22"),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${origin}/help`,
      lastModified: new Date("2026-05-01"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${origin}/privacy`,
      lastModified: new Date("2026-04-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${origin}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const math5Pages: MetadataRoute.Sitemap = math5Lessons.map((lesson) => ({
    url: `${origin}/matematika-5-klass/${lesson.slug}`,
    lastModified: new Date(lesson.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const math6Pages: MetadataRoute.Sitemap = math6Lessons.map((lesson) => ({
    url: `${origin}/matematika-6-klass/${lesson.slug}`,
    lastModified: new Date(lesson.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...blogPages, ...math5Pages, ...math6Pages];
}
