"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, Button } from "@heroui/react";

type ProfileUser = {
  name: string;
  email: string;
  grade: number;
  avatar: string;
};

const grades = Array.from({ length: 7 }, (_, i) => 5 + i);
const avatars = ["bear1", "bear2", "bear3", "bear4"];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(7);
  const [avatar, setAvatar] = useState("bear1");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/profile");
        const data = (await res.json().catch(() => null)) as
          | { ok: true; user: ProfileUser }
          | { ok: false; error: string }
          | null;
        if (!res.ok || !data || data.ok !== true) {
          throw new Error((data as { error?: string } | null)?.error || "Не удалось загрузить профиль");
        }
        setUser(data.user);
        setName(data.user.name);
        setGrade(data.user.grade);
        setAvatar(data.user.avatar);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const changed = useMemo(() => {
    if (!user) return false;
    return user.name !== name.trim() || user.grade !== grade || user.avatar !== avatar;
  }, [user, name, grade, avatar]);

  async function save() {
    if (!changed) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade, avatar }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data as { error?: string } | null)?.error || "Не удалось сохранить");
      }
      setUser((u) => (u ? { ...u, name: name.trim(), grade, avatar } : u));
      setOk("Сохранено. Новый класс сразу используется в заданиях и объяснениях.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="font-semibold">Профиль</CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loading ? (
            <div className="text-sm text-zinc-500">Загрузка…</div>
          ) : user ? (
            <>
              <div className="text-sm text-zinc-500">Email: {user.email}</div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Имя</label>
                  <input
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Класс</label>
                  <select
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                  >
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Аватар</label>
                <select
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                >
                  {avatars.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {error ? <div className="text-sm text-red-600">{error}</div> : null}
              {ok ? <div className="text-sm text-emerald-600">{ok}</div> : null}

              <Button variant="primary" isDisabled={!changed || saving} onPress={save}>
                {saving ? "Сохраняем…" : "Сохранить изменения"}
              </Button>
            </>
          ) : (
            <div className="text-sm text-red-600">Не удалось загрузить профиль.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

