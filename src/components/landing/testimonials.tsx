"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const GAP_PX = 24;

const testimonials = [
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

function useVisibleCount() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setVisibleCount(mq.matches ? 2 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return visibleCount;
}

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const visibleCount = useVisibleCount();
  const maxIndex = testimonials.length - visibleCount;

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const measure = () => {
      const style = getComputedStyle(node);
      const paddingX =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      setViewportWidth(node.clientWidth - paddingX);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const handleNext = useCallback(() => {
    setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const slideWidth =
    viewportWidth > 0
      ? visibleCount === 1
        ? viewportWidth
        : (viewportWidth - GAP_PX) / 2
      : 0;

  const trackTransform =
    slideWidth > 0 ? `translateX(-${index * (slideWidth + GAP_PX)}px)` : undefined;

  return (
    <section className="bg-[#2c1810] py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            Отзывы
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold text-background sm:text-4xl lg:text-5xl">
            Что говорят <span className="text-primary">ученики</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-4xl"
        >
          <div
            ref={viewportRef}
            className="w-full overflow-hidden pr-12 md:pr-14"
            role="region"
            aria-label="Отзывы учеников"
            aria-live="polite"
          >
            <div
              className="flex gap-6 transition-transform duration-300 ease-out"
              style={{ transform: trackTransform }}
            >
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="min-w-0 shrink-0 grow-0 rounded-2xl bg-background p-8"
                  style={slideWidth > 0 ? { width: slideWidth } : undefined}
                >
                  <p className="mb-6 text-pretty text-lg leading-relaxed text-foreground">
                    &quot;{testimonial.text}&quot;
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-semibold text-primary">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-background/20 bg-background/10 text-background transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c1810]"
            aria-label="Следующий отзыв"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
