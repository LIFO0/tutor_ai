import type { Metadata } from "next";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import { HelpContent } from "@/components/help/help-content";
import { pageSeo } from "@/lib/seo";

const TITLE = "Помощь";
const DESCRIPTION =
  "Инструкция по сервису «Мишка знает»: чат, задания, формулы, настройки и FAQ.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageSeo({ path: "/help", title: TITLE, description: DESCRIPTION }),
};

export default function HelpPage() {
  return (
    <main className="landing-light-theme min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <HelpContent />
      </div>
      <Footer />
    </main>
  );
}
