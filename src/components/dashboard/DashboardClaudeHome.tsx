"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat/ChatInput";
import { BearTotem, type BearTotemVariant } from "@/components/ui/BearTotem";
import { PENDING_CHAT_MESSAGE_KEY } from "@/lib/pending-chat-message";
import type { Subject } from "@/lib/subjects";
import { CHAT_SUBJECTS, DEFAULT_CHAT_SUBJECT } from "@/lib/subjects";

const TOTEM_INTRO_SESSION_KEY = "totem_dashboard_welcome_done";
const DASHBOARD_PLACEHOLDERS = [
  "С чего начнём?",
  "Чем могу помочь?",
  "О чём хочешь узнать?",
  "Что тебя интересует?",
  "О чём поговорим сегодня?",
] as const;

export function DashboardClaudeHome({ userName }: { userName: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject>(DEFAULT_CHAT_SUBJECT);
  const [bearVariant, setBearVariant] = useState<BearTotemVariant>("standard");
  const [submitting, setSubmitting] = useState(false);
  const [openHint, setOpenHint] = useState<string | null>(null);
  const [dashboardPlaceholder, setDashboardPlaceholder] = useState<(typeof DASHBOARD_PLACEHOLDERS)[number]>(
    DASHBOARD_PLACEHOLDERS[0],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(TOTEM_INTRO_SESSION_KEY)) {
      setBearVariant("standard");
      return;
    }
    setBearVariant("welcoming");
    const id = window.setTimeout(() => {
      setBearVariant("standard");
      sessionStorage.setItem(TOTEM_INTRO_SESSION_KEY, "1");
    }, 2200);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    setDashboardPlaceholder(
      DASHBOARD_PLACEHOLDERS[Math.floor(Math.random() * DASHBOARD_PLACEHOLDERS.length)],
    );
  }, []);

  async function handleSend(text: string) {
    const message = text.trim();
    if (!message || submitting) return;
    setSubmitting(true);
    setBearVariant("thinking");
    setOpenHint("Открываем чат…");
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; sessionId: number }
        | { ok: false; error?: string }
        | null;
      if (!res.ok || !data || data.ok !== true || typeof data.sessionId !== "number") {
        alert((data as { error?: string } | null)?.error || "Не удалось создать чат");
        return;
      }
      sessionStorage.setItem(PENDING_CHAT_MESSAGE_KEY, message);
      setOpenHint("Переходим в чат…");
      router.push(`/chat/${data.sessionId}`);
    } catch {
      alert("Не удалось создать чат");
    } finally {
      setSubmitting(false);
      setOpenHint(null);
      setBearVariant("standard");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8">
        <BearTotem variant={bearVariant} size="lg" priority className="mx-auto" />

        <div className="w-full text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Привет, {userName}!
          </h1>
        </div>

        <div className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-950/60">
          <ChatInput onSend={handleSend} disabled={submitting} placeholder={dashboardPlaceholder} />
          {openHint ? (
            <div className="mt-2 px-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
              {openHint}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap justify-center gap-2">
          {CHAT_SUBJECTS.map((s) => {
            const Icon = s.icon;
            const active = subject === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSubject(s.key)}
                disabled={submitting}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 text-zinc-900 dark:text-zinc-50"
                    : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-zinc-600",
                ].join(" ")}
              >
                <Icon className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                {s.title}
              </button>
            );
          })}
        </div>

        {/* Пока не нужно: ссылки «Все чаты» / «Задания»
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/chat" className="underline decoration-zinc-400 underline-offset-4 hover:text-zinc-800 dark:hover:text-zinc-200">
            Все чаты
          </Link>
          <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
          <Link href="/tasks" className="underline decoration-zinc-400 underline-offset-4 hover:text-zinc-800 dark:hover:text-zinc-200">
            Задания
          </Link>
        </p>
        */}
      </div>
    </div>
  );
}
