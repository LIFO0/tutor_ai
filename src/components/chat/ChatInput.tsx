"use client";

import { useMemo, useRef, useState } from "react";
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <textarea
          className="min-h-11 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          placeholder="Напишите вопрос… Можно использовать LaTeX: $x^2$"
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
            isDisabled={disabled}
            onPress={() => setShowMath((v) => !v)}
            className="shrink-0"
          >
            ∑
          </Button>
          <Button variant="primary" isDisabled={!canSend} onPress={submit} className="shrink-0">
            Отправить
          </Button>
        </div>
      </div>

      {showMath ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <MathKeyboard
            onInsert={(latex) => {
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
                const pos = start + latex.length;
                el.setSelectionRange(pos, pos);
              });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

