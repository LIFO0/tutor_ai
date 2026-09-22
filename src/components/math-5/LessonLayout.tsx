import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/landing/header";
import Footer from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { LessonBody } from "@/components/math-5/LessonBody";
import type { MathLesson } from "@/data/math-5/types";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

function CoverImage({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const isSvg = src.endsWith(".svg");
  if (isSvg) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={640} height={360} className="h-auto w-full" />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={640}
      height={360}
      className="h-auto w-full"
      priority={priority}
    />
  );
}

export function LessonLayout({
  lesson,
  prev,
  next,
  basePath,
  hubLabel,
  gradeLabel,
}: {
  lesson: MathLesson;
  prev?: MathLesson;
  next?: MathLesson;
  basePath: string;
  hubLabel: string;
  gradeLabel: string;
}) {
  const path = `${basePath}/${lesson.slug}`;
  const publishedDate = new Date(lesson.publishedAt).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.h1,
    headline: lesson.title,
    description: lesson.description,
    datePublished: lesson.publishedAt,
    dateModified: lesson.updatedAt,
    inLanguage: "ru",
    educationalLevel: gradeLabel,
    learningResourceType: "Lesson",
    teaches: lesson.keywords.slice(0, 5),
    image: `${SITE_ORIGIN}${lesson.coverImage}`,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_ORIGIN}${path}` },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_ORIGIN },
      {
        "@type": "ListItem",
        position: 2,
        name: hubLabel,
        item: `${SITE_ORIGIN}${basePath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: lesson.h1,
        item: `${SITE_ORIGIN}${path}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="landing-light-theme min-h-screen bg-background text-foreground">
        <Header />
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <nav aria-label="Хлебные крошки" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  {SITE_NAME}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href={basePath} className="hover:text-foreground">
                  {hubLabel}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="truncate text-foreground">{lesson.h1}</li>
            </ol>
          </nav>

          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <time dateTime={lesson.publishedAt}>{publishedDate}</time>
              <span aria-hidden>·</span>
              <span>{lesson.readingTime} мин чтения</span>
              <span aria-hidden>·</span>
              <span>{gradeLabel}</span>
            </div>
            <h1 className="mb-6 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
              {lesson.h1}
            </h1>
            <div className="overflow-hidden rounded-2xl border border-border">
              <CoverImage src={lesson.coverImage} alt={lesson.coverAlt} priority />
            </div>
          </header>

          <LessonBody blocks={lesson.blocks} />

          {(prev || next) && (
            <nav aria-label="Соседние темы" className="mt-12 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`${basePath}/${prev.slug}`}
                  className="rounded-2xl border border-border p-4 transition-shadow hover:shadow-md"
                >
                  <span className="text-sm text-muted-foreground">Предыдущая тема</span>
                  <span className="mt-1 block font-medium text-foreground">{prev.h1}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`${basePath}/${next.slug}`}
                  className="rounded-2xl border border-border p-4 text-right transition-shadow hover:shadow-md sm:justify-self-stretch"
                >
                  <span className="text-sm text-muted-foreground">Следующая тема</span>
                  <span className="mt-1 block font-medium text-foreground">{next.h1}</span>
                </Link>
              ) : null}
            </nav>
          )}

          <div className="mt-12 rounded-2xl bg-primary/10 p-7 text-center">
            <p className="mb-4 text-lg font-semibold text-foreground">Не понял пример? Спроси Мишку</p>
            <p className="mb-6 text-muted-foreground">
              ИИ-репетитор разберёт твою задачу по шагам — бесплатно и без осуждения.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/login">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </article>
        <Footer />
      </main>
    </>
  );
}
