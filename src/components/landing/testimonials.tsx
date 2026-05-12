"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Дмитрий К.",
    role: "Ученик 9 класса",
    avatar: "Д",
    text: "Готовлюсь к ОГЭ с Мишкой. Объясняет лучше, чем в школе — можно переспрашивать сколько угодно раз. Наконец-то понял тригонометрию!",
  },
  {
    name: "Анна С.",
    role: "Ученица 7 класса",
    avatar: "А",
    text: "Мишка помог разобраться с физикой. Теперь не боюсь контрольных! Нравится, что объясняет простыми словами и приводит примеры из жизни.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-foreground py-20 lg:py-32">
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

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-background p-8"
            >
              <p className="mb-6 text-lg leading-relaxed text-foreground">
                &quot;{testimonial.text}&quot;
              </p>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-semibold text-primary">{testimonial.avatar}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
