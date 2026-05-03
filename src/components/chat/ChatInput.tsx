"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@heroui/react";
import { MathKeyboard } from "./MathKeyboard";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [showMath, setShowMath] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const canSend = useMemo(() => value.trim().length > 0 && !disabled, [value, disabled]);

  function submit() {
    if (!canSend) return;
    const text = value.trim();
    setValue("");
    onSend(text);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 gap-2">
        <textarea
          className="min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          placeholder="С чего начнём?"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          ref={textareaRef}
        />
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            isIconOnly
            isDisabled={disabled}
            onPress={() => setShowMath((v) => !v)}
            className="h-11 w-11 min-h-11 min-w-11 shrink-0"
            aria-label={showMath ? "Скрыть математическую клавиатуру" : "Математическая клавиатура"}
            aria-pressed={showMath}
          >
            <span className="text-lg font-semibold leading-none tracking-tight" aria-hidden>
              ∑
            </span>
          </Button>
          <Button
            variant="primary"
            isIconOnly
            isDisabled={!canSend}
            onPress={submit}
            className="h-11 w-11 min-h-11 min-w-11 shrink-0"
            aria-label="Отправить сообщение"
          >
            <ArrowUp className="size-5" strokeWidth={2.25} aria-hidden />
          </Button>
        </div>
      </div>

      {showMath ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <MathKeyboard
            onInsert={(latex, caretBackoff = 0) => {
              const el = textareaRef.current;
              if (!el) {
                setValue((v) => v + latex);
                return;
              }
              const start = el.selectionStart ?? el.value.length;
              const end = el.selectionEnd ?? el.value.length;
              const next = el.value.slice(0, start) + latex + el.value.slice(end);
              setValue(next);
              requestAnimationFrame(() => {
                el.focus();
                const pos = Math.max(start, start + latex.length - caretBackoff);
                el.setSelectionRange(pos, pos);
              });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
