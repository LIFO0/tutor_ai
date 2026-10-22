import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/current-user";
import { redirectToLoginForInvalidSession } from "@/lib/session-redirect";
import { FeedbackForm } from "@/components/support/FeedbackForm";
import { FEEDBACK_CONTACTS } from "@/lib/site-contacts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Написать в поддержку — Мишка знает", robots: { index: false } };

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) return redirectToLoginForInvalidSession();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-10">
      <div className="flex w-full max-w-xl flex-col gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Написать Мишке
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Нашёл ошибку, запутался или придумал что-то классное? Расскажи нам!
          </p>
        </div>
        <FeedbackForm />
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Можно и по почте:{" "}
          {FEEDBACK_CONTACTS.map(({ email }, i) => (
            <span key={email}>
              {i > 0 ? ", " : ""}
              <a href={`mailto:${email}`} className="underline underline-offset-2">
                {email}
              </a>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
