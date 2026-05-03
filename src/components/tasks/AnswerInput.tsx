"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { MathKeyboard } from "@/components/chat/MathKeyboard";

export function AnswerInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [showMath, setShowMath] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const canToggle = useMemo(() => !disabled, [disabled]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <textarea
          ref={ref}
          className="min-h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ваш ответ… Можно использовать LaTeX"
        />
        <Button
          variant="secondary"
          isDisabled={!canToggle}
          onPress={() => setShowMath((v) => !v)}
          className="shrink-0"
        >
          ∑
        </Button>
      </div>
      {showMath ? (
        <MathKeyboard
          onInsert={(latex, caretBackoff = 0) => {
            const el = ref.current;
            if (!el) return onChange(value + latex);
            const start = el.selectionStart ?? el.value.length;
            const end = el.selectionEnd ?? el.value.length;
            const next = el.value.slice(0, start) + latex + el.value.slice(end);
            onChange(next);
            requestAnimationFrame(() => {
              el.focus();
              const pos = Math.max(start, start + latex.length - caretBackoff);
              el.setSelectionRange(pos, pos);
            });
          }}
        />
      ) : null}
    </div>
  );
}
