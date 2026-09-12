import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/landing/header";
import Footer from "@/components/landing/footer";
import { blogPosts, getSeriesPosts } from "@/data/blog/posts";
import { EGE_INFORMATIKA_2026_SERIES } from "@/data/blog/ege-informatika-2026";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Блог — советы по учёбе для школьников",
  description:
    "Статьи об учёбе для школьников 5–11 класса и конспекты всех 27 заданий ЕГЭ по информатике 2026: методы решения и шаблоны на Python.",
  keywords: [
    "учёба школьники советы",
    "как подготовиться к ОГЭ",
    "как сдать ЕГЭ",
    "ЕГЭ информатика 2026",
    "объяснить математику",
  ],
  alternates: { canonical: `${SITE_ORIGIN}/blog` },
  openGraph: {
    title: "Блог — советы по учёбе для школьников",
    description:
      "Статьи об учёбе для школьников 5–11 класса от ИИ-репетитора «Мишка знает».",
    url: `${SITE_ORIGIN}/blog`,
    siteName: SITE_NAME,
    locale: "ru_RU",
    type: "website",
  },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: `Блог — ${SITE_NAME}`,
  url: `${SITE_ORIGIN}/blog`,
  description:
    "Статьи об учёбе для школьников 5–11 класса: советы по математике, физике, русскому языку и подготовке к экзаменам.",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_ORIGIN,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: SITE_ORIGIN },
    { "@type": "ListItem", position: 2, name: "Блог", item: `${SITE_ORIGIN}/blog` },
  ],
};

export default function BlogPage() {
  const egePosts = getSeriesPosts(EGE_INFORMATIKA_2026_SERIES);
  const otherPosts = blogPosts
    .filter((post) => post.series !== EGE_INFORMATIKA_2026_SERIES)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="landing-light-theme min-h-screen bg-background text-foreground">
        <Header />

        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <header className="mb-12">
            <nav aria-label="Хлебные крошки" className="mb-4">
              <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-foreground">
                    {SITE_NAME}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-foreground">Блог</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Блог</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Советы по учёбе, разборы сложных тем и подготовка к экзаменам
            </p>
          </header>

          <section id="ege-informatika-2026" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              ЕГЭ по информатике 2026: разбор 27 заданий
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Конспекты по демоверсии и спецификации ФИПИ на 2026 год. В работе 27 заданий
              и 235 минут, максимум 29 первичных баллов: задания 1–25 по одному, 26 и 27
              по два. Файлы к заданиям 3, 9, 18 и 22 приходят в формате .ods, задание 10 —
              в .odt, задания 17, 24, 26 и 27 — в .txt. В задании 12 новый сюжет —
              исполнитель МТ. Где уместно, в конспекте есть шаблон на Python.
            </p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2">
              {egePosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {post.seriesOrder}
                    </span>
                    <span>
                      <span className="block font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                        {post.seriesLabel
                          ? post.seriesLabel.charAt(0).toUpperCase() + post.seriesLabel.slice(1)
                          : post.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {post.readingTime} мин чтения
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <h2 className="mb-8 text-2xl font-bold text-foreground">Другие статьи</h2>
          <ul className="grid gap-8 md:grid-cols-2">
            {otherPosts.map((post) => {
              const date = new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              return (
                <li key={post.slug}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex h-full flex-col p-7"
                      aria-label={post.title}
                    >
                      <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                        <time dateTime={post.publishedAt}>{date}</time>
                        <span aria-hidden>·</span>
                        <span>{post.readingTime} мин чтения</span>
                      </div>
                      <h2 className="mb-3 text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {post.title}
                      </h2>
                      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                        {post.description}
                      </p>
                      <span className="mt-5 text-sm font-medium text-primary">
                        Читать статью →
                      </span>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>

        <Footer />
      </main>
    </>
  );
}
