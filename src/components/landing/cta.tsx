"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-primary pb-0 pt-12 sm:pt-10 lg:pt-12">
      <div className="absolute inset-0 -z-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-6 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="mb-5 text-balance text-2xl font-bold leading-tight text-primary-foreground sm:mb-4 sm:text-4xl lg:mb-5 lg:text-5xl">
            Начни учиться прямо сейчас
          </h2>
          <p
            lang="ru"
            className="mx-auto mb-7 max-w-full text-pretty text-[0.9375rem] leading-snug text-primary-foreground/90 sm:mb-6 sm:max-w-2xl sm:text-lg sm:leading-relaxed lg:mb-7 lg:max-w-3xl"
          >
            Присоединяйся к тысячам учеников,{"\u200b"}которые уже улучшили свои оценки с Мишкой.
          </p>

          <Button
            asChild
            size="lg"
            className="mx-auto h-14 w-full max-w-sm rounded-full bg-white px-8 text-base !text-[#9a4b0f] hover:bg-white/90 sm:w-auto"
          >
            <Link href="/login">
              Попробовать бесплатно
              <ArrowRight className="ml-2" size={18} />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Медведь: нижняя половина за краем блока, верхняя (голова) — в оранжевой зоне */}
      <div
        className="relative z-[1] mt-4 h-[min(68vw,240px)] w-full overflow-hidden sm:mt-0 sm:h-[min(46vw,300px)] lg:h-[320px]"
        aria-hidden
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-[38%] justify-center sm:translate-y-[34%] lg:translate-y-[38%]">
          <Image
            src="/bears/bear_welcoming_update.png"
            alt=""
            width={720}
            height={960}
            className="h-auto w-[min(88vw,420px)] max-w-[calc(100vw-2rem)] translate-x-[0.5%] select-none object-contain sm:w-[min(72vw,480px)] md:w-[min(56vw,520px)]"
            sizes="(max-width: 640px) 88vw, (max-width: 1024px) 72vw, 520px"
          />
        </div>
      </div>
    </section>
  );
}
