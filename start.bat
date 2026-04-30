@echo off
setlocal enabledelayedexpansion

REM --- Run "Мишка знает" (Next.js) ---

echo [INFO] Node:
node -v
echo [INFO] NODE_MODULE_VERSION:
node -p "process.versions.modules"

REM Create .env.local from example if missing
if not exist ".env.local" (
  if exist ".env.local.example" (
    copy /Y ".env.local.example" ".env.local" >nul
    echo [INFO] Created ".env.local" from ".env.local.example". Please fill YANDEX_* and JWT_SECRET.
  ) else (
    echo [WARN] ".env.local.example" not found. Create ".env.local" manually.
  )
)

REM Install dependencies if node_modules missing
if not exist "node_modules" (
  echo [INFO] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo [INFO] Rebuilding native deps (better-sqlite3)...
call npm rebuild better-sqlite3
if errorlevel 1 (
  echo [WARN] npm rebuild better-sqlite3 failed. Try reinstall: rmdir /s /q node_modules ^& del package-lock.json ^& npm install
)

echo [INFO] Starting dev server: http://localhost:3000
call npm run dev

pause