import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/landing/header";
import Footer from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { SITE_ORIGIN, SITE_NAME } from "@/lib/seo";

export type SubjectFaqItem = {
  question: string;
  answer: string;
};

export type SubjectFeature = {
  title: string;
  description: string;
};

export type SubjectPageProps = {
  /** Canonical URL path, e.g. "/repetitor-po-matematike" */
  path: string;
  /** H1 heading */
  h1: string;
  /** Lead paragraph under H1 */
  lead: string;
  /** Icon emoji shown in hero */
  icon: string;
  /** Colour accent (Tailwind class, e.g. "text-primary") */
  accentColor?: string;
  /** Section: what Mishka teaches */
  topicsTitle: string;
  topics: string[];
  /** Section: how the service helps */
  features: SubjectFeature[];
  /** FAQ specific to this subject */
  faqs: SubjectFaqItem[];
  /** Related subject links shown at bottom */
  relatedLinks: { label: string; href: string }[];
  /** JSON-LD passed by the page */
  jsonLd?: Record<string, unknown>;
  /** Optional extra content block above FAQ */
  extraContent?: ReactNode;
};

function SubjectFAQ({ faqs }: { faqs: SubjectFaqItem[] }) {
  return (
    <section className="bg-muted/30 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
          Частые вопросы
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group overflow-hidden rounded-xl border border-border bg-card"
            >
              <summary className="flex cursor-pointer items-center justify-between p-5 font-medium text-foreground">
                {faq.question}
                <span className="ml-4 shrink-0 text-xl text-primary transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 pt-0 leading-relaxed text-muted-foreground">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function SubjectPageTemplate({
  path,
  h1,
  lead,
  icon,
  topicsTitle,
  topics,
  features,
  faqs,
  relatedLinks,
  jsonLd,
  extraContent,
}: SubjectPageProps) {
  const canonicalUrl = `${SITE_ORIGIN}${path}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_ORIGIN },
      { "@type": "ListItem", position: 2, name: h1, item: canonicalUrl },
    ],
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="landing-light-theme min-h-screen bg-background text-foreground">
        <Header />

        {/* Hero */}
        <section className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
          <div className="absolute inset-0 -z-10">
            <div className="absolute right-0 top-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 text-5xl">{icon}</div>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              {h1}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {lead}
            </p>
            <nav aria-label="Хлебные крошки" className="mb-8">
              <ol className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-foreground">
                    {SITE_NAME}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-foreground">{h1}</li>
              </ol>
            </nav>
            <Button asChild size="lg" className="h-14 rounded-full px-10 text-base">
              <Link href="/login">
                Начать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Topics */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
              {topicsTitle}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <li
                  key={topic}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm font-medium text-foreground"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/30 py-16 lg:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
              Как Мишка помогает учиться
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-7"
                >
                  <h3 className="mb-3 text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {extraContent}

        {/* FAQ */}
        <SubjectFAQ faqs={faqs} />

        {/* Related links */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Также в Мишке знает
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-16 text-center lg:py-20">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl">
              Начни учиться прямо сейчас
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/90">
              Бесплатный ИИ-репетитор доступен 24/7. Без скачивания — прямо в браузере.
            </p>
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full bg-white px-10 text-base !text-[#9a4b0f] hover:bg-white/90"
            >
              <Link href="/login">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
