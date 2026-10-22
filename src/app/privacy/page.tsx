import type { Metadata } from "next";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";
import { pageSeo } from "@/lib/seo";

const TITLE = "Политика конфиденциальности";
const DESCRIPTION =
  "Политика конфиденциальности сервиса «Мишка знает»: обработка персональных данных школьников, изображения в чате, cookies, Google Gemini API и права пользователей.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageSeo({ path: "/privacy", title: TITLE, description: DESCRIPTION }),
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="landing-light-theme min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <PrivacyPolicyContent />
      </div>
      <Footer />
    </main>
  );
}
