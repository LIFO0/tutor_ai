#!/usr/bin/env bash
# Общий деплой «релизами» с атомарным переключением (staging и прод).
#
# Раскладка BASE_DIR:
#   repo/                      git-клон (только fetch, рабочую копию не трогаем)
#   releases/<YYYYmmdd-HHMMSS>-<sha>/   экспорт ветки + node_modules + .next
#   shared/.env.local          секреты (симлинк в каждый релиз)
#   shared/uploads/            public/uploads (аватары) — симлинк в каждый релиз
#   current -> releases/...    то, что запускает systemd (WorkingDirectory)
#   .deploy.lock               flock против параллельных запусков (ручной + таймер)
#
# Использование:
#   release-deploy.sh deploy    — собрать новый релиз из origin/$BRANCH и переключиться
#   release-deploy.sh rollback  — переключить current на предыдущий релиз
#   release-deploy.sh rollback <релиз> — переключить на указанный релиз
#   release-deploy.sh list      — показать релизы
#   release-deploy.sh unpin     — снять блокировку автодеплоя, поставленную rollback
# Переменные: BASE_DIR, BRANCH, SERVICE, PORT (обязательны), KEEP_RELEASES (3), FORCE=1 (собрать даже без новых коммитов),
#             NO_RESTART=1 (только собрать и переключить current — для первичной миграции),
#             HEALTH_URL (по умолчанию http://127.0.0.1:$PORT/), SYSTEMCTL (по умолчанию "sudo systemctl").
# БД и CHAT_UPLOADS_PATH должны лежать вне BASE_DIR/releases (например, /var/lib/...).
set -euo pipefail

: "${BASE_DIR:?BASE_DIR не задан}"
: "${BRANCH:?BRANCH не задан}"
: "${SERVICE:?SERVICE не задан}"
: "${PORT:?PORT не задан}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${PORT}/}"
SYSTEMCTL="${SYSTEMCTL:-sudo systemctl}"

REPO_DIR="$BASE_DIR/repo"
RELEASES_DIR="$BASE_DIR/releases"
SHARED_DIR="$BASE_DIR/shared"
CURRENT="$BASE_DIR/current"
LOCK_FILE="$BASE_DIR/.deploy.lock"
# После rollback автодеплой (таймер) не должен сразу вернуть сломанный релиз.
PIN_FILE="$BASE_DIR/.deploy-pinned"

log() { printf '==> %s\n' "$*"; }
die() { printf 'ОШИБКА: %s\n' "$*" >&2; exit 1; }

current_release() {
  [ -L "$CURRENT" ] || return 0
  basename "$(readlink "$CURRENT")"
}

# Релизы по возрастанию (имя начинается с даты).
list_releases() {
  [ -d "$RELEASES_DIR" ] || return 0
  find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort
}

switch_to() {
  local name="$1"
  [ -d "$RELEASES_DIR/$name" ] || die "нет релиза $name"
  # Атомарно: новый симлинк рядом + rename поверх старого.
  ln -sfn "releases/$name" "$BASE_DIR/.current.tmp"
  mv -Tf "$BASE_DIR/.current.tmp" "$CURRENT"
  log "current -> releases/$name"
}

restart_and_check() {
  log "restart $SERVICE"
  $SYSTEMCTL restart "$SERVICE"
  local i
  for i in $(seq 1 30); do
    if curl -fsS -o /dev/null --max-time 5 "$HEALTH_URL" 2>/dev/null; then
      log "сервис отвечает ($HEALTH_URL)"
      return 0
    fi
    # 3xx/401 тоже считаем живым ответом
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$HEALTH_URL" 2>/dev/null || true)"
    case "$code" in 2??|3??|401) log "сервис отвечает (HTTP $code)"; return 0 ;; esac
    sleep 2
  done
  return 1
}

prune_releases() {
  local cur keep_from all count
  cur="$(current_release)"
  mapfile -t all < <(list_releases)
  count="${#all[@]}"
  [ "$count" -gt "$KEEP_RELEASES" ] || return 0
  keep_from=$((count - KEEP_RELEASES))
  local i
  for ((i = 0; i < keep_from; i++)); do
    [ "${all[$i]}" = "$cur" ] && continue
    log "удаляю старый релиз ${all[$i]}"
    rm -rf -- "${RELEASES_DIR:?}/${all[$i]}"
  done
}

BUILD_DIR=""
cleanup_failed_build() {
  local rc=$?
  if [ "$rc" -ne 0 ] && [ -n "$BUILD_DIR" ] && [ -d "$BUILD_DIR" ]; then
    echo "Сборка не удалась, current не изменён ($(current_release))" >&2
    rm -rf -- "$BUILD_DIR"
  fi
}

