import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const MODULE_NAME = "better-sqlite3";

/** Written so the Next server can skip `npm rebuild` when ABI already matches (see `src/lib/db/index.ts`). */
const ABI_MARKER = ".tutor-node-modules-abi";

function sqlitePackageDir() {
  return path.dirname(require.resolve(`${MODULE_NAME}/package.json`));
}

function writeAbiMarker() {
  const tagPath = path.join(sqlitePackageDir(), ABI_MARKER);
  fs.writeFileSync(tagPath, String(process.versions.modules), "utf8");
}

function log(message) {
  console.log(`[native] ${message}`);
}

function warn(message) {
  console.warn(`[native] ${message}`);
}

function fail(message) {
  console.error(`[native] ${message}`);
  process.exit(1);
}

function isAbiMismatch(error) {
  const text = `${error?.message ?? ""}\n${error?.stack ?? ""}`;
  return (
    error?.code === "ERR_DLOPEN_FAILED" ||
    text.includes("NODE_MODULE_VERSION") ||
    text.includes("was compiled against a different Node.js version")
  );
}

function loadNativeModule() {
  try {
    require(MODULE_NAME);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function rebuildNativeModule() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  return spawnSync(npmCommand, ["rebuild", MODULE_NAME], {
    stdio: "inherit",
    env: process.env,
  });
}

log(`Node ${process.version}; NODE_MODULE_VERSION ${process.versions.modules}`);

let result = loadNativeModule();
if (result.ok) {
  writeAbiMarker();
  log(`${MODULE_NAME} is compatible with the current Node.js runtime.`);
  process.exit(0);
}

if (!isAbiMismatch(result.error)) {
  fail(
    `${MODULE_NAME} failed to load for a non-ABI reason:\n${result.error?.stack || result.error}`,
  );
}

warn(`${MODULE_NAME} ABI mismatch detected. Rebuilding for current Node.js...`);

const rebuild = rebuildNativeModule();
if (rebuild.status !== 0) {
  fail(
    `npm rebuild ${MODULE_NAME} failed. Use the same Node.js version for installs and for next dev (see .nvmrc), or run npm rebuild ${MODULE_NAME}.`,
  );
}

result = loadNativeModule();
if (!result.ok) {
  fail(
    `${MODULE_NAME} still cannot be loaded after rebuild:\n${result.error?.stack || result.error}`,
  );
}

writeAbiMarker();
log(`${MODULE_NAME} rebuilt and verified successfully.`);
