"use client";

import { memo, useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { PluggableList } from "unified";
import { normalizeLatexDelimiters } from "@/lib/latex-delimiters";
import { mathLiveLatexToKatexDisplay } from "@/lib/mathlive-katex";
import { maskIncompleteMathForStreaming } from "@/lib/streaming-markdown-math";

const rehypeKatexPlugins: PluggableList = [[rehypeKatex, { errorColor: "currentColor" }]];

function TypingDots() {
  return (
    <div
      className="typing-dots"
      role="status"
      aria-label="Мишка печатает"
    >
      <span className="typing-dots__dot" />
      <span className="typing-dots__dot" />
      <span className="typing-dots__dot" />
    </div>
  );
}

function normalizeMathlivePlaceholdersInMarkdown(input: string) {
  // Inline math is `$...$` in markdown; we only normalize placeholder scaffolding inside those segments.
  return input.replace(/\$([^$]+)\$/g, (_m, inner) => `$${mathLiveLatexToKatexDisplay(String(inner))}$`);
}

export const MessageBubble = memo(function MessageBubble({
  role,
  content,
  imageKey,
  imagePreviewUrl,
  assistantFullWidth = false,
  assistantEnd,
  isStreaming = false,
}: {
  role: "user" | "assistant";
  content: string;
  imageKey?: string | null;
  /** Local blob preview before server imageKey is known */
  imagePreviewUrl?: string | null;
  /** Рядом с маскотом в карточке задания — пузырь на всю ширину колонки */
  assistantFullWidth?: boolean;
  /** Доп. блок справа внутри пузыря ассистента (например маскот в задании) */
  assistantEnd?: ReactNode;
  /** Не рендерить незакрытые $ / $$ пока идёт SSE-стрим */
  isStreaming?: boolean;
}) {
  const isUser = role === "user";
  const renderContent = useMemo(() => {
    const withDelimiters = normalizeLatexDelimiters(content);
    const normalized = normalizeMathlivePlaceholdersInMarkdown(withDelimiters);
    return isStreaming ? maskIncompleteMathForStreaming(normalized) : normalized;
  }, [content, isStreaming]);
  const widthClass =
    isUser || !assistantFullWidth ? "max-w-[80%]" : "max-w-full w-full";
  const imageSrc =
    imagePreviewUrl ||
    (imageKey ? `/api/chat/attachments/${encodeURIComponent(imageKey)}` : null);
  const showText = Boolean(content.trim()) && content.trim() !== "📷 Фото";
  const showTyping = !isUser && isStreaming && !showText;
  const prose = showText ? (
    <div
      className={[
        "message-bubble-prose min-w-0 max-w-full break-words",
        isStreaming ? "message-bubble-prose--streaming" : "",
      ].join(" ")}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={rehypeKatexPlugins}>
        {renderContent}
      </ReactMarkdown>
    </div>
  ) : showTyping ? (
    <TypingDots />
  ) : null;
  return (
    <div className={`flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          showTyping ? "w-fit" : widthClass,
          "min-w-0 overflow-hidden rounded-2xl px-4 py-3 text-sm leading-relaxed",
          !isUser && assistantEnd ? "flex flex-col gap-3 sm:flex-row sm:items-start" : "",
          isUser
            ? "bg-[color:var(--color-accent)]/20 text-zinc-900 dark:text-zinc-50"
            : "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800/60",
        ].join(" ")}
      >
        {!isUser && assistantEnd ? (
          <>
            <div className="min-w-0 flex-1 space-y-2">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt="Вложение"
                  className="max-h-64 max-w-full rounded-xl object-contain"
                />
              ) : null}
              {prose}
            </div>
            <div className="shrink-0 self-center sm:self-start">{assistantEnd}</div>
          </>
        ) : (
          <div className="space-y-2">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt="Вложение"
                className="max-h-64 max-w-full rounded-xl object-contain"
              />
            ) : null}
            {prose}
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.role === next.role &&
  prev.content === next.content &&
  prev.imageKey === next.imageKey &&
  prev.imagePreviewUrl === next.imagePreviewUrl &&
  prev.isStreaming === next.isStreaming &&
  prev.assistantFullWidth === next.assistantFullWidth &&
  prev.assistantEnd === next.assistantEnd,
);

