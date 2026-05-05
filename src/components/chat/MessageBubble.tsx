"use client";

import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { mathLiveLatexToKatexDisplay } from "@/lib/mathlive-katex";

function normalizeMathlivePlaceholdersInMarkdown(input: string) {
  // Inline math is `$...$` in markdown; we only normalize placeholder scaffolding inside those segments.
  return input.replace(/\$([^$]+)\$/g, (_m, inner) => `$${mathLiveLatexToKatexDisplay(String(inner))}$`);
}

export const MessageBubble = memo(function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";
  const normalized = useMemo(() => normalizeMathlivePlaceholdersInMarkdown(content), [content]);
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6",
          isUser
            ? "bg-[color:var(--color-accent)]/20 text-zinc-900 dark:text-zinc-50"
            : "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800/60",
        ].join(" ")}
      >
        <div className="prose prose-zinc max-w-none dark:prose-invert prose-p:my-2 prose-pre:my-2">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {normalized}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}, (prev, next) => prev.role === next.role && prev.content === next.content);

