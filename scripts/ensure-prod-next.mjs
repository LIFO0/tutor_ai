import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const buildIdPath = path.join(root, ".next", "BUILD_ID");

function fail(message) {
  console.error(`[start] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(buildIdPath)) {
  fail(
    'No production build: missing ".next/BUILD_ID".\n' +
      "  Run:  npm run build\n" +
      "If you already built, `next dev` may have overwritten `.next` — build again, then start without running dev in between.",
  );
}

const id = fs.readFileSync(buildIdPath, "utf8").trim();
if (!id) {
  fail('".next/BUILD_ID" is empty. Run `npm run build` again.');
}

console.log(`[start] Production build present (BUILD_ID=${id.slice(0, 8)}…).`);
