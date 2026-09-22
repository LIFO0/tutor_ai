import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonLayout } from "@/components/math-5/LessonLayout";
import {
  getMath5Lesson,
  getMath5LessonSlugs,
  getMath5Neighbors,
} from "@/data/math-5/lessons";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

export function generateStaticParams() {
  return getMath5LessonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getMath5Lesson(slug);
  if (!lesson) return {};

  const url = `${SITE_ORIGIN}/matematika-5-klass/${lesson.slug}`;
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

export default async function Math5LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getMath5Lesson(slug);
  if (!lesson) notFound();

  const { prev, next } = getMath5Neighbors(slug);

  return (
    <LessonLayout
      lesson={lesson}
      prev={prev}
      next={next}
      basePath="/matematika-5-klass"
      hubLabel="Математика 5 класс"
      gradeLabel="5 класс"
    />
  );
}
