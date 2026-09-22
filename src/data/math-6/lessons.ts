import type { MathLesson } from "@/data/math-5/types";
import { otritsatelnyeChisla } from "@/data/math-6/otritsatelnye-chisla";
import { raskrytieSkobok } from "@/data/math-6/raskrytie-skobok";
import { lineynyeUravneniya } from "@/data/math-6/lineynye-uravneniya";
import { proportsii } from "@/data/math-6/proportsii";
import { protsentyCherezProportsii } from "@/data/math-6/protsenty-cherez-proportsii";
import { koordinatnayaPloskost } from "@/data/math-6/koordinatnaya-ploskost";

export const math6Lessons: MathLesson[] = [
  otritsatelnyeChisla,
  raskrytieSkobok,
  lineynyeUravneniya,
  proportsii,
  protsentyCherezProportsii,
  koordinatnayaPloskost,
];

export function getMath6Lesson(slug: string): MathLesson | undefined {
  return math6Lessons.find((l) => l.slug === slug);
}

export function getMath6LessonSlugs(): string[] {
  return math6Lessons.map((l) => l.slug);
}

export function getMath6Neighbors(slug: string): {
  prev?: MathLesson;
  next?: MathLesson;
} {
  const index = math6Lessons.findIndex((l) => l.slug === slug);
  if (index < 0) return {};
  return {
    prev: index > 0 ? math6Lessons[index - 1] : undefined,
    next: index < math6Lessons.length - 1 ? math6Lessons[index + 1] : undefined,
  };
}
