import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonLayout } from "@/components/math-5/LessonLayout";
import {
  getMath6Lesson,
  getMath6LessonSlugs,
  getMath6Neighbors,
} from "@/data/math-6/lessons";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

export function generateStaticParams() {
  return getMath6LessonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getMath6Lesson(slug);
  if (!lesson) return {};

  const url = `${SITE_ORIGIN}/matematika-6-klass/${lesson.slug}`;
  return {
    title: lesson.title,
    description: lesson.description,
    keywords: lesson.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: lesson.title,
      description: lesson.description,
      url,
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: "article",
      publishedTime: lesson.publishedAt,
      modifiedTime: lesson.updatedAt,
      images: [{ url: `${SITE_ORIGIN}${lesson.coverImage}`, alt: lesson.coverAlt }],
    },
  };
}

export default async function Math6LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getMath6Lesson(slug);
  if (!lesson) notFound();

  const { prev, next } = getMath6Neighbors(slug);

  return (
    <LessonLayout
      lesson={lesson}
      prev={prev}
      next={next}
      basePath="/matematika-6-klass"
      hubLabel="Математика 6 класс"
      gradeLabel="6 класс"
    />
  );
}
