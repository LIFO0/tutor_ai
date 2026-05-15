"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <div className="min-w-0 max-w-md space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/avatars/av_main.png"
                alt="Мишка знает"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-zinc-200/80"
              />
              <span className="font-display text-xl font-semibold text-foreground">
                Мишка знает
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Умный ИИ-репетитор для школьников 5–11 классов. Объясним любую тему просто и
              понятно.
            </p>
          </div>

          <nav
            className="flex shrink-0 flex-col gap-1 sm:max-w-xs sm:self-start lg:max-w-none lg:items-end"
            aria-label="Дополнительно"
          >
            <button
              type="button"
              className="rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:text-right"
            >
              Помощь
            </button>
            <button
              type="button"
              className="rounded-xl px-3 py-2.5 text-left text-sm leading-snug text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:text-right"
            >
              Политика конфиденциальности
            </button>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-right">
          <p className="text-sm text-muted-foreground">
            © 2026 Мишка знает. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
