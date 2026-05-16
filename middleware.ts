import { NextResponse, type NextRequest } from "next/server";
import { readAuthCookieFromRequest, verifyAuthToken } from "@/lib/auth";

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
  if (pathname.startsWith("/api/chat")) return true;
  if (pathname.startsWith("/api/tasks")) return true;
  if (pathname.startsWith("/api/profile")) return true;
  if (pathname.startsWith("/api/usage")) return true;
  return false;
}

function isSafeInternalPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
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

  const next = req.nextUrl.searchParams.get("next");
  const url = req.nextUrl.clone();
  url.search = "";
  if (next && isSafeInternalPath(next) && isProtected(next)) {
    url.pathname = next;
  } else {
    url.pathname = "/dashboard";
  }
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const authRedirect = await redirectAuthenticatedFromAuthPages(req);
  if (authRedirect) return authRedirect;

  if (!isProtected(pathname)) return NextResponse.next();

  const token = readAuthCookieFromRequest(req);
  if (!token) {
    if (isApi(pathname)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await verifyAuthToken(token);
    return NextResponse.next();
  } catch {
    if (isApi(pathname)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};

