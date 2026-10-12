#!/usr/bin/env bash
# Деплой прода (релизы + атомарное переключение, см. deploy/release-deploy.sh):
#   sudo -u www-data /srv/tutor_ai/current/deploy/prod/deploy-prod.sh            # deploy
#   sudo -u www-data /srv/tutor_ai/current/deploy/prod/deploy-prod.sh rollback   # откат
#   sudo -u www-data /srv/tutor_ai/current/deploy/prod/deploy-prod.sh list
# BASE_DIR по умолчанию /srv/tutor_ai (реальный каталог прода).
# Требует sudo-права www-data на `systemctl restart tutor-ai`.
set -euo pipefail

export BASE_DIR="${BASE_DIR:-/srv/tutor_ai}"
export BRANCH="${BRANCH:-master}"
export SERVICE="${SERVICE:-tutor-ai}"
export PORT="${PORT:-3000}"

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/release-deploy.sh"
RUNNER="$BASE_DIR/.release-deploy.sh"
cp -f "$SRC" "$RUNNER.tmp" && chmod +x "$RUNNER.tmp" && mv -f "$RUNNER.tmp" "$RUNNER"
exec "$RUNNER" "$@"
