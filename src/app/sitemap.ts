import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";

const DEFAULT_ORIGIN = "https://mishkaznaet.ru";

function getSiteOrigin(): string {
  return getAppOrigin() ?? DEFAULT_ORIGIN;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const lastModified = new Date();

  return [
    {
      url: `${origin}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${origin}/help`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${origin}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
