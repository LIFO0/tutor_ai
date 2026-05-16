import { formatQuotaResetsAt } from "@/lib/usage-types";

export function QuotaExceededBanner({
  title = "Лимит на сегодня исчерпан",
  message,
  resetsAt,
}: {
  title?: string;
  message: string;
  resetsAt?: string;
}) {
  return (
    <div
      className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200"
      role="status"
    >
      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
      <p className="mt-1 text-zinc-700 dark:text-zinc-300">{message}</p>
      {resetsAt ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Новые запросы — после {formatQuotaResetsAt(resetsAt)} (МСК).
        </p>
      ) : null}
    </div>
  );
}
