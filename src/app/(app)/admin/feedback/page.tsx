import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/current-user";
import { feedbackTopicLabel, isAdminEmail } from "@/lib/feedback";
import { listFeedback } from "@/lib/feedback-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Обращения", robots: { index: false } };

export default async function AdminFeedbackPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) notFound();

  const rows = listFeedback(200);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Обращения ({rows.length})</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Пока пусто.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">#{r.id}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{feedbackTopicLabel(r.topic)}</span>
                <span>{r.createdAt} UTC</span>
                <span>
                  {r.userName ?? "—"} · {r.userEmail ? <a href={`mailto:${r.userEmail}`} className="underline">{r.userEmail}</a> : `id ${r.userId}`}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-zinc-900 dark:text-zinc-50">{r.text}</p>
              {r.screenshotKey ? (
                <a
                  href={`/api/feedback/screenshot/${r.screenshotKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs underline"
                >
                  Открыть скриншот
                </a>
              ) : null}
              {r.pageUrl || r.userAgent ? (
                <p className="mt-2 break-all text-[11px] text-zinc-400">
                  {r.pageUrl}
                  {r.pageUrl && r.userAgent ? " · " : ""}
                  {r.userAgent}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
