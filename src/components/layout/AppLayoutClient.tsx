"use client";

import type { CurrentUser } from "@/lib/current-user";
import { AccountProfileMenu } from "./AccountProfileMenu";
import { Sidebar } from "./Sidebar";
import { UserAvatar } from "@/components/ui/UserAvatar";

function MobileSettingsBar({ user }: { user: CurrentUser }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Мишка знает
        </div>
        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">ИИ-репетитор</div>
      </div>
      <AccountProfileMenu user={user} placement="bottom">
        <span className="flex min-w-0 max-w-[55%] cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900">
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
  return (
    <div className="flex h-dvh min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <MobileSettingsBar user={user} />
      <Sidebar user={user} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-black">
        <div className="mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col overflow-y-auto px-4 pt-6 pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
