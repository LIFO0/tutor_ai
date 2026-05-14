import "server-only";

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ensureTables } from "./bootstrap";

function resolveDbPath() {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;

  // Keep SQLite *outside* the project so Next dev file-watching doesn't
  // rebuild endlessly when WAL/SHM files update.
  const base =
    process.env.LOCALAPPDATA ||
    process.env.APPDATA ||
    path.join(os.homedir(), "AppData", "Local");
  const dir = path.join(base, "tutor_ai");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "database.db");
}

const dbPath = resolveDbPath();

const SQLITE_PKG = "better-sqlite3";
/** Same filename as `scripts/ensure-native-deps.mjs` — records `process.versions.modules` used to build the addon. */
const SQLITE_ABI_MARKER = ".tutor-node-modules-abi";

declare global {
  var __tutorDb: Database.Database | undefined;
  var __tutorDrizzle: ReturnType<typeof drizzle> | undefined;
}

/**
 * Do not use `require.resolve("better-sqlite3/package.json")` here: Turbopack can fold it
 * to an internal numeric module id at build time, producing `path.dirname(10064)` at runtime.
 *
 * Use `process.cwd()` (project root) — matches `npm start` / `npm run dev` from the repo root.
 */
function betterSqlitePackageDir() {
  const cwd = process.cwd();
  const pkgJson = path.join(cwd, "node_modules", SQLITE_PKG, "package.json");
  if (!fs.existsSync(pkgJson)) {
    throw new Error(
      `Cannot find ${path.join("node_modules", SQLITE_PKG)} under the project root. Run npm commands from the repo directory.`,
    );
  }
  return path.dirname(pkgJson);
}

/**
 * Without this, `better-sqlite3` loads the `.node` file via the `bindings` package, which
 * parses stack traces for a caller path. Turbopack production chunks use numeric internal
 * filenames, so `path.dirname(10064)` throws ERR_INVALID_ARG_TYPE.
 */
function resolveBetterSqliteNativeBindingPath(): string {
  const root = betterSqlitePackageDir();
  const candidates = [
    path.join(root, "build", "Release", "better_sqlite3.node"),
    path.join(root, "build", "Debug", "better_sqlite3.node"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `Cannot find better_sqlite3.node under ${path.join(root, "build")}. Run: npm rebuild better-sqlite3`,
  );
}

function openSqliteDatabase(): Database.Database {
  return new Database(dbPath, { nativeBinding: resolveBetterSqliteNativeBindingPath() });
}

function readStoredSqliteAbi(): string | null {
  const marker = path.join(betterSqlitePackageDir(), SQLITE_ABI_MARKER);
  try {
    const v = fs.readFileSync(marker, "utf8").trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function writeStoredSqliteAbi() {
  fs.writeFileSync(
    path.join(betterSqlitePackageDir(), SQLITE_ABI_MARKER),
    String(process.versions.modules),
    "utf8",
  );
}

function isNativeAbiError(e: unknown): boolean {
  if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "ERR_DLOPEN_FAILED") {
    return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("NODE_MODULE_VERSION") ||
    msg.includes("was compiled against a different Node.js version")
  );
}

function clearBetterSqliteFromRequireCache() {
  try {
    const req = createRequire(import.meta.url);
    for (const key of Object.keys(req.cache)) {
      if (key.includes(`${path.sep}${SQLITE_PKG}${path.sep}`) || key.includes(`node_modules${path.sep}${SQLITE_PKG}`)) {
        delete req.cache[key];
      }
    }
  } catch {
    /* ignore */
  }
}

function rebuildBetterSqliteSync() {
  if (process.env.VERCEL) {
    throw new Error(
      "better-sqlite3 failed to load its native binary on this host (Vercel/serverless). Use a Node deployment with a matching prebuild or run outside serverless.",
    );
  }
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const r = spawnSync(npm, ["rebuild", SQLITE_PKG], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`npm rebuild ${SQLITE_PKG} exited with code ${r.status ?? "unknown"}`);
  }
  clearBetterSqliteFromRequireCache();
}

/**
 * `npm run dev` is often started with a different Node than `postinstall` / `doctor:native`
 * (IDE, global `next`, another shell). Rebuild the native addon when the recorded ABI ≠ this process.
 */
function ensureBetterSqliteAbiMatchesRuntime() {
  if (process.env.VERCEL) return;
  const current = String(process.versions.modules);
  const stored = readStoredSqliteAbi();
  if (stored === current) return;
  if (stored === null) return;
  console.warn(
    `[db] better-sqlite3 was built for NODE_MODULE_VERSION ${stored}; this process is ${current}. Running npm rebuild…`,
  );
  rebuildBetterSqliteSync();
  writeStoredSqliteAbi();
}

function getSqlite() {
  if (!globalThis.__tutorDb) {
    ensureBetterSqliteAbiMatchesRuntime();
    try {
      globalThis.__tutorDb = openSqliteDatabase();
    } catch (e) {
      if (!isNativeAbiError(e) || process.env.VERCEL) throw e;
      console.warn("[db] Native SQLite load failed; rebuilding better-sqlite3 once for this Node.js…");
      rebuildBetterSqliteSync();
      writeStoredSqliteAbi();
      globalThis.__tutorDb = openSqliteDatabase();
    }
    globalThis.__tutorDb.pragma("journal_mode = WAL");
    ensureTables(globalThis.__tutorDb);
  }
  return globalThis.__tutorDb;
}

export function getDb() {
  if (!globalThis.__tutorDrizzle) {
    globalThis.__tutorDrizzle = drizzle(getSqlite(), { schema });
  }
  return globalThis.__tutorDrizzle;
}

export { schema };

