"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/landing/av_main.png"
              alt="Мишка знает"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              priority
            />
            <span className="font-display text-xl font-semibold text-foreground">
              Мишка знает
            </span>
          </Link>

          <div className="hidden md:block">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/login">Попробовать бесплатно</Link>
            </Button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 transition-colors hover:bg-muted md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {isMenuOpen ? (
          <div className="border-t border-border/50 py-4 md:hidden">
            <Button asChild className="w-full rounded-full">
              <Link href="/login">Попробовать бесплатно</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
