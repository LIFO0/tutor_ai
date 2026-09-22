"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@heroui/react";
import {
  Home,
  ListTodo,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import Image from "next/image";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AccountProfileMenu } from "./AccountProfileMenu";
import { ConfirmDeleteChatModal } from "@/components/chat/ConfirmDeleteChatModal";

const RECENTS_LIMIT = 8;
const ICON_STROKE = 1.75;

type ChatSessionRow = {
  id: number;
  subject: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string | null;
};

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/chat", label: "Чаты", icon: MessageCircle },
  { href: "/tasks", label: "Задания", icon: ListTodo },
];

export function SidebarPanel({
  user,
  onNavigate,
  showBrand = true,
  collapsed = false,
  onToggleCollapse,
}: {
  user: CurrentUser;
  onNavigate?: () => void;
  showBrand?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const showToggle = Boolean(onToggleCollapse);

  const [recentsOpen, setRecentsOpen] = useState(true);
  const [recents, setRecents] = useState<ChatSessionRow[]>([]);
  const [recentsLoading, setRecentsLoading] = useState(true);
  const recentsFetchInFlight = useRef(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRecents = useCallback(async () => {
    if (recentsFetchInFlight.current) return;
    recentsFetchInFlight.current = true;
    try {
      const res = await fetch("/api/chat/sessions");
      const data = (await res.json()) as { ok?: boolean; sessions?: ChatSessionRow[] };
      if (res.ok && data.ok && Array.isArray(data.sessions)) {
        setRecents(data.sessions.slice(0, RECENTS_LIMIT));
      } else {
        setRecents([]);
      }
    } catch {
      setRecents([]);
    } finally {
      recentsFetchInFlight.current = false;
      setRecentsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadRecents(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRecents]);

  useEffect(() => {
    const onFocus = () => void loadRecents();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadRecents]);

  useEffect(() => {
    const onSessionUpdated = () => void loadRecents();
    window.addEventListener("chat-session-updated", onSessionUpdated);
    return () => window.removeEventListener("chat-session-updated", onSessionUpdated);
  }, [loadRecents]);

  function go(href: string) {
    onNavigate?.();
    router.push(href);
  }

  function requestDelete(id: number) {
    if (deleting) return;
    setPendingDeleteId(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (deleting) return;
    const id = pendingDeleteId;
    if (typeof id !== "number") return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Не удалось удалить чат.");
        return;
      }
      setRecents((prev) => prev.filter((s) => s.id !== id));
      setDeleteModalOpen(false);
      setPendingDeleteId(null);
      if (pathname === `/chat/${id}`) go("/chat");
      else if (pathname?.startsWith("/chat")) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-zinc-950">
      <ConfirmDeleteChatModal
        isOpen={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open && !deleting) setPendingDeleteId(null);
        }}
        onConfirm={confirmDelete}
        isLoading={deleting}
      />

      {showBrand || showToggle ? (
        <div
          className={[
            "flex shrink-0 items-center gap-1",
            collapsed ? "flex-col px-2 py-3" : "px-2 py-3",
          ].join(" ")}
        >
          {showBrand ? (
            <Link
              href="/"
              title="Мишка знает"
              className={[
                "flex min-w-0 items-center gap-3 rounded-2xl transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900",
                collapsed ? "justify-center p-1.5" : "flex-1 px-2 py-1",
              ].join(" ")}
            >
              <Image
                src="/avatars/av_main.png"
                alt="Мишка знает"
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-zinc-200/80 dark:ring-zinc-700/80"
                sizes="36px"
              />
              {!collapsed ? (
                <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Мишка знает
                </span>
              ) : null}
            </Link>
          ) : null}

          {showToggle && onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
              title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" strokeWidth={ICON_STROKE} />
              ) : (
                <PanelLeftClose className="h-5 w-5" strokeWidth={ICON_STROKE} />
              )}
            </button>
          ) : null}
        </div>
      ) : null}

      <nav
        className={[
          "mt-1 flex flex-col gap-1 overflow-y-auto pb-2",
          collapsed ? "items-center px-2" : "px-3",
        ].join(" ")}
      >
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => go(item.href)}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center rounded-2xl text-sm transition-colors",
                collapsed ? "h-10 w-10 justify-center" : "w-full gap-3 px-3 py-2.5",
                active
                  ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-5 w-5 shrink-0",
                  active
                    ? "text-[color:var(--color-accent)]"
                    : "text-zinc-500 dark:text-zinc-400",
                ].join(" ")}
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      {!collapsed ? (
        <>
          <div className="mx-3 my-2 border-t border-zinc-200 dark:border-zinc-800" />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2">
            <button
              type="button"
              onClick={() => setRecentsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-2xl px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              <span>Последние чаты</span>
              <span
                className="text-zinc-400 transition-transform dark:text-zinc-500"
                style={{ transform: recentsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-hidden
              >
                ▼
              </span>
            </button>

            {recentsOpen ? (
              <div className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
                {recentsLoading ? (
                  <div className="px-2 py-2 text-xs text-zinc-400">Загрузка…</div>
                ) : recents.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-zinc-400">Нет чатов</div>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {recents.map((s) => {
                      const active = pathname === `/chat/${s.id}`;
                      return (
                        <li key={s.id} className="group relative">
                          <button
                            type="button"
                            onClick={() => go(`/chat/${s.id}`)}
                            className={[
                              "flex w-full min-w-0 items-center rounded-2xl py-2 pl-2 pr-9 text-left text-sm transition-colors",
                              active
                                ? "bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
                            ].join(" ")}
                          >
                            <span className="truncate">{s.title || "Новый чат"}</span>
                          </button>
                          <button
                            type="button"
                            aria-label="Удалить чат"
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(s.id);
                            }}
                            className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 opacity-100 transition-opacity hover:bg-zinc-200 hover:text-zinc-700 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            <span className="text-lg leading-none">×</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1" />
      )}

      <div className={["relative mt-auto pb-3", collapsed ? "px-2" : "px-3"].join(" ")}>
        {collapsed ? (
          <AccountProfileMenu user={user} placement="top" fullWidth>
            <span
              className="flex w-full items-center justify-center rounded-2xl p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title={user.name}
            >
              <UserAvatar avatar={user.avatar} size="md" />
            </span>
          </AccountProfileMenu>
        ) : (
          <Card className="overflow-hidden rounded-2xl p-0 shadow-sm">
            <AccountProfileMenu user={user} placement="top" fullWidth>
              <span className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/80">
                <UserAvatar avatar={user.avatar} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {user.grade} класс
                  </span>
                </span>
                <span className="text-zinc-400 dark:text-zinc-500" aria-hidden>
                  ···
                </span>
              </span>
            </AccountProfileMenu>
          </Card>
        )}
      </div>
    </div>
  );
}
