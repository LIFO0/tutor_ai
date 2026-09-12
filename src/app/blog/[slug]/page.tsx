import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/landing/header";
import Footer from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { getBlogPost, getBlogPostSlugs, getRelatedPosts, getSeriesNeighbors } from "@/data/blog/posts";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

export function generateStaticParams() {
  return getBlogPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `${SITE_ORIGIN}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${SITE_ORIGIN}/blog/${post.slug}`,
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  };
}

function markdownToBlocks(md: string): { type: "h2" | "h3" | "p" | "li" | "code"; text: string }[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: { type: "h2" | "h3" | "p" | "li" | "code"; text: string }[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    if (raw.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: codeLines.join("\n").replace(/\s+$/, "") });
      continue;
    }

    const line = raw.trim();
    if (!line) {
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      blocks.push({ type: "li", text: line.slice(2) });
    } else {
      blocks.push({ type: "p", text: line });
    }
    i += 1;
  }
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.92em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function ArticleBody({ body }: { body: string }) {
  const blocks = markdownToBlocks(body);
  const rendered: React.ReactNode[] = [];
  let liBuffer: string[] = [];

  const flushList = () => {
    if (liBuffer.length) {
      rendered.push(
        <ul key={`ul-${rendered.length}`} className="my-4 space-y-2 pl-5">
          {liBuffer.map((item, i) => (
            <li key={i} className="list-disc leading-relaxed text-foreground">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      liBuffer = [];
    }
  };

  for (const block of blocks) {
    if (block.type === "li") {
      liBuffer.push(block.text);
      continue;
    }
    flushList();

    if (block.type === "h2") {
      rendered.push(
        <h2 key={`h2-${rendered.length}`} className="mb-3 mt-8 text-2xl font-bold text-foreground">
          {renderInline(block.text)}
        </h2>,
      );
    } else if (block.type === "h3") {
      rendered.push(
        <h3 key={`h3-${rendered.length}`} className="mb-2 mt-6 text-xl font-semibold text-foreground">
          {renderInline(block.text)}
        </h3>,
      );
    } else if (block.type === "code") {
      rendered.push(
        <pre
          key={`code-${rendered.length}`}
          className="my-4 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm leading-relaxed text-zinc-100"
        >
          <code className="font-mono">{block.text}</code>
        </pre>,
      );
    } else {
      rendered.push(
        <p key={`p-${rendered.length}`} className="leading-relaxed text-foreground">
          {renderInline(block.text)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="space-y-4">{rendered}</div>;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const others = getRelatedPosts(post, 3);
  const { prev, next } = getSeriesNeighbors(post);

  const publishedDate = new Date(post.publishedAt).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const postJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_ORIGIN}/blog/${post.slug}`,
    },
    image: `${SITE_ORIGIN}/opengraph-image.png`,
    inLanguage: "ru",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_ORIGIN },
      { "@type": "ListItem", position: 2, name: "Блог", item: `${SITE_ORIGIN}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_ORIGIN}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="landing-light-theme min-h-screen bg-background text-foreground">
        <Header />

        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          {/* Breadcrumbs */}
          <nav aria-label="Хлебные крошки" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  {SITE_NAME}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Блог
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="truncate text-foreground">{post.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <time dateTime={post.publishedAt}>{publishedDate}</time>
              <span aria-hidden>·</span>
              <span>{post.readingTime} мин чтения</span>
            </div>
            {post.seriesLabel && post.seriesOrder ? (
              <p className="mb-4 text-sm font-medium text-primary">
                ЕГЭ по информатике 2026 · задание {post.seriesOrder} из 27
              </p>
            ) : null}
            <h1 className="text-3xl font-bold leading-snug text-foreground sm:text-4xl">
              {post.h1}
            </h1>
          </header>

          {/* Body */}
          <div className="prose-custom">
            <ArticleBody body={post.body} />
          </div>

          {(prev || next) && (
            <nav aria-label="Соседние задания" className="mt-10 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`/blog/${prev.slug}`}
                  className="rounded-2xl border border-border p-4 transition-shadow hover:shadow-md"
                >
                  <span className="text-sm text-muted-foreground">Предыдущее задание</span>
                  <span className="mt-1 block font-medium text-foreground">
                    {prev.seriesOrder}.{" "}
                    {prev.seriesLabel
                      ? prev.seriesLabel.charAt(0).toUpperCase() + prev.seriesLabel.slice(1)
                      : prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/blog/${next.slug}`}
                  className="rounded-2xl border border-border p-4 text-right transition-shadow hover:shadow-md"
                >
                  <span className="text-sm text-muted-foreground">Следующее задание</span>
                  <span className="mt-1 block font-medium text-foreground">
                    {next.seriesOrder}.{" "}
                    {next.seriesLabel
                      ? next.seriesLabel.charAt(0).toUpperCase() + next.seriesLabel.slice(1)
                      : next.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-primary/10 p-7 text-center">
            <p className="mb-4 text-lg font-semibold text-foreground">
              Попробуйте объяснить с Мишкой
            </p>
            <p className="mb-6 text-muted-foreground">
              Бесплатный ИИ-репетитор объяснит любую тему так, как вам понятно — шаг за шагом.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/login">
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </article>

        {/* Related posts */}
        {others.length > 0 && (
          <section className="bg-muted/30 py-12 lg:py-16">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <h2 className="mb-8 text-xl font-bold text-foreground">Читайте также</h2>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/blog/${other.slug}`}
                      className="group block rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                    >
                      <p className="mb-2 text-sm text-muted-foreground">
                        {other.readingTime} мин чтения
                      </p>
                      <h3 className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {other.title}
                      </h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <Footer />
      </main>
    </>
  );
}
