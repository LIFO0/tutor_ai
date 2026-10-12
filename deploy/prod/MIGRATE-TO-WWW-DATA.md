# Перевод прод-сервиса `tutor-ai` с root на www-data

> **Инструкция рассчитана на выполнение агентом Cursor (или человеком) по шагам на VPS.**
> Выполнять команды строго по порядку, после каждого блока сверять вывод с ожидаемым.
> При любой неожиданности — остановиться и перейти к разделу «Откат».

Сейчас юнит `tutor-ai` не содержит `User=` → процесс работает от **root**. Цель — запуск от `www-data`
(как staging, см. `deploy/staging/tutor-ai-staging.service`) с hardening-опциями. Шаблон: `deploy/prod/tutor-ai.service`.

Ожидаемый простой: секунды (только `systemctl restart`). `chown` выполняется на работающем сервисе.

## 0. Preflight (ничего не меняет)

```bash
sudo -i
systemctl cat tutor-ai                       # текущий юнит: путь к файлу, WorkingDirectory, ExecStart, порт
systemctl show tutor-ai -p FragmentPath -p WorkingDirectory -p ExecStart -p User
export PROD_DIR=$(systemctl show tutor-ai -p WorkingDirectory --value); echo "$PROD_DIR"
cd "$PROD_DIR" && git status -sb && git log -1 --oneline
grep -E '^(DATABASE_PATH|CHAT_UPLOADS_PATH)=' .env.local
# переменные, с которыми реально запущен процесс:
PID=$(systemctl show tutor-ai -p MainPID --value); tr '\0' '\n' < /proc/$PID/environ | grep -E 'DATABASE_PATH|CHAT_UPLOADS_PATH|HOME|PORT'
which npm node; node -v
ss -ltnp | grep 3000                          # порт, который слушает прод
```

Зафиксировать:
```bash
export DB_FILE=<значение DATABASE_PATH>       # если не задан — БД в профиле root (~/.local/share/... / $HOME) → см. п.1
export DB_DIR=$(dirname "$DB_FILE")
export UPLOADS_DIR=<значение CHAT_UPLOADS_PATH>
export NPM_BIN=$(which npm)
```

> Если `DATABASE_PATH` или `CHAT_UPLOADS_PATH` указывают в `/root/...` — www-data туда не попадёт.
> Сначала перенести данные в `/var/lib/tutor-ai/` и поправить `.env.local` (отдельное окно обслуживания со `stop`).

### Бэкапы (обязательно)

```bash
export BK=/root/tutor-ai-migrate-$(date +%Y%m%d-%H%M%S); mkdir -p "$BK"
cp -a "$(systemctl show tutor-ai -p FragmentPath --value)" "$BK/tutor-ai.service.bak"
ls /etc/systemd/system/tutor-ai.service.d/ 2>/dev/null && cp -a /etc/systemd/system/tutor-ai.service.d "$BK/"
# консистентная копия SQLite на живой базе:
sqlite3 "$DB_FILE" ".backup '$BK/database.db'" || cp -a "$DB_FILE"* "$BK/"
# снимок владельцев/прав для отката (без node_modules — их проще chown целиком):
for d in "$PROD_DIR" "$DB_DIR" "$UPLOADS_DIR"; do
  find "$d" -path '*/node_modules' -prune -o -printf '%u:%g %m %p\n' ; done > "$BK/ownership.txt"
ls -la "$PROD_DIR" "$DB_DIR" "$UPLOADS_DIR" > "$BK/ls-la.txt"
wc -l "$BK/ownership.txt"; ls -la "$BK"
```

## 1. Где сервис пишет вне проекта

Проверить, что www-data сможет писать везде, куда пишет приложение:

| Что | Где | Действие |
|---|---|---|
| SQLite (`DATABASE_PATH`) + `-wal`/`-shm` | `$DB_DIR` | chown каталога целиком |
| Чат-вложения (`CHAT_UPLOADS_PATH`) | `$UPLOADS_DIR` | chown |
| Аватары | `$PROD_DIR/public/uploads/avatars` | chown |
| Кэш Next.js | `$PROD_DIR/.next` (в т.ч. `.next/cache`) | chown |
| Логи | journald (stdout) — файлы не нужны | проверить `grep -rn 'appendFile\|createWriteStream' src` |
| npm-кэш / HOME | у www-data `HOME=/var/www` → `/var/www/.npm` | `mkdir -p /var/www/.npm && chown www-data: /var/www/.npm` |

```bash
# файлы, недавно изменённые root вне проекта (подсказка, куда ещё пишет процесс):
ls -l /proc/$PID/fd | grep -vE 'socket|pipe|/dev/'
find / -xdev -user root -newer "$PROD_DIR/.next/BUILD_ID" -type f \
  -not -path '/proc/*' -not -path '/sys/*' -not -path '/var/log/*' -not -path "$PROD_DIR/*" 2>/dev/null | head -50
getent passwd www-data                        # HOME www-data
```

