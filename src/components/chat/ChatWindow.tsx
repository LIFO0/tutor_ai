"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { createSseParser } from "./sse";
import { BearTotem } from "@/components/ui/BearTotem";
import { PENDING_CHAT_MESSAGE_KEY } from "@/lib/pending-chat-message";
import { normalizeMathMessageForModel } from "@/lib/math-prompt";
import { useUsage, parseQuotaResponse } from "@/hooks/useUsage";
import { QuotaExceededBanner } from "@/components/usage/QuotaExceededBanner";
import { LLM_UNAVAILABLE_MESSAGE, MAX_CHAT_MESSAGE_CHARS } from "@/lib/chat-limits";
import { quotaExceededMessage, quotaWarningMessage } from "@/lib/usage-types";

export type UiMessage = { id: string; role: "user" | "assistant"; content: string };
type StreamChunk = { t: string };

export function ChatWindow({
  sessionId,
  title,
  initialMessages,
}: {
  sessionId: number;
  title?: string | null;
  initialMessages: Array<{ id: number; role: "user" | "assistant"; content: string }>;
}) {
  const [messages, setMessages] = useState<UiMessage[]>(() =>
    initialMessages.map((m) => ({ id: String(m.id), role: m.role, content: m.content })),
  );
  const [streaming, setStreaming] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const pendingConsumedRef = useRef(false);
  const sendInFlightRef = useRef(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<{ text: string; at: number } | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [quotaBlock, setQuotaBlock] = useState<{ message: string; resetsAt?: string } | null>(
    null,
  );

  const { usage, refresh: refreshUsage } = useUsage();

  const chatBlocked =
    !usage?.exempt && (quotaBlock !== null || (usage?.remaining.chatMessages ?? 1) === 0);
  const chatWarning =
    !usage?.exempt &&
    !chatBlocked &&
    usage != null &&
    usage.remaining.chatMessages > 0 &&
    usage.remaining.chatMessages <= 3;

  const [headerTitle, setHeaderTitle] = useState<string>(() => title || "Чат");

  useEffect(() => {
    setHeaderTitle(title || "Чат");
  }, [title]);

  useEffect(() => {
    // Best-effort prewarm: compile/load MathLive while user reads the chat.
    const schedule: (cb: () => void) => number =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? ((cb) => (window as unknown as { requestIdleCallback: (c: () => void) => number }).requestIdleCallback(cb))
        : (cb) => window.setTimeout(cb, 200);

    const cancel: (id: number) => void =
      typeof window !== "undefined" && "cancelIdleCallback" in window
        ? (id) => (window as unknown as { cancelIdleCallback: (i: number) => void }).cancelIdleCallback(id)
        : (id) => window.clearTimeout(id);

    const id = schedule(() => {
      // Prewarm only the JS chunk. CSS/fonts are loaded on-demand when user opens the editor.
      void import("mathlive").catch(() => {
        // ignore
      });
    });

    return () => cancel(id);
  }, []);

  const lastMessageFingerprint = useMemo(() => {
    const last = messages.at(-1);
    if (!last) return 0;
    return last.content.length + (last.role === "assistant" ? 1 : 0);
  }, [messages]);

  const send = useCallback(async (text: string): Promise<boolean> => {
    // Guard against accidental double-submits (e.g. Enter + button, or rapid re-entrancy
    // before `streaming` state propagates).
    if (sendInFlightRef.current) return false;

    const isDev = process.env.NODE_ENV !== "production";
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    let firstUsefulTokenAt: number | null = null;

    const normalized = normalizeMathMessageForModel(text);
    if (!normalized.trim()) return false;
    if (normalized.length > MAX_CHAT_MESSAGE_CHARS) {
      setPendingError(
        `Сообщение слишком длинное (максимум ${MAX_CHAT_MESSAGE_CHARS} символов).`,
      );
      setPendingText(normalized);
      return false;
    }

    // Extra dedupe: ignore identical sends within a short window.
    // This covers rare cases like navigation pending-message auto-send racing with user submit.
    const now0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const last = lastSendRef.current;
    if (last && last.text === normalized && now0 - last.at < 1500) return false;
    lastSendRef.current = { text: normalized, at: now0 };

    if (isDev && normalized.includes("\\placeholder")) {
      console.error("[chat] normalizeMathMessageForModel left placeholder scaffolding:", {
        beforeLen: text.length,
        afterLen: normalized.length,
      });
    }
    sendInFlightRef.current = true;
    const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content: normalized };
    const assistantMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      setPendingError(null);
      streamAbortRef.current?.abort();
      const ac = new AbortController();
      streamAbortRef.current = ac;

      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: normalized }),
        signal: ac.signal,
      });

      if (res.status === 503) {
        const errJson = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        setMessages((prev) =>
          prev.filter((m) => m.id !== userMsg.id && m.id !== assistantMsg.id),
        );
        const message =
          typeof errJson?.error === "string" ? errJson.error : LLM_UNAVAILABLE_MESSAGE;
        setQuotaBlock({ message });
        setStreaming(false);
        return false;
      }

      if (res.status === 429) {
        const errJson = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        const quota = parseQuotaResponse(res, errJson);
        setMessages((prev) =>
          prev.filter((m) => m.id !== userMsg.id && m.id !== assistantMsg.id),
        );
        const message =
          quota?.message ??
          (typeof errJson?.message === "string" ? errJson.message : quotaExceededMessage("chat_message", 16));
        setQuotaBlock({ message, resetsAt: quota?.resetsAt });
        setStreaming(false);
        void refreshUsage();
        return false;
      }

      if (!res.ok || !res.body) throw new Error("Не удалось начать стриминг");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let hadStreamError = false;
      const chunks: string[] = [];
      let rafId: number | null = null;
      const flush = () => {
        rafId = null;
        const content = chunks.join("");
        setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content } : m)));
      };
      const parser = createSseParser((ev) => {
        if (ev.type === "data") {
          const t = (ev.data as StreamChunk | null)?.t;
          if (typeof t === "string" && t.length) {
            // Older server versions could send a placeholder token to signal stream start.
            // Never render it to the user.
            if (t === "…") return;
            if (isDev && firstUsefulTokenAt === null && t !== "…") {
              const now = typeof performance !== "undefined" ? performance.now() : Date.now();
              firstUsefulTokenAt = now;
              console.debug("[chat] first token ms:", Math.round(now - t0), { len: normalized.length });
            }
            chunks.push(t);
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(flush);
          }
        } else if (ev.type === "event" && ev.event === "metrics") {
          if (isDev) console.debug("[chat] server metrics:", ev.data);
        } else if (ev.type === "error") {
          hadStreamError = true;
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          flush();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: (m.content || "") + `\n\n⚠️ ${ev.error}` }
                : m,
            ),
          );
          setStreaming(false);
          void refreshUsage();
        } else if (ev.type === "done") {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          flush();
          setStreaming(false);
          // After the first exchange we may auto-update the session title/subject on the server.
          // Pull fresh session data so UI reflects it immediately (and refresh metadata/sidebar).
          void (async () => {
            try {
              const r = await fetch(`/api/chat/sessions/${sessionId}`, { cache: "no-store" });
              const data = (await r.json().catch(() => null)) as
                | { ok: true; session?: { title?: string | null } }
                | { ok?: false }
                | null;
              const nextTitle = data && (data as { session?: { title?: unknown } }).session?.title;
              if (typeof nextTitle === "string" && nextTitle.trim()) {
                setHeaderTitle(nextTitle.trim());
              }
            } catch {
              // ignore
            }
          })();
          void refreshUsage();
          if (isDev) {
            const now = typeof performance !== "undefined" ? performance.now() : Date.now();
            console.debug("[chat] done ms:", Math.round(now - t0), {
              len: normalized.length,
              firstTokenMs: firstUsefulTokenAt ? Math.round(firstUsefulTokenAt - t0) : null,
            });
          }
        }
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }
      setStreaming(false);
      return !hadStreamError;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setStreaming(false);
        return false;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `⚠️ ${e instanceof Error ? e.message : "Ошибка"}` }
            : m,
        ),
      );
      setStreaming(false);
      return false;
    } finally {
      sendInFlightRef.current = false;
      if (streamAbortRef.current?.signal.aborted) {
        streamAbortRef.current = null;
      }
    }
  }, [refreshUsage, sessionId]);

  const stopStreaming = useCallback(() => {
    streamAbortRef.current?.abort();
    setStreaming(false);
  }, []);

  useEffect(() => {
    if (pendingConsumedRef.current) return;
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(PENDING_CHAT_MESSAGE_KEY) : null;
    const trimmed = raw?.trim() ?? "";
    if (!trimmed) return;
    pendingConsumedRef.current = true;
    setPendingText(trimmed);
  }, [send]);

  useEffect(() => {
    const t = pendingText?.trim() ?? "";
    if (!t) return;
    if (streaming) return;
    if (pendingError) return;
    void (async () => {
      const ok = await send(t);
      if (ok) {
        sessionStorage.removeItem(PENDING_CHAT_MESSAGE_KEY);
        setPendingText(null);
      } else {
        setPendingError("Не удалось отправить сообщение. Проверьте интернет и попробуйте ещё раз.");
      }
    })();
  }, [pendingError, pendingText, send, streaming]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    // Скроллим строго контейнер ленты, чтобы не появлялся скролл страницы.
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming, lastMessageFingerprint]);

  return (
    <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 pb-3">
        <BearTotem variant={streaming ? "thinking" : "standard"} size="sm" />
        <div className="flex min-w-0 flex-col">
          <div className="truncate font-semibold">{headerTitle}</div>
          {streaming ? (
            <div className="text-xs text-zinc-900 dark:text-zinc-50">Мишка думает и печатает…</div>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
        <div
          ref={messagesScrollRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-auto px-3 pt-1 pb-4"
        >
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}
        </div>
        <div className="shrink-0 bg-zinc-50/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur dark:bg-black/85">
          {pendingError && pendingText ? (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
              <div className="min-w-0">
                <div className="font-medium">Сообщение не отправлено</div>
                <div className="truncate opacity-90">{pendingError}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingError(null);
                }}
                className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-300"
              >
                Повторить
              </button>
            </div>
          ) : null}
          {chatBlocked ? (
            <QuotaExceededBanner
              message={
                quotaBlock?.message ??
                quotaExceededMessage("chat_message", usage?.limits.chatMessages ?? 16)
              }
              resetsAt={quotaBlock?.resetsAt ?? usage?.resetsAt}
            />
          ) : (
            <>
              {chatWarning && usage ? (
                <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
                  {quotaWarningMessage("chat_message", usage.remaining.chatMessages)}
                </p>
              ) : null}
              <ChatInput
                onSend={send}
                onStop={stopStreaming}
                streaming={streaming}
                disabled={chatBlocked}
              />
            </>
          )}
          <p className="mt-2 px-1 text-center text-xs leading-snug text-zinc-500 dark:text-zinc-400">
            Мишка знает — это искусственный интеллект, и он может ошибаться. Пожалуйста,
            перепроверяйте ответы.
          </p>
        </div>
      </div>
    </div>
  );
}
