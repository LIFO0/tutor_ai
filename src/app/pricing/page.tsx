import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import { Button } from "@/components/ui/button";
import { pageSeo } from "@/lib/seo";
import { getPlanLimits } from "@/lib/usage-quota-config";
import type { QuotaLimits } from "@/lib/usage-types";

const TITLE = "Тарифы и Мишка Plus";
const DESCRIPTION =
  "Тарифы сервиса «Мишка знает»: бесплатный доступ и Мишка Plus с увеличенными дневными лимитами.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageSeo({ path: "/pricing", title: TITLE, description: DESCRIPTION }),
};

// Лимиты читаются из env (USAGE_FREE_* / USAGE_PLUS_*) во время запроса.
export const dynamic = "force-dynamic";

const ROWS: { key: keyof QuotaLimits; label: string }[] = [
  { key: "chatMessages", label: "Сообщений в чате в день" },
  { key: "chatImages", label: "Фото в чате в день" },
  { key: "chatSessions", label: "Новых чатов в день" },
  { key: "taskGenerate", label: "Генераций заданий в день" },
  { key: "taskCheck", label: "Проверок ответов в день" },
];

export default function PricingPage() {
  const free = getPlanLimits("free");
  const plus = getPlanLimits("plus");
  const plans = [
    { name: "Бесплатно", price: "0 ₽", limits: free, highlight: false },
    { name: "Мишка Plus", price: "Скоро", limits: plus, highlight: true },
  ];

  return (
    <main className="landing-light-theme min-h-screen bg-background text-foreground">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h1 className="mb-4 text-center text-3xl font-bold sm:text-4xl">Тарифы</h1>
        <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
          Начать можно бесплатно. Мишка Plus даёт больше сообщений и заданий в день — оформление
          подписки появится скоро.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <section
              key={plan.name}
              className={`rounded-3xl border bg-card p-6 sm:p-8 ${
                plan.highlight ? "border-primary shadow-lg" : "border-border"
              }`}
            >
              <h2 className="mb-1 text-2xl font-bold">{plan.name}</h2>
              <p className="mb-6 text-lg font-semibold text-primary">{plan.price}</p>
              <ul className="space-y-3">
                {ROWS.map((row) => (
                  <li key={row.key} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold">{plan.limits[row.key]}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/login">Попробовать бесплатно</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
