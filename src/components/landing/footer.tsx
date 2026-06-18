"use client";

import Image from "next/image";
import Link from "next/link";

const subjectLinks = [
  { label: "Репетитор по математике", href: "/repetitor-po-matematike" },
  { label: "Репетитор по физике", href: "/repetitor-po-fizike" },
  { label: "Репетитор по русскому", href: "/repetitor-po-russkomu-yazyku" },
  { label: "Подготовка к ОГЭ", href: "/podgotovka-k-oge" },
  { label: "Подготовка к ЕГЭ", href: "/podgotovka-k-ege" },
];

const blogLinks = [
  { label: "Как объяснить дроби", href: "/blog/kak-obyasnit-rebenku-drobi" },
  { label: "Подготовка к ОГЭ по математике", href: "/blog/kak-podgotovitsya-k-oge-po-matematike" },
  { label: "Как учить физику", href: "/blog/kak-uchit-fiziku-shkolniku" },
  { label: "Ошибки в русском языке", href: "/blog/chastye-oshibki-v-russkom-yazyke" },
  { label: "Все статьи", href: "/blog" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="min-w-0 space-y-4 lg:col-span-1">
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
              Умный ИИ-репетитор для школьников 5–11 классов. Объясним любую тему просто и понятно.
            </p>
          </div>

          {/* Subjects */}
          <nav aria-label="Предметы" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Предметы
            </p>
            <ul className="space-y-2">
              {subjectLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Blog */}
          <nav aria-label="Блог" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Блог
            </p>
            <ul className="space-y-2">
              {blogLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Site */}
          <nav aria-label="Дополнительно" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Сервис
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Помощь
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground"
                >
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Войти
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center md:text-right">
          <p className="text-sm text-muted-foreground">
            © 2026 Мишка знает. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
