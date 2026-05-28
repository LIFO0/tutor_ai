import "server-only";

/** Canonical site origin for redirects (OAuth callback). Never trust X-Forwarded-* from clients. */
export function getAppOrigin(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const redirectUri = process.env.YANDEX_OAUTH_REDIRECT_URI?.trim();
  if (redirectUri) {
    try {
      return new URL(redirectUri).origin;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAppUrl(pathname: string, search = ""): string {
  const origin = getAppOrigin();
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const query = search.startsWith("?") ? search : search ? `?${search}` : "";
  if (origin) return `${origin}${path}${query}`;
  return `${path}${query}`;
}
