# Staging: test.mishkaznaet.ru

Тестовая копия приложения на том же VPS (2.26.92.166), что и прод.

| | Прод | Staging |
|---|---|---|
| Домен | mishkaznaet.ru | test.mishkaznaet.ru |
| Ветка | master | develop |
| systemd | `tutor-ai` | `tutor-ai-staging` |
| Порт | 3000 (по умолчанию) | 3001 |
| Каталог | (прод) | `/var/www/tutor-ai-staging` |
| Данные | прод-БД | `/var/lib/tutor-ai-staging/` |

Staging закрыт basic auth, отдаёт `X-Robots-Tag: noindex` и `robots.txt` с `Disallow: /`.

## Первоначальная настройка

### 0. DNS
A-запись `test.mishkaznaet.ru → 2.26.92.166`. Проверка: `dig +short test.mishkaznaet.ru`.

### 1. Клонирование
```bash
sudo mkdir -p /var/www/tutor-ai-staging /var/lib/tutor-ai-staging/chat-uploads
sudo chown -R www-data:www-data /var/www/tutor-ai-staging /var/lib/tutor-ai-staging
sudo -u www-data git clone -b develop https://github.com/LIFO0/tutor_ai.git /var/www/tutor-ai-staging
```
> Пользователь `www-data` — допущение. Посмотрите прод-юнит (`systemctl cat tutor-ai`) и используйте того же пользователя, поправив `User=`/`Group=` в `tutor-ai-staging.service` и команды выше.

### 2. Окружение
```bash
cd /var/www/tutor-ai-staging
sudo -u www-data cp deploy/staging/.env.staging.example .env.local
sudo -u www-data nano .env.local
sudo chmod 600 .env.local
```
Обязательно:
- `JWT_SECRET` — **новый**, не прод (`openssl rand -base64 32`);
- `GEMINI_API_KEY` — желательно отдельный ключ (без него — демо-режим);
- `DATABASE_PATH` / `CHAT_UPLOADS_PATH` — в `/var/lib/tutor-ai-staging/`, **не** прод-БД;
- `NEXT_PUBLIC_YANDEX_METRIKA_DISABLED=1`, `ROBOTS_DISALLOW_ALL=1`.

Аватары пишутся в `public/uploads/avatars` внутри каталога проекта — у staging они свои автоматически.

### 2a. Лимиты для тестовых аккаунтов (опционально)

Чтобы тестировщики не упирались в дневные квоты, в `.env.staging` можно задать:

| Переменная | Формат | Назначение |
|---|---|---|
| `TEST_ACCOUNT_EMAILS` | `a@yandex.ru,b@yandex.ru` | email из Яндекс ID (регистр не важен) |
| `TEST_ACCOUNT_USER_IDS` | `1,2,3` | id пользователей в таблице `users` |
| `TEST_LIMIT_MULTIPLIER` | число > 0 или `unlimited` | во сколько раз увеличить лимиты тарифа (по умолчанию `10`); `unlimited` — квоты не применяются |

Работает только если задан хотя бы один из списков аккаунтов; в проде эти переменные не задаём, поведение не меняется.
Множитель применяется ко всем дневным квотам и к лимиту сообщений в минуту. После изменения — `sudo systemctl restart tutor-ai-staging`.

### 3. Яндекс ID OAuth
На https://oauth.yandex.ru в приложении добавьте Redirect URI:
```
https://test.mishkaznaet.ru/api/auth/yandex/callback
```
(или создайте отдельное staging-приложение) и пропишите `YANDEX_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI` в `.env.local`.
Примечание: basic auth стоит перед всем сайтом, включая callback — браузер уже авторизован, поэтому вход работает.

### 4. Сборка
```bash
cd /var/www/tutor-ai-staging
sudo -u www-data npm ci
sudo -u www-data npm run build
```
Схема БД создаётся при старте (`ensureTables`); при необходимости: `sudo -u www-data npm run db:push`.

### 5. systemd
```bash
sudo cp deploy/staging/tutor-ai-staging.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tutor-ai-staging
curl -I http://127.0.0.1:3001
journalctl -u tutor-ai-staging -f
```

### 6. Basic auth
```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd-staging tester   # -c только в первый раз
sudo chown root:www-data /etc/nginx/.htpasswd-staging && sudo chmod 640 /etc/nginx/.htpasswd-staging
```

### 7. nginx + HTTPS
```bash
sudo cp deploy/staging/nginx-test.mishkaznaet.ru.conf /etc/nginx/sites-available/test.mishkaznaet.ru
sudo ln -s /etc/nginx/sites-available/test.mishkaznaet.ru /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d test.mishkaznaet.ru     # выбрать Redirect (HTTP→HTTPS)
sudo nginx -t && sudo systemctl reload nginx
```
Проверка: `curl -I https://test.mishkaznaet.ru` → `401`; с `-u tester:пароль` → `200` и заголовок `X-Robots-Tag`.

### 8. Права на рестарт (для скрипта)
Чтобы `deploy-staging.sh` мог перезапускать сервис без пароля:
```bash
echo 'www-data ALL=(root) NOPASSWD: /usr/bin/systemctl restart tutor-ai-staging' | sudo tee /etc/sudoers.d/tutor-ai-staging
sudo visudo -c
```
(или запускайте скрипт от своего пользователя с sudo).

## Обновление staging
Деплой идёт «релизами»: сборка в `releases/<дата>-<sha>/`, затем атомарное переключение симлинка `current`
и рестарт; при ошибке сборки работающий релиз не трогается. Схема и разовый переход — `MIGRATE-TO-RELEASES.md`.
```bash
D=/var/www/tutor-ai-staging/current/deploy/staging/deploy-staging.sh
sudo -u www-data $D            # деплой origin/develop
sudo -u www-data $D list       # релизы
sudo -u www-data $D rollback   # откат на предыдущий (автодеплой встаёт на паузу до `unpin`)
sudo -u www-data $D unpin
```
`.env.local` и `public/uploads` живут в `/var/www/tutor-ai-staging/shared/`, БД и чат-вложения — в `/var/lib/tutor-ai-staging`.
Параллельные запуски (ручной + таймер `tutor-ai-staging-autodeploy`) исключены через `flock` (код выхода 75).

## robots.txt
`src/app/robots.ts` при `ROBOTS_DISALLOW_ALL=1` отдаёт `Disallow: /`. Значение читается при `npm run build` (robots статичен), поэтому после изменения переменной нужна пересборка. На проде переменную не задавать.