cmd_deploy() {
  [ -d "$REPO_DIR/.git" ] || die "нет git-клона $REPO_DIR (см. MIGRATE-TO-RELEASES.md)"
  [ -f "$SHARED_DIR/.env.local" ] || die "нет $SHARED_DIR/.env.local"
  mkdir -p "$RELEASES_DIR" "$SHARED_DIR/uploads"

  if [ -f "$PIN_FILE" ] && [ "${FORCE:-0}" != "1" ]; then
    log "деплой заблокирован после отката: $(cat "$PIN_FILE")"
    log "снять: release-deploy unpin  (или FORCE=1 … deploy)"
    return 0
  fi

  log "git fetch origin $BRANCH"
  git -C "$REPO_DIR" fetch --quiet origin "$BRANCH"
  local sha short name dir cur
  sha="$(git -C "$REPO_DIR" rev-parse "origin/$BRANCH")"
  short="${sha:0:7}"
  git -C "$REPO_DIR" log -1 --oneline "$sha"

  cur="$(current_release)"
  if [ "${FORCE:-0}" != "1" ] && [ -n "$cur" ] && [ "${cur##*-}" = "$short" ]; then
    log "уже развёрнут $short ($cur) — нечего делать (FORCE=1 для пересборки)"
    return 0
  fi

  name="$(date +%Y%m%d-%H%M%S)-$short"
  dir="$RELEASES_DIR/$name"
  log "сборка релиза $name"
  mkdir -p "$dir"
  # При ошибке сборки удаляем недособранный релиз; current не трогаем.
  BUILD_DIR="$dir"
  trap cleanup_failed_build EXIT

  git -C "$REPO_DIR" archive --format=tar "$sha" | tar -x -C "$dir"
  printf '%s\n' "$sha" > "$dir/REVISION"
  ln -sfn "$SHARED_DIR/.env.local" "$dir/.env.local"
  mkdir -p "$dir/public"
  rm -rf "$dir/public/uploads"
  ln -sfn "$SHARED_DIR/uploads" "$dir/public/uploads"

  (
    cd "$dir"
    log "npm ci"
    npm ci --no-audit --no-fund
    log "npm run build"
    npm run build
    [ -f .next/BUILD_ID ] || die "после сборки нет .next/BUILD_ID"
  )
  trap - EXIT

  local prev="$cur"
  switch_to "$name"
  if [ "${NO_RESTART:-0}" = "1" ]; then
    log "NO_RESTART=1: релиз собран и current переключён, сервис НЕ перезапущен"
    return 0
  fi
  if ! restart_and_check; then
    echo "Сервис не поднялся на новом релизе" >&2
    if [ -n "$prev" ] && [ -d "$RELEASES_DIR/$prev" ]; then
      echo "Откат на $prev" >&2
      switch_to "$prev"
      $SYSTEMCTL restart "$SERVICE" || true
    fi
    exit 1
  fi
  rm -f "$PIN_FILE"
  prune_releases
  $SYSTEMCTL --no-pager --lines=5 status "$SERVICE" || true
  log "Готово: $name"
}

cmd_rollback() {
  local cur target="${1:-}" all i
  cur="$(current_release)"
  mapfile -t all < <(list_releases)
  if [ -z "$target" ]; then
    for ((i = ${#all[@]} - 1; i >= 0; i--)); do
      if [ "${all[$i]}" = "$cur" ] && [ "$i" -gt 0 ]; then
        target="${all[$((i - 1))]}"
        break
      fi
    done
  fi
  [ -n "$target" ] || die "нет предыдущего релиза для отката (текущий: ${cur:-нет})"
  log "откат: $cur -> $target"
  switch_to "$target"
  printf 'rollback %s -> %s at %s\n' "$cur" "$target" "$(date -Is)" > "$PIN_FILE"
  log "автодеплой приостановлен (unpin или FORCE=1 deploy, чтобы возобновить)"
  restart_and_check || die "сервис не отвечает после отката — смотрите journalctl -u $SERVICE"
}

cmd_list() {
  local cur r
  cur="$(current_release)"
  while read -r r; do
    [ -n "$r" ] || continue
    if [ "$r" = "$cur" ]; then echo "* $r (current)"; else echo "  $r"; fi
  done < <(list_releases)
}

main() {
  local action="${1:-deploy}"
  shift || true
  mkdir -p "$BASE_DIR"
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "Другой деплой уже идёт ($LOCK_FILE) — выходим" >&2
    exit 75
  fi
  case "$action" in
    deploy) cmd_deploy ;;
    rollback) cmd_rollback "${1:-}" ;;
    list) cmd_list ;;
    unpin) rm -f "$PIN_FILE"; log "автодеплой снова включён" ;;
    *) die "неизвестная команда: $action (deploy|rollback [релиз]|list|unpin)" ;;
  esac
}

main "$@"
