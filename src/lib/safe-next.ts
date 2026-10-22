/**
 * Параметр `?next=` после входа: куда вернуть пользователя. Принимаем только относительный путь
 * на этом же сайте, иначе это open redirect (`/login?next=//evil.example`).
 *
 * Разрешено: строка, начинается ровно с одного «/», без «\\» и управляющих символов
 * (браузеры считают «\\» за «/» и выкидывают \t\n\r, так что «/\\evil», «/\t/evil» — это «//evil»),
 * без схемы и хоста. Страницы входа/регистрации не принимаем, чтобы не зациклиться.
 */
const MAX_NEXT_LENGTH = 2048;
const PROBE_ORIGIN = "http://next.invalid";

export function sanitizeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw;
  if (!value || value.length > MAX_NEXT_LENGTH) return null;
  if (value[0] !== "/") return null;
  if (value[1] === "/" || value[1] === "\\") return null;
  if (value.includes("\\")) return null;
  // Управляющие символы, пробелы и DEL.
  if (/[\u0000-\u0020\u007f]/.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN) return null;

  const path = url.pathname;
  if (path === "/login" || path === "/register" || path.startsWith("/api/")) return null;

  return `${path}${url.search}${url.hash}`;
}

/** `/login?next=<path>` (или просто `/login`, если путь небезопасен). */
export function loginPathWithNext(next: unknown, page: "/login" | "/register" = "/login"): string {
  const safe = sanitizeNextPath(next);
  return safe ? `${page}?next=${encodeURIComponent(safe)}` : page;
}
