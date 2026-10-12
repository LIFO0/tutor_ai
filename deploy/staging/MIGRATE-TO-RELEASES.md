# Staging: переход на деплой «релизами» (однократно)

> **Инструкция рассчитана на выполнение агентом Cursor (или человеком) по шагам на VPS.**
> Выполнять блоки по порядку, сверять вывод. При неожиданности — остановиться и перейти к «Откату».

**Зачем.** Раньше `deploy-staging.sh` делал `npm run build` прямо в рабочем каталоге: `.next` стирался,
пока сервис работал, и staging падал (`Could not find a production build … BUILD_ID`) до конца сборки.
Теперь каждая сборка идёт в отдельный каталог релиза, а сервис переключается атомарно (симлинк `current`)
только после успешной сборки. Если сборка упала — `current` не меняется, скрипт выходит с ошибкой.

**Новая раскладка** (`BASE=/var/www/tutor-ai-staging`):

```
/var/www/tutor-ai-staging/
  repo/                         git-клон (только fetch; ничего не собирается)
  releases/20261012-131500-abc1234/   экспорт develop + node_modules + .next
  shared/.env.local             секреты (симлинк в каждый релиз)
  current -> releases/…         WorkingDirectory сервиса
  .deploy.lock                  flock: ручной деплой и таймер не пересекаются
  .deploy-pinned                появляется после rollback: автодеплой на паузе
/var/lib/tutor-ai-staging/      БД, chat-uploads и avatars (AVATAR_UPLOADS_PATH) — вне релизов
```

Хранятся последние 3 релиза (`KEEP_RELEASES`). Ожидаемый простой: один `systemctl restart`.

## 0. Preflight (ничего не меняет)

```bash
sudo -i
export BASE=/var/www/tutor-ai-staging
systemctl cat tutor-ai-staging
systemctl list-timers | grep -i autodeploy
systemctl cat tutor-ai-staging-autodeploy.service tutor-ai-staging-autodeploy.timer   # что именно запускает таймер
cd $BASE && sudo -u www-data git status -sb && git log -1 --oneline
grep -E '^(DATABASE_PATH|CHAT_UPLOADS_PATH)=' $BASE/.env.local     # оба должны быть в /var/lib/tutor-ai-staging
ls -la $BASE/public/uploads 2>/dev/null
df -h /var/www                                                     # нужно ~3 × (node_modules + .next), обычно 2–3 ГБ
which flock curl git npm
cat /etc/sudoers.d/tutor-ai-staging
```

Если `DATABASE_PATH`/`CHAT_UPLOADS_PATH` указывают внутрь `$BASE` — **СТОП**, сначала перенести в `/var/lib/tutor-ai-staging/`.

## 1. Остановить автодеплой на время миграции

```bash
systemctl stop tutor-ai-staging-autodeploy.timer
systemctl is-active tutor-ai-staging-autodeploy.service   # дождаться inactive (не прерывать идущий деплой)
```

## 2. Подготовить новую раскладку рядом со старой

Старый checkout переносим в `$BASE.old` — работающий процесс это не ломает (каталог переименован, inode тот же).

```bash
export BK=/root/staging-releases-migrate-$(date +%Y%m%d-%H%M%S); mkdir -p $BK
cp -a /etc/systemd/system/tutor-ai-staging.service $BK/
cp -a /etc/systemd/system/tutor-ai-staging-autodeploy.* $BK/ 2>/dev/null || true

mv $BASE $BASE.old
mkdir -p $BASE/shared $BASE/releases
sudo -u www-data true; chown www-data:www-data $BASE $BASE/shared $BASE/releases

# git-клон для fetch/archive (из старого checkout, затем remote на GitHub)
sudo -u www-data git clone --quiet $BASE.old $BASE/repo
sudo -u www-data git -C $BASE/repo remote set-url origin "$(git -C $BASE.old remote get-url origin)"
sudo -u www-data git -C $BASE/repo fetch --quiet origin develop && git -C $BASE/repo log -1 --oneline origin/develop

# общие файлы
install -o www-data -g www-data -m 600 $BASE.old/.env.local $BASE/shared/.env.local
# аватары — в каталог данных (отдаются роутом /uploads/avatars/<file>)
install -d -o www-data -g www-data /var/lib/tutor-ai-staging/avatars
[ -d $BASE.old/public/uploads/avatars ] && cp -a $BASE.old/public/uploads/avatars/. /var/lib/tutor-ai-staging/avatars/
chown -R www-data:www-data /var/lib/tutor-ai-staging/avatars
chown -R www-data:www-data $BASE/shared
ls -la $BASE $BASE/shared
```

## 3. Первая сборка (сервис ещё работает со старого каталога)

```bash
sudo -u www-data NO_RESTART=1 $BASE.old/deploy/staging/deploy-staging.sh   # скрипт из новой версии develop
# Если в $BASE.old ещё старый скрипт (до этого коммита) — взять из repo:
#   sudo -u www-data git -C $BASE/repo show origin/develop:deploy/release-deploy.sh > /tmp/rd.sh
#   sudo -u www-data BASE_DIR=$BASE BRANCH=develop SERVICE=tutor-ai-staging PORT=3001 NO_RESTART=1 bash /tmp/rd.sh deploy
ls -la $BASE/current && cat $BASE/current/REVISION && ls $BASE/current/.next/BUILD_ID
```

