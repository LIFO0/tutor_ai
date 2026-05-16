"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@heroui/react";
import { MAX_CHAT_MESSAGE_CHARS } from "@/lib/chat-limits";
import { MathKeyboard } from "./MathKeyboard";
import { MixedMathInput, type MixedMathInputHandle } from "@/components/math/MixedMathInput";

export function ChatInput({
  onSend,
  onStop,
  streaming = false,
  disabled,
  placeholder,
  onFocus,
  mixedMathInputProps,
}: {
  onSend: (text: string) => void;
  onStop?: () => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  mixedMathInputProps?: Partial<React.ComponentProps<typeof MixedMathInput>>;
}) {
  const [value, setValue] = useState("");
  const [showMath, setShowMath] = useState(false);
  const inputRef = useRef<MixedMathInputHandle | null>(null);
  const inputDisabled = Boolean(disabled || streaming);
  const canSend = useMemo(
    () => value.trim().length > 0 && !inputDisabled,
    [value, inputDisabled],
  );

  function submit() {
    if (!canSend) return;
    const text = value.trim();
    if (text.length > MAX_CHAT_MESSAGE_CHARS) return;
    setValue("");
    onSend(text);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 gap-2">
        <MixedMathInput
          ref={inputRef}
          value={value}
          onChange={setValue}
          placeholder={placeholder ?? "С чего начнём?"}
          disabled={inputDisabled}
          className="min-w-0 flex-1"
          inputClassName="min-h-11"
          onFocus={onFocus}
          {...mixedMathInputProps}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !streaming) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            isIconOnly
            isDisabled={inputDisabled}
            onPress={() => setShowMath((v) => !v)}
            className="h-11 w-11 min-h-11 min-w-11 shrink-0"
            aria-label={showMath ? "Скрыть математическую клавиатуру" : "Математическая клавиатура"}
            aria-pressed={showMath}
          >
            <span className="text-lg font-semibold leading-none tracking-tight" aria-hidden>
              ∑
            </span>
          </Button>
          {streaming ? (
            <Button
              variant="secondary"
              isIconOnly
              onPress={onStop}
              className="h-11 w-11 min-h-11 min-w-11 shrink-0"
              aria-label="Остановить генерацию"
            >
              <Square className="size-4 fill-current" strokeWidth={0} aria-hidden />
            </Button>
          ) : (
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
          )}
        </div>
      </div>

      {showMath ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <MathKeyboard
            onInsert={(latex) => {
              const el = inputRef.current;
              if (!el) return setValue((v) => v + latex);
              el.insertFromKeyboard(latex);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
