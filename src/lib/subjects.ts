import type { LucideIcon } from "lucide-react";
import { Atom, BookMarked, Sigma } from "lucide-react";

export type Subject = "math" | "physics" | "russian";

export const SUBJECTS: Array<{
  key: Subject;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "math",
    title: "Математика",
    description: "Дроби, уравнения, функции, геометрия и многое другое.",
    icon: Sigma,
  },
  {
    key: "physics",
    title: "Физика",
    description: "Механика, электричество, оптика — с понятными примерами.",
    icon: Atom,
  },
  {
    key: "russian",
    title: "Русский язык",
    description: "Орфография и пунктуация — без стресса и спешки.",
    icon: BookMarked,
  },
];