## 4. Новый юнит и переключение

```bash
install -m 644 $BASE/current/deploy/staging/tutor-ai-staging.service /etc/systemd/system/tutor-ai-staging.service
diff $BK/tutor-ai-staging.service /etc/systemd/system/tutor-ai-staging.service   # меняются только WorkingDirectory/EnvironmentFile
systemd-analyze verify /etc/systemd/system/tutor-ai-staging.service
systemctl daemon-reload
systemctl restart tutor-ai-staging
sleep 5; systemctl status tutor-ai-staging --no-pager
readlink /proc/$(systemctl show tutor-ai-staging -p MainPID --value)/cwd   # ожидается …/releases/<имя>
curl -sI http://127.0.0.1:3001 | head -1
```

## 5. Автодеплой-таймер

В юните `tutor-ai-staging-autodeploy.service` заменить путь к скрипту на
`/var/www/tutor-ai-staging/current/deploy/staging/deploy-staging.sh` (пользователь — `www-data`, как раньше).
Скрипт сам копирует общий раннер в `$BASE/.release-deploy.sh`, поэтому удаление старых релизов ему не мешает.
Если таймер проверял «есть ли новые коммиты» через `git` в `$BASE` — убрать: скрипт сам выходит без сборки,
если `origin/develop` уже развёрнут, и после `rollback` не деплоит, пока не сделан `unpin`.

```bash
systemctl edit --full tutor-ai-staging-autodeploy.service     # поправить ExecStart / WorkingDirectory=/var/www/tutor-ai-staging
systemctl daemon-reload
systemctl start tutor-ai-staging-autodeploy.service && journalctl -u tutor-ai-staging-autodeploy -n 20 --no-pager
#   ожидается «уже развёрнут <sha> — нечего делать»
systemctl start tutor-ai-staging-autodeploy.timer
```

Права sudo для `www-data` прежние (`systemctl restart tutor-ai-staging`) — менять не нужно.

## 6. Проверка в браузере, затем уборка

Вход, чат, загрузка аватара (файл появится в `/var/lib/tutor-ai-staging/avatars`, картинка открывается по `/uploads/avatars/<file>.png`). Через день-два, если всё ок:
```bash
rm -rf /var/www/tutor-ai-staging.old
```

## Повседневные команды

```bash
D=/var/www/tutor-ai-staging/current/deploy/staging/deploy-staging.sh
sudo -u www-data $D                 # деплой origin/develop (ничего не делает, если уже развёрнут)
sudo -u www-data FORCE=1 $D         # пересобрать тот же коммит
sudo -u www-data $D list            # релизы, * — текущий
sudo -u www-data $D rollback        # на предыдущий релиз (+ пауза автодеплоя)
sudo -u www-data $D rollback 20261012-131500-abc1234
sudo -u www-data $D unpin           # снять паузу автодеплоя после исправления
```

Код выхода: `0` — успех/нечего делать, `1` — ошибка сборки или сервис не поднялся (тогда скрипт сам
возвращает предыдущий релиз), `75` — уже идёт другой деплой (lock).

## Откат миграции

```bash
systemctl stop tutor-ai-staging-autodeploy.timer
cp -a $BK/tutor-ai-staging.service /etc/systemd/system/
cp -a $BK/tutor-ai-staging-autodeploy.* /etc/systemd/system/ 2>/dev/null || true
mv $BASE $BASE.releases-failed && mv $BASE.old $BASE
systemctl daemon-reload && systemctl restart tutor-ai-staging
curl -sI http://127.0.0.1:3001 | head -1
systemctl start tutor-ai-staging-autodeploy.timer
```

## Дополнение: перенос аватаров из shared/uploads (для staging, уже переведённого на релизы)

До коммита с роутом `/uploads/avatars/[file]` аватары писались в `shared/uploads/avatars` (симлинк `public/uploads`),
но `next start` не отдаёт файлы, появившиеся в `public/` после старта, → 404. Теперь они лежат в `AVATAR_UPLOADS_PATH`.
Однократно (URL в БД не меняются):

```bash
sudo -i
grep -q '^AVATAR_UPLOADS_PATH=' /var/www/tutor-ai-staging/shared/.env.local || \
  echo 'AVATAR_UPLOADS_PATH=/var/lib/tutor-ai-staging/avatars' >> /var/www/tutor-ai-staging/shared/.env.local
install -d -o www-data -g www-data /var/lib/tutor-ai-staging/avatars
cp -an /var/www/tutor-ai-staging/shared/uploads/avatars/. /var/lib/tutor-ai-staging/avatars/ 2>/dev/null || true
chown -R www-data:www-data /var/lib/tutor-ai-staging/avatars
sudo -u www-data FORCE=1 /var/www/tutor-ai-staging/current/deploy/staging/deploy-staging.sh   # новый релиз без симлинка public/uploads
curl -sI -u tester:ПАРОЛЬ https://test.mishkaznaet.ru/uploads/avatars/$(ls /var/lib/tutor-ai-staging/avatars | head -1) | head -1   # 200
# после проверки: rm -rf /var/www/tutor-ai-staging/shared/uploads
```
