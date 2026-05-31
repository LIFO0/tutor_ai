import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";

const DEFAULT_ORIGIN = "https://mishkaznaet.ru";

function getSiteOrigin(): string {
  return getAppOrigin() ?? DEFAULT_ORIGIN;
}

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/chat",
        "/tasks",
        "/profile",
        "/settings",
        "/api/",
        "/uploads/",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
