import { NextResponse, type NextRequest } from "next/server";
import { readAuthCookieFromRequest, verifyAuthToken } from "@/lib/auth";
import { NOT_FOUND_REWRITE_PATH, isUnknownContentSlug } from "@/lib/content-routes";
import { sanitizeNextPath } from "@/lib/safe-next";

const PUBLIC_PATHS = new Set([
  "/",
  "/privacy",
  "/help",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/yandex/start",
  "/api/auth/yandex/callback",
]);

function isApi(pathname: string) {
  return pathname.startsWith("/api/");
}

function isProtected(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return false;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/chat")) return true;
  if (pathname.startsWith("/tasks")) return true;
  if (pathname.startsWith("/profile")) return true;
  if (pathname.startsWith("/settings")) return true;
  if (pathname === "/support" || pathname.startsWith("/support/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  if (pathname.startsWith("/api/chat")) return true;
  if (pathname.startsWith("/api/tasks")) return true;
  if (pathname.startsWith("/api/profile")) return true;
  if (pathname.startsWith("/api/usage")) return true;
  return false;
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  const next = sanitizeNextPath(`${req.nextUrl.pathname}${req.nextUrl.search}`);
  url.pathname = "/login";
  url.search = "";
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

async function redirectAuthenticatedFromAuthPages(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname !== "/login" && pathname !== "/register") return null;

  const token = readAuthCookieFromRequest(req);
  if (!token) return null;

  try {
    await verifyAuthToken(token);
  } catch {
    return null;
  }

  const next = sanitizeNextPath(req.nextUrl.searchParams.get("next"));
  return NextResponse.redirect(new URL(next ?? "/dashboard", req.nextUrl.origin));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isUnknownContentSlug(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = NOT_FOUND_REWRITE_PATH;
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const authRedirect = await redirectAuthenticatedFromAuthPages(req);
  if (authRedirect) return authRedirect;

  if (!isProtected(pathname)) return NextResponse.next();

  const token = readAuthCookieFromRequest(req);
  if (!token) {
    if (isApi(pathname)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return redirectToLogin(req);
  }

  try {
    await verifyAuthToken(token);
    return NextResponse.next();
  } catch {
    if (isApi(pathname)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return redirectToLogin(req);
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};

