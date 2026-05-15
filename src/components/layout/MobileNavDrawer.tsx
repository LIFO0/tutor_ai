"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { SidebarPanel } from "./SidebarPanel";

export function MobileNavDrawer({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: CurrentUser;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Меню навигации">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Закрыть меню"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute left-0 top-0 flex h-full w-[min(100vw-3rem,18rem)] flex-col border-r border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-3">
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
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <SidebarPanel user={user} onNavigate={() => onOpenChange(false)} showBrand={false} />
        </div>
      </div>
    </div>
  );
}
