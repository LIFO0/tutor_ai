import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/landing/header";
import Footer from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { math6Lessons } from "@/data/math-6/lessons";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

const PATH = "/matematika-6-klass";
const TITLE = "Математика 6 класс — отрицательные числа, уравнения, пропорции";
const DESCRIPTION =
  "Бесплатные уроки математики для 6 класса: отрицательные числа, раскрытие скобок, линейные уравнения, пропорции, проценты и координатная плоскость. С формулами и схемами.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "математика 6 класс",
    "отрицательные числа 6 класс",
    "линейные уравнения 6 класс",
    "пропорции 6 класс",
    "координатная плоскость",
    "раскрытие скобок",
  ],
  alternates: { canonical: `${SITE_ORIGIN}${PATH}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}${PATH}`,
    siteName: SITE_NAME,
    locale: "ru_RU",
    type: "website",
  },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Математика 6 класс",
  description: DESCRIPTION,
  url: `${SITE_ORIGIN}${PATH}`,
  inLanguage: "ru",
  isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_ORIGIN },
  hasPart: math6Lessons.map((lesson) => ({
    "@type": "LearningResource",
    name: lesson.h1,
    url: `${SITE_ORIGIN}${PATH}/${lesson.slug}`,
    educationalLevel: "6 класс",
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: SITE_ORIGIN },
    {
      "@type": "ListItem",
      position: 2,
      name: "Математика 6 класс",
      item: `${SITE_ORIGIN}${PATH}`,
    },
  ],
};

export default function Matematika6KlassHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="landing-light-theme min-h-screen bg-background text-foreground">
        <Header />

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <nav aria-label="Хлебные крошки" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  {SITE_NAME}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground">Математика 6 класс</li>
            </ol>
          </nav>

          <header className="mb-12 max-w-3xl">
            <p className="mb-3 text-sm font-medium text-primary">Бесплатные уроки</p>
            <h1 className="mb-4 text-3xl font-bold leading-snug text-foreground sm:text-4xl lg:text-5xl">
              Математика 6 класс
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Темы, где чаще всего путаются в шестом: знаки, скобки, уравнения, пропорции и координаты.
              Схемы, алгоритмы в 3 шага и «где все ошибаются».
            </p>
          </header>

          <ul className="grid gap-6 sm:grid-cols-2">
            {math6Lessons.map((lesson, index) => (
              <li key={lesson.slug}>
                <Link
                  href={`${PATH}/${lesson.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lesson.coverImage}
                      alt={lesson.coverAlt}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
                      Тема {index + 1}
                    </p>
                    <h2 className="mb-2 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                      {lesson.h1}
                    </h2>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {lesson.cardTeaser}
                    </p>
                    <span className="inline-flex items-center text-sm font-medium text-primary">
                      Открыть урок
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 text-center text-sm text-muted-foreground">
            Также есть{" "}
            <Link href="/matematika-5-klass" className="font-medium text-primary hover:underline">
              математика 5 класса
            </Link>
            .
          </div>

          <div className="mt-10 rounded-2xl bg-primary/10 p-8 text-center">
            <p className="mb-3 text-lg font-semibold text-foreground">Нужна помощь с домашкой?</p>
            <p className="mb-6 text-muted-foreground">
              Мишка объяснит любую задачу 6 класса по шагам — бесплатно.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/login">
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
