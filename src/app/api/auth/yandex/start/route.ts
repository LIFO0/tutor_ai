import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

const OAUTH_STATE_COOKIE = "yandex_oauth_state";
const OAUTH_VERIFIER_COOKIE = "yandex_oauth_verifier";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function sha256Base64Url(input: string) {
  const hash = createHash("sha256").update(input).digest();
  return base64UrlEncode(hash);
}

export async function GET() {
  const clientId = requiredEnv("YANDEX_OAUTH_CLIENT_ID");
  const redirectUri = requiredEnv("YANDEX_OAUTH_REDIRECT_URI");

  const state = base64UrlEncode(randomBytes(32));
  const codeVerifier = base64UrlEncode(randomBytes(64));
  const codeChallenge = sha256Base64Url(codeVerifier);

  const c = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const maxAge = 60 * 10; // 10 minutes

  c.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
  c.set(OAUTH_VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });

  const url = new URL("https://oauth.yandex.ru/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "login:email login:info login:avatar");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(url);
}

