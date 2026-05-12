"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 lg:py-32">
      <div className="absolute inset-0 -z-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="mb-6 block text-6xl">🐻</span>
          <h2 className="mb-6 text-balance text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
            Начни учиться прямо сейчас
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
            Присоединяйся к тысячам учеников, которые уже улучшили свои оценки с Мишкой.
            Первые вопросы — бесплатно!
          </p>

          <Button
            asChild
            size="lg"
            className="h-14 rounded-full bg-white px-8 text-base !text-[#9a4b0f] hover:bg-white/90"
          >
            <Link href="/login">
              Попробовать бесплатно
              <ArrowRight className="ml-2" size={18} />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
