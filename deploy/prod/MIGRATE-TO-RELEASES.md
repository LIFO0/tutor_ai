# Прод: переход на деплой «релизами» (однократно)

> Выполнять **после** `MIGRATE-TO-WWW-DATA.md` (сервис уже от www-data). Сначала отработать то же на staging
> (`deploy/staging/MIGRATE-TO-RELEASES.md`) — шаги идентичны, отличаются только переменные ниже.

| | staging | прод |
|---|---|---|
| BASE | `/var/www/tutor-ai-staging` | `$PROD_DIR` (WorkingDirectory прода, напр. `/var/www/tutor-ai`) |
| Ветка | develop | master |
| Сервис / порт | tutor-ai-staging / 3001 | tutor-ai / 3000 |
| Скрипт | `deploy/staging/deploy-staging.sh` | `deploy/prod/deploy-prod.sh` |
| Юнит | `deploy/staging/tutor-ai-staging.service` | `deploy/prod/tutor-ai.releases.service` (плейсхолдеры как в `tutor-ai.service`) |

Зачем: `npm run build` на месте стирает `.next` работающего прода → 500/падение до конца сборки.

## Шаги

```bash
sudo -i
export PROD_DIR=$(systemctl show tutor-ai -p WorkingDirectory --value); echo $PROD_DIR
grep -E '^(DATABASE_PATH|CHAT_UPLOADS_PATH)=' $PROD_DIR/.env.local   # оба ВНЕ $PROD_DIR, иначе СТОП
export DB_DIR=$(dirname "<DATABASE_PATH>") UPLOADS_DIR=<CHAT_UPLOADS_PATH> NPM_BIN=$(which npm)
export BASE=$PROD_DIR BK=/root/prod-releases-migrate-$(date +%Y%m%d-%H%M%S); mkdir -p $BK
cp -a "$(systemctl show tutor-ai -p FragmentPath --value)" $BK/tutor-ai.service.bak
sqlite3 "<DATABASE_PATH>" ".backup '$BK/database.db'"

# 1. раскладка (прод продолжает работать из $BASE.old)
mv $BASE $BASE.old
mkdir -p $BASE/shared $BASE/releases
sudo -u www-data git clone --quiet $BASE.old $BASE/repo 2>/dev/null || { chown www-data: $BASE; sudo -u www-data git clone --quiet $BASE.old $BASE/repo; }
sudo -u www-data git -C $BASE/repo remote set-url origin "$(git -C $BASE.old remote get-url origin)"
install -o www-data -g www-data -m 640 $BASE.old/.env.local $BASE/shared/.env.local
# аватары: в каталог данных рядом с БД (или AVATAR_UPLOADS_PATH в .env.local); отдаются роутом
install -d -o www-data -g www-data $DB_DIR/avatars
[ -d $BASE.old/public/uploads/avatars ] && cp -a $BASE.old/public/uploads/avatars/. $DB_DIR/avatars/ && chown -R www-data: $DB_DIR/avatars
grep -q "^AVATAR_UPLOADS_PATH=" $BASE/shared/.env.local || echo "AVATAR_UPLOADS_PATH=$DB_DIR/avatars" >> $BASE/shared/.env.local
chown -R www-data:www-data $BASE

# 2. первая сборка без рестарта
sudo -u www-data git -C $BASE/repo fetch --quiet origin master
sudo -u www-data git -C $BASE/repo show origin/master:deploy/release-deploy.sh > /tmp/rd.sh
sudo -u www-data BASE_DIR=$BASE BRANCH=master SERVICE=tutor-ai PORT=3000 NO_RESTART=1 bash /tmp/rd.sh deploy
cat $BASE/current/REVISION; ls $BASE/current/.next/BUILD_ID

# 3. юнит
sed -e "s#PROD_DIR#$BASE#g" -e "s#DB_DIR#$DB_DIR#g" -e "s#UPLOADS_DIR#$UPLOADS_DIR#g" -e "s#NPM_BIN#$NPM_BIN#g" \
  $BASE/current/deploy/prod/tutor-ai.releases.service > /tmp/tutor-ai.service
grep -nE 'PROD_DIR|DB_DIR|UPLOADS_DIR|NPM_BIN' /tmp/tutor-ai.service && echo 'ОСТАЛИСЬ ПЛЕЙСХОЛДЕРЫ — СТОП'
diff $BK/tutor-ai.service.bak /tmp/tutor-ai.service
systemd-analyze verify /tmp/tutor-ai.service
install -m 644 /tmp/tutor-ai.service "$(systemctl show tutor-ai -p FragmentPath --value)"
systemctl daemon-reload && systemctl restart tutor-ai
sleep 5; curl -sI http://127.0.0.1:3000 | head -1; curl -sI https://mishkaznaet.ru | head -1
journalctl -u tutor-ai -n 50 --no-pager | grep -iE 'EACCES|EPERM|SQLITE_|error'

# 4. sudo для скрипта
echo 'www-data ALL=(root) NOPASSWD: /usr/bin/systemctl restart tutor-ai' > /etc/sudoers.d/tutor-ai && visudo -c
```

## Деплой и откат

```bash
D=$PROD_DIR/current/deploy/prod/deploy-prod.sh     # BASE_DIR по умолчанию /var/www/tutor-ai; иначе BASE_DIR=… перед вызовом
sudo -u www-data $D             # сборка origin/master в новый релиз, атомарное переключение, рестарт, health-check
sudo -u www-data $D list
sudo -u www-data $D rollback    # на предыдущий релиз
sudo -u www-data $D unpin
```

**Не запускать npm/git в релизах от root.** Откат миграции — как в staging-инструкции
(вернуть `$BK/tutor-ai.service.bak`, `mv $BASE.old $BASE`, `daemon-reload`, `restart`).
