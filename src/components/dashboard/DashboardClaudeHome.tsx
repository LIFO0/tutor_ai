"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat/ChatInput";
import { BearTotem, type BearTotemVariant } from "@/components/ui/BearTotem";
import { QuotaExceededBanner } from "@/components/usage/QuotaExceededBanner";
import { useUsage, parseQuotaResponse } from "@/hooks/useUsage";
import { PENDING_CHAT_MESSAGE_KEY } from "@/lib/pending-chat-message";
import type { Subject } from "@/lib/subjects";
import { CHAT_SUBJECTS, DEFAULT_CHAT_SUBJECT } from "@/lib/subjects";
import { quotaExceededMessage, quotaWarningMessage } from "@/lib/usage-types";

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
  // IMPORTANT: keep SSR + first client render deterministic to avoid hydration mismatch.
  const [bearVariant, setBearVariant] = useState<BearTotemVariant>("standard");
  const [submitting, setSubmitting] = useState(false);
  const [openHint, setOpenHint] = useState<string | null>(null);
  const [dashboardPlaceholder, setDashboardPlaceholder] = useState<(typeof DASHBOARD_PLACEHOLDERS)[number]>(
    DASHBOARD_PLACEHOLDERS[0],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { usage, refresh: refreshUsage } = useUsage();

  const sessionsBlocked = !usage?.exempt && (usage?.remaining.chatSessions ?? 1) === 0;
  const messagesBlocked = !usage?.exempt && (usage?.remaining.chatMessages ?? 1) === 0;
  const inputBlocked = sessionsBlocked || messagesBlocked;

  const sessionsWarning =
    !usage?.exempt &&
    !sessionsBlocked &&
    usage != null &&
    usage.remaining.chatSessions > 0 &&
    usage.remaining.chatSessions <= 3;

  const messagesWarning =
    !usage?.exempt &&
    !messagesBlocked &&
    usage != null &&
    usage.remaining.chatMessages > 0 &&
    usage.remaining.chatMessages <= 3;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(TOTEM_INTRO_SESSION_KEY)) return;
    // Avoid setState synchronously in effect; schedule after paint.
    const welcomeId = window.setTimeout(() => setBearVariant("welcoming"), 0);
    const id = window.setTimeout(() => {
      setBearVariant("standard");
      sessionStorage.setItem(TOTEM_INTRO_SESSION_KEY, "1");
    }, 2200);
    return () => {
      window.clearTimeout(welcomeId);
      window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    // Avoid hydration mismatch: pick random placeholder only after mount.
    const id = window.setTimeout(() => {
      const idx = Math.floor(Math.random() * DASHBOARD_PLACEHOLDERS.length);
      setDashboardPlaceholder(DASHBOARD_PLACEHOLDERS[idx] ?? DASHBOARD_PLACEHOLDERS[0]);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  async function handleSend(text: string) {
    const message = text.trim();
    if (!message || submitting) return;
    const isDev = process.env.NODE_ENV !== "production";
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (inputBlocked) return;

    setSubmitting(true);
    setSubmitError(null);
    setBearVariant("thinking");
    setOpenHint("Создаём чат…");
    if (isDev) console.time("[dashboard] total handleSend");
    try {
      if (isDev) console.time("[dashboard] POST /api/chat/sessions");
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject }),
      });
      if (isDev) console.timeEnd("[dashboard] POST /api/chat/sessions");
      const data = (await res.json().catch(() => null)) as
        | { ok: true; sessionId: number }
        | { ok: false; error?: string; message?: string }
        | null;
      const quota = parseQuotaResponse(res, data);
      if (quota) {
        setSubmitError(quota.message ?? quotaExceededMessage(quota.kind, quota.limit));
        void refreshUsage();
        return;
      }
      if (!res.ok || !data || data.ok !== true || typeof data.sessionId !== "number") {
        const msg =
          (data && "message" in data && typeof data.message === "string" ? data.message : null) ||
          (data as { error?: string } | null)?.error ||
          "Не удалось создать чат";
        setSubmitError(msg);
        return;
      }
      void refreshUsage();
      const sessionId = data.sessionId;
      if (isDev) console.time("[dashboard] sessionStorage + push");
      sessionStorage.setItem(PENDING_CHAT_MESSAGE_KEY, message);
      setOpenHint("Открываем чат…");
      router.push(`/chat/${sessionId}`);
      if (isDev) console.timeEnd("[dashboard] sessionStorage + push");
    } catch {
      setSubmitError("Не удалось создать чат. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      if (isDev) {
        console.timeEnd("[dashboard] total handleSend");
        const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
        console.debug("[dashboard] total ms:", Math.round(t1 - t0));
      }
      setSubmitting(false);
      setOpenHint(null);
      setBearVariant("standard");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-3 py-6 sm:px-4 md:py-10">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8">
        <BearTotem variant={bearVariant} size="lg" priority className="mx-auto" />

        <div className="w-full text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Привет, {userName}!
          </h1>
        </div>

        <div className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-950/60">
          {inputBlocked && usage ? (
            <div className="flex flex-col gap-3">
              <QuotaExceededBanner
                title={
                  sessionsBlocked
                    ? "Новые чаты на сегодня закончились"
                    : "Сообщения на сегодня закончились"
                }
                message={
                  sessionsBlocked
                    ? quotaExceededMessage("chat_session", usage.limits.chatSessions)
                    : quotaExceededMessage("chat_message", usage.limits.chatMessages)
                }
                resetsAt={usage.resetsAt}
              />
              {sessionsBlocked ? (
                <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                  Продолжите в{" "}
                  <Link
                    href="/chat"
                    className="font-medium text-[color:var(--accent)] underline underline-offset-2"
                  >
                    недавнем чате
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          ) : (
            <>
              {sessionsWarning && usage ? (
                <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
                  {quotaWarningMessage("chat_session", usage.remaining.chatSessions)}
                </p>
              ) : null}
              {messagesWarning && usage ? (
                <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
                  {quotaWarningMessage("chat_message", usage.remaining.chatMessages)}
                </p>
              ) : null}
              {submitError ? (
                <div className="mb-2">
                  <QuotaExceededBanner message={submitError} resetsAt={usage?.resetsAt} />
                </div>
              ) : null}
              <ChatInput
                onSend={handleSend}
                disabled={submitting || inputBlocked}
                placeholder={dashboardPlaceholder}
                mixedMathInputProps={{ inlineEditActivation: "doubleClick" }}
              />
              {openHint ? (
                <div className="mt-2 px-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {openHint}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex w-full flex-wrap justify-center gap-1.5 md:gap-2">
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
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors md:px-4 md:py-2 md:text-sm",
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
