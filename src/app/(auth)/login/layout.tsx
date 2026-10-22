import type { Metadata } from "next";
import { pageSeo } from "@/lib/seo";

const TITLE = "Вход";
const DESCRIPTION =
  "Войдите в «Мишка знает» по электронной почте или через Яндекс ID, чтобы продолжить занятия с ИИ-репетитором.";

// page.tsx — клиентский компонент, поэтому метаданные задаём здесь.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageSeo({ path: "/login", title: TITLE, description: DESCRIPTION }),
  // Служебная страница: не индексируем, но ссылки с неё учитываем; canonical остаётся своим.
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