## 2. Миграция

```bash
# 2.1 Права (сервис ещё работает от root — ему это не мешает)
chown -R www-data:www-data "$PROD_DIR" "$DB_DIR" "$UPLOADS_DIR"
mkdir -p /var/www/.npm && chown www-data:www-data /var/www/.npm
chmod 640 "$PROD_DIR/.env.local"              # секреты: читает только www-data

# 2.2 Юнит из шаблона (подставить плейсхолдеры)
sed -e "s#PROD_DIR#$PROD_DIR#g" -e "s#DB_DIR#$DB_DIR#g" \
    -e "s#UPLOADS_DIR#$UPLOADS_DIR#g" -e "s#NPM_BIN#$NPM_BIN#g" \
    "$PROD_DIR/deploy/prod/tutor-ai.service" > /tmp/tutor-ai.service
diff "$BK/tutor-ai.service.bak" /tmp/tutor-ai.service   # сверить ExecStart/порт с текущими!
grep -nE 'PROD_DIR|DB_DIR|UPLOADS_DIR|NPM_BIN' /tmp/tutor-ai.service && echo 'ОСТАЛИСЬ ПЛЕЙСХОЛДЕРЫ — СТОП'
systemd-analyze verify /tmp/tutor-ai.service
install -m 644 /tmp/tutor-ai.service /etc/systemd/system/tutor-ai.service

# 2.3 Перезапуск
systemctl daemon-reload
systemctl restart tutor-ai
```

> Если `DB_DIR` = `PROD_DIR` или вложен в него — дубли в `ReadWritePaths` безвредны. Несуществующий путь в
> `ReadWritePaths` роняет запуск (ошибка 226/NAMESPACE) — создать каталог или префиксовать `-`.

## 3. Проверка

```bash
systemctl status tutor-ai --no-pager
ps -o user,pid,cmd -C node                    # ожидается www-data
curl -sI http://127.0.0.1:3000 | head -1      # 200/307
curl -sI https://mishkaznaet.ru | head -1
journalctl -u tutor-ai -n 100 --no-pager | grep -iE 'EACCES|EPERM|SQLITE_READONLY|SQLITE_CANTOPEN|error'
```

Вручную: вход, запись в БД (сообщение в чате), загрузка вложения в чат, смена аватара. После — снова `journalctl`.

## 4. Деплой в будущем (от www-data)

> **Рекомендуется следующим шагом перейти на деплой релизами** (сборка в отдельном каталоге, атомарный
> `current`-симлинк, `rollback`): `deploy/prod/MIGRATE-TO-RELEASES.md`, скрипт `deploy/prod/deploy-prod.sh`.
> Команды ниже — старый способ: сборка на месте роняет сервис до её окончания.

```bash
cd "$PROD_DIR"
sudo -u www-data git pull
sudo -u www-data npm ci          # если менялись зависимости
sudo -u www-data npm run build
sudo systemctl restart tutor-ai
```

**Не запускать `git`/`npm` в `$PROD_DIR` от root** — появятся root-файлы в `.next`/`node_modules`, и сервис получит EACCES.
Если всё же случилось: `chown -R www-data:www-data "$PROD_DIR"`.

**git safe.directory:** если `git` от root ругается `detected dubious ownership` (каталог теперь чужой):
```bash
git config --global --add safe.directory "$PROD_DIR"   # только для root; для www-data не нужно
```

## 5. Откат

```bash
# 5.1 вернуть юнит
cp -a "$BK/tutor-ai.service.bak" "$(systemctl show tutor-ai -p FragmentPath --value)"
systemctl daemon-reload

# 5.2 вернуть владельцев
# вариант А — точно по снимку:
while read -r og mode path; do chown -h "$og" "$path"; chmod "$mode" "$path" 2>/dev/null; done < "$BK/ownership.txt"
chown -R root:root "$PROD_DIR/node_modules"
# вариант Б — грубо (до миграции всё было root):
# chown -R root:root "$PROD_DIR" "$DB_DIR" "$UPLOADS_DIR"

# 5.3 перезапуск и проверка
systemctl restart tutor-ai
systemctl status tutor-ai --no-pager; curl -sI http://127.0.0.1:3000 | head -1

# 5.4 только если повреждена БД (потеряет записи после бэкапа!):
# systemctl stop tutor-ai; cp -a "$BK/database.db" "$DB_FILE"; rm -f "$DB_FILE-wal" "$DB_FILE-shm"; systemctl start tutor-ai
```
