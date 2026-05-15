"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { AccountProfileMenu } from "./AccountProfileMenu";
import { Sidebar } from "./Sidebar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { UserAvatar } from "@/components/ui/UserAvatar";

function MobileSettingsBar({
  user,
  onMenuOpen,
}: {
  user: CurrentUser;
  onMenuOpen: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
        <Image
          src="/avatars/av_main.png"
          alt="Мишка знает"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-zinc-200/80 dark:ring-zinc-700/80"
          sizes="36px"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Мишка знает
          </div>
          <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">ИИ-репетитор</div>
        </div>
      </div>
      <AccountProfileMenu user={user} placement="bottom">
        <span className="flex min-w-0 max-w-[45%] cursor-pointer items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 py-1.5 pl-1.5 pr-2.5 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 sm:max-w-[55%] sm:pr-3">
          <UserAvatar avatar={user.avatar} size="sm" />
          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {user.name}
          </span>
        </span>
      </AccountProfileMenu>
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
      <MobileSettingsBar user={user} onMenuOpen={() => setMobileNavOpen(true)} />
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
