"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  text: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Дмитрий Тихобаев",
    role: "Ученик 9 класса",
    avatar: "Д",
    text: "Мишка объясняет последовательно, без воды, и сразу даёт рабочие инструменты. За пару часов получил чёткий план действий вместо каши в голове. Очень удобно, что можно переспрашивать сколько угодно - не боишься выглядеть глупо. Рекомендую.",
  },
  {
    name: "София Пасконная",
    role: "Ученица 8 класса",
    avatar: "С",
    text: "Шикарный ИИ-репетитор, объясняет всё простым языком, не ругает и не осуждает учеников. Если же ты ошибаешься, то он объясняет, в чём дело, и предлагает попробовать снова и снова. Старается сделать процесс обучения интересным и веселым.",
  },
  {
    name: "Елизавета Щербакова",
    role: "Ученица 10 класса",
    avatar: "Е",
    text: "Отличный сервис: даже самые сложные правила объясняет на пальцах, с юмором и без занудства. Мишка классный, всем советую. Очень круто, что можно не просто почитать теорию, но и сразу закрепить её на практике.",
  },
  {
    name: "Зайцева Полина",
    role: "Ученица 10 класса",
    avatar: "З",
    text: "Я учусь в химбио профиле, поэтому всё время уходит на химию и биологию, а вот с математикой и физикой были проблемы. «Мишка знает» стал для меня идеальным спасением, потому что он объясняет сложные формулы простыми словами.",
  },
];

const DESKTOP_MAX_INDEX = Math.max(0, testimonials.length - 2);

const navButtonClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-background/35 bg-background/20 text-background shadow-lg backdrop-blur-sm transition-colors hover:border-background/50 hover:bg-background/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c1810] disabled:pointer-events-none disabled:opacity-0";

const scrollContainerClass =
  "flex gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6";

function TestimonialCard({
  testimonial,
  className,
  slideRef,
}: {
  testimonial: Testimonial;
  className: string;
  slideRef?: (node: HTMLElement | null) => void;
}) {
  return (
    <article ref={slideRef} className={className}>
      <p className="mb-5 flex-1 text-pretty text-[0.9375rem] leading-snug text-foreground sm:text-base sm:leading-relaxed md:mb-6 md:text-lg">
        &quot;{testimonial.text}&quot;
      </p>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 md:h-12 md:w-12">
          <span className="text-base font-semibold text-primary md:text-lg">
            {testimonial.avatar}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </article>
  );
}

function getClosestSlideIndex(container: HTMLElement, slides: Array<HTMLElement | null>) {
  const scrollLeft = container.scrollLeft;
  let closestIndex = 0;
  let minDistance = Infinity;

  slides.forEach((slide, index) => {
    if (!slide) return;
    const distance = Math.abs(slide.offsetLeft - scrollLeft);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);

  const scrollToSlide = useCallback((index: number) => {
    slideRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    setActiveIndex(getClosestSlideIndex(container, slideRefs.current));
  }, []);

  const handlePrev = useCallback(() => {
    const nextIndex = activeIndex - 1;
    if (nextIndex < 0) return;
    scrollToSlide(nextIndex);
    setActiveIndex(nextIndex);
  }, [activeIndex, scrollToSlide]);

  const handleNext = useCallback(() => {
    const nextIndex = activeIndex + 1;
    if (nextIndex > DESKTOP_MAX_INDEX) return;
    scrollToSlide(nextIndex);
    setActiveIndex(nextIndex);
  }, [activeIndex, scrollToSlide]);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < DESKTOP_MAX_INDEX;

  return (
    <section className="bg-[#2c1810] py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            Отзывы
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold text-background sm:text-4xl lg:text-5xl">
            Что говорят <span className="text-primary">ученики</span>
          </h2>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`${navButtonClass} hidden md:flex`}
              aria-label="Предыдущий отзыв"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.5} aria-hidden />
            </button>

            <div
              ref={scrollRef}
              className={`${scrollContainerClass} min-w-0 flex-1 snap-x snap-mandatory`}
              role="region"
              aria-label="Отзывы учеников"
              onScroll={handleScroll}
            >
              {testimonials.map((testimonial, slideIndex) => (
                <TestimonialCard
                  key={testimonial.name}
                  testimonial={testimonial}
                  slideRef={(node) => {
                    slideRefs.current[slideIndex] = node;
                  }}
                  className="flex w-[88%] shrink-0 snap-center flex-col rounded-2xl bg-background p-5 sm:p-6 md:w-[calc(50%-12px)] md:snap-start md:p-8"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className={`${navButtonClass} hidden md:flex`}
              aria-label="Следующий отзыв"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          <div
            className="mt-5 flex justify-center gap-2 md:hidden"
            aria-label="Навигация по отзывам"
          >
            {testimonials.map((testimonial, dotIndex) => (
              <button
                key={testimonial.name}
                type="button"
                aria-label={`Отзыв ${dotIndex + 1}`}
                aria-current={dotIndex === activeIndex ? "true" : undefined}
                onClick={() => {
                  scrollToSlide(dotIndex);
                  setActiveIndex(dotIndex);
                }}
                className={[
                  "h-2 rounded-full transition-all duration-300",
                  dotIndex === activeIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-background/35 hover:bg-background/50",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
