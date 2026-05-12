"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const faqs = [
  {
    question: "Для каких классов подходит Мишка?",
    answer:
      "Мишка идеально подходит для учеников 5-11 классов. Он адаптирует объяснения под уровень знаний ребёнка и программу соответствующего класса.",
  },
  {
    question: "Нужно ли скачивать приложение?",
    answer:
      "Нет, Мишка работает прямо в браузере — на компьютере, планшете или телефоне. Никакого скачивания, просто заходи на сайт и начинай учиться.",
  },
  {
    question: "Что если Мишка ошибётся?",
    answer:
      "Мишка — это ИИ, и он может иногда ошибаться. Поэтому мы рекомендуем перепроверять важные ответы. Если заметишь ошибку — напиши об этом, и Мишка исправится!",
  },
  {
    question: "Какие предметы доступны?",
    answer:
      "Математика, физика, химия, русский язык, биология, история, обществознание, литература и другие школьные предметы. Мы постоянно расширяем список.",
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  };

  return (
    <section className="bg-muted/30 py-20 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            Вопросы и ответы
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Частые <span className="text-primary">вопросы</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openItems.includes(index);

            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleItem(index)}
                  className="flex w-full cursor-pointer items-center justify-between p-6 text-left"
                >
                  <span className="pr-4 font-medium text-foreground">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="text-xl text-primary"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0">
                        <p className="leading-relaxed text-muted-foreground">{faq.answer}</p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
