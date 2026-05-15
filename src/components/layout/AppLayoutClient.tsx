"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { Sidebar } from "./Sidebar";
import { MobileNavDrawer } from "./MobileNavDrawer";

function MobileSettingsBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      <Link
        href="/dashboard"
        className="flex min-w-0 items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <Image
          src="/avatars/av_main.png"
          alt="Мишка знает"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-zinc-200/80 dark:ring-zinc-700/80"
          sizes="36px"
        />
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Мишка знает
        </span>
      </Link>
    </header>
  );
}

export function AppLayoutClient({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-dvh min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <MobileSettingsBar onMenuOpen={() => setMobileNavOpen(true)} />
      <MobileNavDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen} user={user} />
      <Sidebar user={user} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-black">
        <div className="mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col overflow-y-auto px-4 pt-4 pb-0 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
