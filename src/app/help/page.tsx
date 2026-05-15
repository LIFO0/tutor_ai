import type { Metadata } from "next";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import { HelpContent } from "@/components/help/help-content";

export const metadata: Metadata = {
  title: "Помощь | Мишка знает",
  description:
    "Инструкция по сервису «Мишка знает»: чат, задания, формулы, настройки и FAQ.",
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
