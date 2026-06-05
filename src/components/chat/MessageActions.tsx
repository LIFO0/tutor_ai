"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Pencil } from "lucide-react";

export function MessageActions({
  content,
  role,
  messageId,
  onEdit,
  disabled = false,
}: {
  content: string;
  role: "user" | "assistant";
  messageId: string;
  onEdit?: (id: string) => void;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [content]);

  if (disabled) return null;

  return (
    <div
      className={[
        "flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
        isUser ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label={copied ? "Скопировано" : "Копировать"}
      >
        {copied ? (
          <Check className="size-3.5" strokeWidth={2.25} aria-hidden />
        ) : (
          <Copy className="size-3.5" strokeWidth={2.25} aria-hidden />
        )}
      </button>
      {isUser && onEdit ? (
        <button
          type="button"
          onClick={() => onEdit(messageId)}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Редактировать"
        >
          <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
