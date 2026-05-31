import type { Metadata } from "next";
import CTA from "@/components/landing/cta";
import FAQ from "@/components/landing/faq";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import { SubjectsMarquee } from "@/components/landing/subjects-marquee";
import Testimonials from "@/components/landing/testimonials";
import { getHomePageJsonLd } from "@/lib/json-ld";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_ORIGIN } from "@/lib/seo";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: SITE_ORIGIN },
};

export default function Home() {
  const jsonLd = getHomePageJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="landing-light-theme min-h-screen bg-background text-foreground">
        <Header />
        <Hero />
        <SubjectsMarquee />
        <HowItWorks />
        <Features />
        <Testimonials />
        <FAQ />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
