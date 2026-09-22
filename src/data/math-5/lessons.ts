import type { Math5Lesson } from "@/data/math-5/types";
import { obyknovennyeDrobi } from "@/data/math-5/obyknovennye-drobi";
import { desyatichnyeDrobi } from "@/data/math-5/desyatichnye-drobi";
import { zadachiNaDvizhenie } from "@/data/math-5/zadachi-na-dvizhenie";
import { nodINok } from "@/data/math-5/nod-i-nok";
import { obyomIEdinicy } from "@/data/math-5/obyom-i-edinicy";

export const math5Lessons: Math5Lesson[] = [
  obyknovennyeDrobi,
  desyatichnyeDrobi,
  zadachiNaDvizhenie,
  nodINok,
  obyomIEdinicy,
];

export function getMath5Lesson(slug: string): Math5Lesson | undefined {
  return math5Lessons.find((l) => l.slug === slug);
}

export function getMath5LessonSlugs(): string[] {
  return math5Lessons.map((l) => l.slug);
}

export function getMath5Neighbors(slug: string): {
  prev?: Math5Lesson;
  next?: Math5Lesson;
} {
  const index = math5Lessons.findIndex((l) => l.slug === slug);
  if (index < 0) return {};
  return {
    prev: index > 0 ? math5Lessons[index - 1] : undefined,
    next: index < math5Lessons.length - 1 ? math5Lessons[index + 1] : undefined,
  };
}
