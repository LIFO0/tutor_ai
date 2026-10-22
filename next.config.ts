import type { NextConfig } from "next";
import { contentNotFoundRewrites } from "./src/lib/content-routes";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://mc.yandex.com https://yastatic.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://avatars.yandex.net https://avatars.mds.yandex.net https://mc.yandex.ru https://mc.yandex.com",
      "connect-src 'self' https://mc.yandex.ru https://mc.yandex.com wss://mc.yandex.ru wss://mc.yandex.com",
      "font-src 'self'",
      "frame-src https://mc.yandex.ru https://mc.yandex.com https://kinescope.io https://*.kinescope.io",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Нативные Node-модули не бандлить для клиента (better-sqlite3 тянет `fs`)
  serverExternalPackages: ["better-sqlite3"],
  // Пользовательские загрузки не часть сборки (и могут быть симлинком наружу) — не трассировать.
  outputFileTracingExcludes: {
    "*": ["public/uploads/**/*"],
  },
  // Меньше модулей в dev/production за счёт точечных импортов из «толстых» пакетов
  experimental: {
    optimizePackageImports: [
      "@heroui/react",
      "lucide-react",
    ],
  },
  async redirects() {
    return [{ source: "/plus", destination: "/pricing", permanent: true }];
  },
  async rewrites() {
    // Неизвестный slug в /blog, /matematika-5-klass, /matematika-6-klass → серверный 404
    // (см. src/lib/content-routes.ts, почему не в middleware).
    return { beforeFiles: contentNotFoundRewrites(), afterFiles: [], fallback: [] };
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Accel-Buffering", value: "no" }],
      },
    ];
  },
};

export default nextConfig;
