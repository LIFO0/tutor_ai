#!/usr/bin/env bash
# Обновление staging (релизы + атомарное переключение, см. deploy/release-deploy.sh):
#   sudo -u www-data /var/www/tutor-ai-staging/current/deploy/staging/deploy-staging.sh            # deploy
#   sudo -u www-data /var/www/tutor-ai-staging/current/deploy/staging/deploy-staging.sh rollback   # откат
#   sudo -u www-data /var/www/tutor-ai-staging/current/deploy/staging/deploy-staging.sh list
# Требует sudo-права www-data на `systemctl restart tutor-ai-staging` (README, п. 8).
set -euo pipefail

export BASE_DIR="${BASE_DIR:-/var/www/tutor-ai-staging}"
export BRANCH="${BRANCH:-develop}"
export SERVICE="${SERVICE:-tutor-ai-staging}"
export PORT="${PORT:-3001}"

# Запускаем копию общего скрипта вне релизов: текущий релиз может быть удалён при очистке.
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/release-deploy.sh"
RUNNER="$BASE_DIR/.release-deploy.sh"
cp -f "$SRC" "$RUNNER.tmp" && chmod +x "$RUNNER.tmp" && mv -f "$RUNNER.tmp" "$RUNNER"
exec "$RUNNER" "$@"
