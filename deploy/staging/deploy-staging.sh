#!/usr/bin/env bash
# Обновление staging: sudo -u www-data /var/www/tutor-ai-staging/deploy/staging/deploy-staging.sh
# (рестарт сервиса требует sudo-права на systemctl restart tutor-ai-staging)
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/tutor-ai-staging}"
BRANCH="${BRANCH:-develop}"
SERVICE="${SERVICE:-tutor-ai-staging}"

cd "$APP_DIR"
[ -f .env.local ] || { echo "Нет $APP_DIR/.env.local" >&2; exit 1; }

echo "==> git fetch / reset на origin/$BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
git log -1 --oneline

echo "==> npm ci"
npm ci

echo "==> npm run build"
npm run build

echo "==> restart $SERVICE"
sudo systemctl restart "$SERVICE"
sleep 3
systemctl --no-pager --lines=5 status "$SERVICE" || true
echo "Готово: https://test.mishkaznaet.ru"
