import { getBlogPostSlugs } from "@/data/blog/posts";
import { getMath5LessonSlugs } from "@/data/math-5/lessons";
import { getMath6LessonSlugs } from "@/data/math-6/lessons";

/**
 * Статические разделы с [slug]: список известных slug для каждого префикса.
 *
 * Зачем: в Next 16 вызов notFound() из страницы отдаёт пустой HTML-шелл (без h1 и lang),
 * а not-found UI появляется только после гидрации (vercel/next.js#62228, #99793).
 * Proxy заранее отправляет неизвестный slug на несуществующий путь, и Next рендерит корневой
 * not-found.tsx на сервере, с кодом 404. notFound() в страницах остаётся страховкой.
 */
const CONTENT_SECTIONS: Array<{ prefix: string; slugs: () => string[] }> = [
  { prefix: "/blog/", slugs: getBlogPostSlugs },
  { prefix: "/matematika-5-klass/", slugs: getMath5LessonSlugs },
  { prefix: "/matematika-6-klass/", slugs: getMath6LessonSlugs },
];

let cache: Array<{ prefix: string; slugs: Set<string> }> | null = null;

function sections() {
  cache ??= CONTENT_SECTIONS.map((s) => ({ prefix: s.prefix, slugs: new Set(s.slugs()) }));
  return cache;
}

/** true, если путь вида /<раздел>/<slug> и такого slug нет. */
export function isUnknownContentSlug(pathname: string): boolean {
  for (const { prefix, slugs } of sections()) {
    if (!pathname.startsWith(prefix)) continue;
    const rest = pathname.slice(prefix.length).replace(/\/$/, "");
    if (!rest || rest.includes("/")) return false;
    let slug: string;
    try {
      slug = decodeURIComponent(rest);
    } catch {
      return true;
    }
    return !slugs.has(slug);
  }
  return false;
}

/** Путь, которого нет среди маршрутов: рендерится корневой not-found.tsx со статусом 404. */
export const NOT_FOUND_REWRITE_PATH = "/__not-found";
