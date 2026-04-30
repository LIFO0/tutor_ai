export type Subject = "math" | "physics" | "russian";

export const SUBJECTS: Array<{
  key: Subject;
  title: string;
  description: string;
}> = [
  {
    key: "math",
    title: "Математика",
    description: "Дроби, уравнения, функции, геометрия и многое другое.",
  },
  {
    key: "physics",
    title: "Физика",
    description: "Механика, электричество, оптика — с понятными примерами.",
  },
  {
    key: "russian",
    title: "Русский язык",
    description: "Орфография и пунктуация — без стресса и спешки.",
  },
];

