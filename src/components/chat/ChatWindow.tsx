"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { createSseParser } from "./sse";
import { BearTotem } from "@/components/ui/BearTotem";
import { PENDING_CHAT_MESSAGE_KEY } from "@/lib/pending-chat-message";

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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pendingConsumedRef = useRef(false);

  const headerTitle = useMemo(() => title || "Чат", [title]);

  const send = useCallback(async (text: string) => {
    const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (!res.ok || !res.body) throw new Error("Не удалось начать стриминг");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const parser = createSseParser((ev) => {
        if (ev.type === "data") {
          const t = (ev.data as StreamChunk | null)?.t;
          if (typeof t === "string" && t.length) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + t } : m)),
            );
          }
        } else if (ev.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: (m.content || "") + `\n\n⚠️ ${ev.error}` }
                : m,
            ),
          );
          setStreaming(false);
        } else if (ev.type === "done") {
          setStreaming(false);
        }
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }
      setStreaming(false);
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `⚠️ ${e instanceof Error ? e.message : "Ошибка"}` }
            : m,
        ),
      );
      setStreaming(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (pendingConsumedRef.current) return;
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(PENDING_CHAT_MESSAGE_KEY) : null;
    const trimmed = raw?.trim() ?? "";
    if (!trimmed) return;
    pendingConsumedRef.current = true;
    sessionStorage.removeItem(PENDING_CHAT_MESSAGE_KEY);
    void send(trimmed);
  }, [send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streaming]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 pb-3">
        <BearTotem variant={streaming ? "thinking" : "standard"} size="sm" />
        <div className="flex flex-col">
          <div className="font-semibold">{headerTitle}</div>
          <div className="text-xs text-zinc-900 dark:text-zinc-50">
            {streaming ? "Мишка думает и печатает…" : "Спросите что угодно по теме"}
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="sticky bottom-0 -mx-1 bg-zinc-50/95 pt-2 pb-3 backdrop-blur dark:bg-black/85">
          <ChatInput onSend={send} disabled={streaming} />
        </div>
      </div>
    </div>
  );
}
