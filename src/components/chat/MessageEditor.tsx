"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { MAX_CHAT_MESSAGE_CHARS } from "@/lib/chat-limits";

export function MessageEditor({
  initialContent,
  onSave,
  onCancel,
  saving = false,
}: {
  initialContent: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [value, setValue] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const canSave = value.trim().length > 0 && value.length <= MAX_CHAT_MESSAGE_CHARS && !saving;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    onSave(value.trim());
  }, [canSave, onSave, value]);

  return (
    <div className="flex w-full min-w-0 justify-end">
      <div className="flex w-full max-w-[80%] min-w-0 flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={saving}
          rows={3}
          className="min-h-[4.5rem] w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            } else if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onPress={onCancel} isDisabled={saving}>
            Отмена
          </Button>
          <Button variant="primary" size="sm" onPress={handleSave} isDisabled={!canSave}>
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
