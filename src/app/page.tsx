import CTA from "@/components/landing/cta";
import FAQ from "@/components/landing/faq";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import { SubjectsMarquee } from "@/components/landing/subjects-marquee";
import Testimonials from "@/components/landing/testimonials";

export default function Home() {
  return (
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
  );
}
