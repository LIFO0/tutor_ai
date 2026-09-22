export type CalloutVariant = "remember" | "example" | "mistake";

export type LessonBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | {
      type: "callout";
      variant: CalloutVariant;
      title?: string;
      text: string;
    }
  | { type: "figure"; id: string; caption?: string }
  | { type: "check"; question: string; answer: string }
  | { type: "link"; href: string; label: string; note?: string };

export type MathLesson = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  coverImage: string;
  coverAlt: string;
  cardTeaser: string;
  blocks: LessonBlock[];
};

/** @deprecated Use MathLesson — kept for existing math-5 imports */
export type Math5Lesson = MathLesson;
