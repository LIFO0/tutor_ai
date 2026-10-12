"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/react";
import {
  FEEDBACK_SCREENSHOT_MAX_BYTES,
  FEEDBACK_TEXT_MAX,
  FEEDBACK_TOPICS,
  validateFeedback,
  type FeedbackTopic,
} from "@/lib/feedback";

const fieldClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-600";

export function FeedbackForm() {
  const [topic, setTopic] = useState<FeedbackTopic | "">("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validateFeedback({ topic, text, screenshot: file ? { size: file.size, type: file.type } : null });
    if (!v.ok) {
      setError(v.error);
      return;
    }
    const fd = new FormData();
    fd.set("topic", v.topic);
    fd.set("text", v.text);
    fd.set("pageUrl", document.referrer || window.location.href);
    if (file) fd.set("screenshot", file);
    setSending(true);
    try {
      const res = await fetch("/api/feedback", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Не получилось отправить. Попробуй ещё раз.");
        return;
      }
      setDone(true);
      setTopic("");
      setText("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Нет связи с сервером. Проверь интернет и попробуй ещё раз.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-base font-semibold text-emerald-800 dark:text-emerald-200">Спасибо! Мишка передал твоё сообщение 🐻</p>
        <p className="text-sm text-emerald-700 dark:text-emerald-300">Мы прочитаем его и постараемся помочь.</p>
        <Button variant="secondary" onPress={() => setDone(false)}>
          Написать ещё
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">О чём хочешь написать?</span>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value as FeedbackTopic | "")}
          className={fieldClass}
          required
        >
          <option value="" disabled>
            Выбери тему
          </option>
          {FEEDBACK_TOPICS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Расскажи подробнее</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={FEEDBACK_TEXT_MAX}
          rows={6}
          placeholder="Что случилось или что хочешь предложить? Чем подробнее, тем быстрее разберёмся."
          className={fieldClass}
        />
        <span className="self-end text-xs text-zinc-400">
          {text.length}/{FEEDBACK_TEXT_MAX}
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Скриншот (если есть)</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-100"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          JPEG, PNG или WebP, до {Math.round(FEEDBACK_SCREENSHOT_MAX_BYTES / 1024 / 1024)} МБ.
        </span>
      </label>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}

      <Button type="submit" variant="primary" isDisabled={sending}>
        {sending ? "Отправляем…" : "Отправить"}
      </Button>
    </form>
  );
}
