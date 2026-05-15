"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { AVATAR_IDS, UserAvatar } from "@/components/ui/UserAvatar";
import { YandexSignInButton } from "@/components/ui/YandexSignInButton";

const grades = Array.from({ length: 7 }, (_, i) => 5 + i);

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="auth-input-wrap rounded-2xl border border-zinc-200/80 bg-white/70 backdrop-blur-sm shadow-sm transition-colors">
    {children}
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<number>(7);
  const [avatar, setAvatar] = useState<string>("bear1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim() && email.trim() && password.length >= 6;
  }, [name, email, password]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("name") || "");
    const nextEmail = String(formData.get("email") || "");
    const nextPassword = String(formData.get("password") || "");
    const nextGrade = Number(formData.get("grade") || grade);
    const nextAvatar = String(formData.get("avatar") || avatar);

    setName(nextName);
    setEmail(nextEmail);
    setPassword(nextPassword);
    setGrade(nextGrade);
    setAvatar(nextAvatar);

    if (!nextName.trim() || !nextEmail.trim() || nextPassword.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName,
          email: nextEmail,
          password: nextPassword,
          grade: nextGrade,
          avatar: nextAvatar,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Ошибка регистрации");
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-[100dvh] w-full bg-white">
        <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
          <section className="flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
              <div className="flex flex-col gap-8">
                <div className="animate-element animate-delay-100">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/avatars/av_main.png"
                      alt="Мишка знает"
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-zinc-200/80 dark:ring-zinc-700/80"
                      sizes="36px"
                    />
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Мишка знает
                    </div>
                  </div>
                  <h1 className="mt-2 text-4xl font-semibold leading-tight text-zinc-900">
                    Регистрация
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    Расскажите немного о себе — класс нужен, чтобы объяснения были “по программе”.
                  </p>
                </div>

                <div className="bg-transparent p-0 shadow-none backdrop-blur-0">
                  <div className="animate-element animate-delay-150">
                    <YandexSignInButton />
                  </div>
                  <form className="space-y-5" onSubmit={onSubmit}>
                    <div className="animate-element animate-delay-200">
                      <label className="text-sm font-medium text-zinc-700">Имя</label>
                      <GlassInputWrapper>
                        <input
                          name="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Как вас зовут?"
                          className="w-full rounded-2xl bg-transparent p-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                        />
                      </GlassInputWrapper>
                    </div>

                    <div className="animate-element animate-delay-300">
                      <label className="text-sm font-medium text-zinc-700">Email</label>
                      <GlassInputWrapper>
                        <input
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          autoComplete="email"
                          placeholder="name@example.com"
                          className="w-full rounded-2xl bg-transparent p-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                        />
                      </GlassInputWrapper>
                    </div>

                    <div className="animate-element animate-delay-400">
                      <label className="text-sm font-medium text-zinc-700">Пароль</label>
                      <GlassInputWrapper>
                        <div className="relative">
                          <input
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Минимум 6 символов"
                            className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute inset-y-0 right-3 flex items-center"
                            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-zinc-500 transition-colors hover:text-zinc-900" />
                            ) : (
                              <Eye className="h-5 w-5 text-zinc-500 transition-colors hover:text-zinc-900" />
                            )}
                          </button>
                        </div>
                      </GlassInputWrapper>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
                      <div className="animate-element animate-delay-500">
                        <label className="text-sm font-medium text-zinc-700">Класс</label>
                        <GlassInputWrapper>
                          <select
                            name="grade"
                            value={grade}
                            onChange={(e) => setGrade(Number(e.target.value))}
                            className="w-full appearance-none rounded-2xl bg-transparent p-4 text-sm text-zinc-900 focus:outline-none"
                          >
                            {grades.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </GlassInputWrapper>
                      </div>

                      <div className="animate-element animate-delay-500 flex min-h-0 flex-col">
                        <label className="text-sm font-medium text-zinc-700">Аватар</label>
                        <input type="hidden" name="avatar" value={avatar} />
                        <GlassInputWrapper>
                          <div className="flex items-center justify-between gap-2 px-4 py-1.5">
                            {AVATAR_IDS.map((id) => (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setAvatar(id)}
                                className={[
                                  "flex size-10 shrink-0 items-center justify-center rounded-lg border-2 p-0.5 transition-colors",
                                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]",
                                  avatar === id
                                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                                    : "border-zinc-200/80 bg-white/60 hover:border-zinc-300 hover:bg-zinc-50/80",
                                ].join(" ")}
                                aria-label={`Аватар ${id.slice(-1)}`}
                                aria-pressed={avatar === id}
                              >
                                <UserAvatar avatar={id} size="sm" selected={false} />
                              </button>
                            ))}
                          </div>
                        </GlassInputWrapper>
                      </div>
                    </div>

                    {error ? <div className="text-sm text-red-600">{error}</div> : null}

                    <button
                      type="submit"
                      disabled={!canSubmit || loading}
                      className="animate-element animate-delay-600 w-full rounded-2xl bg-[color:var(--color-accent)] py-3 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Создаём…" : "Создать аккаунт"}
                    </button>
                  </form>

                  <div className="animate-element animate-delay-700 mt-5 text-center text-sm text-zinc-600">
                    Уже есть аккаунт?{" "}
                    <Link
                      className="text-[color:var(--color-accent)] transition-colors hover:brightness-95 hover:underline"
                      href="/login"
                    >
                      Войти
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="animate-element animate-delay-200 hidden p-4 md:block md:h-full md:min-h-0">
            <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#F59E2F]">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-[31%] justify-center">
                <Image
                  src="/bears/bear_welcoming_update.png"
                  alt="Bear illustration"
                  width={720}
                  height={960}
                  priority
                  className="h-auto w-[min(44vw,620px)] max-w-[calc(50vw-1.5rem)] translate-x-[1%] select-none object-contain md:w-[min(42vw,580px)]"
                  sizes="(min-width: 768px) 44vw, 0px"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="sr-only">
        <Link href="/login">Войти</Link>
      </div>
    </>
  );
}

