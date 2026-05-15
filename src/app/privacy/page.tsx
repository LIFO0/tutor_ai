import type { Metadata } from "next";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";

export const metadata: Metadata = {
  title: "Политика конфиденциальности | Мишка знает",
  description:
    "Политика конфиденциальности сервиса «Мишка знает»: обработка персональных данных школьников, cookies, YandexGPT и права пользователей.",
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
