@echo off
setlocal

REM Ensure we run from this script directory (project root)
pushd "%~dp0"

REM Use UTF-8 for nicer output (optional)
chcp 65001 >nul

REM --- Run "Мишка знает" (Next.js) ---

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH. Install Node.js LTS and reopen terminal.
  popd
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not found in PATH. Reinstall Node.js; npm comes bundled. Reopen terminal.
  popd
  pause
  exit /b 1
)

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

popd
pause