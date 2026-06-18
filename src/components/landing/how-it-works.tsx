"use client";

import Image from "next/image";

const steps = [
  {
    title: "Выбери предмет",
    description: "Математика, физика, русский язык — выбирай тему, которая нужна прямо сейчас.",
    icon: "/landing/book_icon.png",
    iconAlt: "Выбор предмета для занятия",
  },
  {
    title: "Задай вопрос",
    description: "Спроси что угодно так, как спросил бы у репетитора. Мишка всё поймёт.",
    icon: "/landing/conversation.png",
    iconAlt: "Чат с репетитором",
  },
  {
    title: "Получи объяснение по шагам",
    description: "Мишка разберёт тему пошагово, просто и понятно. Можно переспрашивать!",
    icon: "/landing/star.png",
    iconAlt: "Пошаговое объяснение темы",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            Как это работает
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Начни учиться за <span className="text-primary">3 простых шага</span>
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="relative h-full rounded-2xl border border-border bg-card p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Image src={step.icon} alt={step.iconAlt} width={36} height={36} className="h-9 w-9 object-contain" />
                </div>
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
