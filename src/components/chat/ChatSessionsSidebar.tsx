"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Subject } from "@/lib/subjects";
import { CHAT_SUBJECTS } from "@/lib/subjects";
import { ConfirmDeleteChatModal } from "./ConfirmDeleteChatModal";

type ChatSessionRow = {
  id: number;
  subject: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string | null;
};

function subjectLabel(subject: string) {
  const found = CHAT_SUBJECTS.find((s) => s.key === (subject as Subject));
  return found?.title ?? subject;
}

function parseSqliteDate(value: string | null | undefined) {
  if (!value) return null;
  const isoLike = value.includes("T") ? value : value.replace(" ", "T");
  const withZone = /z$/i.test(isoLike) ? isoLike : `${isoLike}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d;
}

function relativeTime(from: Date, to = new Date()) {
  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

export function ChatSessionsSidebar({
  sessions,
  activeSessionId,
}: {
  sessions: ChatSessionRow[];
  activeSessionId?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const newChatWrapRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!newChatOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (newChatWrapRef.current?.contains(e.target as Node)) return;
      setNewChatOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [newChatOpen]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((s) => {
      const title = (s.title || "New chat").toLowerCase();
      const subj = subjectLabel(String(s.subject)).toLowerCase();
      return title.includes(query) || subj.includes(query) || String(s.id).includes(query);
    });
  }, [q, sessions]);

  function requestDelete(sessionId: number) {
    if (deleting) return;
    setPendingDeleteId(sessionId);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (deleting) return;
    const sessionId = pendingDeleteId;
    if (typeof sessionId !== "number") return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Не удалось удалить чат.");
        return;
      }
      const isActive =
        (typeof activeSessionId === "number" && activeSessionId === sessionId) ||
        pathname === `/chat/${sessionId}`;
      setDeleteModalOpen(false);
      setPendingDeleteId(null);
      if (isActive) router.push("/chat");
      if (pathname?.startsWith("/chat")) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <aside className="w-full">
      <ConfirmDeleteChatModal
        isOpen={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open && !deleting) setPendingDeleteId(null);
        }}
        onConfirm={confirmDelete}
        isLoading={deleting}
      />
      <div className="sticky top-0 z-20 px-1 pb-1 pt-0 sm:px-0">
        <div className="flex items-center justify-between gap-3 pb-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Чаты
          </h1>
          <div ref={newChatWrapRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setNewChatOpen((v) => !v)}
              className="inline-flex h-9 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm hover:border-[color:var(--accent)]/35 hover:bg-zinc-50/90 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-[color:var(--accent)]/28 dark:hover:bg-zinc-800/80 sm:h-10 sm:px-4"
            >
              Новый чат
            </button>
            {newChatOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-xl">
                {CHAT_SUBJECTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setNewChatOpen(false);
                      router.push(`/chat?subject=${s.key}`);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
                  >
                    <span>{s.title}</span>
                    <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                      {s.key}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400 sm:left-4"
            strokeWidth={2}
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск чатов"
            className="h-11 w-full min-w-0 rounded-2xl border-0 bg-zinc-100/90 pl-10 pr-4 text-[15px] text-zinc-900 shadow-inner outline-none ring-1 ring-zinc-200/80 placeholder:text-zinc-500 focus:bg-white focus:ring-2 focus:ring-zinc-300/90 focus:ring-offset-0 dark:bg-zinc-900/50 dark:text-zinc-50 dark:ring-zinc-700/80 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-950 dark:focus:ring-zinc-600/80 sm:h-12 sm:rounded-2xl sm:pl-11 sm:text-base"
          />
        </div>
      </div>

      <div className="max-h-[calc(100vh-3rem-200px)] overflow-y-auto px-1 pb-8 pt-2 sm:px-0">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Ничего не найдено
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.map((s) => {
              const active =
                typeof activeSessionId === "number"
                  ? s.id === activeSessionId
                  : pathname === `/chat/${s.id}`;

              const last = parseSqliteDate(s.lastMessageAt) ?? parseSqliteDate(s.createdAt);
              const lastText = last ? relativeTime(last) : "—";
              const subj = subjectLabel(String(s.subject));

              return (
                <li key={s.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => router.push(`/chat/${s.id}`)}
                    className={[
                      "w-full rounded-2xl border py-3.5 pl-3 pr-11 text-left shadow-sm shadow-transparent ring-1 ring-inset ring-transparent",
                      "transition-[border-color,box-shadow,background-color,ring-color] duration-200 ease-out sm:py-4 sm:pl-3.5",
                      active
                        ? "border-zinc-200/80 bg-zinc-100/95 dark:border-zinc-600/45 dark:bg-zinc-800/55 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:hover:border-zinc-500/55"
                        : [
                            "border-transparent bg-transparent",
                            "hover:border-zinc-300/90 hover:bg-zinc-50/90",
                            "hover:shadow-[0_2px_14px_-6px_rgba(0,0,0,0.07)]",
                            "hover:ring-[color:var(--accent)]/22",
                            "dark:hover:border-zinc-500/65 dark:hover:bg-zinc-900/50",
                            "dark:hover:shadow-[0_2px_18px_-8px_rgba(0,0,0,0.38)]",
                            "dark:hover:ring-[color:var(--accent)]/18",
                          ].join(" "),
                    ].join(" ")}
                  >
                    <div className="truncate text-[15px] font-medium text-zinc-900 dark:text-zinc-50">
                      {s.title || "Новый чат"}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {subj}
                      <span className="text-zinc-300 dark:text-zinc-600"> · </span>
                      {lastText}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="Удалить чат"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      requestDelete(s.id);
                    }}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200/80 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-700/70 dark:hover:text-zinc-200 sm:right-2 sm:h-9 sm:w-9"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
