# Мишка знает

Веб‑приложение на **Next.js** (React 19) с UI на **HeroUI**, хранением данных в **SQLite** и схемой/миграциями через **Drizzle**.

## Быстрый старт (Windows)

1) Установите **Node.js LTS**.
2) Запустите `start.bat` (он:
- создаст `.env.local` из `.env.local.example`, если файла нет
- установит зависимости, если нет `node_modules`
- сделает `npm rebuild better-sqlite3` (нативный модуль для SQLite)
- запустит `npm run dev`)

После старта откройте `http://localhost:3000`.

## Запуск через npm (вручную)

```bash
npm install
npm run dev
```

## Переменные окружения

Файл `.env.local` **не коммитится**. Пример лежит в `.env.local.example`.

Нужно заполнить:
- **`YANDEX_GPT_API_KEY`**: API‑ключ
- **`YANDEX_FOLDER_ID`**: Folder ID
- **`JWT_SECRET`**: длинная случайная строка (секрет подписи токенов)
- **`DATABASE_PATH`**: путь к SQLite файлу (по умолчанию `./database.db`)

## База данных (Drizzle + SQLite)

Проект использует SQLite (файл `database.db`) и Drizzle ORM.

Команды:

```bash
npm run db:push
npm run db:studio
```

## Скрипты

- **`npm run dev`**: dev‑сервер
- **`npm run build`**: сборка
- **`npm run start`**: запуск собранного приложения
- **`npm run lint`**: eslint
- **`npm run db:push`**: применить схему в БД через drizzle-kit
- **`npm run db:studio`**: открыть drizzle studio
