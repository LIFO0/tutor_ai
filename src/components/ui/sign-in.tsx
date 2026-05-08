"use client";

import React, { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { Eye, EyeOff } from "lucide-react";

export type SignInRightImage = string | StaticImageData;

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onTestSignIn?: () => void;
  onCreateAccount?: () => void;
  extraActions?: React.ReactNode;
  error?: React.ReactNode;
  loading?: boolean;
  defaultEmail?: string;
  rightImage?: SignInRightImage;
  rightImageAlt?: string;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="auth-input-wrap rounded-2xl border border-zinc-200/80 bg-white/70 backdrop-blur-sm shadow-sm transition-colors">
    {children}
  </div>
);

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light tracking-tighter text-zinc-900">С возвращением</span>,
  description = "Войдите в аккаунт и продолжайте учиться.",
  onSignIn,
  onTestSignIn,
  onCreateAccount,
  extraActions,
  error,
  loading = false,
  defaultEmail,
  rightImage,
  rightImageAlt = "Cover",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[100dvh] w-full bg-white">
      <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="flex flex-col gap-8">
              <div className="animate-element animate-delay-100">
                <div className="text-sm font-medium text-zinc-900/80">🐻 Мишка знает</div>
                <h1 className="mt-2 text-4xl font-semibold leading-tight text-zinc-900">{title}</h1>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
              </div>

              <div className="bg-transparent p-0 shadow-none backdrop-blur-0">
                <form className="space-y-5" onSubmit={onSignIn}>
                  <div className="animate-element animate-delay-200">
                    <label className="text-sm font-medium text-zinc-700">Email</label>
                    <GlassInputWrapper>
                      <input
                        name="email"
                        type="email"
                        defaultValue={defaultEmail}
                        autoComplete="email"
                        placeholder="name@example.com"
                        className="w-full rounded-2xl bg-transparent p-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                      />
                    </GlassInputWrapper>
                  </div>

                  <div className="animate-element animate-delay-300">
                    <label className="text-sm font-medium text-zinc-700">Пароль</label>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Введите пароль"
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

                  {error ? <div className="text-sm text-red-600">{error}</div> : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="animate-element animate-delay-400 w-full rounded-2xl bg-[color:var(--color-accent)] py-3 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Входим…" : "Войти"}
                  </button>
                </form>

                {extraActions ? (
                  <div className="animate-element animate-delay-450 mt-3">{extraActions}</div>
                ) : null}

                <button
                  type="button"
                  onClick={onTestSignIn}
                  disabled={loading}
                  className="animate-element animate-delay-500 mt-3 w-full rounded-2xl border border-zinc-200 bg-white/70 py-3 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Войти как тестовый ученик
                </button>

                <div className="animate-element animate-delay-600 mt-5 text-center text-sm text-zinc-600">
                  Нет аккаунта?{" "}
                  <button
                    type="button"
                    className="text-[color:var(--color-accent)] transition-colors hover:brightness-95 hover:underline"
                    onClick={onCreateAccount}
                    disabled={loading}
                  >
                    Зарегистрироваться
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {rightImage ? (
          <section className="animate-element animate-delay-200 hidden p-4 md:block md:h-full md:min-h-0">
            <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#F59E2F]">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-[31%] justify-center">
                <Image
                  src={rightImage}
                  alt={rightImageAlt}
                  width={720}
                  height={960}
                  priority
                  className="h-auto w-[min(44vw,620px)] max-w-[calc(50vw-1.5rem)] translate-x-[1%] select-none object-contain md:w-[min(42vw,580px)]"
                  sizes="(min-width: 768px) 44vw, 0px"
                />
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

