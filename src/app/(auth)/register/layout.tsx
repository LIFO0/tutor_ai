import type { Metadata } from "next";
import { pageSeo } from "@/lib/seo";

const TITLE = "Регистрация";
const DESCRIPTION =
  "Создайте бесплатный аккаунт в «Мишка знает» — ИИ-репетиторе для школьников 5–11 класса по математике, физике и русскому языку.";

// page.tsx — клиентский компонент, поэтому метаданные задаём здесь.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageSeo({ path: "/register", title: TITLE, description: DESCRIPTION }),
  // Служебная страница: не индексируем, но ссылки с неё учитываем; canonical остаётся своим.
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
