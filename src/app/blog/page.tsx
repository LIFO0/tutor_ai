import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/landing/header";
import Footer from "@/components/landing/footer";
import { blogPosts } from "@/data/blog/posts";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Блог — советы по учёбе для школьников",
  description:
    "Статьи об учёбе для школьников 5–11 класса: как объяснить сложные темы, подготовиться к ОГЭ и ЕГЭ, понять физику и математику. Советы от «Мишка знает».",
  keywords: [
    "учёба школьники советы",
    "как подготовиться к ОГЭ",
    "как сдать ЕГЭ",
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
  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

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

          <ul className="grid gap-8 md:grid-cols-2">
            {sorted.map((post) => {
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
