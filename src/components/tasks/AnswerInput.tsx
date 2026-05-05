"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { MathKeyboard } from "@/components/chat/MathKeyboard";
import { MixedMathInput, type MixedMathInputHandle } from "@/components/math/MixedMathInput";

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
  const ref = useRef<MixedMathInputHandle | null>(null);
  const canToggle = useMemo(() => !disabled, [disabled]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <MixedMathInput
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full"
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
          onInsert={(latex) => {
            const el = ref.current;
            if (!el) return onChange(value + latex);
            el.insertFromKeyboard(latex);
          }}
        />
      ) : null}
    </div>
  );
}
