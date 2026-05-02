"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Subject } from "@/lib/subjects";
import { SUBJECTS } from "@/lib/subjects";

type ChatSessionRow = {
  id: number;
  subject: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string | null;
};

function subjectLabel(subject: string) {
  const found = SUBJECTS.find((s) => s.key === (subject as Subject));
  return found?.title ?? subject;
}

function parseSqliteDate(value: string | null | undefined) {
  if (!value) return null;
  // SQLite CURRENT_TIMESTAMP => "YYYY-MM-DD HH:MM:SS"
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
  const [subjectFilter, setSubjectFilter] = useState<Subject | "all">("all");
  const [newChatOpen, setNewChatOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base =
      subjectFilter === "all"
        ? sessions
        : sessions.filter((s) => String(s.subject) === subjectFilter);
    if (!query) return base;
    return base.filter((s) => {
      const title = (s.title || "New chat").toLowerCase();
      const subj = subjectLabel(String(s.subject)).toLowerCase();
      return title.includes(query) || subj.includes(query) || String(s.id).includes(query);
    });
  }, [q, sessions, subjectFilter]);

  return (
    <aside className="w-full md:w-[420px] md:shrink-0 md:border-r md:border-zinc-200 md:bg-white md:dark:border-zinc-800 md:dark:bg-zinc-950">
      <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-6 pb-4 pt-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="flex items-center justify-between gap-4">
          <div className="text-2xl font-semibold tracking-tight">Чаты</div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setNewChatOpen((v) => !v)}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              + Новый чат
            </button>
            {newChatOpen ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setNewChatOpen(false);
                      router.push(`/chat?subject=${s.key}`);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <span>{s.title}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {s.key}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              🔎
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по чатам..."
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span>Мои чаты</span>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value as Subject | "all")}
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <option value="all">Все</option>
            {SUBJECTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-h-[calc(100vh-3rem-180px)] overflow-y-auto px-6">
        {filtered.length === 0 ? (
          <div className="py-6 text-sm text-zinc-500 dark:text-zinc-400">
            Ничего не найдено.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filtered.map((s) => {
              const active =
                typeof activeSessionId === "number"
                  ? s.id === activeSessionId
                  : pathname === `/chat/${s.id}`;

              const last = parseSqliteDate(s.lastMessageAt) ?? parseSqliteDate(s.createdAt);
              const lastText = last ? relativeTime(last) : "—";

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => router.push(`/chat/${s.id}`)}
                  className={[
                    "w-full py-5 text-left",
                    active ? "opacity-100" : "opacity-95 hover:opacity-100",
                  ].join(" ")}
                >
                  <div className="text-[15px] font-medium text-zinc-900 dark:text-zinc-50">
                    {s.title || "Новый чат"}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Последнее сообщение {lastText}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

