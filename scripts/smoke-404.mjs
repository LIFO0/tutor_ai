#!/usr/bin/env node
/**
 * Смоук-проверка 404 на собранном и запущенном приложении (`npm run build && npm start`).
 *
 *   node scripts/smoke-404.mjs [baseUrl]          # по умолчанию http://127.0.0.1:3001
 *
 * Запросы идут с заголовками как от nginx на staging/prod (Host + X-Forwarded-Proto: https):
 * именно с ними rewrite из middleware превращался во внешний прокси и давал 500.
 * Для каждого пути ждём: статус 404, ровно один <h1> и ровно один <meta name="robots">.
 * Известные страницы должны отдавать 200.
 */
const base = (process.argv[2] || "http://127.0.0.1:3001").replace(/\/$/, "");
const host = process.env.SMOKE_HOST || "test.mishkaznaet.ru";

const notFound = [
  "/blog/x",
  "/blog/abc",
  "/matematika-5-klass/xxx",
  "/matematika-6-klass/xxx",
  "/no-such-page",
];
const ok = ["/", "/blog", "/matematika-5-klass"];

const count = (html, re) => (html.match(re) || []).length;
let failed = 0;

async function check(path, expectStatus) {
  const res = await fetch(base + path, {
    redirect: "manual",
    headers: { Host: host, "X-Forwarded-Proto": "https", "X-Forwarded-For": "127.0.0.1" },
  });
  const html = await res.text();
  const problems = [];
  if (res.status !== expectStatus) problems.push(`status ${res.status} != ${expectStatus}`);
  if (expectStatus === 404) {
    const h1 = count(html, /<h1[\s>]/g);
    const robots = count(html, /<meta name="robots"/g);
    if (h1 !== 1) problems.push(`h1 x${h1}`);
    if (robots !== 1) problems.push(`robots x${robots}`);
  }
  if (problems.length) failed++;
  console.log(`${problems.length ? "FAIL" : "ok  "} ${path} ${res.status}${problems.length ? " — " + problems.join(", ") : ""}`);
}

for (const p of notFound) await check(p, 404);
for (const p of ok) await check(p, 200);
if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
