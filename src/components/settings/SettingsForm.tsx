"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ListBox, Select } from "@heroui/react";
import type { CurrentUser } from "@/lib/current-user";
import { UserAvatar, AVATAR_IDS } from "@/components/ui/UserAvatar";

const grades = Array.from({ length: 7 }, (_, i) => 5 + i);

type Baseline = {
  name: string;
  email: string;
  grade: number;
  avatar: string;
  chatName: string | null;
};

export function SettingsForm({ initialUser }: { initialUser: CurrentUser }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [baseline, setBaseline] = useState<Baseline | null>(() => ({
    name: initialUser.name,
    email: initialUser.email,
    grade: initialUser.grade,
    avatar: initialUser.avatar,
    chatName: initialUser.chatName,
  }));
  const [name, setName] = useState(initialUser.name);
  const [grade, setGrade] = useState(initialUser.grade);
  const [avatar, setAvatar] = useState(initialUser.avatar);
  const [chatName, setChatName] = useState(initialUser.chatName?.trim() ?? "");

  const changed = useMemo(() => {
    if (!baseline) return false;
    const cn = chatName.trim() || null;
    const bn = baseline.chatName?.trim() || null;
    return (
      baseline.name !== name.trim() ||
      baseline.grade !== grade ||
      baseline.avatar !== avatar ||
      bn !== cn
    );
  }, [baseline, name, grade, avatar, chatName]);

  async function save() {
    if (!changed) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          avatar,
          chatName: chatName.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data as { error?: string } | null)?.error || "Не удалось сохранить");
      }
      const cn = chatName.trim() || null;
      setBaseline((b) =>
        b
          ? {
              ...b,
              name: name.trim(),
              grade,
              avatar,
              chatName: cn,
            }
          : b,
      );
      setOk("Сохранено. Класс и обращение в чате применятся к новым ответам.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Данные ученика</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Имя</label>
            <input
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="settings-grade">
              Класс
            </label>
            <Select
              fullWidth
              variant="secondary"
              value={String(grade)}
              onChange={(key) => {
                if (key == null) return;
                setGrade(Number(key));
              }}
              aria-label="Класс"
              className="w-full"
            >
              <Select.Trigger
                id="settings-grade"
                className={[
                  "h-11 w-full justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-start text-sm font-normal text-zinc-900 shadow-none",
                  "outline-none focus-visible:border-zinc-400 data-[focus-visible]:border-zinc-400 data-[focus-visible]:ring-0",
                  "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
                ].join(" ")}
              >
                <Select.Value />
                <Select.Indicator className="shrink-0 text-zinc-500 dark:text-zinc-400" />
              </Select.Trigger>
              <Select.Popover
                placement="bottom start"
                className="overflow-x-hidden"
              >
                <ListBox className="max-h-60 min-w-0 overflow-x-hidden overflow-y-auto py-1.5 px-2.5 outline-none">
                  {grades.map((g) => (
                    <ListBox.Item
                      key={g}
                      id={String(g)}
                      textValue={`${g} класс`}
                      className="mx-0.5 cursor-pointer rounded-lg px-3 py-2 text-sm text-zinc-900 outline-none data-[focused]:bg-zinc-100 data-[selected]:bg-zinc-100 data-[selected]:font-medium dark:text-zinc-50 dark:data-[focused]:bg-zinc-800 dark:data-[selected]:bg-zinc-800"
                    >
                      {g}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Как обращаться к тебе в чате
          </label>
          <input
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            placeholder="Например: Саша — если пусто, используется имя выше"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Так тебя увидит Мишка в системных подсказках к ответам.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Аватар</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {AVATAR_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setAvatar(id)}
              className={[
                "flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors",
                avatar === id
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                  : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
              ].join(" ")}
            >
              <UserAvatar avatar={id} size="lg" selected={avatar === id} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Мишка {id.slice(-1)}</span>
            </button>
          ))}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (!file) return;
              setError(null);
              setOk(null);
              setAvatarUploading(true);
              try {
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
                const data = (await res.json().catch(() => null)) as
                  | { ok: true; avatar: string }
                  | { ok: false; error?: string }
                  | null;
                if (!res.ok || !data || data.ok !== true || typeof data.avatar !== "string") {
                  throw new Error((data as { error?: string } | null)?.error || "Не удалось загрузить аватар");
                }
                setAvatar(data.avatar);
                setOk("Аватар загружен. Нажмите «Сохранить изменения».");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Ошибка");
              } finally {
                setAvatarUploading(false);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading || saving}
            className={[
              "flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors",
              "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
              avatarUploading ? "opacity-70" : "",
            ].join(" ")}
          >
            <div
              className={[
                "inline-flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-xl font-semibold text-zinc-600 ring-2 ring-transparent dark:bg-zinc-900 dark:text-zinc-300",
                avatar.startsWith("/uploads/avatars/") ? "ring-[color:var(--color-accent)] ring-offset-2 ring-offset-white dark:ring-offset-zinc-950" : "",
              ].join(" ")}
              aria-hidden
            >
              {avatarUploading ? "…" : "+"}
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {avatarUploading ? "Загрузка…" : "Загрузить"}
            </span>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Профиль</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Email привязан к аккаунту и не меняется здесь.
        </p>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200">
          {baseline?.email ?? initialUser.email}
        </div>
      </section>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
      {ok ? <div className="text-sm text-emerald-600 dark:text-emerald-400">{ok}</div> : null}

      <Button variant="primary" isDisabled={!changed || saving} onPress={save}>
        {saving ? "Сохраняем…" : "Сохранить изменения"}
      </Button>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
        >
          Политика конфиденциальности
        </Link>
      </p>
    </div>
  );
}
