"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-20 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <span className="text-sm font-medium text-primary">✦ Для 5–11 класса</span>
            </div>

            <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              <span className="text-balance">Учись с ИИ</span>
              <br />
              <span className="text-primary">репетитором</span>
              <br />
              <span className="text-balance">в любое время</span>
            </h1>

            <p className="mb-8 max-w-lg text-lg text-muted-foreground sm:text-xl">
              Персональный репетитор для{" "}
              <strong className="text-foreground">5–11 класса</strong>. Объясняет сложные
              темы простым языком, шаг за шагом.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-14 rounded-full px-8 text-base">
                <Link href="/login">
                  Начать учиться
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-14 rounded-full px-6 text-base text-muted-foreground hover:text-foreground"
              >
                <a href="#how-it-works">
                  Как это работает
                  <ArrowDown className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-2 px-6 pb-4 pt-6">
                <Image
                  src="/landing/bear_main_update.png"
                  alt="Мишка"
                  width={112}
                  height={112}
                  className="h-24 w-24 object-contain sm:h-28 sm:w-28"
                  priority
                />
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  Объяснение смешанных дробей
                </h3>
              </div>

              <div className="min-h-[300px] space-y-4 px-6 pb-6">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.9 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/10 px-4 py-3">
                    <p className="text-sm text-foreground">
                      Объясни мне тему смешанные дроби
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 2.6 }}
                  className="flex"
                >
                  <div className="max-w-[85%] rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                    <p className="text-sm leading-relaxed text-foreground">
                      Конечно, с удовольствием объясню!
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      <strong>Смешанная дробь</strong> — это число, которое состоит из
                      целой части и правильной дроби.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      Например, 2⅓ — это смешанная дробь, где 2 — целое число, а ⅓ —
                      правильная дробь.
                    </p>
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      Давай разберём пошагово?
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                  <input
                    type="text"
                    placeholder="С чего начнём?"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    disabled
                  />
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary"
                  >
                    Σ
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                  >
                    <ArrowUp className="h-4 w-4 text-primary-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
