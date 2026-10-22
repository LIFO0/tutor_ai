import type { MathLesson } from "@/data/math-5/types";
import { otritsatelnyeChisla } from "./otritsatelnye-chisla";
import { raskrytieSkobok } from "./raskrytie-skobok";
import { lineynyeUravneniya } from "./lineynye-uravneniya";
import { proportsii } from "./proportsii";
import { protsentyCherezProportsii } from "./protsenty-cherez-proportsii";
import { koordinatnayaPloskost } from "./koordinatnaya-ploskost";

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
