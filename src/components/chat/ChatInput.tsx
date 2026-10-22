"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ImagePlus, Square, X } from "lucide-react";
import { Button } from "@heroui/react";
import { MAX_CHAT_MESSAGE_CHARS } from "@/lib/chat-limits";
import {
  IMAGE_INPUT_ACCEPT,
  UNSUPPORTED_IMAGE_MESSAGE,
  isAllowedImageMime,
  isDecodableImageFile,
} from "@/lib/image-formats";
import { MathKeyboard } from "./MathKeyboard";
import { MixedMathInput, type MixedMathInputHandle } from "@/components/math/MixedMathInput";

const MAX_ATTACH_BYTES = 8 * 1024 * 1024;

/**
 * Optional result of `onSend`. When the send is rejected, ChatInput shows `error`
 * and puts the typed text back so the user doesn't lose it.
 */
export type ChatSendRejection = { rejected: true; error: string };

function fileListFromFile(file: File): FileList {
  const dt = new DataTransfer();
  dt.items.add(file);
  return dt.files;
}

export function ChatInput({
  onSend,
  onStop,
  streaming = false,
  disabled,
  placeholder,
  onFocus,
  mixedMathInputProps,
  allowImage = true,
}: {
  onSend: (
    text: string,
    file?: File | null,
  ) => void | ChatSendRejection | Promise<void | ChatSendRejection | null> | null;
  onStop?: () => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  mixedMathInputProps?: Partial<React.ComponentProps<typeof MixedMathInput>>;
  allowImage?: boolean;
}) {
  const [value, setValue] = useState("");
  const [showMath, setShowMath] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  // Файл, который пользователь пытался прикрепить, но он не прошёл проверку (GIF, не картинка,
  // слишком большой). Пока он не убран, отправка блокируется: иначе ушёл бы только текст,
  // а картинка молча потерялась бы.
  const [rejectedFileName, setRejectedFileName] = useState<string | null>(null);
  // Пока проверяем содержимое файла (сигнатура + пробное декодирование), отправка недоступна.
  const [checkingFile, setCheckingFile] = useState(false);
  const pickSeqRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);
  const inputRef = useRef<MixedMathInputHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputDisabled = Boolean(disabled || streaming);
  const canAttach = allowImage && !inputDisabled;
  const canSend = useMemo(
    () => (value.trim().length > 0 || file != null) && !inputDisabled && !checkingFile,
    [value, file, inputDisabled, checkingFile],
  );

  function replacePreview(nextFile: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    const nextUrl = nextFile ? URL.createObjectURL(nextFile) : null;
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  function clearFile() {
    pickSeqRef.current += 1;
    setCheckingFile(false);
    setFile(null);
    replacePreview(null);
    setAttachError(null);
    setRejectedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function rejectPick(name: string, message: string) {
    setCheckingFile(false);
    // Неподходящий файл заменяет прежнее вложение: пользователь хотел отправить именно его.
    setFile(null);
    replacePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setRejectedFileName(name || "файл");
    setAttachError(message);
  }

  function onPickFile(list: FileList | null) {
    const next = list?.[0] ?? null;
    if (!next) return;
    const seq = ++pickSeqRef.current;
    setAttachError(null);
    setRejectedFileName(null);
    if (!next.type.startsWith("image/")) {
      rejectPick(next.name, "Можно прикрепить только изображение.");
      return;
    }
    if (!isAllowedImageMime(next.type)) {
      rejectPick(next.name, UNSUPPORTED_IMAGE_MESSAGE);
      return;
    }
    if (next.size <= 0 || next.size > MAX_ATTACH_BYTES) {
      rejectPick(next.name, "Файл слишком большой (макс. 8 МБ).");
      return;
    }
    // MIME берётся из расширения: «.png», который на деле не PNG, проходит проверку выше.
    // Смотрим содержимое, чтобы отказать сразу, а не после создания чата / запроса к серверу.
    setCheckingFile(true);
    void isDecodableImageFile(next).then((ok) => {
      if (seq !== pickSeqRef.current) return;
      if (!ok) {
        rejectPick(next.name, UNSUPPORTED_IMAGE_MESSAGE);
        return;
      }
      setCheckingFile(false);
      setFile(next);
      replacePreview(next);
    });
  }

  function resetDrag() {
    dragDepthRef.current = 0;
    setDragging(false);
  }

  function onPasteImage(e: React.ClipboardEvent) {
    if (!canAttach) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const blob = item.getAsFile();
        if (!blob) continue;
        e.preventDefault();
        onPickFile(fileListFromFile(blob));
        return;
      }
    }
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      const image = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (image) {
        e.preventDefault();
        onPickFile(fileListFromFile(image));
      }
    }
  }

  function submit() {
    if (!canSend) return;
    if (rejectedFileName) {
      // Ничего не отправляем и текст не трогаем, пока неподходящий файл не убран.
      setAttachError((current) => current ?? UNSUPPORTED_IMAGE_MESSAGE);
      return;
    }
    const text = value.trim();
    if (text.length > MAX_CHAT_MESSAGE_CHARS) return;
    const attach = file;
    setValue("");
    clearFile();
    void Promise.resolve(onSend(text, attach)).then((result) => {
      if (!result || !result.rejected) return;
      setAttachError(result.error);
      // Вернуть набранный текст, если пользователь ещё не начал печатать новый.
      if (text) setValue((current) => (current.trim() ? current : text));
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        className={[
          "relative min-w-0 rounded-2xl transition-[box-shadow,background-color]",
          dragging
            ? "bg-[color:var(--color-accent)]/5 ring-2 ring-[color:var(--color-accent)] ring-offset-2 ring-offset-zinc-50 dark:ring-offset-black"
            : "",
        ].join(" ")}
        onDragEnter={(e) => {
          if (!canAttach) return;
          e.preventDefault();
          e.stopPropagation();
          dragDepthRef.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => {
          if (!canAttach) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (!canAttach) return;
          e.preventDefault();
          e.stopPropagation();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          if (!canAttach) return;
          e.preventDefault();
          e.stopPropagation();
          resetDrag();
          onPickFile(e.dataTransfer.files);
        }}
      >
        {dragging ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[color:var(--color-accent)]/10 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Отпустите, чтобы прикрепить
          </div>
        ) : null}

        {previewUrl && file ? (
          <div className="group relative mb-2 w-fit max-w-full px-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-40 max-w-full rounded-2xl border border-zinc-200 object-contain dark:border-zinc-700"
            />
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 max-w-[min(100vw-2rem,20rem)] truncate rounded-md bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {file.name}
            </span>
            <button
              type="button"
              onClick={clearFile}
              disabled={inputDisabled}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white shadow hover:bg-zinc-700 disabled:opacity-50"
              aria-label="Убрать изображение"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ) : null}
        {attachError ? (
          <div className="mb-2 flex items-start gap-2">
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {attachError}
            </p>
            {rejectedFileName ? (
              <button
                type="button"
                onClick={clearFile}
                disabled={inputDisabled}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label={`Убрать файл ${rejectedFileName}`}
                title="Убрать файл"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-w-0 items-end gap-2">
          <div className="flex min-w-0 flex-1 items-end rounded-xl border border-zinc-200 bg-white focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
            {allowImage ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_INPUT_ACCEPT}
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files)}
                />
                <Button
                  variant="secondary"
                  isIconOnly
                  isDisabled={!canAttach}
                  onPress={() => fileInputRef.current?.click()}
                  className="m-1 h-9 w-9 min-h-9 min-w-9 shrink-0 self-end border-0 bg-transparent shadow-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Прикрепить изображение"
                >
                  <ImagePlus className="size-5" strokeWidth={1.75} aria-hidden />
                </Button>
              </>
            ) : null}

            <MixedMathInput
              ref={inputRef}
              value={value}
              onChange={setValue}
              placeholder={placeholder ?? "С чего начнём?"}
              disabled={inputDisabled}
              className="min-w-0 flex-1"
              inputClassName="!min-h-11 max-h-[min(40vh,16rem)] overflow-y-auto rounded-none border-0 bg-transparent px-2 py-2.5 focus:border-transparent dark:bg-transparent"
              placeholderClassName="!top-1/2 left-2 -translate-y-1/2"
              onFocus={onFocus}
              {...mixedMathInputProps}
              onPaste={onPasteImage}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !streaming) {
                  e.preventDefault();
                  submit();
                }
              }}
            />

            <Button
              variant="secondary"
              isIconOnly
              isDisabled={inputDisabled}
              onPress={() => setShowMath((v) => !v)}
              className="m-1 h-9 w-9 min-h-9 min-w-9 shrink-0 self-end border-0 bg-transparent shadow-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label={showMath ? "Скрыть математическую клавиатуру" : "Математическая клавиатура"}
              aria-pressed={showMath}
            >
              <span className="text-lg font-semibold leading-none tracking-tight" aria-hidden>
                ∑
              </span>
            </Button>
          </div>

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
