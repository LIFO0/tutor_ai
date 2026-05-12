"use client";

import { motion } from "framer-motion";
import { Calculator, ClipboardCheck, History, MessageSquare } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Чат с объяснением",
    description:
      "Задавай вопросы как живому репетитору. Мишка объяснит тему простым языком, пошагово разберёт любую задачу.",
    color: "bg-primary/10 text-primary",
    cardClass: "border-border bg-card hover:border-primary/30",
  },
  {
    icon: ClipboardCheck,
    title: "Задания с проверкой",
    description:
      "Решай задачи и получай мгновенную проверку ответа. Мишка объяснит ошибки и поможет их исправить.",
    color: "bg-accent/15 text-accent",
    cardClass:
      "border-accent/20 bg-accent/10 hover:border-accent/50 hover:bg-accent/15 hover:shadow-[0_18px_45px_-28px_rgba(20,184,166,0.75)]",
  },
  {
    icon: Calculator,
    title: "Математическая клавиатура",
    description:
      "Встроенная клавиатура с математическими символами (Σ, ∫, √). Легко вводить дроби, степени и формулы.",
    color: "bg-primary/10 text-primary",
    cardClass: "border-border bg-card hover:border-primary/30",
  },
  {
    icon: History,
    title: "История чатов",
    description:
      "Все разговоры сохраняются. Можно вернуться к объяснению в любой момент и повторить материал.",
    color: "bg-accent/15 text-accent",
    cardClass:
      "border-accent/20 bg-accent/10 hover:border-accent/50 hover:bg-accent/15 hover:shadow-[0_18px_45px_-28px_rgba(20,184,166,0.75)]",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            Возможности
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Всё для удобной <span className="text-primary">учёбы</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Мишка — это не просто чат-бот, а полноценный помощник в учёбе
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`group relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-lg ${feature.cardClass}`}
            >
              <div
                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${feature.color}`}
              >
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
