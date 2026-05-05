"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleHelp, LogOut, Settings } from "lucide-react";
import { Popover } from "@heroui/react";
import { Button as AriaButton } from "react-aria-components/Button";
import type { CurrentUser } from "@/lib/current-user";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-zinc-800 outline-none transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/90 dark:focus-visible:bg-zinc-800/90";

export function AccountProfileMenu({
  user,
  placement,
  children,
}: {
  user: CurrentUser;
  placement: "top" | "bottom";
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
  }

  return (
    <Popover.Root>
      <AriaButton
        type="button"
        className="w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
      >
        {children}
      </AriaButton>
      <Popover.Content
        placement={placement}
        offset={8}
        className="w-[min(calc(100vw-2rem),256px)] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-0 shadow-xl shadow-zinc-900/8 outline-none ring-1 ring-zinc-900/5 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-black/40 dark:ring-white/10"
      >
        <Popover.Dialog className="!p-2 outline-none">
          <nav aria-label="Меню аккаунта" className="flex flex-col gap-1.5">
            <p className="truncate px-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">{user.email}</p>

            <div className="flex flex-col gap-1">
              <Link href="/settings" className={itemClass}>
                <Settings className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} aria-hidden />
                Настройки
              </Link>
              <Link href="/help" className={itemClass}>
                <CircleHelp className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} aria-hidden />
                Помощь
              </Link>
            </div>

            <div className="my-0.5 h-px shrink-0 bg-zinc-200/90 dark:bg-zinc-800" />

            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-red-600 outline-none transition-colors hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/35 dark:focus-visible:bg-red-950/35"
            >
              <LogOut className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Выйти
            </button>
          </nav>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
