# Security

## If secrets were exposed

Rotate immediately (invalidates active sessions after `JWT_SECRET` change):

1. **Google Gemini API** — [Google AI Studio](https://aistudio.google.com/) → API keys → create a new key; revoke the old `GEMINI_API_KEY`.
2. **Yandex ID OAuth** — application settings → regenerate client secret; update `YANDEX_OAUTH_CLIENT_SECRET`.
3. **JWT** — generate a new secret (≥ 32 bytes):

   ```bash
   openssl rand -base64 32
   ```

   Set `JWT_SECRET` in production env and restart the app. All users must sign in again.

4. Confirm `.env.local` is **not** in git:

   ```bash
   git log --all --full-history -- .env.local
   git check-ignore -v .env.local
   ```

Use **system environment variables** or a secret manager (Vault, etc.) in production — not committed files.

## Required production env

- `JWT_SECRET` — at least 32 characters, not a placeholder (`change-me`).
- `NEXT_PUBLIC_APP_URL` — e.g. `https://mishkaznaet.ru` (used for OAuth redirects).
- `GEMINI_API_KEY` — Google AI Studio / Gemini API key (optional `GEMINI_MODEL`, default `gemini-3.5-flash-lite`).
- Yandex ID OAuth variables as in `.env.local.example` (if social login is enabled).

## Reverse proxy

Place the app behind nginx/Caddy that sets `X-Forwarded-For` / `X-Real-IP` and **strips** client-supplied values. Rate limiting uses the last IP in `X-Forwarded-For` or `CF-Connecting-IP` when behind Cloudflare.
