/** UTC ISO timestamp for SQLite text columns (consistent with Node clock). */
export function utcNowIso(): string {
  return new Date().toISOString();
}

/** Parse SQLite `DATETIME` / ISO strings as UTC for relative display in the browser. */
export function parseSqliteUtcDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const isoLike = value.includes("T") ? value : value.replace(" ", "T");
  const withZone = /z$/i.test(isoLike) ? isoLike : `${isoLike}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatRelativeTimeRu(from: Date, to = new Date()): string {
  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}
