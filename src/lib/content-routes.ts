import { getBlogPostSlugs } from "../data/blog/posts";
import { getMath5LessonSlugs } from "../data/math-5/lessons";
import { getMath6LessonSlugs } from "../data/math-6/lessons";

// Модуль грузится из next.config.ts, а его загрузчик не понимает алиас "@/": здесь и в
// src/data/{blog/posts,math-5/lessons,math-6/lessons} значения импортируются относительными путями
// (import type можно оставить с "@/"). Иначе `next build` падает на загрузке конфига.

/**
 * Статические разделы с [slug]: список известных slug для каждого префикса.
 *
 * Зачем: в Next 16 вызов notFound() из страницы отдаёт пустой HTML-шелл (без h1 и lang),
 * а not-found UI появляется только после гидрации (vercel/next.js#62228, #99793).
 * Поэтому неизвестный slug заранее переписывается на несуществующий путь, и Next рендерит
 * корневой not-found.tsx на сервере, с кодом 404. notFound() в страницах остаётся страховкой.
 *
 * Переписывание делается в next.config (rewrites.beforeFiles), а не в proxy/middleware:
 * rewrite из middleware Next 16 считает внешним, если origin не совпал с внутренним URL
 * сервера. За nginx (`X-Forwarded-Proto: https`) и с `next start -H 127.0.0.1` они не
 * совпадают (NextURL меняет 127.0.0.1 на localhost), и Next проксировал запрос сам в себя
 * по https на http-порт → 500. Rewrites из конфига всегда внутренние.
 */
const CONTENT_SECTIONS: Array<{ prefix: string; slugs: () => string[] }> = [
  { prefix: "/blog/", slugs: getBlogPostSlugs },
  { prefix: "/matematika-5-klass/", slugs: getMath5LessonSlugs },
  { prefix: "/matematika-6-klass/", slugs: getMath6LessonSlugs },
];

/** Путь, которого нет среди маршрутов: рендерится корневой not-found.tsx со статусом 404. */
export const NOT_FOUND_REWRITE_PATH = "/__not-found";

/** Slug, которые можно безопасно вставить в регулярку path-to-regexp без экранирования. */
const SAFE_SLUG = /^[a-z0-9-]+$/;

/**
 * Правила для next.config rewrites.beforeFiles: /<раздел>/<неизвестный slug> → NOT_FOUND_REWRITE_PATH.
 * Совпадает с isUnknownContentSlug для одиночного сегмента (известные slug проходят мимо).
 */
export function contentNotFoundRewrites(): Array<{ source: string; destination: string }> {
  return CONTENT_SECTIONS.map(({ prefix, slugs }) => {
    const list = slugs();
    for (const slug of list) {
      if (!SAFE_SLUG.test(slug)) throw new Error(`content-routes: unsafe slug "${slug}" in ${prefix}`);
    }
    // path-to-regexp запрещает шаблон, начинающийся с "(?", поэтому отрицательный lookbehind
    // в конце сегмента: сегмент целиком не равен ни одному известному slug.
    const known = list.length ? `(?<!${prefix}(?:${list.join("|")}))` : "";
    return {
      source: `${prefix}:slug([^/]+${known})`,
      destination: NOT_FOUND_REWRITE_PATH,
    };
  });
}
