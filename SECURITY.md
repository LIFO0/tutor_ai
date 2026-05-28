# Security

## If secrets were exposed

Rotate immediately (invalidates active sessions after `JWT_SECRET` change):

1. **Yandex Cloud** — IAM → service account → create a new API key; revoke `YANDEX_GPT_API_KEY`.
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

Use **system environment variables** or a secret manager (Yandex Lockbox, Vault) in production — not committed files.

## Required production env

- `JWT_SECRET` — at least 32 characters, not a placeholder (`change-me`).
- `NEXT_PUBLIC_APP_URL` — e.g. `https://mishkaznaet.ru` (used for OAuth redirects).
- Yandex GPT and OAuth variables as in `.env.local.example`.

## Reverse proxy

Place the app behind nginx/Caddy that sets `X-Forwarded-For` / `X-Real-IP` and **strips** client-supplied values. Rate limiting uses the last IP in `X-Forwarded-For` or `CF-Connecting-IP` when behind Cloudflare.
