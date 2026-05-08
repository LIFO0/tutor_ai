import { eq, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/auth";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

const OAUTH_STATE_COOKIE = "yandex_oauth_state";
const OAUTH_VERIFIER_COOKIE = "yandex_oauth_verifier";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

type YandexTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type YandexUserInfo = {
  id?: string;
  login?: string;
  default_email?: string;
  emails?: string[];
  first_name?: string;
  last_name?: string;
  real_name?: string;
  display_name?: string;
  is_avatar_empty?: boolean;
  default_avatar_id?: string;
};

function buildName(info: YandexUserInfo) {
  const first = (info.first_name ?? "").trim();
  const last = (info.last_name ?? "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();
  return (
    full ||
    (info.real_name ?? "").trim() ||
    (info.display_name ?? "").trim() ||
    (info.login ?? "").trim() ||
    "Ученик"
  );
}

function buildAvatarUrl(info: YandexUserInfo) {
  const id = (info.default_avatar_id ?? "").trim();
  if (!id) return null;
  if (info.is_avatar_empty === true) return null;
  return `https://avatars.yandex.net/get-yapic/${encodeURIComponent(id)}/islands-200`;
}

export async function GET(req: Request) {
  const db = getDb();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return jsonError(errorDescription || error, 400);
  }
  if (!code || !state) return jsonError("Missing OAuth code/state", 400);

  const c = await cookies();
  const expectedState = c.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = c.get(OAUTH_VERIFIER_COOKIE)?.value;

  // Clear cookies early to avoid reuse.
  c.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  c.set(OAUTH_VERIFIER_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });

  if (!expectedState || expectedState !== state || !codeVerifier) {
    return jsonError("Invalid OAuth state", 400);
  }

  const clientId = requiredEnv("YANDEX_OAUTH_CLIENT_ID");
  const clientSecret = requiredEnv("YANDEX_OAUTH_CLIENT_SECRET");
  const redirectUri = requiredEnv("YANDEX_OAUTH_REDIRECT_URI");

  const tokenRes = await fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
    cache: "no-store",
  });

  const tokenJson = (await tokenRes.json().catch(() => null)) as YandexTokenResponse | null;
  const accessToken = tokenJson?.access_token;
  if (!tokenRes.ok || !accessToken) {
    return jsonError(tokenJson?.error_description || "Failed to get OAuth token", 400);
  }

  const infoRes = await fetch("https://login.yandex.ru/info?format=json", {
    headers: { Authorization: `OAuth ${accessToken}` },
    cache: "no-store",
  });
  const info = (await infoRes.json().catch(() => null)) as YandexUserInfo | null;
  if (!infoRes.ok || !info) return jsonError("Failed to fetch user info", 400);

  const yandexId = (info.id ?? "").trim();
  const email = (info.default_email || info.emails?.[0] || "").trim().toLowerCase();

  if (!yandexId) return jsonError("Yandex user id missing", 400);
  if (!email || !email.includes("@")) return jsonError("Email not provided by Yandex", 400);

  const name = buildName(info);
  const avatarUrl = buildAvatarUrl(info);

  const existing = await db
    .select({
      id: schema.users.id,
      grade: schema.users.grade,
      yandexId: schema.users.yandexId,
      avatar: schema.users.avatar,
    })
    .from(schema.users)
    .where(or(eq(schema.users.yandexId, yandexId), eq(schema.users.email, email)))
    .limit(1);

  let userId = existing[0]?.id;
  let grade = existing[0]?.grade ?? 7;
  let created = false;

  if (userId) {
    const patch: Partial<{ yandexId: string; avatar: string; name: string }> = {};
    if (!existing[0]?.yandexId) patch.yandexId = yandexId;
    if (avatarUrl && (!existing[0]?.avatar || /^bear[1-4]$/.test(existing[0]?.avatar))) {
      patch.avatar = avatarUrl;
    }
    // If user exists by email and had placeholder name, update once.
    if (name && name !== "Ученик") {
      patch.name = name;
    }
    if (Object.keys(patch).length) {
      await db.update(schema.users).set(patch).where(eq(schema.users.id, userId));
    }
  } else {
    const inserted = await db
      .insert(schema.users)
      .values({
        email,
        password: null,
        name,
        grade: 7,
        avatar: avatarUrl || "bear1",
        yandexId,
      })
      .returning({ id: schema.users.id, grade: schema.users.grade });
    userId = inserted[0]?.id;
    grade = inserted[0]?.grade ?? 7;
    created = true;
  }

  if (!userId) return jsonError("Failed to sign in", 500);

  const token = await signAuthToken({ userId, grade });
  await setAuthCookie(token);

  const redirectTo = new URL("/dashboard", url);
  if (created) redirectTo.searchParams.set("onboarding", "grade");
  return NextResponse.redirect(redirectTo);
}

