/**
 * Remove stale Next.js dev route types before production build.
 * After moving pages between route groups (e.g. (app)/help → /help),
 * `next dev` can leave `.next/dev/types/validator.ts` pointing at old paths
 * and break `next build` typecheck.
 */
import fs from "node:fs";
import path from "node:path";

const devTypesDir = path.join(process.cwd(), ".next", "dev", "types");

try {
  fs.rmSync(devTypesDir, { recursive: true, force: true });
} catch {
  // ignore
}
